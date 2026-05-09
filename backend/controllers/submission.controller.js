const Submission = require('../models/submission.model');
const Question = require('../models/question.model');
const Test = require('../models/test.model');
const User = require('../models/user.model');
const TestDraft = require('../models/testDraft.model');
const { evaluateAnswersAI } = require('../utils/openai');
const { dispatchSubmissionWebhook } = require('../utils/webhookDispatch');
const {
    notifyCandidateScore,
    notifyHrNewSubmission,
    notifyCandidateApplicationStage,
    notifyCandidateInterviewScheduled,
} = require('../utils/emailNotifications');
const { createAndDispatchNotification } = require('../utils/inAppNotifications');
const { logManualActivity } = require('../utils/activityLogger');
const skillRecommender = require('../utils/skillRecommender');
const { calculateTrustScore } = require('../utils/trustScoreCalculator');
const { copyProfileCvToApplicationSnapshot } = require('../utils/uploadRetention');
const { purgeCandidateCvIfNoRemainingApplications, deleteSubmissionCascade } = require('../utils/submissionPurge');
const { runAdvancedPipelineAfterSubmission, REMOVAL } = require('../utils/advancedPipelineNotifications');
const { buildJobMatchAnalysis } = require('../utils/jobMatchAnalysis');
const { buildHrTestListFilter, hrCanManageTest } = require('../utils/hrTestAccess');

const MAX_OPEN_RESPONSE_CHARS = 4000;
const MASSIVE_PASTE_CHARS_THRESHOLD = 1200;
const MASSIVE_PASTE_EVENT_THRESHOLD = 4;

function normalizeCounter(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
}

function normalizeTelemetry(raw = {}) {
    return {
        focusLossCount: normalizeCounter(raw.focusLossCount),
        visibilityHiddenCount: normalizeCounter(raw.visibilityHiddenCount),
        tabSwitchCount: normalizeCounter(raw.tabSwitchCount),
        copyCount: normalizeCounter(raw.copyCount),
        pasteCount: normalizeCounter(raw.pasteCount),
        fullscreenExitCount: normalizeCounter(raw.fullscreenExitCount),
    };
}

function mergeTelemetry(base = {}, incoming = {}) {
    const a = normalizeTelemetry(base);
    const b = normalizeTelemetry(incoming);
    return {
        focusLossCount: Math.max(a.focusLossCount, b.focusLossCount),
        visibilityHiddenCount: Math.max(a.visibilityHiddenCount, b.visibilityHiddenCount),
        tabSwitchCount: Math.max(a.tabSwitchCount, b.tabSwitchCount),
        copyCount: Math.max(a.copyCount, b.copyCount),
        pasteCount: Math.max(a.pasteCount, b.pasteCount),
        fullscreenExitCount: Math.max(a.fullscreenExitCount, b.fullscreenExitCount),
    };
}

function normalizeQuestionMetric(raw = {}) {
    return {
        dwellSeconds: Math.max(0, Number(raw?.dwellSeconds) || 0),
        keystrokes: normalizeCounter(raw?.keystrokes),
        backspaces: normalizeCounter(raw?.backspaces),
        pastes: normalizeCounter(raw?.pastes),
    };
}

function normalizeQuestionTimeline(raw = {}) {
    const entries = raw instanceof Map ? Array.from(raw.entries()) : Object.entries(raw || {});
    const out = {};
    entries.forEach(([questionId, metrics]) => {
        if (!questionId) return;
        out[String(questionId)] = normalizeQuestionMetric(metrics);
    });
    return out;
}

function mergeQuestionTimeline(base = {}, incoming = {}) {
    const a = normalizeQuestionTimeline(base);
    const b = normalizeQuestionTimeline(incoming);
    const out = { ...a };
    Object.entries(b).forEach(([questionId, metrics]) => {
        const prev = out[questionId] || normalizeQuestionMetric();
        out[questionId] = {
            dwellSeconds: Math.max(prev.dwellSeconds, metrics.dwellSeconds),
            keystrokes: Math.max(prev.keystrokes, metrics.keystrokes),
            backspaces: Math.max(prev.backspaces, metrics.backspaces),
            pastes: Math.max(prev.pastes, metrics.pastes),
        };
    });
    return out;
}

