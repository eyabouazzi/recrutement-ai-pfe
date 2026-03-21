const skillRecommender = require('../utils/skillRecommender');
const Recommendation = require('../models/recommendation.model');
const Test = require('../models/test.model');
const Submission = require('../models/submission.model');

// Generate recommendations for authenticated user
async function generateRecommendations(req, res) {
    try {
        const userId = req.user.id;
        const recommendations = await skillRecommender.generateRecommendations(userId);
        
        res.status(200).json({
            status: true,
            message: 'Recommendations generated successfully',
            recommendations
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get stored recommendations for authenticated user
async function getRecommendations(req, res) {
    try {
        const userId = req.user.id;
        const recommendations = await skillRecommender.getRecommendationsForUser(userId);
        
        // Populate test details
        const populatedRecs = await Promise.all(
            recommendations.map(async (rec) => {
                if (rec.testId) {
                    const test = await Test.findById(rec.testId);
                    return {
                        ...rec.toObject(),
                        test
                    };
                }
                return rec;
            })
        );
        
        res.status(200).json({
            status: true,
            recommendations: populatedRecs
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Refresh recommendations
async function refreshRecommendations(req, res) {
    try {
        const userId = req.user.id;
        const recommendations = await skillRecommender.refreshRecommendations(userId);
        
        res.status(200).json({
            status: true,
            message: 'Recommendations refreshed successfully',
            recommendations
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get user profile insights
async function getProfileInsights(req, res) {
    try {
        const userId = req.user.id;
        
        const recommendation = await Recommendation.findOne({ userId });
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
                    skillScores[skill].total += sub.totalScore;
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
                improvementAreas
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
