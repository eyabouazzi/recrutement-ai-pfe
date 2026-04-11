const express = require('express');
const {
    signUp,
    login,
    getMe,
    changePassword,
    forgetPassword,
    resetPassword,
    patchPreferences,
    exportMyData,
    deleteMyAccountData,
    getSmtpStatus,
    sendSmtpTestEmail,
} = require('../controllers/auth.controller');
const { updateMyProfile } = require('../controllers/profile.controller');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../utils/upload');
const profileUpload = require('../utils/profileUpload');
const { loginLimiter, signupLimiter } = require('../middlewares/rateLimiters');

// http://localhost:3000/auth/signup
router.post('/signup', signupLimiter, upload.single('avatar'), signUp);

// post :http://localhost:3000/auth/login 
router.post('/login', loginLimiter, login);

// Password recovery routes
router.post('/forgot-password', forgetPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.patch(
    '/me/profile',
    protect,
    profileUpload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cv', maxCount: 1 },
    ]),
    updateMyProfile
);
router.get('/me/export-data', protect, exportMyData);
router.delete('/me/account-data', protect, deleteMyAccountData);
router.patch('/me/preferences', protect, patchPreferences);
router.put('/change-password', protect, changePassword);

// SMTP / email deliverability (HR/admin only)
router.get('/smtp-status', protect, restrictTo('HR', 'admin'), getSmtpStatus);
router.post('/smtp-test-email', protect, restrictTo('HR', 'admin'), sendSmtpTestEmail);

module.exports = router; 
