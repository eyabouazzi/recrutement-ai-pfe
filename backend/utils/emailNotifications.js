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

async function notifyPipelineMatchingPositive(candidateId, { testTitle, matchScore }) {
    const scoreLine = matchScore != null && Number.isFinite(matchScore)
        ? `Score de compatibilité CV / poste : ${Math.round(matchScore)} %.\n\n`
        : '';
    return sendUserEmail(
        candidateId,
        `[Recruit AI] Pré-sélection réussie — ${testTitle}`,
        `${scoreLine}Votre profil correspond aux attentes initiales de l’offre. Votre évaluation technique a été enregistrée dans la plateforme.\n\n` +
        'Consultez l’espace candidat pour la suite du processus.',
        'emailPipelineMatchingPositive'
    );
}

async function notifyPipelineMatchingNegative(candidateId, { testTitle, matchScore, threshold, justification }) {
    return sendUserEmail(
        candidateId,
        `[Recruit AI] Candidature non retenue (adéquation profil) — ${testTitle}`,
        `Après analyse automatique du CV et du poste, votre dossier ne permet pas de poursuivre pour cette offre.\n\n` +
        `Score de matching : ${Math.round(matchScore)} % (seuil requis : ${threshold} %).\n\n` +
        `Motif synthétique :\n${justification}\n\n` +
        'Conformément au processus, votre candidature peut être clôturée et retirée de la base active.',
        'emailPipelineMatchingNegative'
    );
}

async function notifyPipelineAssessmentPass(candidateId, { testTitle, score }) {
    return sendUserEmail(
        candidateId,
        `[Recruit AI] Réussite au test — ${testTitle}`,
        `Félicitations : vous avez obtenu ${score} % à l’évaluation technique.\n\n` +
        'L’équipe recrutement est informée et pourra vous convoigner pour un entretien. Surveillez vos notifications sur la plateforme.',
        'emailPipelineAssessmentPass'
    );
}

async function notifyPipelineAssessmentFail(candidateId, { testTitle, score, threshold }) {
    return sendUserEmail(
        candidateId,
        `[Recruit AI] Résultat du test — ${testTitle}`,
        `Votre score (${score} %) est inférieur au seuil de réussite (${threshold} %).\n\n` +
        'Selon la configuration de l’offre, votre candidature peut être automatiquement retirée. Vous pouvez postuler à d’autres opportunités depuis l’annuaire des offres.',
        'emailPipelineAssessmentFail'
    );
}

module.exports = {
    smtpConfigured,
    notifyCandidateScore,
    notifyHrNewSubmission,
    notifyCandidateApplicationStage,
    notifyCandidateInterviewScheduled,
    notifyCandidateNewMatch,
    notifyPipelineMatchingPositive,
    notifyPipelineMatchingNegative,
    notifyPipelineAssessmentPass,
    notifyPipelineAssessmentFail,
};
