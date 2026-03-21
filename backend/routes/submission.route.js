const express = require('express');
const router = express.Router();
const { protect: AuthMw } = require('../middlewares/auth.middleware');
const {
    submitTest,
    getMyResults,
    getResultDetails,
    getAllSubmissions,
    updateSubmissionStage,
    addSubmissionNote,
    getCandidateApplications
} = require('../controllers/submission.controller');

router.post('/submit', AuthMw, submitTest);
router.get('/my-results', AuthMw, getMyResults);
router.get('/all', AuthMw, getAllSubmissions);
router.get('/my-applications', AuthMw, getCandidateApplications);
router.get('/:id', AuthMw, getResultDetails);
router.put('/:id/stage', AuthMw, updateSubmissionStage);
router.patch('/:id/stage', AuthMw, updateSubmissionStage);
router.post('/:id/notes', AuthMw, addSubmissionNote);

module.exports = router;
