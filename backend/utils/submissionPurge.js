/**
 * Suppression dossier candidature + CV profil si plus aucune candidature.
 * Extrait pour réutilisation (pipeline auto, rejet RH).
 */
const Submission = require('../models/submission.model');
const User = require('../models/user.model');
const { safeDeleteUploadFile } = require('./uploadRetention');

async function purgeCandidateCvIfNoRemainingApplications(candidateId) {
    if (!candidateId) return false;
    const remainingCount = await Submission.countDocuments({ candidateId });
    if (remainingCount > 0) return false;

    const candidate = await User.findById(candidateId).select('cvUrl cvOriginalName cvText cvAnalysis');
    if (!candidate) return false;

    if (candidate.cvUrl) {
        await safeDeleteUploadFile(candidate.cvUrl);
    }

    candidate.cvUrl = '';
    candidate.cvOriginalName = '';
    candidate.cvText = '';
    candidate.cvAnalysis = {
        summary: '',
        detectedSkills: [],
        experienceLevel: '',
        strengths: [],
        recommendations: [],
        suggestedRoles: [],
        lastAnalyzedAt: null,
    };
    await candidate.save();
    return true;
}

/**
 * @param {import('mongoose').Document} submission — document Submission (sauvegardé)
 */
async function deleteSubmissionCascade(submission) {
    if (!submission?._id) return;
    const candidateId = submission.candidateId?._id || submission.candidateId;
    if (submission.applicationCvUrl) {
        await safeDeleteUploadFile(submission.applicationCvUrl);
    }
    await Submission.findByIdAndDelete(submission._id);
    await purgeCandidateCvIfNoRemainingApplications(candidateId);
}

module.exports = {
    purgeCandidateCvIfNoRemainingApplications,
    deleteSubmissionCascade,
};
