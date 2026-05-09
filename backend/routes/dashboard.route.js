const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { getHrDashboard } = require('../controllers/dashboard.controller');

router.get('/hr', protect, restrictTo('HR'), getHrDashboard);

module.exports = router;