function parseDateOrNull(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function pickString(value) {
    if (value == null) return '';
    return String(value).trim();
}

function extractDeviceFingerprint(req, body = {}) {
    const forwarded = pickString(req.headers['x-forwarded-for']);
    const firstForwardedIp = forwarded ? forwarded.split(',')[0].trim() : '';
    return {
        userAgent: pickString(req.headers['user-agent']).slice(0, 512),
        ip: firstForwardedIp || pickString(req.ip || req.connection?.remoteAddress).slice(0, 128),
        acceptLanguage: pickString(req.headers['accept-language']).slice(0, 128),
        screenResolution: pickString(body.screenResolution).slice(0, 32),
        timezone: pickString(body.timezone).slice(0, 64),
    };
}

function sanitizeAnswers(rawAnswers, questionMap) {
    const byQuestion = new Map();
    let duplicateCount = 0;

    if (Array.isArray(rawAnswers)) {
        for (const entry of rawAnswers) {
            const questionId = String(entry?.questionId || '').trim();
            if (!questionId) continue;
            if (byQuestion.has(questionId)) duplicateCount += 1;
            byQuestion.set(questionId, entry?.response);
        }
    }

    const normalizedAnswers = [];
    let invalidQuestionCount = 0;
    let invalidQcmOptionCount = 0;
    let tooLongCount = 0;

    for (const [questionId, rawResponse] of byQuestion.entries()) {
        const q = questionMap[questionId];
        if (!q) {
            invalidQuestionCount += 1;
            continue;
        }

        const response = rawResponse == null ? '' : String(rawResponse).trim();
        if (q.type !== 'QCM' && response.length > MAX_OPEN_RESPONSE_CHARS) {
            tooLongCount += 1;
            continue;
        }

        if (q.type === 'QCM' && response) {
            const opts = Array.isArray(q.options) ? q.options.map((x) => String(x).trim()) : [];
            if (opts.length > 0 && !opts.includes(response)) {
                invalidQcmOptionCount += 1;
                continue;
            }
        }

        normalizedAnswers.push({ questionId, response });
    }

    return {
        normalizedAnswers,
        duplicateCount,
        invalidQuestionCount,
        invalidQcmOptionCount,
        tooLongCount,
    };
}

function resolveEffectiveStartedAt(draftStartedAt, clientStartedAt) {
    const draft = parseDateOrNull(draftStartedAt);
    const client = parseDateOrNull(clientStartedAt);
    if (draft) return draft;
    return client;
}

function computeAnomalyFlags({
    answers,
    questionMap,
    effectiveStartedAt,
    questionsCount,
    minSecondsPerQuestion,
    antiCheatConfig,
    telemetry,
    duplicateCount,
    clientStartedAt,
    draftStartedAt,
    questionTimeline,
}) {
    const flags = [];
    if (effectiveStartedAt && questionsCount > 0) {
        const elapsed = (Date.now() - new Date(effectiveStartedAt).getTime()) / 1000;
        const minReasonable = Math.max(
            45,
            questionsCount * 10,
            (Number(minSecondsPerQuestion) > 0 ? Number(minSecondsPerQuestion) * questionsCount * 0.5 : 0),
        );
        if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < minReasonable) {
            flags.push({
                code: 'FAST_COMPLETION',
                severity: elapsed < minReasonable * 0.5 ? 'high' : 'medium',
                detail: `Duree totale ~${Math.round(elapsed)}s pour ${questionsCount} question(s)`,
            });
        }
    }

    if (!Array.isArray(answers) || answers.length === 0) return flags;

    let empty = 0;
    const textResponses = [];
    for (const a of answers) {
        const q = questionMap[(a.questionId || '').toString()];
        if (!q) continue;
        const r = (a.response != null ? String(a.response) : '').trim();
        if (!r) empty += 1;
        if (q.type !== 'QCM') textResponses.push(r);
    }

    if (empty / answers.length > 0.4) {
        flags.push({ code: 'MANY_BLANK', severity: 'low', detail: 'Nombreuses reponses vides' });
    }

    if (questionsCount > 0 && answers.length / questionsCount < 0.35) {
        flags.push({
            code: 'LOW_ANSWER_COVERAGE',
            severity: 'medium',
            detail: `${answers.length}/${questionsCount} question(s) repondues`,
        });
    }

    const nonEmpty = textResponses.filter(Boolean);
    if (nonEmpty.length >= 2) {
        const set = new Set(nonEmpty);
        if (set.size === 1 && nonEmpty[0].length > 15) {
            flags.push({
                code: 'IDENTICAL_OPEN_ANSWERS',
                severity: 'medium',
                detail: 'Reponses ouvertes identiques',
            });
        }
    }

    if (duplicateCount > 0) {
        flags.push({
            code: 'DUPLICATE_QUESTION_IDS',
            severity: 'medium',
            detail: `${duplicateCount} question(s) envoyees plusieurs fois`,
        });
    }

    const t = normalizeTelemetry(telemetry);
    const timeline = normalizeQuestionTimeline(questionTimeline);
    const focusLossThreshold = normalizeCounter(antiCheatConfig?.focusLossFlagThreshold) || 4;
    const pasteThreshold = normalizeCounter(antiCheatConfig?.pasteFlagThreshold) || 4;
    const fullscreenThreshold = normalizeCounter(antiCheatConfig?.fullscreenExitFlagThreshold) || 3;
    const minQuestionDwellSeconds = Math.max(1, normalizeCounter(antiCheatConfig?.minQuestionDwellSeconds) || 6);
    const suspiciousLongAnswerChars = Math.max(40, normalizeCounter(antiCheatConfig?.suspiciousLongAnswerChars) || 180);
    const minKeystrokesForLongAnswer = Math.max(0, normalizeCounter(antiCheatConfig?.minKeystrokesForLongAnswer) || 12);

    // Focus-loss flag: tabSwitch is the most reliable signal; window blur fires too readily.
    if (t.tabSwitchCount >= focusLossThreshold || t.visibilityHiddenCount >= focusLossThreshold) {
        flags.push({
            code: 'HIGH_FOCUS_LOSS',
            severity: (t.tabSwitchCount >= focusLossThreshold + 3 || t.visibilityHiddenCount >= focusLossThreshold + 3) ? 'high' : 'medium',
            detail: `focus=${t.focusLossCount}, hidden=${t.visibilityHiddenCount}, tabs=${t.tabSwitchCount}`,
        });
    }
    if (t.pasteCount >= pasteThreshold) {
        flags.push({
            code: 'EXCESSIVE_PASTE',
            // Require a higher bar for 'high' severity to reduce false positives.
            severity: t.pasteCount >= pasteThreshold + 6 ? 'high' : 'medium',
            detail: `${t.pasteCount} collage(s) detectes`,
        });
    }
    if (t.copyCount >= 8) {
        flags.push({
            code: 'HIGH_COPY_ACTIVITY',
            severity: 'low',
            detail: `${t.copyCount} copie(s) detectees`,
        });
    }
    // Fullscreen exits are only a meaningful signal when fullscreen was required.
    const antiCheatRequiresFullscreen = Boolean(antiCheatConfig?.requireFullscreen);
    if (antiCheatRequiresFullscreen && t.fullscreenExitCount >= fullscreenThreshold) {
        flags.push({
            code: 'FULLSCREEN_EXITS',
            severity: t.fullscreenExitCount >= fullscreenThreshold + 3 ? 'high' : 'medium',
            detail: `${t.fullscreenExitCount} sortie(s) du mode plein ecran`,
        });
    }

    let rapidAnswers = 0;
    let longLowTypingAnswers = 0;
    for (const a of answers) {
        const q = questionMap[(a.questionId || '').toString()];
        if (!q) continue;
        const metric = timeline[(a.questionId || '').toString()] || normalizeQuestionMetric();
        const answerText = (a.response != null ? String(a.response) : '').trim();
        if (answerText && metric.dwellSeconds > 0 && metric.dwellSeconds < minQuestionDwellSeconds) {
            rapidAnswers += 1;
        }
        if (q.type !== 'QCM' && answerText.length >= suspiciousLongAnswerChars && metric.keystrokes < minKeystrokesForLongAnswer) {
            longLowTypingAnswers += 1;
        }
    }
    if (rapidAnswers >= 2) {
        flags.push({
            code: 'RAPID_QUESTION_HOPPING',
            severity: rapidAnswers >= 4 ? 'high' : 'medium',
            detail: `${rapidAnswers} reponse(s) rendues sous ${minQuestionDwellSeconds}s`,
        });
    }
    if (longLowTypingAnswers >= 1) {
        flags.push({
            code: 'LOW_TYPING_ACTIVITY_LONG_ANSWERS',
            severity: longLowTypingAnswers >= 2 ? 'high' : 'medium',
            detail: `${longLowTypingAnswers} reponse(s) longues avec faible frappe clavier`,
        });
    }

    const draftStart = parseDateOrNull(draftStartedAt);
    const clientStart = parseDateOrNull(clientStartedAt);
    if (draftStart && clientStart) {
        const drift = Math.abs(draftStart.getTime() - clientStart.getTime()) / 1000;
        if (drift > 180) {
            flags.push({
                code: 'CLIENT_CLOCK_MISMATCH',
                severity: 'low',
                detail: `Ecart horodatage client/serveur: ~${Math.round(drift)}s`,
            });
        }
    }

    return flags;
}

