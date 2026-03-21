const Submission = require('../models/submission.model');
const Question = require('../models/question.model');
const Test = require('../models/test.model');
const { evaluateAnswersAI } = require('../utils/openai');

async function submitTest(req, res) {
    try {
        const { testId, answers } = req.body;

        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ status: false, message: "Test not found" });

        const questions = await Question.find({ testId });
        const questionMap = {};
        questions.forEach(q => questionMap[q._id.toString()] = q);

        let qaTextForAI = "";
        let qcmScore = 0;
        let qcmTotal = 0;
        let requiresAI = false;

        for (let ans of answers) {
            const q = questionMap[ans.questionId];
            if (!q) continue;

            if (q.type === 'QCM') {
                qcmTotal++;
                if (ans.response === q.correctAnswer) {
                    qcmScore++;
                }
            } else {
                requiresAI = true;
                qaTextForAI += `Q: ${q.prompt}\nA: ${ans.response}\n\n`;
            }
        }

        let totalScore = 0;
        let feedback = "";

        if (requiresAI && qaTextForAI.trim().length > 0) {
            const aiResult = await evaluateAnswersAI(test.jobRole, qaTextForAI);
            totalScore = aiResult.score || 0;
            const qcmPerc = qcmTotal > 0 ? (qcmScore / qcmTotal) * 100 : 0;

            if (qcmTotal > 0) {
                totalScore = Math.round((totalScore + qcmPerc) / 2);
            }
            feedback = aiResult.feedback;
        } else {
            totalScore = qcmTotal > 0 ? Math.round((qcmScore / qcmTotal) * 100) : 0;
            feedback = "Questions à choix multiples évaluées automatiquement.";
        }

        const submission = new Submission({
            testId,
            candidateId: req.user._id,
            answers,
            status: 'GRADED',
            totalScore,
            feedback
        });

        await submission.save();
        
        // Send real-time notification
        if (typeof global.notifyApplicationUpdate === 'function') {
            global.notifyApplicationUpdate(
                req.user.id,
                submission._id,
                'SUBMISSION_CREATED',
                {
                    testTitle: test.title,
                    score: totalScore,
                    jobId: test._id
                }
            );
        }

        res.status(201).json({
            status: true,
            message: "Test submitted and graded successfully",
            submissionId: submission._id
        });

    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getMyResults(req, res) {
    try {
        const submissions = await Submission.find({ candidateId: req.user.id })
            .populate('testId', 'title jobRole')
            .sort('-createdAt');
        res.status(200).json({ status: true, submissions });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getResultDetails(req, res) {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('testId', 'title jobRole description location employmentType')
            .populate('candidateId', 'firstName lastName email avatar')
            .populate('notes.author', 'firstName lastName avatar');

        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

        if (submission.candidateId._id.toString() !== req.user.id && req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }

        res.status(200).json({ status: true, submission });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function getAllSubmissions(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const submissions = await Submission.find({})
            .populate('testId', 'title jobRole')
            .populate('candidateId', 'firstName lastName email')
            .sort('-createdAt');

        res.status(200).json({ status: true, submissions });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function addSubmissionNote(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const { id } = req.params;
        const { text } = req.body;

        const submission = await Submission.findById(id);
        if (!submission) return res.status(404).json({ status: false, message: "Submission not found" });

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
            .populate('testId', 'title jobRole location employmentType description')
            .sort({ createdAt: -1 });
        res.status(200).json({ status: true, applications });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

async function updateSubmissionStage(req, res) {
    try {
        if (req.user.role !== 'HR' && req.user.role !== 'admin') {
            return res.status(403).json({ status: false, message: "Unauthorized" });
        }
        const { id } = req.params;
        const { stage } = req.body;

        if (!['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].includes(stage)) {
            return res.status(400).json({ status: false, message: 'Etape invalide' });
        }

        const submission = await Submission.findByIdAndUpdate(id, { stage }, { new: true })
            .populate('candidateId', 'firstName lastName email');

        if (!submission) {
            return res.status(404).json({ status: false, message: 'Candidature introuvable' });
        }

        res.status(200).json({ status: true, message: 'Étape mise à jour', submission });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
}

module.exports = {
    submitTest,
    getMyResults,
    getResultDetails,
    getAllSubmissions,
    addSubmissionNote,
    getCandidateApplications,
    updateSubmissionStage
};
