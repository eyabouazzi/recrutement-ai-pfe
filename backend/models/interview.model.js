const mongoose = require('mongoose');

const { Schema } = mongoose;

const interviewSchema = new Schema(
    {
        candidateId: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
            index: true,
        },
        testId: {
            type: Schema.Types.ObjectId,
            ref: 'Test',
            required: false,
        },
        submissionId: {
            type: Schema.Types.ObjectId,
            ref: 'Submission',
            required: false,
        },

        scheduledAt: { type: Date, required: true, index: true },
        durationMinutes: { type: Number, default: 30, min: 5, max: 240 },
        type: {
            type: String,
            enum: ['video', 'phone', 'onsite'],
            default: 'video',
        },
        status: {
            type: String,
            enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'],
            default: 'SCHEDULED',
            index: true,
        },

        rescheduleCount: { type: Number, default: 0, min: 0 },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

// Common query patterns for Calendar / timeline:
// - HR listing: by creator/test/candidate with a date window
// - Candidate listing: by candidateId with a date window
interviewSchema.index({ candidateId: 1, scheduledAt: -1 });
interviewSchema.index({ createdBy: 1, scheduledAt: -1 });
interviewSchema.index({ testId: 1, scheduledAt: -1 });
interviewSchema.index({ status: 1, scheduledAt: -1 });

const Interview = mongoose.model('Interview', interviewSchema);
module.exports = Interview;

