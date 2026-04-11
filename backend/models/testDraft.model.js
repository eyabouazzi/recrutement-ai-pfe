const mongoose = require('mongoose');

const draftAnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    response: { type: String, default: '' },
}, { _id: false });

const draftTelemetrySchema = new mongoose.Schema({
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

const testDraftSchema = new mongoose.Schema({
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    answers: [draftAnswerSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    telemetry: { type: draftTelemetrySchema, default: () => ({}) },
    deviceFingerprint: { type: deviceFingerprintSchema, default: () => ({}) },
}, { timestamps: true });

testDraftSchema.index({ candidateId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('TestDraft', testDraftSchema);
