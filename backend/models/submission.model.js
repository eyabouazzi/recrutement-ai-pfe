const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
    },
    response: {
        type: String,
        required: true,
    },
});

const submissionSchema = new mongoose.Schema({
    testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true,
        index: true,
    },
    candidateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true,
    },
    answers: [answerSchema],
    totalScore: {
        type: Number,
        default: null, // Null until graded
    },
    feedback: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['PENDING', 'GRADED'],
        default: 'PENDING',
    },
    stage: {
        type: String,
        enum: ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
        default: 'NEW',
    },
    notes: [{
        text: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
