const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const upload = require('../utils/upload');
const {
    getCompanies, getCompanyById, createCompany,
    getRecruiters, getRecruiterById,
} = require('../controllers/company.controller');

// Public routes
router.get('/', getCompanies);
router.get('/recruiters', getRecruiters);
router.get('/recruiters/:id', getRecruiterById);
router.get('/:id', getCompanyById);

// HR/admin can create/update companies
router.post('/', upload.single('logo'), createCompany);

module.exports = router;
