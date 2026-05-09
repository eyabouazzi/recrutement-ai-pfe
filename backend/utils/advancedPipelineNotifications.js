/**
 * Gestion avancée des notifications pipeline : matching CV, résultat test,
 * refus justifiés et suppressions de candidature selon configuration de l'offre.
 */
const { createAndDispatchNotification } = require('./inAppNotifications');
const {
    notifyCandidateScore,
    notifyHrNewSubmission,
    notifyPipelineMatchingPositive,
    notifyPipelineMatchingNegative,
    notifyPipelineAssessmentPass,
    notifyPipelineAssessmentFail,
} = require('./emailNotifications');
const { deleteSubmissionCascade } = require('./submissionPurge');

const REMOVAL = {
    NEGATIVE_MATCH: 'NEGATIVE_MATCH',
    FAILED_ASSESSMENT: 'FAILED_ASSESSMENT',
};

function resolveAdvancedPipelineConfig(test = {}) {
    const ap = test.advancedPipeline || {};
    const envOff = String(process.env.DISABLE_ADVANCED_PIPELINE || '').toLowerCase() === 'true';
    if (envOff) {
        return {
            enabled: false,
            matchPassThreshold: 45,
            removeOnCvMismatch: false,
            removeOnFailedAssessment: false,
            advanceStageOnPass: false,
        };
    }
    const envDefaultOn = String(process.env.ADVANCED_PIPELINE_DEFAULT || '').toLowerCase() === 'true';
    const enabled = envDefaultOn || ap.enabled === true;
    const matchPassThreshold = Number.isFinite(Number(ap.matchPassThreshold))
        ? Math.min(100, Math.max(0, Number(ap.matchPassThreshold)))
        : 45;
    return {
        enabled,
        matchPassThreshold,
        removeOnCvMismatch: enabled && ap.removeOnCvMismatch !== false,
        removeOnFailedAssessment: enabled && ap.removeOnFailedAssessment !== false,
        advanceStageOnPass: enabled && ap.advanceStageOnPass !== false,
    };
}

function formatMatchJustification(jobMatchAnalysis = {}) {
    const parts = [];
    if (jobMatchAnalysis.summary) parts.push(String(jobMatchAnalysis.summary).slice(0, 400));
    const missing = Array.isArray(jobMatchAnalysis.missingSkills) ? jobMatchAnalysis.missingSkills.slice(0, 8) : [];
    if (missing.length) parts.push(`Compétences / axes attendus non couverts : ${missing.join(', ')}.`);
    const role = jobMatchAnalysis.roleAlignment || jobMatchAnalysis.experienceAlignment;
    if (role) parts.push(String(role).slice(0, 280));
    const out = parts.join('\n\n').trim();
    return out || 'Le profil et le poste sont insuffisamment alignés par rapport aux critères de l’offre.';
}

/**
 * @returns {Promise<{ retained: boolean, removalReason?: string, message?: string, pipeline?: string }>}
 */
