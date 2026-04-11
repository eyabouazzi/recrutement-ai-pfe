const express = require('express');
const router = express.Router();
const { protect: AuthMw, restrictTo } = require('../middlewares/auth.middleware');

const {
    createInterview,
    listInterviews,
    listMyInterviews,
    updateInterview,
    cancelInterview,
    remindInterview,
} = require('../controllers/interview.controller');

router.post('/', AuthMw, restrictTo('HR'), createInterview);
router.get('/', AuthMw, restrictTo('HR'), listInterviews);

// Candidate view
router.get('/me', AuthMw, restrictTo('candidat'), listMyInterviews);

// HR actions
router.patch('/:id', AuthMw, restrictTo('HR'), updateInterview);
router.post('/:id/cancel', AuthMw, restrictTo('HR'), cancelInterview);
router.post('/:id/remind', AuthMw, restrictTo('HR'), remindInterview);

module.exports = router;

