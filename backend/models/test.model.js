const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    /** Critères / pondération attendus par le RH, transmis au prompt d'évaluation IA */
    evaluationCriteria: {
        type: String,
        trim: true,
        default: '',
    },
    jobRole: {
        type: String,
        required: true,
        trim: true,
    },
    timeLimit: {
        type: Number, // Time limit in minutes
        required: true,
        default: 30,
    },
    location: {
        type: String,
        default: 'Remote',
    },
    employmentType: {
        type: String,
        enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
        default: 'Full-time',
    },
    status: {
        type: String,
        enum: ['PUBLISHED', 'DRAFT', 'CLOSED'],
        default: 'PUBLISHED',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    /** Lien privé : si non vide, le candidat doit passer ?invite=... */
    inviteCode: { type: String, trim: true, default: '' },
    submissionDeadline: { type: Date },
    /** 0 = illimité */
    maxAttempts: { type: Number, default: 0, min: 0 },
    passThreshold: { type: Number, default: 50, min: 0, max: 100 },
    /** Pondération combinée QCM / ouvert (normalisée côté serveur) */
    weightQCM: { type: Number, default: 50, min: 0, max: 100 },
    weightOpen: { type: Number, default: 50, min: 0, max: 100 },
    calendlyUrl: { type: String, trim: true, default: '' },
    webhookUrl: { type: String, trim: true, default: '' },
    /** Anti-triche légère : 0 = désactivé */
    minSecondsPerQuestion: { type: Number, default: 0, min: 0 },
    antiCheatLevel: {
        type: String,
        enum: ['BASIC', 'STANDARD', 'STRICT'],
        default: 'STANDARD',
    },
    antiCheatConfig: {
        tabSwitchWarnThreshold: { type: Number, default: 3, min: 1 },
        tabSwitchAutoSubmitThreshold: { type: Number, default: 5, min: 2 },
        focusLossFlagThreshold: { type: Number, default: 4, min: 1 },
        pasteFlagThreshold: { type: Number, default: 4, min: 1 },
        fullscreenExitFlagThreshold: { type: Number, default: 3, min: 1 },
        requireFullscreen: { type: Boolean, default: false },
    },
    evaluationCriteriaVersion: { type: Number, default: 1 },
    scoringAuditLog: [{
        at: { type: Date, default: Date.now },
        evaluationCriteria: String,
        version: Number,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    }],
}, { timestamps: true });

const Test = mongoose.model('Test', testSchema);
module.exports = Test;

