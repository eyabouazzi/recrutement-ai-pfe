const express = require('express');
const router = express.Router();
const { protect: authenticate } = require('../middlewares/auth.middleware');
const {
    generateRecommendations,
    getRecommendations,
    refreshRecommendations,
    getProfileInsights
} = require('../controllers/recommendation.controller');

// All routes require authentication
router.post('/generate', authenticate, generateRecommendations);
router.get('/', authenticate, getRecommendations);
router.post('/refresh', authenticate, refreshRecommendations);
router.get('/insights', authenticate, getProfileInsights);

module.exports = router;
