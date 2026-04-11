const Interview = require('../models/interview.model');
const User = require('../models/user.model');
const Test = require('../models/test.model');
const Submission = require('../models/submission.model');
const sendEmail = require('../utils/mailer');
const { smtpConfigured } = require('../utils/emailNotifications');

function parseDate(value) {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) {
        throw new Error('Date invalide');
    }
    return d;
}

function formatFR(date) {
    try {
        return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return date.toISOString();
    }
}

async function safeSend({ to, subject, content }) {
    if (!smtpConfigured()) return;
    if (!to) return;
    await sendEmail({ email: to, subject, content });
}

async function resolveCandidateAndTest({ candidateId, testId, submissionId }) {
    // If we have submissionId, derive missing parts from Submission.
    if ((!candidateId || !testId) && submissionId) {
        const sub = await Submission.findById(submissionId).populate('candidateId', 'firstName lastName email avatar').populate('testId', 'title jobRole');
        if (!sub) throw new Error('Submission introuvable');
        return {
            candidateId: candidateId || sub.candidateId?._id || sub.candidateId,
            testId: testId || sub.testId?._id || sub.testId,
        };
    }
    return { candidateId, testId };
}

async function buildInterviewPayload(interview) {
    // Keep payload lean for the frontend.
    return Interview.findById(interview._id)
        .populate('candidateId', 'firstName lastName email avatar')
        .populate('createdBy', 'firstName lastName email avatar role')
        .populate('testId', 'title jobRole')
        .populate('submissionId')
        .lean();
}

// POST /interviews
async function createInterview(req, res) {
    try {
        const {
            candidateId,
            testId,
            submissionId,
            scheduledAt,
            durationMinutes,
            type,
            notes,
        } = req.body || {};

        if (!candidateId && !submissionId) {
            return res.status(400).json({ status: false, message: 'candidateId requis' });
        }
        if (!scheduledAt) {
            return res.status(400).json({ status: false, message: 'scheduledAt requis' });
        }

        const resolved = await resolveCandidateAndTest({ candidateId, testId, submissionId });
        const resolvedCandidateId = resolved.candidateId;
        const resolvedTestId = resolved.testId;

        const scheduledDate = parseDate(scheduledAt);

        const interview = await Interview.create({
            candidateId: resolvedCandidateId,
            createdBy: req.user._id,
            testId: resolvedTestId || undefined,
            submissionId: submissionId || undefined,
            scheduledAt: scheduledDate,
            durationMinutes: durationMinutes ?? 30,
            type: type || 'video',
            notes: notes || '',
            status: 'SCHEDULED',
            rescheduleCount: 0,
        });

        // Email invite
        try {
            const [candidate, hr, test] = await Promise.all([
                User.findById(resolvedCandidateId).select('firstName lastName email'),
                User.findById(req.user._id).select('firstName lastName email'),
                resolvedTestId ? Test.findById(resolvedTestId).select('title jobRole') : Promise.resolve(null),
            ]);

            const testTitle = test?.title || test?.jobRole || 'Entretien';
            const when = formatFR(scheduledDate);
            const candidateName = candidate?.firstName ? ` ${candidate.firstName}` : '';
            const hrName = hr?.firstName ? hr.firstName : 'l’équipe RH';

            await safeSend({
                to: candidate?.email,
                subject: `Entretien confirmé : ${testTitle}`,
                content:
                    `Bonjour${candidateName},\n\n` +
                    `Votre entretien est confirmé pour : ${when}.\n` +
                    `Type : ${type || 'video'}\n` +
                    `Offre/Test : ${testTitle}\n\n` +
                    `Si vous devez modifier le rendez-vous, contactez votre recruteur.\n\n` +
                    `Cordialement,\n${hrName}`,
            });
        } catch {
            // Do not fail request if email fails.
        }

        return res.status(201).json({ status: true, interview: await buildInterviewPayload(interview) });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Erreur création entretien' });
    }
}

// GET /interviews (HR/admin)
async function listInterviews(req, res) {
    try {
        const {
            startDate,
            endDate,
            candidateId,
            testId,
            status,
        } = req.query || {};

        const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

        if (candidateId) filter.candidateId = candidateId;
        if (testId) filter.testId = testId;
        if (status) filter.status = status;

        if (startDate || endDate) {
            filter.scheduledAt = {};
            if (startDate) filter.scheduledAt.$gte = parseDate(startDate);
            if (endDate) filter.scheduledAt.$lte = parseDate(endDate);
        }

        const items = await Interview.find(filter)
            .sort({ scheduledAt: -1 })
            .limit(500)
            .populate('candidateId', 'firstName lastName email avatar')
            .populate('testId', 'title jobRole')
            .lean();

        return res.status(200).json({ status: true, items });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Erreur listing entretiens' });
    }
}

// GET /interviews/me (candidate)
async function listMyInterviews(req, res) {
    try {
        const { status } = req.query || {};
        const filter = { candidateId: req.user._id };
        if (status) filter.status = status;

        const interviews = await Interview.find(filter)
            .sort({ scheduledAt: -1 })
            .limit(200)
            .populate('testId', 'title jobRole')
            .lean();

        return res.status(200).json({ status: true, interviews });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Erreur listing mes entretiens' });
    }
}

