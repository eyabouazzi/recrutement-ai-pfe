const Company = require('../models/company.model');
const userModel = require('../models/user.model');
const Test = require('../models/test.model');
const sendEmail = require('../utils/mailer');

/**
 * GET /companies — public list of approved companies
 */
async function getCompanies(req, res) {
    try {
        const { search, sector, city, size, sort = 'recent', featured, page = 1, limit = 12 } = req.query;
        const query = { status: 'approved' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sector: { $regex: search, $options: 'i' } },
            ];
        }
        if (sector) query.sector = { $regex: sector, $options: 'i' };
        if (city) query.city = { $regex: city, $options: 'i' };
        if (size) {
            if (size === 'small') query.size = { $in: ['1-10', '11-50'] };
            else if (size === 'medium') query.size = { $in: ['51-200', '201-500'] };
            else if (size === 'large') query.size = { $in: ['500+'] };
            else query.size = size;
        }

        const sortQuery = sort === 'name'
            ? { name: 1 }
            : sort === 'oldest'
                ? { createdAt: 1 }
                : { createdAt: -1 };

        const skip = (Number(page) - 1) * Number(limit);
        const [companies, total] = await Promise.all([
            Company.find(query)
                .populate('hrUsers', 'firstName lastName avatar')
                .sort(sortQuery)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Company.countDocuments(query),
        ]);

        const hrUserIds = companies.flatMap((company) =>
            (company.hrUsers || []).map((user) => user._id)
        );

        const publishedJobs = hrUserIds.length > 0
            ? await Test.find({
                createdBy: { $in: hrUserIds },
                status: 'PUBLISHED',
            }).select('createdBy').lean()
            : [];

        const jobCountByHrId = publishedJobs.reduce((acc, job) => {
            const key = String(job.createdBy);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const enrichedCompanies = companies.map((company) => {
            const activeJobCount = (company.hrUsers || []).reduce((sum, hrUser) => {
                return sum + (jobCountByHrId[String(hrUser._id)] || 0);
            }, 0);

            return {
                ...company,
                activeJobCount,
                recruiterCount: (company.hrUsers || []).length,
            };
        });

        const sizeRank = {
            '1-10': 1,
            '11-50': 2,
            '51-200': 3,
            '201-500': 4,
            '500+': 5,
        };

        let finalCompanies = enrichedCompanies;
        if (sort === 'size') {
            finalCompanies = [...enrichedCompanies].sort(
                (a, b) => (sizeRank[b.size] || 0) - (sizeRank[a.size] || 0)
            );
        }
        if (sort === 'rating') {
            finalCompanies = [...enrichedCompanies].sort((a, b) => {
                if ((b.activeJobCount || 0) !== (a.activeJobCount || 0)) {
                    return (b.activeJobCount || 0) - (a.activeJobCount || 0);
                }
                return (b.recruiterCount || 0) - (a.recruiterCount || 0);
            });
        }
        if (String(featured) === 'true') {
            finalCompanies = [...finalCompanies]
                .sort((a, b) => {
                    if ((b.activeJobCount || 0) !== (a.activeJobCount || 0)) {
                        return (b.activeJobCount || 0) - (a.activeJobCount || 0);
                    }
                    return (b.recruiterCount || 0) - (a.recruiterCount || 0);
                })
                .slice(0, Number(limit));
        }

        res.status(200).json({
            status: true,
            companies: finalCompanies,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalItems: total,
            },
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /companies/:id — public company detail
 */
async function getCompanyById(req, res) {
    try {
        const company = await Company.findById(req.params.id)
            .populate('hrUsers', 'firstName lastName avatar')
            .lean();

        if (!company || company.status !== 'approved') {
            return res.status(404).json({ status: false, message: 'Entreprise introuvable.' });
        }

        // Get active job offers by this company's HR users
        const hrUserIds = (company.hrUsers || []).map(u => u._id);
        const jobs = await Test.find({
            createdBy: { $in: hrUserIds },
            status: 'PUBLISHED',
        }).sort({ createdAt: -1 }).lean();

        res.status(200).json({ status: true, company, jobs });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * POST /companies — register a new company (HR signup)
 */
async function createCompany(req, res) {
    try {
        const { name, email, description, website, sector, size, city, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({ status: false, message: 'Nom et email de l\'entreprise requis.' });
        }

        const existing = await Company.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ status: false, message: 'Une entreprise avec cet email existe déjà.' });
        }

        const company = new Company({
            name,
            email: email.toLowerCase().trim(),
            description,
            website,
            sector,
            size,
            city,
            phone,
            status: 'pending',
        });

        if (req.file) company.logo = `/uploads/${req.file.filename}`;
        await company.save();

        res.status(201).json({
            status: true,
            message: 'Entreprise enregistrée. En attente de validation par l\'administrateur.',
            company,
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /companies/public/recruiters — list of all HR users with their company info
 */
async function getRecruiters(req, res) {
    try {
        const { page = 1, limit = 12, search, sector } = req.query;
        const query = { role: 'HR' };

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [recruiters, total] = await Promise.all([
            userModel.find(query)
                .populate('companyId', 'name sector city logo status')
                .select('firstName lastName avatar bio city companyId skills')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            userModel.countDocuments(query),
        ]);

        // For each recruiter, count their active job offers
        const recruiterIds = recruiters.map(r => r._id);
        const jobCountPipeline = await Test.aggregate([
            { $match: { createdBy: { $in: recruiterIds }, status: 'PUBLISHED' } },
            { $group: { _id: '$createdBy', count: { $sum: 1 } } },
        ]);

        const jobCountMap = {};
        jobCountPipeline.forEach(j => { jobCountMap[j._id.toString()] = j.count; });

        const enriched = recruiters.map(r => ({
            ...r,
            activeJobCount: jobCountMap[r._id.toString()] || 0,
        }));

        res.status(200).json({
            status: true,
            recruiters: enriched,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalItems: total,
            },
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /companies/public/recruiters/:id — recruiter public profile
 */
async function getRecruiterById(req, res) {
    try {
        const recruiter = await userModel.findOne({ _id: req.params.id, role: 'HR' })
            .populate('companyId', 'name sector city logo description website')
            .select('firstName lastName avatar bio city skills education companyId createdAt')
            .lean();

        if (!recruiter) {
            return res.status(404).json({ status: false, message: 'Recruteur introuvable.' });
        }

        // Get their published jobs
        const jobs = await Test.find({ createdBy: recruiter._id, status: 'PUBLISHED' })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ status: true, recruiter, jobs });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = { getCompanies, getCompanyById, createCompany, getRecruiters, getRecruiterById };
