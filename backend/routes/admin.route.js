const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const {
    getStats, getAllUsers, updateUser, deleteUser,
    getAllCompanies, approveCompany,
    getAllJobs, adminDeleteJob,
    adminNotify,
    getAntiCheatAnalytics,
} = require('../controllers/admin.controller');

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/anti-cheat/analytics', getAntiCheatAnalytics);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Companies
router.get('/companies', getAllCompanies);
router.put('/companies/:id/approve', approveCompany);

// Jobs
router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', adminDeleteJob);

// Notifications
router.post('/notify', adminNotify);

module.exports = router;
