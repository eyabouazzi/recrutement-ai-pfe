const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const profileUpload = require('../utils/profileUpload');
const { completeOnboarding } = require('../controllers/register.controller');

// Onboarding (first login info collection)
router.post(
    '/onboarding',
    protect,
    profileUpload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cv', maxCount: 1 },
    ]),
    completeOnboarding
);

module.exports = router;
