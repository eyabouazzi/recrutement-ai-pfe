const QuestionBank = require('../models/questionBank.model');
const Question = require('../models/question.model');
const Test = require('../models/test.model');

async function listQuestionBank(req, res) {
    try {
        const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const items = await QuestionBank.find(filter).sort('-updatedAt').limit(200);
        res.status(200).json({ status: true, items });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function createQuestionBank(req, res) {
    try {
        const { title, tags, type, prompt, options, correctAnswer } = req.body;
        const item = await QuestionBank.create({
            title: title || '',
            tags: Array.isArray(tags) ? tags : [],
            type,
            prompt,
            options: type === 'QCM' ? options : undefined,
            correctAnswer: type === 'QCM' ? correctAnswer : undefined,
            createdBy: req.user._id,
        });
        res.status(201).json({ status: true, item });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function attachBankQuestion(req, res) {
    try {
        const { bankId } = req.params;
        const { testId } = req.body;
        const bank = await QuestionBank.findById(bankId);
        if (!bank) return res.status(404).json({ status: false, message: 'Question banque introuvable' });
        if (req.user.role !== 'admin' && bank.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }
        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ status: false, message: 'Test introuvable' });
        if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }
        const isQcm = bank.type === 'QCM';
        const question = await Question.create({
            testId,
            type: bank.type,
            prompt: bank.prompt,
            options: isQcm ? bank.options : undefined,
            correctAnswer: isQcm ? bank.correctAnswer : undefined,
        });
        res.status(201).json({ status: true, question });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function deleteBankQuestion(req, res) {
    try {
        const bank = await QuestionBank.findById(req.params.bankId);
        if (!bank) return res.status(404).json({ status: false, message: 'Introuvable' });
        if (req.user.role !== 'admin' && bank.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: 'Non autorisé' });
        }
        await QuestionBank.findByIdAndDelete(req.params.bankId);
        res.status(200).json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

async function clearQuestionBank(req, res) {
    try {
        // HR can clear their own banks; admin can clear everything.
        const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
        const result = await QuestionBank.deleteMany(filter);
        res.status(200).json({ status: true, deletedCount: result.deletedCount || 0 });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = {
    listQuestionBank,
    createQuestionBank,
    attachBankQuestion,
    deleteBankQuestion,
    clearQuestionBank,
};
