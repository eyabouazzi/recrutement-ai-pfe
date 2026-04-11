const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'USER_LOGIN', 
            'USER_LOGOUT', 
            'USER_CREATED', 
            'USER_UPDATED', 
            'USER_DELETED',
            'PASSWORD_CHANGED',
            'TEST_CREATED',
            'TEST_UPDATED',
            'TEST_DELETED',
            'QUESTION_ADDED',
            'QUESTION_REMOVED',
            'SUBMISSION_SUBMITTED',
            'RESULT_VIEWED',
            'FILE_UPLOADED',
            'PROFILE_UPDATED',
            'SETTINGS_CHANGED',
            'EXPORT_GENERATED',
            'EVALUATION_CRITERIA_UPDATED',
            'AI_QUESTION_REGENERATED',
            'WEBHOOK_DISPATCHED',
            'EMAIL_NOTIFICATION_SENT'
        ]
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actorEmail: {
        type: String,
        required: true
    },
    actorRole: {
        type: String,
        required: true
    },
    resourceType: {
        type: String,
        enum: ['User', 'Test', 'Question', 'Submission', 'Result', 'File', 'Setting']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'ERROR'],
        default: 'INFO'
    }
}, { 
    timestamps: true 
});

// Index for better query performance
logSchema.index({ actorId: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('Log', logSchema);