const Test = require('../models/test.model');
const Submission = require('../models/submission.model');
const { buildHrTestListFilter } = require('../utils/hrTestAccess');

const SCORE_BUCKETS = [
    { range: '0-20', min: 0, max: 20, color: '#ef4444' },
    { range: '21-40', min: 21, max: 40, color: '#f97316' },
    { range: '41-60', min: 41, max: 60, color: '#f59e0b' },
    { range: '61-80', min: 61, max: 80, color: '#22c55e' },
    { range: '81-100', min: 81, max: 100, color: '#10b981' },
];

const PIPELINE_ORDER = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeScore(submission) {
    return toNumber(
        submission?.totalScore ??
        submission?.score ??
        submission?.matchScore ??
        0,
        0
    );
}

function normalizeStage(stage) {
    const normalized = String(stage || 'NEW').trim().toUpperCase();
    return PIPELINE_ORDER.includes(normalized) ? normalized : 'NEW';
}

function formatStageLabel(stage) {
    const labels = {
        NEW: 'Nouveaux',
        SCREENING: 'Screening',
        INTERVIEW: 'Entretien',
        OFFER: 'Offre',
        HIRED: 'Embauches',
        REJECTED: 'Rejetes',
    };
    return labels[stage] || stage;
}

function buildRecentActivity(submissions = []) {
    return submissions
        .slice()
        .sort((left, right) => new Date(right?.updatedAt || 0) - new Date(left?.updatedAt || 0))
        .slice(0, 10)
        .map((submission) => {
            const candidate = submission?.candidateId || {};
            const firstName = String(candidate?.firstName || '').trim();
            const lastName = String(candidate?.lastName || '').trim();
            const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim() || 'CA';

            return {
                id: submission?._id,
                user: `${firstName} ${lastName}`.trim() || 'Candidat anonyme',
                test: submission?.testId?.title || 'Test inconnu',
                score: normalizeScore(submission),
                timestamp: submission?.updatedAt || submission?.createdAt || null,
                avatar: initials,
                stage: normalizeStage(submission?.stage),
                trustScore: toNumber(submission?.trustScore, 100),
            };
        });
}

function buildTopTests(tests = [], submissions = []) {
    return tests
        .map((test) => {
            const testSubmissions = submissions.filter((submission) => String(submission?.testId?._id || submission?.testId) === String(test?._id));
            const submissionsCount = testSubmissions.length;
            const averageScore = submissionsCount > 0
                ? Math.round(testSubmissions.reduce((sum, submission) => sum + normalizeScore(submission), 0) / submissionsCount)
                : 0;
            const qualifiedCount = testSubmissions.filter((submission) => submission?.qualified === true).length;
            const passRate = submissionsCount > 0 ? Math.round((qualifiedCount / submissionsCount) * 100) : 0;

            return {
                id: test?._id,
                title: test?.title || 'Test sans titre',
                jobRole: test?.jobRole || '',
                status: String(test?.status || '').toUpperCase(),
                submissionsCount,
                averageScore,
                passRate,
            };
        })
        .sort((left, right) => {
            if (right.submissionsCount !== left.submissionsCount) {
                return right.submissionsCount - left.submissionsCount;
            }
            return right.averageScore - left.averageScore;
        })
        .slice(0, 5);
}

