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

const questionIntegritySchema = new mongoose.Schema({
    dwellSeconds: { type: Number, default: 0, min: 0 },
    keystrokes: { type: Number, default: 0, min: 0 },
    backspaces: { type: Number, default: 0, min: 0 },
    pastes: { type: Number, default: 0, min: 0 },
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
    applicationCvUrl: {
        type: String,
        default: '',
    },
    applicationCvOriginalName: {
        type: String,
        default: '',
        trim: true,
    },
    applicationCvText: {
        type: String,
        default: '',
        trim: true,
    },
    jobMatchAnalysis: {
        score: { type: Number, min: 0, max: 100, default: null },
        confidence: { type: String, default: '' },
        summary: { type: String, default: '' },
        matchedSkills: [{ type: String, trim: true }],
        missingSkills: [{ type: String, trim: true }],
        extraSkills: [{ type: String, trim: true }],
        matchingSignals: [{ type: String, trim: true }],
        recruiterRecommendations: [{ type: String, trim: true }],
        candidateActionPlan: { type: mongoose.Schema.Types.Mixed, default: null },
        roleAlignment: { type: String, default: '' },
        experienceAlignment: { type: String, default: '' },
        requiredExperienceLevel: { type: String, default: '' },
        detectedCandidateLevel: { type: String, default: '' },
        lastCalculatedAt: { type: Date },
        /** Enriched CV signals (education, certs, languages, etc.) */
        enrichedCvSignals: { type: mongoose.Schema.Types.Mixed, default: null },
        /** Moteur v2 : dimensions, radar, constellation, insights créatifs (non strict pour évolution) */
        matchEngine: { type: mongoose.Schema.Types.Mixed, default: null },
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
    stageHistory: [{
        fromStage: {
            type: String,
            enum: ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', null],
            default: null,
        },
        toStage: {
            type: String,
            enum: ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
            required: true,
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            default: null,
        },
        changedAt: {
            type: Date,
            default: Date.now,
        },
        source: {
            type: String,
            enum: ['system', 'hr', 'candidate'],
            default: 'system',
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
    }],
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
    plagiarismReport: {
        score: { type: Number, default: 0, min: 0, max: 100 },
        level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
        duplicatePairs: { type: Number, default: 0, min: 0 },
        maxSimilarity: { type: Number, default: 0, min: 0, max: 1 },
        suspiciousPhrases: [{ type: String, trim: true }],
    },
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
        questionTimeline: { type: Map, of: questionIntegritySchema, default: {} },
    },
}, { timestamps: true });

submissionSchema.pre('save', function stageHistoryBootstrap() {
    if (this.isNew && (!Array.isArray(this.stageHistory) || this.stageHistory.length === 0)) {
        this.stageHistory = [{
            fromStage: null,
            toStage: this.stage || 'NEW',
            changedBy: this.candidateId || null,
            source: 'system',
            changedAt: new Date(),
            note: 'Initial submission stage',
        }];
    }
});

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
