const Submission = require('../models/submission.model');
const Question = require('../models/question.model');
const Test = require('../models/test.model');
const User = require('../models/user.model');
const TestDraft = require('../models/testDraft.model');
const { evaluateAnswersAI } = require('../utils/openai');
const { dispatchSubmissionWebhook } = require('../utils/webhookDispatch');
const {
    notifyCandidateScore,
    notifyHrNewSubmission,
    notifyCandidateApplicationStage,
    notifyCandidateInterviewScheduled,
} = require('../utils/emailNotifications');
const { createAndDispatchNotification } = require('../utils/inAppNotifications');
const { logManualActivity } = require('../utils/activityLogger');
const skillRecommender = require('../utils/skillRecommender');
const { calculateTrustScore } = require('../utils/trustScoreCalculator');

const MAX_OPEN_RESPONSE_CHARS = 4000;

function normalizeCounter(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
}

function normalizeTelemetry(raw = {}) {
    return {
        focusLossCount: normalizeCounter(raw.focusLossCount),
        visibilityHiddenCount: normalizeCounter(raw.visibilityHiddenCount),
        tabSwitchCount: normalizeCounter(raw.tabSwitchCount),
        copyCount: normalizeCounter(raw.copyCount),
        pasteCount: normalizeCounter(raw.pasteCount),
        fullscreenExitCount: normalizeCounter(raw.fullscreenExitCount),
    };
}

function mergeTelemetry(base = {}, incoming = {}) {
    const a = normalizeTelemetry(base);
    const b = normalizeTelemetry(incoming);
    return {
        focusLossCount: Math.max(a.focusLossCount, b.focusLossCount),
        visibilityHiddenCount: Math.max(a.visibilityHiddenCount, b.visibilityHiddenCount),
        tabSwitchCount: Math.max(a.tabSwitchCount, b.tabSwitchCount),
        copyCount: Math.max(a.copyCount, b.copyCount),
        pasteCount: Math.max(a.pasteCount, b.pasteCount),
        fullscreenExitCount: Math.max(a.fullscreenExitCount, b.fullscreenExitCount),
    };
}