// PATCH /interviews/:id
async function updateInterview(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const {
            scheduledAt,
            durationMinutes,
            type,
            notes,
        } = req.body || {};

        const interview = await Interview.findById(id);
        if (!interview) return res.status(404).json({ status: false, message: 'Entretien introuvable' });
        if (req.user.role !== 'admin' && String(interview.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }

        const oldScheduled = interview.scheduledAt ? new Date(interview.scheduledAt) : null;
        let newScheduled = oldScheduled;
        let scheduledChanged = false;

        if (scheduledAt) {
            newScheduled = parseDate(scheduledAt);
            scheduledChanged = !oldScheduled || newScheduled.getTime() !== oldScheduled.getTime();
            interview.scheduledAt = newScheduled;
        }

        if (durationMinutes != null) interview.durationMinutes = durationMinutes;
        if (type) interview.type = type;
        if (notes != null) interview.notes = notes;

        if (scheduledChanged && interview.status === 'SCHEDULED') {
            interview.rescheduleCount = (interview.rescheduleCount || 0) + 1;
        }

        await interview.save();

        // Email update
        try {
            const [candidate, hr, test] = await Promise.all([
                User.findById(interview.candidateId).select('firstName lastName email'),
                User.findById(interview.createdBy).select('firstName lastName email'),
                interview.testId ? Test.findById(interview.testId).select('title jobRole') : Promise.resolve(null),
            ]);

            const testTitle = test?.title || test?.jobRole || 'Entretien';
            const when = interview.scheduledAt ? formatFR(interview.scheduledAt) : '—';
            const candidateName = candidate?.firstName ? ` ${candidate.firstName}` : '';
            const hrName = hr?.firstName ? hr.firstName : 'l’équipe RH';

            await safeSend({
                to: candidate?.email,
                subject: `Entretien mis à jour : ${testTitle}`,
                content:
                    `Bonjour${candidateName},\n\n` +
                    `Votre entretien a été mis à jour.\n` +
                    `Nouveau créneau : ${when}\n` +
                    `Type : ${type || interview.type}\n` +
                    `Offre/Test : ${testTitle}\n\n` +
                    `Cordialement,\n${hrName}`,
            });
        } catch {
            // noop
        }

        return res.status(200).json({ status: true, interview: await buildInterviewPayload(interview) });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Erreur mise à jour entretien' });
    }
}

// POST /interviews/:id/cancel
async function cancelInterview(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const interview = await Interview.findById(id);
        if (!interview) return res.status(404).json({ status: false, message: 'Entretien introuvable' });
        if (req.user.role !== 'admin' && String(interview.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }

        interview.status = 'CANCELLED';
        await interview.save();

        // Email cancel
        try {
            const [candidate, hr, test] = await Promise.all([
                User.findById(interview.candidateId).select('firstName lastName email'),
                User.findById(interview.createdBy).select('firstName lastName email'),
                interview.testId ? Test.findById(interview.testId).select('title jobRole') : Promise.resolve(null),
            ]);

            const testTitle = test?.title || test?.jobRole || 'Entretien';
            const when = interview.scheduledAt ? formatFR(interview.scheduledAt) : '—';
            const candidateName = candidate?.firstName ? ` ${candidate.firstName}` : '';
            const hrName = hr?.firstName ? hr.firstName : 'l’équipe RH';

            await safeSend({
                to: candidate?.email,
                subject: `Entretien annulé : ${testTitle}`,
                content:
                    `Bonjour${candidateName},\n\n` +
                    `Nous vous informons que votre entretien (${testTitle}) prévu pour ${when} a été annulé.\n\n` +
                    `Cordialement,\n${hrName}`,
            });
        } catch {
            // noop
        }

        return res.status(200).json({ status: true, interview: await buildInterviewPayload(interview) });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Erreur annulation entretien' });
    }
}

// POST /interviews/:id/remind
async function remindInterview(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: 'Unauthorized' });
        }

        const { id } = req.params;
        const interview = await Interview.findById(id);
        if (!interview) return res.status(404).json({ status: false, message: 'Entretien introuvable' });
        if (req.user.role !== 'admin' && String(interview.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }

        // Email reminder
        try {
            const [candidate, hr, test] = await Promise.all([
                User.findById(interview.candidateId).select('firstName lastName email'),
                User.findById(interview.createdBy).select('firstName lastName email'),
                interview.testId ? Test.findById(interview.testId).select('title jobRole') : Promise.resolve(null),
            ]);

            const testTitle = test?.title || test?.jobRole || 'Entretien';
            const when = interview.scheduledAt ? formatFR(interview.scheduledAt) : '—';
            const candidateName = candidate?.firstName ? ` ${candidate.firstName}` : '';
            const hrName = hr?.firstName ? hr.firstName : 'l’équipe RH';

            await safeSend({
                to: candidate?.email,
                subject: `Rappel entretien : ${testTitle}`,
                content:
                    `Bonjour${candidateName},\n\n` +
                    `Petit rappel : votre entretien (${testTitle}) est prévu pour ${when}.\n\n` +
                    `Cordialement,\n${hrName}`,
            });
        } catch {
            // noop
        }

        return res.status(200).json({ status: true, message: 'Reminder envoyé (si SMTP configuré)' });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message || 'Erreur reminder entretien' });
    }
}

module.exports = {
    createInterview,
    listInterviews,
    listMyInterviews,
    updateInterview,
    cancelInterview,
    remindInterview,
};