function computeHardAntiCheatViolations({
    telemetry,
    questionTimeline,
    answers,
    antiCheatConfig = {},
    anomalyFlags = [],
}) {
    const t = normalizeTelemetry(telemetry);
    const violations = [];

    const maxTabs = normalizeCounter(antiCheatConfig.maxTabSwitchAllowed) || 8;
    // Use a higher default for focus loss to avoid false positives from normal browser interactions.
    const maxFocus = normalizeCounter(antiCheatConfig.maxFocusLossAllowed) || 15;
    const maxPaste = Number.isFinite(Number(antiCheatConfig.maxPasteAllowed))
        ? normalizeCounter(antiCheatConfig.maxPasteAllowed)
        : 8;
    // Only apply fullscreen hard-block when fullscreen was explicitly required by the test.
    const requireFullscreen = Boolean(antiCheatConfig.requireFullscreen);
    const maxFullscreen = Number.isFinite(Number(antiCheatConfig.maxFullscreenExitAllowed))
        ? normalizeCounter(antiCheatConfig.maxFullscreenExitAllowed)
        : (requireFullscreen ? 4 : Infinity);
    const maxRapidAnswersAllowed = Number.isFinite(Number(antiCheatConfig.maxRapidAnswersAllowed))
        ? normalizeCounter(antiCheatConfig.maxRapidAnswersAllowed)
        : 4;
    const minQuestionDwellSeconds = Math.max(1, normalizeCounter(antiCheatConfig.minQuestionDwellSeconds) || 6);
    const timeline = normalizeQuestionTimeline(questionTimeline);

    if (maxTabs > 0 && t.tabSwitchCount > maxTabs) {
        violations.push(`Changements d'onglet (${t.tabSwitchCount}) > limite (${maxTabs})`);
    }
    if (maxFocus > 0 && t.focusLossCount > maxFocus) {
        violations.push(`Pertes de focus (${t.focusLossCount}) > limite (${maxFocus})`);
    }
    if (maxFocus > 0 && t.visibilityHiddenCount > maxFocus) {
        violations.push(`Masquages de page (${t.visibilityHiddenCount}) > limite (${maxFocus})`);
    }
    if (maxPaste >= 0 && t.pasteCount > maxPaste) {
        violations.push(`Collages (${t.pasteCount}) > limite (${maxPaste})`);
    }
    // Only hard-block fullscreen exits when fullscreen was explicitly required.
    if (requireFullscreen && Number.isFinite(maxFullscreen) && t.fullscreenExitCount > maxFullscreen) {
        violations.push(`Sorties plein ecran (${t.fullscreenExitCount}) > limite (${maxFullscreen})`);
    }
    if (requireFullscreen && t.fullscreenExitCount > 0 && maxFullscreen === 0) {
        violations.push('Sortie du mode plein ecran detectee alors qu\'il est strictement requis');
    }
    if (maxRapidAnswersAllowed >= 0 && Array.isArray(answers)) {
        let rapidAnswers = 0;
        answers.forEach((answer) => {
            const questionId = String(answer?.questionId || '');
            if (!questionId) return;
            const metric = timeline[questionId];
            const hasResponse = String(answer?.response || '').trim().length > 0;
            if (hasResponse && metric && metric.dwellSeconds > 0 && metric.dwellSeconds < minQuestionDwellSeconds) {
                rapidAnswers += 1;
            }
        });
        if (rapidAnswers > maxRapidAnswersAllowed) {
            violations.push(`Reponses trop rapides (${rapidAnswers}) > limite (${maxRapidAnswersAllowed})`);
        }
    }

    if (antiCheatConfig.rejectOnCriticalFlags) {
        // Only block on signals that are unambiguous and have very low false-positive rates.
        // LOW_TYPING_ACTIVITY_LONG_ANSWERS and FAST_COMPLETION are excluded because they
        // produce too many false positives with certain keyboards, IME, and slow typists.
        const blockingCriticalCodes = new Set([
            'DEVICE_SWITCH',
            'EXCESSIVE_PASTE',
        ]);
        // HIGH_FOCUS_LOSS and FULLSCREEN_EXITS are only blocking when fullscreen is required
        // or when tab-switch count is truly extreme (handled by absolute maxTabs above).
        const critical = anomalyFlags.filter(
            (f) => f?.severity === 'high' && blockingCriticalCodes.has(String(f?.code || ''))
        );
        if (critical.length > 0) {
            violations.push(`Signaux critiques detectes (${critical.length})`);
        }
    }

    return violations;
}

function computeMassivePasteSignal({
    answers = [],
    questionTimeline = {},
    telemetry = {},
}) {
    const timeline = normalizeQuestionTimeline(questionTimeline);
    const t = normalizeTelemetry(telemetry);

    let maxSingleAnswerChars = 0;
    let totalOpenChars = 0;
    let suspiciousLowTypingLongAnswers = 0;
    let timelinePasteCount = 0;

    answers.forEach((answer) => {
        const questionId = String(answer?.questionId || '');
        const response = String(answer?.response || '').trim();
        if (!response) return;

        const chars = response.length;
        totalOpenChars += chars;
        maxSingleAnswerChars = Math.max(maxSingleAnswerChars, chars);

        const metric = timeline[questionId] || normalizeQuestionMetric();
        timelinePasteCount += normalizeCounter(metric.pastes);
        if (chars >= MASSIVE_PASTE_CHARS_THRESHOLD && normalizeCounter(metric.keystrokes) < 20) {
            suspiciousLowTypingLongAnswers += 1;
        }
    });

    const isMassivePaste = (
        maxSingleAnswerChars >= MASSIVE_PASTE_CHARS_THRESHOLD
        || t.pasteCount >= MASSIVE_PASTE_EVENT_THRESHOLD
        || timelinePasteCount >= MASSIVE_PASTE_EVENT_THRESHOLD
        || suspiciousLowTypingLongAnswers >= 1
    );

    return {
        isMassivePaste,
        maxSingleAnswerChars,
        totalOpenChars,
        pasteCount: t.pasteCount,
        timelinePasteCount,
        suspiciousLowTypingLongAnswers,
    };
}

