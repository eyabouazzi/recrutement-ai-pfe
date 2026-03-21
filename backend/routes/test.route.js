const express = require('express');
const router = express.Router();
const { protect: AuthMw } = require('../middlewares/auth.middleware');
const { createTest, generateAutoQuestions, getTests, getTestById, addManualQuestion, deleteQuestion, deleteTest, updateTest, getPublicTests } = require('../controllers/test.controller');

// Public route for career page
router.get('/public/jobs', getPublicTests);

// HR Only middleware check can be added inside AuthMw or specific controllers
router.post('/create', AuthMw, createTest);
router.post('/generate-questions', AuthMw, generateAutoQuestions);
router.get('/', AuthMw, getTests);
router.get('/:id', AuthMw, getTestById);
router.put('/:id', AuthMw, updateTest);

router.post('/question', AuthMw, addManualQuestion);
router.delete('/question/:id', AuthMw, deleteQuestion);
router.delete('/:id', AuthMw, deleteTest);

module.exports = router;