function parseDateOrNull(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function pickString(value) {
    if (value == null) return '';
    return String(value).trim();
}

function extractDeviceFingerprint(req, body = {}) {
    const forwarded = pickString(req.headers['x-forwarded-for']);
    const firstForwardedIp = forwarded ? forwarded.split(',')[0].trim() : '';
    return {
        userAgent: pickString(req.headers['user-agent']).slice(0, 512),
        ip: firstForwardedIp || pickString(req.ip || req.connection?.remoteAddress).slice(0, 128),
        acceptLanguage: pickString(req.headers['accept-language']).slice(0, 128),
        screenResolution: pickString(body.screenResolution).slice(0, 32),
        timezone: pickString(body.timezone).slice(0, 64),
    };
}

function sanitizeAnswers(rawAnswers, questionMap) {
    const byQuestion = new Map();
    let duplicateCount = 0;

    if (Array.isArray(rawAnswers)) {
        for (const entry of rawAnswers) {
            const questionId = String(entry?.questionId || '').trim();
            if (!questionId) continue;
            if (byQuestion.has(questionId)) duplicateCount += 1;
            byQuestion.set(questionId, entry?.response);
        }
    }

    const normalizedAnswers = [];
    let invalidQuestionCount = 0;
    let invalidQcmOptionCount = 0;
    let tooLongCount = 0;

    for (const [questionId, rawResponse] of byQuestion.entries()) {
        const q = questionMap[questionId];
        if (!q) {
            invalidQuestionCount += 1;
            continue;
        }

        const response = rawResponse == null ? '' : String(rawResponse).trim();
        if (q.type !== 'QCM' && response.length > MAX_OPEN_RESPONSE_CHARS) {
            tooLongCount += 1;
            continue;
        }

        if (q.type === 'QCM' && response) {
            const opts = Array.isArray(q.options) ? q.options.map((x) => String(x).trim()) : [];
            if (opts.length > 0 && !opts.includes(response)) {
                invalidQcmOptionCount += 1;
                continue;
            }
        }

        normalizedAnswers.push({ questionId, response });
    }

    return {
        normalizedAnswers,
        duplicateCount,
        invalidQuestionCount,
        invalidQcmOptionCount,
        tooLongCount,
    };
}

function resolveEffectiveStartedAt(draftStartedAt, clientStartedAt) {
    const draft = parseDateOrNull(draftStartedAt);
    const client = parseDateOrNull(clientStartedAt);
    if (draft) return draft;
    return client;
}

function computeAnomalyFlags({
    answers,
    questionMap,
    effectiveStartedAt,
    questionsCount,
    minSecondsPerQuestion,
    antiCheatConfig,
    telemetry,
    duplicateCount,
    clientStartedAt,
    draftStartedAt,
}) {
    const flags = [];
    if (effectiveStartedAt && questionsCount > 0) {
        const elapsed = (Date.now() - new Date(effectiveStartedAt).getTime()) / 1000;
        const minReasonable = Math.max(
            45,
            questionsCount * 10,
            (Number(minSecondsPerQuestion) > 0 ? Number(minSecondsPerQuestion) * questionsCount * 0.5 : 0),
        );
        if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < minReasonable) {
            flags.push({
                code: 'FAST_COMPLETION',
                severity: elapsed < minReasonable * 0.5 ? 'high' : 'medium',
                detail: `Duree totale ~${Math.round(elapsed)}s pour ${questionsCount} question(s)`,
            });
        }
    }

    if (!Array.isArray(answers) || answers.length === 0) return flags;

    let empty = 0;
    const textResponses = [];
    for (const a of answers) {
        const q = questionMap[(a.questionId || '').toString()];
        if (!q) continue;
        const r = (a.response != null ? String(a.response) : '').trim();
        if (!r) empty += 1;
        if (q.type !== 'QCM') textResponses.push(r);
    }

    if (empty / answers.length > 0.4) {
        flags.push({ code: 'MANY_BLANK', severity: 'low', detail: 'Nombreuses reponses vides' });
    }

    if (questionsCount > 0 && answers.length / questionsCount < 0.35) {
        flags.push({
            code: 'LOW_ANSWER_COVERAGE',
            severity: 'medium',
            detail: `${answers.length}/${questionsCount} question(s) repondues`,
        });
    }

    const nonEmpty = textResponses.filter(Boolean);
    if (nonEmpty.length >= 2) {
        const set = new Set(nonEmpty);
        if (set.size === 1 && nonEmpty[0].length > 15) {
            flags.push({
                code: 'IDENTICAL_OPEN_ANSWERS',
                severity: 'medium',
                detail: 'Reponses ouvertes identiques',
            });
        }
    }

    if (duplicateCount > 0) {
        flags.push({
            code: 'DUPLICATE_QUESTION_IDS',
            severity: 'medium',
            detail: `${duplicateCount} question(s) envoyees plusieurs fois`,
        });
    }

    const t = normalizeTelemetry(telemetry);
    const focusLossThreshold = normalizeCounter(antiCheatConfig?.focusLossFlagThreshold) || 4;
    const pasteThreshold = normalizeCounter(antiCheatConfig?.pasteFlagThreshold) || 4;
    const fullscreenThreshold = normalizeCounter(antiCheatConfig?.fullscreenExitFlagThreshold) || 3;

    if (t.focusLossCount >= focusLossThreshold || t.visibilityHiddenCount >= focusLossThreshold || t.tabSwitchCount >= focusLossThreshold) {
        flags.push({
            code: 'HIGH_FOCUS_LOSS',
            severity: (t.focusLossCount >= focusLossThreshold + 3 || t.tabSwitchCount >= focusLossThreshold + 3) ? 'high' : 'medium',
            detail: `focus=${t.focusLossCount}, hidden=${t.visibilityHiddenCount}, tabs=${t.tabSwitchCount}`,
        });
    }
    if (t.pasteCount >= pasteThreshold) {
        flags.push({
            code: 'EXCESSIVE_PASTE',
            severity: t.pasteCount >= pasteThreshold + 4 ? 'high' : 'medium',
            detail: `${t.pasteCount} collage(s) detectes`,
        });
    }
    if (t.copyCount >= 8) {
        flags.push({
            code: 'HIGH_COPY_ACTIVITY',
            severity: 'low',
            detail: `${t.copyCount} copie(s) detectees`,
        });
    }
    if (t.fullscreenExitCount >= fullscreenThreshold) {
        flags.push({
            code: 'FULLSCREEN_EXITS',
            severity: t.fullscreenExitCount >= fullscreenThreshold + 3 ? 'high' : 'medium',
            detail: `${t.fullscreenExitCount} sortie(s) du mode plein ecran`,
        });
    }

    const draftStart = parseDateOrNull(draftStartedAt);
    const clientStart = parseDateOrNull(clientStartedAt);
    if (draftStart && clientStart) {
        const drift = Math.abs(draftStart.getTime() - clientStart.getTime()) / 1000;
        if (drift > 180) {
            flags.push({
                code: 'CLIENT_CLOCK_MISMATCH',
                severity: 'low',
                detail: `Ecart horodatage client/serveur: ~${Math.round(drift)}s`,
            });
        }
    }

    return flags;
}

