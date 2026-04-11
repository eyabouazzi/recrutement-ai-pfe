const express = require('express');
const { submitLead } = require('../controllers/contact.controller');
const { contactLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.post('/', contactLimiter, submitLead);

module.exports = router;
