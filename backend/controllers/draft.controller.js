const TestDraft = require('../models/testDraft.model');
const Test = require('../models/test.model');

function normalizeCounter(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
}

function mergeTelemetry(current = {}, incoming = {}) {
    return {
        focusLossCount: Math.max(normalizeCounter(current.focusLossCount), normalizeCounter(incoming.focusLossCount)),
        visibilityHiddenCount: Math.max(normalizeCounter(current.visibilityHiddenCount), normalizeCounter(incoming.visibilityHiddenCount)),
        tabSwitchCount: Math.max(normalizeCounter(current.tabSwitchCount), normalizeCounter(incoming.tabSwitchCount)),
        copyCount: Math.max(normalizeCounter(current.copyCount), normalizeCounter(incoming.copyCount)),
        pasteCount: Math.max(normalizeCounter(current.pasteCount), normalizeCounter(incoming.pasteCount)),
        fullscreenExitCount: Math.max(normalizeCounter(current.fullscreenExitCount), normalizeCounter(incoming.fullscreenExitCount)),
    };
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

async function getDraft(req, res) {
    try {
        const { testId } = req.params;
        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ status: false, message: 'Test introuvable' });

        let draft = await TestDraft.findOne({ candidateId: req.user._id, testId });
        if (!draft) {
            draft = await TestDraft.create({
                candidateId: req.user._id,
                testId,
                answers: [],
                currentQuestionIndex: 0,
                startedAt: new Date(),
                lastActivityAt: new Date(),
                telemetry: {},
                deviceFingerprint: extractDeviceFingerprint(req),
            });
        }
        res.status(200).json({
            status: true,
            draft,
        });
    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
}

async function saveDraft(req, res) {
    try {
        const { testId } = req.params;
        const { answers, currentQuestionIndex, telemetry, startedAt } = req.body || {};
        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ status: false, message: 'Test introuvable' });

        const existing = await TestDraft.findOne({ candidateId: req.user._id, testId }).lean();
        const existingStartedAt = existing?.startedAt ? new Date(existing.startedAt) : null;
        const incomingStartedAt = startedAt ? new Date(startedAt) : null;
        const effectiveStartedAt = existingStartedAt || (incomingStartedAt && !Number.isNaN(incomingStartedAt.getTime()) ? incomingStartedAt : new Date());

        const payload = {
            candidateId: req.user._id,
            testId,
            answers: Array.isArray(answers) ? answers : [],
            currentQuestionIndex: Number.isFinite(currentQuestionIndex) ? currentQuestionIndex : 0,
            startedAt: effectiveStartedAt,
            lastActivityAt: new Date(),
            telemetry: mergeTelemetry(existing?.telemetry || {}, telemetry || {}),
            deviceFingerprint: {
                ...(existing?.deviceFingerprint || {}),
                ...extractDeviceFingerprint(req, req.body || {}),
            },
        };

        const draft = await TestDraft.findOneAndUpdate(
            { candidateId: req.user._id, testId },
            { $set: payload },
            { upsert: true, new: true }
        );

        res.status(200).json({ status: true, draft });
    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
}

async function deleteDraft(req, res) {
    try {
        const { testId } = req.params;
        await TestDraft.deleteMany({ candidateId: req.user._id, testId });
        res.status(200).json({ status: true });
    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
}

module.exports = { getDraft, saveDraft, deleteDraft };
