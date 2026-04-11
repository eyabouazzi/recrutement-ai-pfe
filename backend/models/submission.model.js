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

const proctoringTelemetrySchema = new mongoose.Schema({
    focusLossCount: { type: Number, default: 0, min: 0 },
    visibilityHiddenCount: { type: Number, default: 0, min: 0 },
    tabSwitchCount: { type: Number, default: 0, min: 0 },
    copyCount: { type: Number, default: 0, min: 0 },
    pasteCount: { type: Number, default: 0, min: 0 },
    fullscreenExitCount: { type: Number, default: 0, min: 0 },
}, { _id: false });

const deviceFingerprintSchema = new mongoose.Schema({
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    acceptLanguage: { type: String, default: '' },
    screenResolution: { type: String, default: '' },
    timezone: { type: String, default: '' },
}, { _id: false });

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
    /** Synthèse par compétence renvoyée par l'IA (évaluation des réponses ouvertes) */
    competencyBreakdown: [{
        competency: { type: String, required: true },
        score: { type: Number, min: 0, max: 100 },
        comment: { type: String, default: '' },
    }],
    qualified: { type: Boolean, default: false },
    attemptNumber: { type: Number, default: 1 },
    evaluationCriteriaVersion: { type: Number },
    interviewScheduledAt: { type: Date },
    followUpNotes: { type: String, trim: true, default: '' },
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
    /** Signaux pour revue RH (anti-fraude / qualité légère) */
    anomalyFlags: [{
        code: { type: String },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
        detail: { type: String, default: '' },
    }],
    cheatingFlags: [{
        code: { type: String },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
        detail: { type: String, default: '' },
        at: { type: Date, default: Date.now },
    }],
    trustScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
    },
    behaviorData: {
        tabSwitches: { type: Number, default: 0, min: 0 },
        copyCount: { type: Number, default: 0, min: 0 },
        pasteCount: { type: Number, default: 0, min: 0 },
        fullscreenExits: { type: Number, default: 0, min: 0 },
        focusLossCount: { type: Number, default: 0, min: 0 },
        visibilityHiddenCount: { type: Number, default: 0, min: 0 },
        deviceFingerprint: { type: deviceFingerprintSchema, default: () => ({}) },
    },
    antiCheat: {
        startedAt: { type: Date, default: null },
        submittedAt: { type: Date, default: Date.now },
        elapsedSeconds: { type: Number, default: null },
        telemetry: { type: proctoringTelemetrySchema, default: () => ({}) },
    },
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
