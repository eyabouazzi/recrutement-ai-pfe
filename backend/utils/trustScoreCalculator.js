const PENALTIES = {
    FAST_COMPLETION: 15,
    MANY_BLANK: 6,
    IDENTICAL_OPEN_ANSWERS: 20,
    LOW_ANSWER_COVERAGE: 10,
    DUPLICATE_QUESTION_IDS: 12,
    HIGH_FOCUS_LOSS: 12,
    EXCESSIVE_PASTE: 10,
    HIGH_COPY_ACTIVITY: 6,
    CLIENT_CLOCK_MISMATCH: 4,
    FULLSCREEN_EXITS: 8,
    DEVICE_SWITCH: 18,
};

function severityMultiplier(severity) {
    if (severity === 'high') return 1.4;
    if (severity === 'medium') return 1;
    return 0.6;
}

function normalizeCounter(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
}

function calculateTrustScore({ anomalyFlags = [], telemetry = {} } = {}) {
    let score = 100;

    for (const flag of anomalyFlags) {
        const code = String(flag?.code || '').trim();
        const severity = String(flag?.severity || 'low').trim().toLowerCase();
        const basePenalty = PENALTIES[code] || 5;
        score -= Math.round(basePenalty * severityMultiplier(severity));
    }

    const tabSwitches = normalizeCounter(telemetry.tabSwitchCount);
    const pasteCount = normalizeCounter(telemetry.pasteCount);
    const fullscreenExits = normalizeCounter(telemetry.fullscreenExitCount);
    if (tabSwitches >= 5) score -= 8;
    if (pasteCount >= 5) score -= 6;
    if (fullscreenExits >= 3) score -= 4;

    return Math.max(0, Math.min(100, score));
}

module.exports = {
    calculateTrustScore,
};
