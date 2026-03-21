const express = require('express');
const { signUp, login, getMe, changePassword, forgetPassword, resetPassword } = require('../controllers/auth.controller');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');

// http://localhost:3000/auth/signup
router.post('/signup', signUp);

// post :http://localhost:3000/auth/login 
router.post('/login', login);

// Password recovery routes
router.post('/forgot-password', forgetPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

module.exports = router; 