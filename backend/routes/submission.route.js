const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../middlewares/auth.middleware');
const draftController = require('../controllers/draft.controller');
const submissionController = require('../controllers/submission.controller');

router.post('/submit', protect, restrictTo('candidat'), submissionController.submitTest);

router.get('/draft/:testId', protect, restrictTo('candidat'), draftController.getDraft);
router.put('/draft/:testId', protect, restrictTo('candidat'), draftController.saveDraft);
router.delete('/draft/:testId', protect, restrictTo('candidat'), draftController.deleteDraft);
router.get('/drafts', protect, restrictTo('candidat'), draftController.listDrafts);

router.get('/my-results', protect, restrictTo('candidat'), submissionController.getMyResults);
router.get('/my-applications', protect, restrictTo('candidat'), submissionController.getCandidateApplications);

router.get('/all', protect, restrictTo('HR', 'admin'), submissionController.getAllSubmissions);
router.get('/hr-activity', protect, restrictTo('HR', 'admin'), submissionController.getHrActivity);
router.patch('/bulk/stage', protect, restrictTo('HR', 'admin'), submissionController.bulkUpdateSubmissionStage);

router.patch('/:id/pipeline', protect, restrictTo('HR', 'admin'), submissionController.updateSubmissionPipeline);
router.put('/:id/stage', protect, restrictTo('HR', 'admin'), submissionController.updateSubmissionStage);
router.patch('/:id/stage', protect, restrictTo('HR', 'admin'), submissionController.updateSubmissionStage);
router.post('/:id/notes', protect, restrictTo('HR', 'admin'), submissionController.addSubmissionNote);

router.post('/cheat/report', protect, submissionController.reportCheatFlag);
router.get('/:id', protect, restrictTo('candidat', 'HR', 'admin'), submissionController.getResultDetails);

module.exports = router;
