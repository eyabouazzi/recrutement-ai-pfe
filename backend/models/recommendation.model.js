const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    recommendedTests: [{
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test',
            required: true
        },
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        matchScore: {
            type: Number,
            min: 0,
            max: 100
        },
        confidence: {
            type: Number,
            min: 0,
            max: 100
        },
        category: {
            type: String,
            enum: ['STRONG_MATCH', 'GROWTH_MATCH', 'EXPLORATION'],
            default: 'GROWTH_MATCH'
        },
        reason: String,
        fitSummary: String,
        hardRequirementSkills: [String],
        missingHardRequirements: [String],
        matchedSkills: [String],
        missingSkills: [String],
        skillGaps: [{
            skill: String,
            importance: Number,
            learningDifficulty: String,
            relatedUserSkills: [String]
        }],
        learningOpportunities: [{
            skill: String,
            reason: String,
            suggestion: String
        }],
        scoreBreakdown: {
            hardRequirements: Number,
            skillCoverage: Number,
            skillAlignment: Number,
            proficiency: Number,
            experience: Number,
            location: Number,
            jobType: Number,
            momentum: Number
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    userProfile: {
        skills: [String],
        skillProficiency: {
            type: Map,
            of: Number,
            default: {}
        },
        experienceLevel: {
            type: String,
            enum: ['Junior', 'Mid-level', 'Senior', 'Expert']
        },
        preferredLocations: [String],
        preferredJobTypes: [String],
        preferredSectors: [String],
        industryPreferences: [String],
        remotePreference: {
            type: Boolean,
            default: false
        },
        yearsOfExperience: {
            type: Number,
            default: 0
        },
        activitySignals: {
            totalSubmissions: {
                type: Number,
                default: 0
            },
            averageScore: {
                type: Number,
                default: 0
            },
            lastSubmissionAt: Date
        },
        salaryExpectations: {
            min: Number,
            max: Number
        }
    },
    stats: {
        totalRecommendations: {
            type: Number,
            default: 0
        },
        strongMatches: {
            type: Number,
            default: 0
        },
        growthMatches: {
            type: Number,
            default: 0
        },
        explorationMatches: {
            type: Number,
            default: 0
        },
        averageMatchScore: {
            type: Number,
            default: 0
        }
    },
    algorithmVersion: {
        type: String,
        default: '2.0.0'
    },
    profileFingerprint: {
        type: String,
        default: ''
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
recommendationSchema.index({ userId: 1, lastUpdated: -1 });
recommendationSchema.index({ 'recommendedTests.testId': 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
