const skillRecommender = require('../utils/skillRecommender');
const Recommendation = require('../models/recommendation.model');
const Submission = require('../models/submission.model');

function toClientRecommendation(item) {
    if (!item) return null;
    const base = typeof item.toObject === 'function' ? item.toObject() : { ...item };
    const populatedTest = base.test || (
        base.testId && typeof base.testId === 'object' ? base.testId : null
    );
    if (populatedTest) {
        base.test = populatedTest;
        base._id = base._id || populatedTest._id;
        base.title = base.title || populatedTest.title;
        base.jobRole = base.jobRole || populatedTest.jobRole;
        base.description = base.description || populatedTest.description;
        base.location = base.location || populatedTest.location;
        base.type = base.type || populatedTest.employmentType;
    }
    base.matchScore = base.matchScore || base.score || 0;
    base.requiredSkills = Array.isArray(base.requiredSkills)
        ? base.requiredSkills
        : Array.from(new Set([
            ...(base.hardRequirementSkills || []),
            ...(base.matchedSkills || []),
            ...(base.missingSkills || []),
        ]));
    base.hardRequirementSkills = Array.isArray(base.hardRequirementSkills) ? base.hardRequirementSkills : [];
    base.missingHardRequirements = Array.isArray(base.missingHardRequirements) ? base.missingHardRequirements : [];
    base.skills = Array.isArray(base.skills) ? base.skills : base.matchedSkills || [];
    return base;
}

// Generate recommendations for authenticated user
async function generateRecommendations(req, res) {
    try {
        const userId = req.user.id;
        await skillRecommender.generateRecommendations(userId, { notifyTopMatches: true });
        const recommendations = await skillRecommender.getRecommendationsForUser(userId, {
            autoGenerate: false,
            refreshIfStale: false,
        });

        res.status(200).json({
            status: true,
            message: 'Recommendations generated successfully',
            recommendations: recommendations.map((item) => toClientRecommendation(item)),
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get stored recommendations for authenticated user
async function getRecommendations(req, res) {
    try {
        const userId = req.user.id;
        const recommendationDoc = await skillRecommender.getRecommendationDocument(userId, {
            autoGenerate: true,
            refreshIfStale: true,
            notifyTopMatches: false,
        });
        const recommendations = recommendationDoc?.recommendedTests || [];

        res.status(200).json({
            status: true,
            recommendations: recommendations.map((item) => toClientRecommendation(item)),
            meta: {
                algorithmVersion: recommendationDoc?.algorithmVersion || null,
                lastUpdated: recommendationDoc?.lastUpdated || null,
                stats: recommendationDoc?.stats || {},
            },
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Refresh recommendations
async function refreshRecommendations(req, res) {
    try {
        const userId = req.user.id;
        await skillRecommender.refreshRecommendations(userId, { notifyTopMatches: true });
        const recommendations = await skillRecommender.getRecommendationsForUser(userId, {
            autoGenerate: false,
            refreshIfStale: false,
        });

        res.status(200).json({
            status: true,
            message: 'Recommendations refreshed successfully',
            recommendations: recommendations.map((item) => toClientRecommendation(item)),
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get user profile insights
async function getProfileInsights(req, res) {
    try {
        const userId = req.user.id;

        const recommendation = await Recommendation.findOne({ userId }).sort({ lastUpdated: -1 });
        const submissions = await Submission.find({ candidateId: userId }).populate('testId');

        if (!recommendation && submissions.length === 0) {
            return res.status(200).json({
                status: true,
                insights: {
                    skills: [],
                    experienceLevel: 'Junior',
                    totalSubmissions: 0,
                    averageScore: 0,
                    topSkills: [],
                    improvementAreas: []
                }
            });
        }

        const userProfile = recommendation ? recommendation.userProfile : { skills: [], experienceLevel: 'Junior' };

        // Calculate stats
        const totalSubmissions = submissions.length;
        const averageScore = totalSubmissions > 0
            ? Math.round(submissions.reduce((sum, s) => sum + s.totalScore, 0) / totalSubmissions)
            : 0;

        // Get top skills based on scores
        const skillScores = {};
        submissions.forEach(sub => {
            if (sub.testId && sub.testId.jobRole) {
                const skills = skillRecommender.extractSkillsFromJobRole(sub.testId.jobRole);
                skills.forEach(skill => {
                    if (!skillScores[skill]) {
                        skillScores[skill] = { total: 0, count: 0 };
                    }
                    skillScores[skill].total += Number(sub.totalScore || 0);
                    skillScores[skill].count += 1;
                });
            }
        });

        const topSkills = Object.entries(skillScores)
            .map(([skill, data]) => ({
                skill,
                avgScore: Math.round(data.total / data.count)
            }))
            .sort((a, b) => b.avgScore - a.avgScore)
            .slice(0, 5);

        // Identify improvement areas
        const improvementAreas = Object.entries(skillScores)
            .map(([skill, data]) => ({
                skill,
                avgScore: Math.round(data.total / data.count)
            }))
            .sort((a, b) => a.avgScore - b.avgScore)
            .slice(0, 3)
            .filter(s => s.avgScore < 70);

        res.status(200).json({
            status: true,
            insights: {
                skills: userProfile.skills,
                experienceLevel: userProfile.experienceLevel,
                totalSubmissions,
                averageScore,
                topSkills,
                improvementAreas,
                recommendationStats: recommendation?.stats || {},
            }
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = {
    generateRecommendations,
    getRecommendations,
    refreshRecommendations,
    getProfileInsights
};