async function runAdvancedPipelineAfterSubmission({
    submission,
    test,
    candidateProfile,
    jobMatchAnalysis,
    totalScore,
    qualified,
    candidateName,
}) {
    const cfg = resolveAdvancedPipelineConfig(test);
    const testTitle = test.title || 'cette offre';
    const candidateId = submission.candidateId;
    const matchScore = jobMatchAnalysis && typeof jobMatchAnalysis.score === 'number'
        ? jobMatchAnalysis.score
        : null;
    const hasNumericMatch = Number.isFinite(matchScore);
    const matchPositive = !hasNumericMatch || matchScore >= cfg.matchPassThreshold;

    if (!cfg.enabled) {
        await notifyCandidateScore(candidateId, {
            testTitle,
            score: totalScore,
            qualified,
        }).catch(() => {});
        await createAndDispatchNotification({
            userId: candidateId,
            type: 'SUBMISSION_CREATED',
            category: 'assessment',
            priority: qualified ? 'normal' : 'high',
            title: 'Test terminé',
            message: `Votre test « ${testTitle} » est terminé. Score : ${totalScore} %.`,
            link: '/mes-resultats',
            actionKey: `submission:${submission._id}:candidate`,
            data: {
                submissionId: submission._id,
                testTitle,
                score: totalScore,
                jobId: test._id,
                qualified,
            },
        }).catch(() => {});
        if (test.createdBy) {
            await notifyHrNewSubmission(test.createdBy, {
                testTitle,
                candidateName,
                score: totalScore,
            }).catch(() => {});
            await createAndDispatchNotification({
                userId: test.createdBy,
                type: 'CANDIDATE_SUBMITTED',
                category: 'pipeline',
                priority: 'high',
                title: 'Nouvelle soumission',
                message: `${candidateName || 'Un candidat'} a terminé le test « ${testTitle} » (score : ${totalScore} %).`,
                link: '/rh/resultats',
                actionKey: `submission:${submission._id}:hr:${test.createdBy}`,
                data: {
                    submissionId: submission._id,
                    testTitle,
                    testId: test._id,
                    candidateId,
                    score: totalScore,
                },
            }).catch(() => {});
        }
        return { retained: true, pipeline: 'legacy' };
    }

    // —— Matching négatif ——
    if (!matchPositive) {
        const justification = formatMatchJustification(jobMatchAnalysis);
        await createAndDispatchNotification({
            userId: candidateId,
            type: 'PIPELINE_MATCH_NEGATIVE',
            category: 'pipeline',
            priority: 'high',
            title: 'Pré-sélection : profil non retenu',
            message: `Votre candidature sur « ${testTitle} » ne correspond pas au niveau d’adéquation requis (score de matching ${Math.round(matchScore)} %, seuil ${cfg.matchPassThreshold} %). ${justification.slice(0, 900)}`,
            link: '/mes-candidatures',
            actionKey: `submission:${submission._id}:match-negative`,
            data: {
                submissionId: submission._id,
                testId: test._id,
                testTitle,
                matchScore,
                threshold: cfg.matchPassThreshold,
                phase: 'matching',
            },
        }).catch(() => {});

        await notifyPipelineMatchingNegative(candidateId, {
            testTitle,
            matchScore,
            threshold: cfg.matchPassThreshold,
            justification,
        }).catch(() => {});

        if (test.createdBy) {
            await createAndDispatchNotification({
                userId: test.createdBy,
                type: 'PIPELINE_MATCH_NEGATIVE_HR',
                category: 'pipeline',
                priority: 'normal',
                title: 'Tentative filtrée (matching)',
                message: `${candidateName || 'Un candidat'} — « ${testTitle} » : matching ${Math.round(matchScore)} % sous le seuil (${cfg.matchPassThreshold} %). Dossier supprimé si configuré.`,
                link: '/rh/resultats',
                actionKey: `submission:${submission._id}:hr-match-negative`,
                data: { submissionId: submission._id, testTitle, matchScore },
            }).catch(() => {});
        }

        if (cfg.removeOnCvMismatch) {
            await deleteSubmissionCascade(submission);
            return {
                retained: false,
                removalReason: REMOVAL.NEGATIVE_MATCH,
                message: 'Votre candidature a été clôturée : adéquation CV / poste insuffisante. Le dossier a été retiré.',
                pipeline: 'advanced',
            };
        }

        if (test.createdBy) {
            await notifyHrNewSubmission(test.createdBy, {
                testTitle,
                candidateName,
                score: totalScore,
            }).catch(() => {});
            await createAndDispatchNotification({
                userId: test.createdBy,
                type: 'CANDIDATE_SUBMITTED',
                category: 'pipeline',
                priority: 'high',
                title: 'Soumission à examiner (matching bas)',
                message: `${candidateName || 'Un candidat'} a terminé « ${testTitle} » (score test ${totalScore} %, matching ${Math.round(matchScore)} % sous le seuil — dossier conservé).`,
                link: '/rh/resultats',
                actionKey: `submission:${submission._id}:hr-low-match`,
                data: {
                    submissionId: submission._id,
                    testTitle,
                    testId: test._id,
                    candidateId,
                    score: totalScore,
                },
            }).catch(() => {});
        }
        return { retained: true, pipeline: 'advanced', matchRetainedDespiteLowScore: true };
    }

    // —— Matching positif ——
    await createAndDispatchNotification({
        userId: candidateId,
        type: 'PIPELINE_MATCH_POSITIVE',
        category: 'pipeline',
        priority: 'normal',
        title: 'Pré-sélection réussie',
        message: `Félicitations : votre profil correspond à l’offre « ${testTitle} »${hasNumericMatch ? ` (matching ${Math.round(matchScore)} %)` : ''}. Votre évaluation technique est enregistrée.`,
        link: '/mes-resultats',
        actionKey: `submission:${submission._id}:match-positive`,
        data: {
            submissionId: submission._id,
            testId: test._id,
            testTitle,
            matchScore,
            phase: 'matching',
        },
    }).catch(() => {});

    await notifyPipelineMatchingPositive(candidateId, {
        testTitle,
        matchScore: hasNumericMatch ? matchScore : null,
    }).catch(() => {});

    // —— Résultat final test ——
    if (!qualified) {
        await createAndDispatchNotification({
            userId: candidateId,
            type: 'PIPELINE_ASSESSMENT_FAIL',
            category: 'assessment',
            priority: 'high',
            title: 'Résultat du test : non retenu',
            message: `Suite à l’évaluation « ${testTitle} », le score obtenu (${totalScore} %) est inférieur au seuil de réussite. ${cfg.removeOnFailedAssessment ? 'Votre candidature sera retirée conformément au processus automatisé.' : 'Vous pouvez consulter le détail dans Mes résultats.'}`,
            link: cfg.removeOnFailedAssessment ? '/mes-candidatures' : '/mes-resultats',
            actionKey: `submission:${submission._id}:fail`,
            data: {
                submissionId: submission._id,
                testTitle,
                score: totalScore,
                qualified: false,
            },
        }).catch(() => {});

        await notifyPipelineAssessmentFail(candidateId, {
            testTitle,
            score: totalScore,
            threshold: test.passThreshold != null ? test.passThreshold : 50,
        }).catch(() => {});

        if (cfg.removeOnFailedAssessment) {
            if (test.createdBy) {
                await createAndDispatchNotification({
                    userId: test.createdBy,
                    type: 'CANDIDATE_AUTO_REMOVED',
                    category: 'pipeline',
                    priority: 'normal',
                    title: 'Candidature retirée (échec test)',
                    message: `${candidateName || 'Candidat'} — « ${testTitle} » : score ${totalScore} % sous le seuil. Dossier supprimé automatiquement.`,
                    link: '/rh/resultats',
                    actionKey: `submission:${submission._id}:hr-removed-fail`,
                    data: { submissionId: submission._id, testTitle, score: totalScore },
                }).catch(() => {});
            }
            await deleteSubmissionCascade(submission);
            return {
                retained: false,
                removalReason: REMOVAL.FAILED_ASSESSMENT,
                message: 'Échec au test : candidature supprimée automatiquement.',
                pipeline: 'advanced',
            };
        }

        await notifyCandidateScore(candidateId, { testTitle, score: totalScore, qualified: false }).catch(() => {});
    } else {
        await createAndDispatchNotification({
            userId: candidateId,
            type: 'PIPELINE_ASSESSMENT_PASS',
            category: 'pipeline',
            priority: 'high',
            title: 'Réussite au test — convocation entretien',
            message: `Vous avez réussi l’évaluation « ${testTitle} » (score ${totalScore} %). L’équipe recrutement peut vous convoquer pour un entretien. Suivez vos notifications et la messagerie de l’entreprise.`,
            link: '/mes-candidatures',
            actionKey: `submission:${submission._id}:pass`,
            data: {
                submissionId: submission._id,
                testTitle,
                score: totalScore,
                qualified: true,
            },
        }).catch(() => {});

        await notifyPipelineAssessmentPass(candidateId, {
            testTitle,
            score: totalScore,
        }).catch(() => {});

        await notifyCandidateScore(candidateId, { testTitle, score: totalScore, qualified: true }).catch(() => {});

        if (cfg.advanceStageOnPass && submission.stage === 'NEW') {
            submission.stage = 'SCREENING';
            await submission.save();
        }
    }

    if (test.createdBy) {
        await notifyHrNewSubmission(test.createdBy, {
            testTitle,
            candidateName,
            score: totalScore,
        }).catch(() => {});

        await createAndDispatchNotification({
            userId: test.createdBy,
            type: 'CANDIDATE_SUBMITTED',
            category: 'pipeline',
            priority: 'high',
            title: 'Nouvelle soumission',
            message: `${candidateName || 'Un candidat'} a terminé le test « ${testTitle} » (score : ${totalScore} %).`,
            link: '/rh/resultats',
            actionKey: `submission:${submission._id}:hr:${test.createdBy}`,
            data: {
                submissionId: submission._id,
                testTitle,
                testId: test._id,
                candidateId,
                score: totalScore,
                qualified,
                matchScore: hasNumericMatch ? matchScore : null,
            },
        }).catch(() => {});
    }

    return { retained: true, pipeline: 'advanced' };
}

module.exports = {
    runAdvancedPipelineAfterSubmission,
    REMOVAL,
    resolveAdvancedPipelineConfig,
};