async function getHrDashboard(req, res) {
    try {
        const testFilter = await buildHrTestListFilter(req.user);
        const tests = await Test.find(testFilter)
            .select('_id title jobRole status createdAt')
            .sort('-createdAt')
            .lean();

        const testIds = tests.map((test) => test._id);
        const submissions = testIds.length > 0
            ? await Submission.find({ testId: { $in: testIds } })
                .select('testId candidateId totalScore qualified stage trustScore antiCheat.elapsedSeconds jobMatchAnalysis.score createdAt updatedAt')
                .populate('testId', 'title jobRole')
                .populate('candidateId', 'firstName lastName email')
                .sort('-createdAt')
                .lean()
            : [];

        const uniqueCandidateIds = new Set(
            submissions
                .map((submission) => String(submission?.candidateId?._id || submission?.candidateId || ''))
                .filter(Boolean)
        );

        const scoreValues = submissions.map(normalizeScore);
        const averageScore = scoreValues.length > 0
            ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
            : 0;

        const qualifiedCount = submissions.filter((submission) => submission?.qualified === true).length;
        const successRate = submissions.length > 0
            ? Math.round((qualifiedCount / submissions.length) * 100)
            : 0;

        const averageMatchScore = submissions.length > 0
            ? Math.round(
                submissions.reduce((sum, submission) => sum + toNumber(submission?.jobMatchAnalysis?.score, 0), 0) / submissions.length
            )
            : 0;

        const avgTrustScore = submissions.length > 0
            ? Math.round(
                submissions.reduce((sum, submission) => sum + toNumber(submission?.trustScore, 100), 0) / submissions.length
            )
            : 100;

        const timedSubmissions = submissions.filter((submission) => toNumber(submission?.antiCheat?.elapsedSeconds, 0) > 0);
        const avgCompletionMinutes = timedSubmissions.length > 0
            ? Math.round(
                timedSubmissions.reduce((sum, submission) => sum + (toNumber(submission?.antiCheat?.elapsedSeconds, 0) / 60), 0) / timedSubmissions.length
            )
            : 0;

        const highRiskCount = submissions.filter((submission) => toNumber(submission?.trustScore, 100) < 60).length;

        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const submissionsLast7Days = submissions.filter((submission) => {
            const createdAt = new Date(submission?.createdAt || 0).getTime();
            return Number.isFinite(createdAt) && now - createdAt <= sevenDaysMs;
        }).length;

        const previousWindowCount = submissions.filter((submission) => {
            const createdAt = new Date(submission?.createdAt || 0).getTime();
            return Number.isFinite(createdAt) && now - createdAt > sevenDaysMs && now - createdAt <= sevenDaysMs * 2;
        }).length;

        const submissionsTrend = previousWindowCount > 0
            ? Math.round(((submissionsLast7Days - previousWindowCount) / previousWindowCount) * 100)
            : submissionsLast7Days > 0 ? 100 : 0;

        const stageCounts = PIPELINE_ORDER.reduce((acc, stage) => {
            acc[stage] = 0;
            return acc;
        }, {});
        submissions.forEach((submission) => {
            stageCounts[normalizeStage(submission?.stage)] += 1;
        });

        const scoreDistribution = SCORE_BUCKETS.map((bucket) => ({
            ...bucket,
            count: scoreValues.filter((score) => score >= bucket.min && score <= bucket.max).length,
        }));

        const publishedTests = tests.filter((test) => String(test?.status || '').toUpperCase() === 'PUBLISHED').length;
        const draftTests = tests.filter((test) => String(test?.status || '').toUpperCase() === 'DRAFT').length;
        const closedTests = tests.filter((test) => String(test?.status || '').toUpperCase() === 'CLOSED').length;

        res.status(200).json({
            status: true,
            stats: {
                totalCandidates: uniqueCandidateIds.size,
                completedTests: submissions.length,
                totalTests: tests.length,
                activeTests: publishedTests,
                draftTests,
                closedTests,
                pendingTests: stageCounts.NEW + stageCounts.SCREENING,
                successRate,
                qualifiedCount,
                hired: stageCounts.HIRED,
                offersSent: stageCounts.OFFER,
                averageScore,
                averageMatchScore,
                averageTrustScore: avgTrustScore,
                avgCompletionMinutes,
                highRiskCount,
                submissionsLast7Days,
                submissionsTrend,
                scoreDistribution,
                topTests: buildTopTests(tests, submissions),
            },
            pipeline: {
                stages: stageCounts,
                formattedStages: PIPELINE_ORDER.map((stage) => ({
                    key: stage,
                    label: formatStageLabel(stage),
                    count: stageCounts[stage],
                })),
                conversionRates: {
                    applicationToAssessment: stageCounts.NEW > 0 ? Math.round((stageCounts.SCREENING / stageCounts.NEW) * 100) : 0,
                    assessmentToInterview: stageCounts.SCREENING > 0 ? Math.round((stageCounts.INTERVIEW / stageCounts.SCREENING) * 100) : 0,
                    interviewToOffer: stageCounts.INTERVIEW > 0 ? Math.round((stageCounts.OFFER / stageCounts.INTERVIEW) * 100) : 0,
                    offerToHire: stageCounts.OFFER > 0 ? Math.round((stageCounts.HIRED / stageCounts.OFFER) * 100) : 0,
                },
                totalCandidates: uniqueCandidateIds.size,
                activeSubmissions: submissions.length,
            },
            recentActivity: buildRecentActivity(submissions),
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

module.exports = {
    getHrDashboard,
};
