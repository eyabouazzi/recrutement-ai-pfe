const express = require('express');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const router = express.Router();
const { 
    getLogs, 
    getLogByActorId, 
    getLogById, 
    getLogsByResource,
    getLogStatistics 
} = require('../controllers/log.controller');

// All log routes require authentication and HR access
router.use(protect);
router.use(restrictTo('HR'));

// GET routes
router.get('/', getLogs);
router.get('/statistics', getLogStatistics);
router.get('/:id', getLogById);
router.get('/actor/:id', getLogByActorId);
router.get('/resource/:resourceType/:resourceId', getLogsByResource);

module.exports = router;