function normalizeForSimilarity(text = '') {
    return String(text || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function toTokenSet(text = '') {
    const cleaned = normalizeForSimilarity(text);
    return new Set(
        cleaned
            .split(' ')
            .map((token) => token.trim())
            .filter((token) => token.length >= 3)
    );
}

function jaccardSimilarity(aSet = new Set(), bSet = new Set()) {
    if (aSet.size === 0 || bSet.size === 0) return 0;
    let intersection = 0;
    aSet.forEach((token) => {
        if (bSet.has(token)) intersection += 1;
    });
    const union = aSet.size + bSet.size - intersection;
    if (union <= 0) return 0;
    return intersection / union;
}

function computePlagiarismReport({
    answers = [],
    questionMap = {},
    telemetry = {},
}) {
    const suspiciousPhrasesCatalog = [
        'as an ai language model',
        'copie collee',
        'chatgpt',
        'copied from',
    ];

    const openAnswers = [];
    answers.forEach((answer) => {
        const question = questionMap[String(answer?.questionId || '')];
        if (!question || question.type === 'QCM') return;
        const response = String(answer?.response || '').trim();
        if (response.length < 80) return;
        openAnswers.push({
            questionId: String(answer?.questionId || ''),
            response,
            tokens: toTokenSet(response),
        });
    });

    let duplicatePairs = 0;
    let maxSimilarity = 0;
    for (let i = 0; i < openAnswers.length; i += 1) {
        for (let j = i + 1; j < openAnswers.length; j += 1) {
            const similarity = jaccardSimilarity(openAnswers[i].tokens, openAnswers[j].tokens);
            maxSimilarity = Math.max(maxSimilarity, similarity);
            if (similarity >= 0.82) duplicatePairs += 1;
        }
    }

    const suspiciousPhrases = [];
    const normalizedCorpus = normalizeForSimilarity(openAnswers.map((entry) => entry.response).join(' '));
    suspiciousPhrasesCatalog.forEach((phrase) => {
        if (normalizedCorpus.includes(phrase)) suspiciousPhrases.push(phrase);
    });

    const pasteCount = normalizeTelemetry(telemetry).pasteCount;

    let score = 0;
    score += Math.min(50, duplicatePairs * 20);
    if (maxSimilarity >= 0.92) score += 30;
    else if (maxSimilarity >= 0.82) score += 18;
    if (suspiciousPhrases.length > 0) score += Math.min(20, suspiciousPhrases.length * 10);
    if (pasteCount >= 4) score += 10;
    score = Math.max(0, Math.min(100, score));

    let level = 'low';
    if (score >= 70) level = 'high';
    else if (score >= 40) level = 'medium';

    return {
        score,
        level,
        duplicatePairs,
        maxSimilarity,
        suspiciousPhrases,
    };
}

function combineScores(qcmPerc, openScore, qcmTotal, requiresAI, wQ, wO) {
    let wq = Number(wQ);
    let wo = Number(wO);
    if (!Number.isFinite(wq) || wq < 0) wq = 50;
    if (!Number.isFinite(wo) || wo < 0) wo = 50;
    if (wq + wo === 0) {
        wq = 50;
        wo = 50;
    }
    const hasQcm = qcmTotal > 0;
    const hasOpen = requiresAI;
    if (!hasQcm) return Math.round(openScore);
    if (!hasOpen) return Math.round(qcmPerc);
    const totalW = wq + wo;
    return Math.round((qcmPerc * wq + openScore * wo) / totalW);
}

function ensureSubmissionJobMatchAnalysis(submission) {
    if (!submission) return submission;

    const current = submission.jobMatchAnalysis || {};
    const hasExistingScore = Number.isFinite(current.score);
    const hasV2Engine = Number(current.matchEngine?.version) >= 2;
    const hasEnriched = current.enrichedCvSignals && Object.keys(current.enrichedCvSignals).length > 0;
    if (hasExistingScore && hasV2Engine && hasEnriched) return submission;

    const candidate = submission.candidateId || {};
    const test = submission.testId || {};
    const nextAnalysis = buildJobMatchAnalysis({
        candidate,
        submission,
        test,
    });

    if (typeof submission.set === 'function') {
        submission.set('jobMatchAnalysis', nextAnalysis);
        submission.markModified('jobMatchAnalysis');
        // Persist asynchronously — don't block the response
        Submission.findByIdAndUpdate(
            submission._id,
            { $set: { jobMatchAnalysis: nextAnalysis } },
            { strict: false }
        ).catch((err) => console.error('[jobMatch] persist error:', err));
    } else {
        submission.jobMatchAnalysis = nextAnalysis;
    }

    return submission;
}

function ensureSubmissionJobMatchAnalysisList(submissions = []) {
    return submissions.map((submission) => ensureSubmissionJobMatchAnalysis(submission));
}

async function submitTest(req, res) {
    try {
        const { testId, answers, testStartedAt, telemetry, questionTimeline } = req.body || {};

        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });

        const [candidateProfile, questions, draft] = await Promise.all([
            User.findById(req.user._id).select('cvUrl cvOriginalName cvText firstName lastName bio education experienceYears skills jobTitle preferredSector preferredLocation cvAnalysis'),
            Question.find({ testId }),
            TestDraft.findOne({ candidateId: req.user._id, testId }).lean(),
        ]);

        const hasCv = Boolean(candidateProfile?.cvUrl) || Boolean(String(candidateProfile?.cvText || '').trim());
        if (!hasCv) {
            return res.status(400).json({
                status: false,
                message: 'Ajoutez votre CV dans votre profil avant de passer cette candidature technique.',
            });
        }

        let applicationCvUrl = '';
        let applicationCvOriginalName = '';
        let applicationCvText = String(candidateProfile?.cvText || '').trim().slice(0, 20000);

        if (candidateProfile?.cvUrl) {
            try {
                const snapshot = await copyProfileCvToApplicationSnapshot(
                    candidateProfile.cvUrl,
                    candidateProfile.cvOriginalName
                );
                if (snapshot?.url) {
                    applicationCvUrl = snapshot.url;
                    applicationCvOriginalName = snapshot.originalName || '';
                }
            } catch (error) {
                // Keep submission flow resilient even if file copy fails.
            }
        }

        if (test.submissionDeadline && new Date() > new Date(test.submissionDeadline)) {
            return res.status(400).json({ status: false, message: 'La date limite de passage est depassee.' });
        }

        const previousAttempts = await Submission.countDocuments({ testId, candidateId: req.user._id });
        if (test.maxAttempts > 0 && previousAttempts >= test.maxAttempts) {
            return res.status(400).json({ status: false, message: 'Nombre maximum de tentatives atteint.' });
        }

        const questionMap = {};
        questions.forEach((q) => {
            questionMap[q._id.toString()] = q;
        });

        const sanitized = sanitizeAnswers(answers, questionMap);
        if (sanitized.invalidQuestionCount > 0) {
            return res.status(400).json({
                status: false,
                message: 'Soumission invalide: question inconnue detectee.',
            });
        }
        if (sanitized.invalidQcmOptionCount > 0) {
            return res.status(400).json({
                status: false,
                message: 'Soumission invalide: une reponse QCM ne correspond pas aux options proposees.',
            });
        }
        if (sanitized.tooLongCount > 0) {
            return res.status(400).json({
                status: false,
                message: `Certaines reponses sont trop longues (max ${MAX_OPEN_RESPONSE_CHARS} caracteres).`,
            });
        }
        if (sanitized.normalizedAnswers.length === 0) {
            return res.status(400).json({
                status: false,
                message: 'Aucune reponse exploitable a soumettre.',
            });
        }

        const mergedTelemetry = mergeTelemetry(draft?.telemetry || {}, telemetry || {});
        const mergedQuestionTimeline = mergeQuestionTimeline(draft?.questionTimeline || {}, questionTimeline || {});
        const currentDeviceFingerprint = extractDeviceFingerprint(req, req.body || {});
        const effectiveStartedAt = resolveEffectiveStartedAt(draft?.startedAt, testStartedAt);

        if (test.minSecondsPerQuestion > 0 && effectiveStartedAt && questions.length > 0) {
            const elapsed = (Date.now() - new Date(effectiveStartedAt).getTime()) / 1000;
            const minTotal = test.minSecondsPerQuestion * questions.length;
            if (Number.isFinite(elapsed) && elapsed < minTotal * 0.25) {
                return res.status(400).json({
                    status: false,
                    message: 'Duree de test trop courte par rapport aux exigences. Prenez le temps de repondre correctement.',
                });
            }
        }

        let qaTextForAI = '';
        let qcmScore = 0;
        let qcmTotal = 0;
        let requiresAI = false;

        for (const ans of sanitized.normalizedAnswers) {
            const q = questionMap[ans.questionId];
            if (!q) continue;

            if (q.type === 'QCM') {
                qcmTotal += 1;
                const expected = q.correctAnswer == null ? '' : String(q.correctAnswer).trim();
                if (ans.response === expected) {
                    qcmScore += 1;
                }
            } else {
                requiresAI = true;
                qaTextForAI += `Q: ${q.prompt}\nA: ${ans.response}\n\n`;
            }
        }

        let openScore = 0;
        let totalScore = 0;
        let feedback = '';
        let competencyBreakdown = [];

        const qcmPerc = qcmTotal > 0 ? (qcmScore / qcmTotal) * 100 : 0;

        if (requiresAI && qaTextForAI.trim().length > 0) {
            const aiResult = await evaluateAnswersAI(
                test.jobRole,
                qaTextForAI,
                test.evaluationCriteria || ''
            );
            openScore = aiResult.score || 0;
            totalScore = combineScores(qcmPerc, openScore, qcmTotal, true, test.weightQCM, test.weightOpen);
            feedback = aiResult.feedback || '';
            competencyBreakdown = Array.isArray(aiResult.competencies) ? aiResult.competencies : [];
        } else {
            totalScore = qcmTotal > 0 ? Math.round(qcmPerc) : 0;
            feedback = 'Questions a choix multiples evaluees automatiquement.';
            competencyBreakdown = [];
        }

        const threshold = test.passThreshold != null ? test.passThreshold : 50;
        const qualified = totalScore >= threshold;
        const attemptNumber = previousAttempts + 1;
        const submittedAt = new Date();
        const elapsedSeconds = effectiveStartedAt
            ? Math.max(0, Math.round((submittedAt.getTime() - new Date(effectiveStartedAt).getTime()) / 1000))
            : null;

        const anomalyFlags = computeAnomalyFlags({
            answers: sanitized.normalizedAnswers,
            questionMap,
            effectiveStartedAt,
            questionsCount: questions.length,
            minSecondsPerQuestion: test.minSecondsPerQuestion,
            antiCheatConfig: test.antiCheatConfig || {},
            telemetry: mergedTelemetry,
            duplicateCount: sanitized.duplicateCount,
            clientStartedAt: testStartedAt,
            draftStartedAt: draft?.startedAt,
            questionTimeline: mergedQuestionTimeline,
        });
        if (draft?.lastActivityAt) {
            const lastActivity = new Date(draft.lastActivityAt);
            if (!Number.isNaN(lastActivity.getTime())) {
                const idleSeconds = (submittedAt.getTime() - lastActivity.getTime()) / 1000;
                if (idleSeconds > 8 * 60) {
                    anomalyFlags.push({
                        code: 'INACTIVITY_GAP',
                        severity: idleSeconds > 15 * 60 ? 'high' : 'medium',
                        detail: `Aucune activite detectee pendant ~${Math.round(idleSeconds)}s avant soumission`,
                    });
                }
            }
        }
        const draftFingerprint = draft?.deviceFingerprint || {};
        if (
            pickString(draftFingerprint.userAgent) &&
            pickString(draftFingerprint.ip) &&
            (
                pickString(draftFingerprint.userAgent) !== pickString(currentDeviceFingerprint.userAgent) ||
                pickString(draftFingerprint.ip) !== pickString(currentDeviceFingerprint.ip)
            )
        ) {
            anomalyFlags.push({
                code: 'DEVICE_SWITCH',
                severity: 'high',
                detail: 'Session detectee sur un appareil/adresse IP differente',
            });
            if (test?.antiCheatConfig?.rejectOnDeviceSwitch) {
                if (test?.createdBy) {
                    const candidateFullName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.email || 'Candidat';
                    createAndDispatchNotification({
                        userId: test.createdBy,
                        type: 'CHEATING_ALERT',
                        category: 'proctoring',
                        priority: 'high',
                        title: 'Alerte anti-triche: changement d’appareil',
                        message: `${candidateFullName} a ete bloque pour changement d'appareil/session sur "${test.title || 'ce test'}".`,
                        link: '/rh/resultats',
                        actionKey: `test:${test._id}:candidate:${req.user._id}:device-switch-block`,
                        data: {
                            testId: test._id,
                            testTitle: test.title || '',
                            candidateId: req.user._id,
                            candidateName: candidateFullName,
                            reason: 'DEVICE_SWITCH_BLOCKED',
                        },
                    }).catch(() => {});
                }
                return res.status(400).json({
                    status: false,
                    message: 'Soumission bloquee : changement d’appareil/session detecte.',
                    anomalyFlags,
                });
            }
        }

        const plagiarismReport = computePlagiarismReport({
            answers: sanitized.normalizedAnswers,
            questionMap,
            telemetry: mergedTelemetry,
        });
        if (plagiarismReport.score >= 40) {
            anomalyFlags.push({
                code: 'POTENTIAL_PLAGIARISM',
                severity: plagiarismReport.level === 'high' ? 'high' : 'medium',
                detail: `plagiarismScore=${plagiarismReport.score}, similarPairs=${plagiarismReport.duplicatePairs}`,
            });
        }
        const trustScore = calculateTrustScore({
            anomalyFlags,
            telemetry: mergedTelemetry,
        });
        const hardViolations = computeHardAntiCheatViolations({
            telemetry: mergedTelemetry,
            questionTimeline: mergedQuestionTimeline,
            answers: sanitized.normalizedAnswers,
            antiCheatConfig: test.antiCheatConfig || {},
            anomalyFlags,
        });
        if (hardViolations.length > 0) {
            if (test?.createdBy) {
                const candidateFullName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.email || 'Candidat';
                createAndDispatchNotification({
                    userId: test.createdBy,
                    type: 'CHEATING_ALERT',
                    category: 'proctoring',
                    priority: 'high',
                    title: 'Alerte anti-triche: soumission bloquee',
                    message: `${candidateFullName} a ete bloque par le systeme anti-triche sur "${test.title || 'ce test'}".`,
                    link: '/rh/resultats',
                    actionKey: `test:${test._id}:candidate:${req.user._id}:hard-violation-block`,
                    data: {
                        testId: test._id,
                        testTitle: test.title || '',
                        candidateId: req.user._id,
                        candidateName: candidateFullName,
                        trustScore,
                        plagiarismScore: plagiarismReport?.score || 0,
                        violations: hardViolations.slice(0, 5),
                        anomalyCount: anomalyFlags.length || 0,
                        reason: 'HARD_ANTI_CHEAT_VIOLATION',
                    },
                }).catch(() => {});
            }
            return res.status(400).json({
                status: false,
                message: 'Soumission bloquee par le systeme anti-triche.',
                violations: hardViolations,
                anomalyFlags,
            });
        }
        const behaviorData = {
            tabSwitches: normalizeCounter(mergedTelemetry.tabSwitchCount),
            copyCount: normalizeCounter(mergedTelemetry.copyCount),
            pasteCount: normalizeCounter(mergedTelemetry.pasteCount),
            fullscreenExits: normalizeCounter(mergedTelemetry.fullscreenExitCount),
            focusLossCount: normalizeCounter(mergedTelemetry.focusLossCount),
            visibilityHiddenCount: normalizeCounter(mergedTelemetry.visibilityHiddenCount),
            deviceFingerprint: currentDeviceFingerprint,
        };
        const cheatingFlags = anomalyFlags.map((f) => ({
            code: f.code,
            severity: f.severity || 'low',
            detail: f.detail || '',
            at: new Date(),
        }));
        const jobMatchAnalysis = buildJobMatchAnalysis({
            candidate: candidateProfile || {},
            submission: {
                applicationCvText,
            },
            test,
        });

        const submission = new Submission({
            testId,
            candidateId: req.user._id,
            applicationCvUrl,
            applicationCvOriginalName,
            applicationCvText,
            jobMatchAnalysis,
            answers: sanitized.normalizedAnswers,
            status: 'GRADED',
            totalScore,
            feedback,
            competencyBreakdown,
            qualified,
            attemptNumber,
            evaluationCriteriaVersion: test.evaluationCriteriaVersion,
            anomalyFlags,
            plagiarismReport,
            cheatingFlags,
            trustScore,
            behaviorData,
            antiCheat: {
                startedAt: effectiveStartedAt || null,
                submittedAt,
                elapsedSeconds,
                telemetry: mergedTelemetry,
                questionTimeline: mergedQuestionTimeline,
            },
        });

        await submission.save();
        await TestDraft.deleteMany({ candidateId: req.user._id, testId });

        const massivePasteSignal = computeMassivePasteSignal({
            answers: sanitized.normalizedAnswers,
            telemetry: mergedTelemetry,
            questionTimeline: mergedQuestionTimeline,
        });

        if (massivePasteSignal.isMassivePaste && test?.createdBy) {
            const candidateFullName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.email || 'Candidat';
            createAndDispatchNotification({
                userId: test.createdBy,
                type: 'SUSPICIOUS_PASTE_ACTIVITY',
                category: 'proctoring',
                priority: 'high',
                title: 'Alerte anti-triche: collage massif detecte',
                message: `${candidateFullName} a colle un volume important de texte sur "${test.title || 'ce test'}".`,
                link: '/rh/resultats',
                actionKey: `submission:${submission._id}:massive-paste-alert`,
                data: {
                    submissionId: submission._id,
                    candidateId: req.user._id,
                    candidateName: candidateFullName,
                    testId: test._id,
                    testTitle: test.title || '',
                    maxSingleAnswerChars: massivePasteSignal.maxSingleAnswerChars,
                    totalOpenChars: massivePasteSignal.totalOpenChars,
                    pasteCount: massivePasteSignal.pasteCount,
                    timelinePasteCount: massivePasteSignal.timelinePasteCount,
                    suspiciousLowTypingLongAnswers: massivePasteSignal.suspiciousLowTypingLongAnswers,
                    plagiarismScore: plagiarismReport.score,
                    plagiarismLevel: plagiarismReport.level,
                },
            }).catch(() => {});
        }

        const notableCheatingFlags = Array.isArray(anomalyFlags)
            ? anomalyFlags.filter((flag) => ['medium', 'high'].includes(String(flag?.severity || '').toLowerCase()))
            : [];
        const shouldNotifyCheatingAlert = (
            notableCheatingFlags.length > 0
            || Number(plagiarismReport?.score || 0) >= 40
            || Number(trustScore || 100) <= 70
        );

        if (shouldNotifyCheatingAlert && test?.createdBy) {
            const candidateFullName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || req.user?.email || 'Candidat';
            const topSignals = notableCheatingFlags.slice(0, 3).map((flag) => String(flag?.code || '').trim()).filter(Boolean);
            createAndDispatchNotification({
                userId: test.createdBy,
                type: 'CHEATING_ALERT',
                category: 'proctoring',
                priority: 'high',
                title: 'Alerte anti-triche détectée',
                message: `${candidateFullName} présente des signaux de triche sur "${test.title || 'ce test'}".`,
                link: '/rh/resultats',
                actionKey: `submission:${submission._id}:cheating-alert`,
                data: {
                    submissionId: submission._id,
                    candidateId: req.user._id,
                    candidateName: candidateFullName,
                    testId: test._id,
                    testTitle: test.title || '',
                    trustScore,
                    plagiarismScore: plagiarismReport?.score || 0,
                    plagiarismLevel: plagiarismReport?.level || 'low',
                    signals: topSignals,
                    anomalyCount: anomalyFlags.length || 0,
                },
            }).catch(() => {});
        }

        const candidateUser = await User.findById(req.user._id);
        const candidateName = candidateUser ? `${candidateUser.firstName} ${candidateUser.lastName}` : '';

        const pipelineOutcome = await runAdvancedPipelineAfterSubmission({
            submission,
            test,
            candidateProfile: candidateProfile || {},
            jobMatchAnalysis,
            totalScore,
            qualified,
            candidateName,
        }).catch(() => ({ retained: true, pipeline: 'error' }));

        if (!pipelineOutcome.retained) {
            if (test.webhookUrl) {
                dispatchSubmissionWebhook(test.webhookUrl, {
                    event: pipelineOutcome.removalReason === REMOVAL.NEGATIVE_MATCH
                        ? 'submission.rejected_matching'
                        : 'submission.rejected_assessment',
                    testId: String(test._id),
                    testTitle: test.title,
                    candidateId: String(req.user._id),
                    score: totalScore,
                    qualified,
                    removalReason: pipelineOutcome.removalReason,
                    at: new Date().toISOString(),
                }).catch(() => {});
            }
            return res.status(200).json({
                status: true,
                submissionRetained: false,
                removalReason: pipelineOutcome.removalReason,
                message: pipelineOutcome.message || 'Candidature clôturée.',
                qualified,
                anomalyFlags,
                trustScore,
            });
        }

        if (test.webhookUrl) {
            dispatchSubmissionWebhook(test.webhookUrl, {
                event: 'submission.completed',
                testId: String(test._id),
                testTitle: test.title,
                submissionId: String(submission._id),
                candidateId: String(req.user._id),
                score: totalScore,
                qualified,
                attemptNumber,
                at: new Date().toISOString(),
            }).catch(() => {});
            try {
                await logManualActivity(req.user._id, req.user.email, req.user.role, 'WEBHOOK_DISPATCHED', {
                    resourceType: 'Submission',
                    resourceId: submission._id,
                });
            } catch (e) { /* noop */ }
        }

        skillRecommender.refreshRecommendations(req.user._id, {
            notifyTopMatches: true,
        }).catch(() => {});

        res.status(201).json({
            status: true,
            message: 'Test submitted and graded successfully',
            submissionId: submission._id,
            qualified,
            submissionRetained: true,
            pipeline: pipelineOutcome.pipeline,
            anomalyFlags,
            trustScore,
            plagiarismReport,
        });
    } catch (error) {
        console.error('submitTest fatal error:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

async function updateSubmissionPipeline(req, res) {
    try {
        if (req.user.role !== 'HR') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const submission = await Submission.findById(req.params.id)
            .populate('candidateId', 'firstName lastName email')
            .populate('testId', 'title jobRole');
        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

        const testPipeline = await Test.findById(submission.testId?._id || submission.testId);
        if (!testPipeline || !(await hrCanManageTest(req.user, testPipeline))) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }

        const { interviewScheduledAt, followUpNotes } = req.body;
        const previousInterviewDate = submission.interviewScheduledAt ? new Date(submission.interviewScheduledAt) : null;
        if (interviewScheduledAt !== undefined) {
            submission.interviewScheduledAt = interviewScheduledAt ? new Date(interviewScheduledAt) : null;
        }
        if (followUpNotes !== undefined) {
            submission.followUpNotes = followUpNotes;
        }
        await submission.save();

        const nextInterviewDate = submission.interviewScheduledAt ? new Date(submission.interviewScheduledAt) : null;
        const interviewChanged = (
            (previousInterviewDate?.getTime() || null) !== (nextInterviewDate?.getTime() || null)
        );

        if (interviewChanged && nextInterviewDate && submission.candidateId?._id) {
            const interviewDateLabel = nextInterviewDate.toISOString();
            createAndDispatchNotification({
                userId: submission.candidateId._id,
                type: 'INTERVIEW_SCHEDULED',
                category: 'pipeline',
                priority: 'high',
                title: 'Interview scheduled',
                message: `Your interview for "${submission.testId?.title || 'this role'}" is scheduled.`,
                link: '/mes-candidatures',
                actionKey: `submission:${submission._id}:interview:${interviewDateLabel}`,
                data: {
                    submissionId: submission._id,
                    testId: submission.testId?._id || null,
                    testTitle: submission.testId?.title || '',
                    interviewScheduledAt: interviewDateLabel,
                },
            }).catch(() => {});

            notifyCandidateInterviewScheduled(submission.candidateId._id, {
                testTitle: submission.testId?.title || 'this role',
                interviewDate: interviewDateLabel,
            }).catch(() => {});
        }

        res.status(200).json({ status: true, submission });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getMyResults(req, res) {
    try {
        const submissions = await Submission.find({ candidateId: req.user.id })
            .populate('testId', 'title jobRole description evaluationCriteria')
            .populate('candidateId', 'firstName lastName bio education experienceYears skills jobTitle preferredSector preferredLocation cvText cvAnalysis')
            .sort('-createdAt');
        res.status(200).json({ status: true, submissions: ensureSubmissionJobMatchAnalysisList(submissions) });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getResultDetails(req, res) {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('testId', 'title jobRole description location employmentType calendlyUrl passThreshold evaluationCriteria')
            .populate(
                'candidateId',
                'firstName lastName email avatar bio phone city country education experienceYears skills jobTitle preferredSector preferredLocation preferredJobType cvUrl cvOriginalName cvText cvAnalysis'
            )
            .populate('notes.author', 'firstName lastName avatar');

        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

        const candidateId = submission.candidateId?._id || submission.candidateId;
        if (req.user.role === 'candidat') {
            if (!candidateId || (String(candidateId) !== String(req.user.id) && String(candidateId) !== String(req.user._id))) {
                return res.status(403).json({ status: false, message: "Unauthorized" });
            }
        } else if (req.user.role === 'HR') {
            const testDoc = await Test.findById(submission.testId?._id || submission.testId);
            if (!testDoc || !(await hrCanManageTest(req.user, testDoc))) {
                return res.status(403).json({ status: false, message: 'Non autorisé pour cette candidature.' });
            }
        } else {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }

        res.status(200).json({ status: true, submission: ensureSubmissionJobMatchAnalysis(submission) });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getAllSubmissions(req, res) {
    try {
        if (req.user.role !== 'HR') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const testFilter = await buildHrTestListFilter(req.user);
        const tests = await Test.find(testFilter).select('_id').lean();
        const testIds = tests.map((t) => t._id);
        const submissions = testIds.length === 0
            ? []
            : await Submission.find({ testId: { $in: testIds } })
                .populate('testId', 'title jobRole description evaluationCriteria')
                .populate('candidateId', 'firstName lastName email bio education experienceYears skills jobTitle preferredSector preferredLocation cvText cvAnalysis')
                .sort('-createdAt');

        res.status(200).json({ status: true, submissions: ensureSubmissionJobMatchAnalysisList(submissions) });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function addSubmissionNote(req, res) {
    try {
        if (req.user.role !== 'HR') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const { id } = req.params;
        const { text } = req.body;

        const submission = await Submission.findById(id);
        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

        const testForNote = await Test.findById(submission.testId);
        if (!testForNote || !(await hrCanManageTest(req.user, testForNote))) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }

        submission.notes.push({ text, author: req.user.id });
        await submission.save();

        const updated = await Submission.findById(id).populate('notes.author', 'firstName lastName avatar');
        const newNote = updated.notes[updated.notes.length - 1];

        res.status(201).json({ status: true, note: newNote });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getCandidateApplications(req, res) {
    try {
        const applications = await Submission.find({ candidateId: req.user._id })
            .populate('testId', 'title jobRole location employmentType description calendlyUrl evaluationCriteria')
            .populate('candidateId', 'firstName lastName bio education experienceYears skills jobTitle preferredSector preferredLocation cvText cvAnalysis')
            .sort({ createdAt: -1 });
        res.status(200).json({ status: true, applications: ensureSubmissionJobMatchAnalysisList(applications) });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function updateSubmissionStage(req, res) {
    try {
        if (req.user.role !== 'HR') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const { id } = req.params;
        const { stage } = req.body;

        if (!['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].includes(stage)) {
            return res.status(400).json({ status: false, message: 'Etape invalide' });
        }

        const submission = await Submission.findById(id)
            .populate('candidateId', 'firstName lastName email')
            .populate('testId', 'title jobRole');

        if (!submission) {
            return res.status(404).json({ status: false, message: 'Candidature introuvable' });
        }

        const testStage = await Test.findById(submission.testId?._id || submission.testId);
        if (!testStage || !(await hrCanManageTest(req.user, testStage))) {
            return res.status(403).json({ status: false, message: 'Non autorisé pour cette candidature.' });
        }

        const previousStage = submission.stage || 'NEW';
        submission.stage = stage;
        if (!Array.isArray(submission.stageHistory)) submission.stageHistory = [];
        submission.stageHistory.push({
            fromStage: previousStage,
            toStage: stage,
            changedBy: req.user._id || req.user.id,
            source: 'hr',
            changedAt: new Date(),
            note: previousStage === stage ? 'Stage re-confirmed by HR' : 'Stage updated by HR',
        });
        await submission.save();

        if (submission.candidateId?._id) {
            createAndDispatchNotification({
                userId: submission.candidateId._id,
                type: 'APPLICATION_STATUS_CHANGED',
                category: 'pipeline',
                priority: stage === 'REJECTED' ? 'high' : 'normal',
                title: 'Application status updated',
                message: `Your application for "${submission.testId?.title || 'this role'}" moved to stage: ${stage}.`,
                link: '/mes-candidatures',
                actionKey: `submission:${submission._id}:stage:${stage}`,
                data: {
                    submissionId: submission._id,
                    testId: submission.testId?._id || null,
                    testTitle: submission.testId?.title || '',
                    stage,
                },
            }).catch(() => {});

            notifyCandidateApplicationStage(submission.candidateId._id, {
                testTitle: submission.testId?.title || 'this role',
                stage,
            }).catch(() => {});
        }

        if (stage === 'REJECTED') {
            const deletedSubmissionId = String(submission._id);
            await deleteSubmissionCascade(submission);

            return res.status(200).json({
                status: true,
                deleted: true,
                submissionId: deletedSubmissionId,
                message: 'Candidature non retenue: dossier et CV supprimes automatiquement.',
            });
        }

        res.status(200).json({ status: true, message: 'Etape mise a jour', submission });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function bulkUpdateSubmissionStage(req, res) {
    try {
        if (req.user.role !== 'HR') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }

        const { submissionIds, stage } = req.body || {};
        if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
            return res.status(400).json({ status: false, message: 'submissionIds requis' });
        }
        if (!['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].includes(stage)) {
            return res.status(400).json({ status: false, message: 'Etape invalide' });
        }

        const uniqueIds = [...new Set(submissionIds.map((id) => String(id)).filter(Boolean))];
        const submissions = await Submission.find({ _id: { $in: uniqueIds } })
            .populate('testId', 'title createdBy company');

        let updatedCount = 0;
        const blocked = [];

        for (const submission of submissions) {
            const testStage = await Test.findById(submission.testId?._id || submission.testId);
            if (!testStage || !(await hrCanManageTest(req.user, testStage))) {
                blocked.push(String(submission._id));
                continue;
            }

            const previousStage = submission.stage || 'NEW';
            if (previousStage === stage) continue;

            submission.stage = stage;
            if (!Array.isArray(submission.stageHistory)) submission.stageHistory = [];
            submission.stageHistory.push({
                fromStage: previousStage,
                toStage: stage,
                changedBy: req.user._id || req.user.id,
                source: 'hr',
                changedAt: new Date(),
                note: 'Bulk stage update by HR',
            });
            await submission.save();
            updatedCount += 1;
        }

        return res.status(200).json({
            status: true,
            updatedCount,
            blockedCount: blocked.length,
            blockedSubmissionIds: blocked,
            message: `${updatedCount} candidature(s) mises a jour.`,
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}

async function getHrActivity(req, res) {
    try {
        if (req.user.role !== 'HR') {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }
        const testFilter = await buildHrTestListFilter(req.user);
        const tests = await Test.find(testFilter).select('_id');
        const testIds = tests.map((t) => t._id);
        const items = await Submission.find({ testId: { $in: testIds } })
            .sort('-createdAt')
            .limit(50)
            .populate('candidateId', 'firstName lastName email')
            .populate('testId', 'title jobRole');
        res.status(200).json({ status: true, items });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function reportCheatFlag(req, res) {
    try {
        const { submissionId, type } = req.body;
        // Mock success response for documentation screenshots
        res.status(200).json({
            status: true,
            message: "Infraction enregistrée avec succès",
            alertLevel: "HIGH",
            flags: [type],
            trustScore: 60
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = {
    submitTest,
    getMyResults,
    getResultDetails,
    getAllSubmissions,
    addSubmissionNote,
    getCandidateApplications,
    updateSubmissionStage,
    bulkUpdateSubmissionStage,
    updateSubmissionPipeline,
    getHrActivity,
    reportCheatFlag,
};




