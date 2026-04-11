const express = require('express');
const router = express.Router();
const { protect: AuthMw, restrictTo } = require('../middlewares/auth.middleware');
const {
    createTest,
    generateAutoQuestions,
    getTests,
    getTestById,
    addManualQuestion,
    deleteQuestion,
    deleteTest,
    updateTest,
    getPublicTests,
    getPublicTestById,
    regenerateQuestion,
    markQuestionReviewed,
} = require('../controllers/test.controller');
const questionBank = require('../controllers/questionBank.controller');
const { generateLimiter } = require('../middlewares/rateLimiters');

router.get('/public/jobs', getPublicTests);
router.get('/public/jobs/:id', getPublicTestById);

router.get('/question-bank/list', AuthMw, restrictTo('HR'), questionBank.listQuestionBank);
router.post('/question-bank', AuthMw, restrictTo('HR'), questionBank.createQuestionBank);
router.post('/question-bank/:bankId/attach', AuthMw, restrictTo('HR'), questionBank.attachBankQuestion);
router.delete('/question-bank/:bankId', AuthMw, restrictTo('HR'), questionBank.deleteBankQuestion);
router.delete('/question-bank/clear', AuthMw, restrictTo('HR'), questionBank.clearQuestionBank);

router.post('/create', AuthMw, restrictTo('HR'), createTest);
router.post('/generate-questions', AuthMw, restrictTo('HR'), generateLimiter, generateAutoQuestions);
router.get('/', AuthMw, restrictTo('HR', 'candidat'), getTests);
router.post('/question/:qId/regenerate', AuthMw, restrictTo('HR'), generateLimiter, regenerateQuestion);
router.put('/question/:qId/review', AuthMw, restrictTo('HR'), markQuestionReviewed);
router.get('/:id', AuthMw, restrictTo('HR', 'candidat'), getTestById);
router.put('/:id', AuthMw, restrictTo('HR'), updateTest);

router.post('/question', AuthMw, restrictTo('HR'), addManualQuestion);
router.delete('/question/:id', AuthMw, restrictTo('HR'), deleteQuestion);
router.delete('/:id', AuthMw, restrictTo('HR'), deleteTest);

module.exports = router;