function combineScores(qcmPerc, openScore, qcmTotal, requiresAI, wQ, wO) {
    let wq = Number(wQ);
    let wo = Number(wO);
    if (!Number.isFinite(wq) || wq < 0) wq = 50;
    if (!Number.isFinite(wo) || wo < 0) wo = 50;
    if (wq + wo === 0) {
        wq = 50;
        wo = 50;
    }
    const hasQcm = qcmTotal > 0;
    const hasOpen = requiresAI;
    if (!hasQcm) return Math.round(openScore);
    if (!hasOpen) return Math.round(qcmPerc);
    const totalW = wq + wo;
    return Math.round((qcmPerc * wq + openScore * wo) / totalW);
}

async function submitTest(req, res) {
    try {
        const { testId, answers, testStartedAt, telemetry } = req.body || {};

        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });

        const [candidateProfile, questions, draft] = await Promise.all([
            User.findById(req.user._id).select('cvUrl cvText firstName lastName'),
            Question.find({ testId }),
            TestDraft.findOne({ candidateId: req.user._id, testId }).lean(),
        ]);

        const hasCv = Boolean(candidateProfile?.cvUrl) || Boolean(String(candidateProfile?.cvText || '').trim());
        if (!hasCv) {
            return res.status(400).json({
                status: false,
                message: 'Ajoutez votre CV dans votre profil avant de passer cette candidature technique.',
            });
        }

        if (test.submissionDeadline && new Date() > new Date(test.submissionDeadline)) {
            return res.status(400).json({ status: false, message: 'La date limite de passage est depassee.' });
        }

        const previousAttempts = await Submission.countDocuments({ testId, candidateId: req.user._id });
        if (test.maxAttempts > 0 && previousAttempts >= test.maxAttempts) {
            return res.status(400).json({ status: false, message: 'Nombre maximum de tentatives atteint.' });
        }

        const questionMap = {};
        questions.forEach((q) => {
            questionMap[q._id.toString()] = q;
        });

        const sanitized = sanitizeAnswers(answers, questionMap);
        if (sanitized.invalidQuestionCount > 0) {
            return res.status(400).json({
                status: false,
                message: 'Soumission invalide: question inconnue detectee.',
            });
        }
        if (sanitized.invalidQcmOptionCount > 0) {
            return res.status(400).json({
                status: false,
                message: 'Soumission invalide: une reponse QCM ne correspond pas aux options proposees.',
            });
        }
        if (sanitized.tooLongCount > 0) {
            return res.status(400).json({
                status: false,
                message: `Certaines reponses sont trop longues (max ${MAX_OPEN_RESPONSE_CHARS} caracteres).`,
            });
        }
        if (sanitized.normalizedAnswers.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Aucune reponse exploitable a soumettre.',
            });
        }

        const mergedTelemetry = mergeTelemetry(draft?.telemetry || {}, telemetry || {});
        const currentDeviceFingerprint = extractDeviceFingerprint(req, req.body || {});
        const effectiveStartedAt = resolveEffectiveStartedAt(draft?.startedAt, testStartedAt);

        if (test.minSecondsPerQuestion > 0 && effectiveStartedAt && questions.length > 0) {
            const elapsed = (Date.now() - new Date(effectiveStartedAt).getTime()) / 1000;
            const minTotal = test.minSecondsPerQuestion * questions.length;
            if (Number.isFinite(elapsed) && elapsed < minTotal * 0.25) {
                return res.status(400).json({
                    status: false,
                    message: 'Duree de test trop courte par rapport aux exigences. Prenez le temps de repondre correctement.',
                });
            }
        }

        let qaTextForAI = '';
        let qcmScore = 0;
        let qcmTotal = 0;
        let requiresAI = false;

        for (const ans of sanitized.normalizedAnswers) {
            const q = questionMap[ans.questionId];
            if (!q) continue;

            if (q.type === 'QCM') {
                qcmTotal += 1;
                const expected = q.correctAnswer == null ? '' : String(q.correctAnswer).trim();
                if (ans.response === expected) {
                    qcmScore += 1;
                }
            } else {
                requiresAI = true;
                qaTextForAI += `Q: ${q.prompt}\nA: ${ans.response}\n\n`;
            }
        }

        let openScore = 0;
        let totalScore = 0;
        let feedback = '';
        let competencyBreakdown = [];

        const qcmPerc = qcmTotal > 0 ? (qcmScore / qcmTotal) * 100 : 0;

        if (requiresAI && qaTextForAI.trim().length > 0) {
            const aiResult = await evaluateAnswersAI(
                test.jobRole,
                qaTextForAI,
                test.evaluationCriteria || ''
            );
            openScore = aiResult.score || 0;
            totalScore = combineScores(qcmPerc, openScore, qcmTotal, true, test.weightQCM, test.weightOpen);
            feedback = aiResult.feedback || '';
            competencyBreakdown = Array.isArray(aiResult.competencies) ? aiResult.competencies : [];
        } else {
            totalScore = qcmTotal > 0 ? Math.round(qcmPerc) : 0;
            feedback = 'Questions a choix multiples evaluees automatiquement.';
            competencyBreakdown = [];
        }

        const threshold = test.passThreshold != null ? test.passThreshold : 50;
        const qualified = totalScore >= threshold;
        const attemptNumber = previousAttempts + 1;
        const submittedAt = new Date();
        const elapsedSeconds = effectiveStartedAt
            ? Math.max(0, Math.round((submittedAt.getTime() - new Date(effectiveStartedAt).getTime()) / 1000))
            : null;

        const anomalyFlags = computeAnomalyFlags({
            answers: sanitized.normalizedAnswers,
            questionMap,
            effectiveStartedAt,
            questionsCount: questions.length,
            minSecondsPerQuestion: test.minSecondsPerQuestion,
            antiCheatConfig: test.antiCheatConfig || {},
            telemetry: mergedTelemetry,
            duplicateCount: sanitized.duplicateCount,
            clientStartedAt: testStartedAt,
            draftStartedAt: draft?.startedAt,
        });
        const draftFingerprint = draft?.deviceFingerprint || {};
        if (
            pickString(draftFingerprint.userAgent) &&
            pickString(draftFingerprint.ip) &&
            (
                pickString(draftFingerprint.userAgent) !== pickString(currentDeviceFingerprint.userAgent) ||
                pickString(draftFingerprint.ip) !== pickString(currentDeviceFingerprint.ip)
            )
        ) {
            anomalyFlags.push({
                code: 'DEVICE_SWITCH',
                severity: 'high',
                detail: 'Session detectee sur un appareil/adresse IP differente',
            });
        }

        const trustScore = calculateTrustScore({
            anomalyFlags,
            telemetry: mergedTelemetry,
        });
        const behaviorData = {
            tabSwitches: normalizeCounter(mergedTelemetry.tabSwitchCount),
            copyCount: normalizeCounter(mergedTelemetry.copyCount),
            pasteCount: normalizeCounter(mergedTelemetry.pasteCount),
            fullscreenExits: normalizeCounter(mergedTelemetry.fullscreenExitCount),
            focusLossCount: normalizeCounter(mergedTelemetry.focusLossCount),
            visibilityHiddenCount: normalizeCounter(mergedTelemetry.visibilityHiddenCount),
            deviceFingerprint: currentDeviceFingerprint,
        };
        const cheatingFlags = anomalyFlags.map((f) => ({
            code: f.code,
            severity: f.severity || 'low',
            detail: f.detail || '',
            at: new Date(),
        }));

        const submission = new Submission({
            testId,
            candidateId: req.user._id,
            answers: sanitized.normalizedAnswers,
            status: 'GRADED',
            totalScore,
            feedback,
            competencyBreakdown,
            qualified,
            attemptNumber,
            evaluationCriteriaVersion: test.evaluationCriteriaVersion,
            anomalyFlags,
            cheatingFlags,
            trustScore,
            behaviorData,
            antiCheat: {
                startedAt: effectiveStartedAt || null,
                submittedAt,
                elapsedSeconds,
                telemetry: mergedTelemetry,
            },
        });

        await submission.save();
        await TestDraft.deleteMany({ candidateId: req.user._id, testId });

        if (test.webhookUrl) {
            dispatchSubmissionWebhook(test.webhookUrl, {
                event: 'submission.completed',
                testId: String(test._id),
                testTitle: test.title,
                submissionId: String(submission._id),
                candidateId: String(req.user._id),
                score: totalScore,
                qualified,
                attemptNumber,
                at: new Date().toISOString(),
            }).catch(() => {});
            try {
                await logManualActivity(req.user._id, req.user.email, req.user.role, 'WEBHOOK_DISPATCHED', {
                    resourceType: 'Submission',
                    resourceId: submission._id,
                });
            } catch (e) { /* noop */ }
        }

        const candidateUser = await User.findById(req.user._id);
        const candidateName = candidateUser ? `${candidateUser.firstName} ${candidateUser.lastName}` : '';

        notifyCandidateScore(req.user._id, {
            testTitle: test.title,
            score: totalScore,
            qualified,
        }).catch(() => {});

        if (test.createdBy) {
            notifyHrNewSubmission(test.createdBy, {
                testTitle: test.title,
                candidateName,
                score: totalScore,
            }).catch(() => {});
        }

        createAndDispatchNotification({
            userId: req.user._id,
            type: 'SUBMISSION_CREATED',
            category: 'assessment',
            priority: qualified ? 'normal' : 'high',
            title: 'Test termine',
            message: `Votre test "${test.title}" est termine. Score: ${totalScore}%.`,
            link: '/mes-resultats',
            actionKey: `submission:${submission._id}:candidate`,
            data: {
                submissionId: submission._id,
                testTitle: test.title,
                score: totalScore,
                jobId: test._id,
                qualified,
            },
        }).catch(() => {});

        if (test.createdBy) {
            createAndDispatchNotification({
                userId: test.createdBy,
                type: 'CANDIDATE_SUBMITTED',
                category: 'pipeline',
                priority: 'high',
                title: 'Nouvelle soumission',
                message: `${candidateName || 'Un candidat'} a termine le test "${test.title}" (score: ${totalScore}%).`,
                link: '/rh/resultats',
                actionKey: `submission:${submission._id}:hr:${test.createdBy}`,
                data: {
                    submissionId: submission._id,
                    testTitle: test.title,
                    testId: test._id,
                    candidateId: req.user._id,
                    score: totalScore,
                },
            }).catch(() => {});
        }

        skillRecommender.refreshRecommendations(req.user._id, {
            notifyTopMatches: true,
        }).catch(() => {});

        res.status(201).json({
            status: true,
            message: 'Test submitted and graded successfully',
            submissionId: submission._id,
            qualified,
            anomalyFlags,
            trustScore,
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function updateSubmissionPipeline(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const submission = await Submission.findById(req.params.id)
            .populate('candidateId', 'firstName lastName email')
            .populate('testId', 'title jobRole');
        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

        const { interviewScheduledAt, followUpNotes } = req.body;
        const previousInterviewDate = submission.interviewScheduledAt ? new Date(submission.interviewScheduledAt) : null;
        if (interviewScheduledAt !== undefined) {
            submission.interviewScheduledAt = interviewScheduledAt ? new Date(interviewScheduledAt) : null;
        }
        if (followUpNotes !== undefined) {
            submission.followUpNotes = followUpNotes;
        }
        await submission.save();

        const nextInterviewDate = submission.interviewScheduledAt ? new Date(submission.interviewScheduledAt) : null;
        const interviewChanged = (
            (previousInterviewDate?.getTime() || null) !== (nextInterviewDate?.getTime() || null)
        );

        if (interviewChanged && nextInterviewDate && submission.candidateId?._id) {
            const interviewDateLabel = nextInterviewDate.toISOString();
            createAndDispatchNotification({
                userId: submission.candidateId._id,
                type: 'INTERVIEW_SCHEDULED',
                category: 'pipeline',
                priority: 'high',
                title: 'Interview scheduled',
                message: `Your interview for "${submission.testId?.title || 'this role'}" is scheduled.`,
                link: '/mes-candidatures',
                actionKey: `submission:${submission._id}:interview:${interviewDateLabel}`,
                data: {
                    submissionId: submission._id,
                    testId: submission.testId?._id || null,
                    testTitle: submission.testId?.title || '',
                    interviewScheduledAt: interviewDateLabel,
                },
            }).catch(() => {});

            notifyCandidateInterviewScheduled(submission.candidateId._id, {
                testTitle: submission.testId?.title || 'this role',
                interviewDate: interviewDateLabel,
            }).catch(() => {});
        }

        res.status(200).json({ status: true, submission });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getMyResults(req, res) {
    try {
        const submissions = await Submission.find({ candidateId: req.user.id })
            .populate('testId', 'title jobRole')
            .sort('-createdAt');
        res.status(200).json({ status: true, submissions });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getResultDetails(req, res) {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('testId', 'title jobRole description location employmentType calendlyUrl passThreshold')
            .populate(
                'candidateId',
                'firstName lastName email avatar bio phone city country education experienceYears skills preferredSector preferredLocation preferredJobType cvUrl cvOriginalName cvText cvAnalysis'
            )
            .populate('notes.author', 'firstName lastName avatar');

        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

        if (submission.candidateId._id.toString() !== req.user.id && req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }

        res.status(200).json({ status: true, submission });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getAllSubmissions(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const submissions = await Submission.find({})
            .populate('testId', 'title jobRole')
            .populate('candidateId', 'firstName lastName email')
            .sort('-createdAt');

        res.status(200).json({ status: true, submissions });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function addSubmissionNote(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const { id } = req.params;
        const { text } = req.body;

        const submission = await Submission.findById(id);
        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

        submission.notes.push({ text, author: req.user.id });
        await submission.save();

        const updated = await Submission.findById(id).populate('notes.author', 'firstName lastName avatar');
        const newNote = updated.notes[updated.notes.length - 1];

        res.status(201).json({ status: true, note: newNote });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getCandidateApplications(req, res) {
    try {
        const applications = await Submission.find({ candidateId: req.user._id })
            .populate('testId', 'title jobRole location employmentType description calendlyUrl')
            .sort({ createdAt: -1 });
        res.status(200).json({ status: true, applications });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function updateSubmissionStage(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const { id } = req.params;
        const { stage } = req.body;

        if (!['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].includes(stage)) {
            return res.status(400).json({ status: false, message: 'Etape invalide' });
        }

        const submission = await Submission.findByIdAndUpdate(id, { stage }, { new: true })
            .populate('candidateId', 'firstName lastName email')
            .populate('testId', 'title jobRole');

        if (!submission) {
            return res.status(404).json({ status: false, message: 'Candidature introuvable' });
        }

        if (submission.candidateId?._id) {
            createAndDispatchNotification({
                userId: submission.candidateId._id,
                type: 'APPLICATION_STATUS_CHANGED',
                category: 'pipeline',
                priority: stage === 'REJECTED' ? 'high' : 'normal',
                title: 'Application status updated',
                message: `Your application for "${submission.testId?.title || 'this role'}" moved to stage: ${stage}.`,
                link: '/mes-candidatures',
                actionKey: `submission:${submission._id}:stage:${stage}`,
                data: {
                    submissionId: submission._id,
                    testId: submission.testId?._id || null,
                    testTitle: submission.testId?.title || '',
                    stage,
                },
            }).catch(() => {});

            notifyCandidateApplicationStage(submission.candidateId._id, {
                testTitle: submission.testId?.title || 'this role',
                stage,
            }).catch(() => {});
        }

        res.status(200).json({ status: true, message: 'Etape mise a jour', submission });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function getHrActivity(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }
        const testFilter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const tests = await Test.find(testFilter).select('_id');
        const testIds = tests.map((t) => t._id);
        const items = await Submission.find({ testId: { $in: testIds } })
            .sort('-createdAt')
            .limit(50)
            .populate('candidateId', 'firstName lastName email')
            .populate('testId', 'title jobRole');
        res.status(200).json({ status: true, items });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = {
    submitTest,
    getMyResults,
    getResultDetails,
    getAllSubmissions,
    addSubmissionNote,
    getCandidateApplications,
    updateSubmissionStage,
    updateSubmissionPipeline,
    getHrActivity,
};




