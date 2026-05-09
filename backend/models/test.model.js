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
    /** Entreprise associée (copié depuis le profil RH à la création) — utile pour le reporting */
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        default: null,
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
        /** Seuils de blocage serveur (anti-contournement client) */
        maxTabSwitchAllowed: { type: Number, default: 8, min: 1 },
        maxFocusLossAllowed: { type: Number, default: 10, min: 1 },
        maxPasteAllowed: { type: Number, default: 8, min: 0 },
        maxFullscreenExitAllowed: { type: Number, default: 4, min: 0 },
        minQuestionDwellSeconds: { type: Number, default: 6, min: 1 },
        suspiciousLongAnswerChars: { type: Number, default: 180, min: 40 },
        minKeystrokesForLongAnswer: { type: Number, default: 12, min: 0 },
        maxRapidAnswersAllowed: { type: Number, default: 4, min: 0 },
        blockPaste: { type: Boolean, default: false },
        rejectOnDeviceSwitch: { type: Boolean, default: true },
        rejectOnCriticalFlags: { type: Boolean, default: true },
    },
    evaluationCriteriaVersion: { type: Number, default: 1 },
    scoringAuditLog: [{
        at: { type: Date, default: Date.now },
        evaluationCriteria: String,
        version: Number,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    }],
    /**
     * Notifications pipeline avancées (matching CV, résultat test, suppressions auto).
     * Si absent, le moteur applique des défauts « actifs » côté code (voir advancedPipelineNotifications).
     */
    advancedPipeline: {
        /** Activer matching / notifications avancées (désactivé par défaut pour compatibilité) */
        enabled: { type: Boolean, default: false },
        /** Seuil minimal du score de matching (0–100) pour poursuivre la candidature */
        matchPassThreshold: { type: Number, default: 45, min: 0, max: 100 },
        /** Supprimer la candidature si le matching est sous le seuil */
        removeOnCvMismatch: { type: Boolean, default: true },
        /** Supprimer la candidature si le test est sous le seuil de réussite */
        removeOnFailedAssessment: { type: Boolean, default: true },
        /** Passer l’étape pipeline à SCREENING après réussite test + matching OK */
        advanceStageOnPass: { type: Boolean, default: true },
    },
}, { timestamps: true });

const Test = mongoose.model('Test', testSchema);
module.exports = Test;

