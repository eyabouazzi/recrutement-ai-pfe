const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recommendedTests: [{
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Test'
        },
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        reason: String,
        matchedSkills: [String],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    userProfile: {
        skills: [String],
        experienceLevel: {
            type: String,
            enum: ['Junior', 'Mid-level', 'Senior', 'Expert']
        },
        preferredLocations: [String],
        preferredJobTypes: [String],
        salaryExpectations: {
            min: Number,
            max: Number
        }
    },
    algorithmVersion: {
        type: String,
        default: '1.0'
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