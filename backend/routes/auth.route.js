const express = require('express');
const {signUp,login} = require('../controllers/auth.controller');
const router = express.Router();
// http://localhost:3000/auth/signup
router.post('/signup', signUp);
// post :http://localhost:3000/auth/login 

router.post('/login', login);
module.exports = router; 