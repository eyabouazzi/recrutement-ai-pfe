const sendEmail = require('./mailer');
const userModel = require('../models/user.model');

function smtpConfigured() {
    return !!(
        String(process.env.SMTP_HOST || '').trim() &&
        String(process.env.SMTP_USER || '').trim() &&
        String(process.env.SMTP_PASS || '').trim()
    );
}

async function sendUserEmail(userId, subject, content, preferenceKey) {
    if (!smtpConfigured()) return false;

    try {
        const user = await userModel.findById(userId).select('email firstName notificationPrefs');
        if (!user?.email) return false;
        if (preferenceKey && user.notificationPrefs?.[preferenceKey] === false) return false;

        await sendEmail({
            email: user.email,
            subject,
            content: `Hello ${user.firstName || ''},\n\n${content}\n\nRecruitAI Team`,
        });
        return true;
    } catch (error) {
        return false;
    }
}

async function notifyCandidateScore(candidateId, { testTitle, score, qualified }) {
    return sendUserEmail(
        candidateId,
        `Your test result is ready: ${testTitle}`,
        `Your test "${testTitle}" has been graded.\nScore: ${score}/100\nStatus: ${qualified ? 'qualified' : 'not qualified'}.`,
        'emailScoreReady'
    );
}

async function notifyHrNewSubmission(hrUserId, { testTitle, candidateName, score }) {
    return sendUserEmail(
        hrUserId,
        `New submission received: ${testTitle}`,
        `${candidateName || 'A candidate'} completed "${testTitle}".\nScore: ${score}/100.`,
        'emailHrNewSubmission'
    );
}

async function notifyCandidateApplicationStage(candidateId, { testTitle, stage }) {
    return sendUserEmail(
        candidateId,
        `Application status updated: ${testTitle}`,
        `Your application for "${testTitle}" moved to stage: ${stage}.`,
        'emailApplicationStatus'
    );
}

async function notifyCandidateInterviewScheduled(candidateId, { testTitle, interviewDate }) {
    return sendUserEmail(
        candidateId,
        `Interview scheduled: ${testTitle}`,
        `Your interview for "${testTitle}" was scheduled at ${interviewDate}.`,
        'emailInterviewUpdates'
    );
}

async function notifyCandidateNewMatch(candidateId, { testTitle, matchScore }) {
    return sendUserEmail(
        candidateId,
        `New matching opportunity: ${testTitle}`,
        `A new role "${testTitle}" matches your profile (${matchScore}%).`,
        'emailRecommendedJobs'
    );
}

module.exports = {
    smtpConfigured,
    notifyCandidateScore,
    notifyHrNewSubmission,
    notifyCandidateApplicationStage,
    notifyCandidateInterviewScheduled,
    notifyCandidateNewMatch,
};
