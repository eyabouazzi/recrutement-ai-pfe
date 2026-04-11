const express = require('express');
const router = express.Router();
const { protect: AuthMw, restrictTo } = require('../middlewares/auth.middleware');
const {
    submitTest,
    getMyResults,
    getResultDetails,
    getAllSubmissions,
    updateSubmissionStage,
    addSubmissionNote,
    getCandidateApplications,
    updateSubmissionPipeline,
    getHrActivity,
} = require('../controllers/submission.controller');
const draftController = require('../controllers/draft.controller');
const { submitLimiter } = require('../middlewares/rateLimiters');

router.get('/hr-activity', AuthMw, restrictTo('HR'), getHrActivity);
router.get('/draft/:testId', AuthMw, restrictTo('candidat'), draftController.getDraft);
router.put('/draft/:testId', AuthMw, restrictTo('candidat'), draftController.saveDraft);
router.delete('/draft/:testId', AuthMw, restrictTo('candidat'), draftController.deleteDraft);

router.post('/submit', AuthMw, restrictTo('candidat'), submitLimiter, submitTest);
router.get('/my-results', AuthMw, restrictTo('candidat'), getMyResults);
router.get('/all', AuthMw, restrictTo('HR'), getAllSubmissions);
router.get('/my-applications', AuthMw, restrictTo('candidat'), getCandidateApplications);
router.get('/:id', AuthMw, restrictTo('HR', 'candidat'), getResultDetails);
router.put('/:id/stage', AuthMw, restrictTo('HR'), updateSubmissionStage);
router.patch('/:id/stage', AuthMw, restrictTo('HR'), updateSubmissionStage);
router.patch('/:id/pipeline', AuthMw, restrictTo('HR'), updateSubmissionPipeline);
router.post('/:id/notes', AuthMw, restrictTo('HR'), addSubmissionNote);

module.exports = router;
