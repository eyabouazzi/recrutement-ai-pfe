const userModel = require('../models/user.model');
const Company = require('../models/company.model');
const Test = require('../models/test.model');
const Submission = require('../models/submission.model');
const Event = require('../models/event.model');
const mongoose = require('mongoose');
const {
    createAndDispatchNotification,
    createManyAndDispatchNotifications,
} = require('../utils/inAppNotifications');

function parseDateInput(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function parsePositiveInt(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
}

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(String(value || '').trim());
}

function buildPeriodFormat(granularity) {
    if (granularity === 'month') return '%Y-%m';
    if (granularity === 'week') return '%G-W%V';
    return '%Y-%m-%d';
}

/**
 * GET /admin/stats — platform global stats
 */
async function getStats(req, res) {
    try {
        const [
            totalUsers, totalCandidates, totalHR, totalCompanies,
            totalJobs, totalSubmissions, totalEvents,
            pendingCompanies, recentUsers,
        ] = await Promise.all([
            userModel.countDocuments(),
            userModel.countDocuments({ role: 'candidat' }),
            userModel.countDocuments({ role: 'HR' }),
            Company.countDocuments({ status: 'approved' }),
            Test.countDocuments(),
            Submission.countDocuments(),
            Event.countDocuments(),
            Company.countDocuments({ status: 'pending' }),
            userModel.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role createdAt').lean(),
        ]);

        res.status(200).json({
            status: true,
            stats: {
                totalUsers, totalCandidates, totalHR, totalCompanies,
                totalJobs, totalSubmissions, totalEvents, pendingCompanies,
            },
            recentUsers,
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /admin/users — list all users with pagination & search
 */
async function getAllUsers(req, res) {
    try {
        const { page = 1, limit = 20, search, role } = req.query;
        const query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            userModel.find(query)
                .populate('companyId', 'name logo')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            userModel.countDocuments(query),
        ]);

        res.status(200).json({
            status: true,
            users,
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
 * PUT /admin/users/:id — update user role or status
 */
async function updateUser(req, res) {
    try {
        const { role, companyId } = req.body;
        const user = await userModel.findById(req.params.id);
        if (!user) return res.status(404).json({ status: false, message: 'Utilisateur introuvable.' });

        if (role) user.role = role;
        if (companyId !== undefined) user.companyId = companyId || null;
        await user.save();

        res.status(200).json({ status: true, message: 'Utilisateur mis à jour.', user });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * DELETE /admin/users/:id — soft-delete (remove user)
 */
async function deleteUser(req, res) {
    try {
        const user = await userModel.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ status: false, message: 'Utilisateur introuvable.' });
        res.status(200).json({ status: true, message: 'Utilisateur supprimé.' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /admin/companies — list all companies (any status)
 */
async function getAllCompanies(req, res) {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { sector: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [companies, total] = await Promise.all([
            Company.find(query)
                .populate('approvedBy', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Company.countDocuments(query),
        ]);

        res.status(200).json({
            status: true,
            companies,
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
 * PUT /admin/companies/:id/approve — approve or reject a company
 */
async function approveCompany(req, res) {
    try {
        const { action, note } = req.body; // 'approve' or 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ status: false, message: 'Action doit être "approve" ou "reject".' });
        }

        const company = await Company.findById(req.params.id);
        if (!company) return res.status(404).json({ status: false, message: 'Entreprise introuvable.' });

        company.status = action === 'approve' ? 'approved' : 'rejected';
        company.approvedBy = req.user.id;
        company.approvedAt = new Date();
        company.approvalNote = action === 'approve' ? (note || '') : '';
        company.rejectionReason = action === 'reject' ? (note || '') : '';
        await company.save();

        if (Array.isArray(company.hrUsers) && company.hrUsers.length > 0) {
            const title = action === 'approve' ? 'Entreprise approuvée' : 'Entreprise rejetée';
            const body = action === 'approve'
                ? `Votre entreprise ${company.name} a été approuvée. Vous pouvez publier des offres.`
                : `Votre entreprise ${company.name} a été rejetée.${note ? ` Motif: ${note}` : ''}`;

            await createManyAndDispatchNotifications(company.hrUsers.map((userId) => ({
                userId,
                type: 'general',
                title,
                message: body,
                link: '/rh/parametres',
            })));
        }

        res.status(200).json({
            status: true,
            message: `Entreprise ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès.`,
            company,
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /admin/jobs — list all job offers
 */
async function getAllJobs(req, res) {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const query = {};
        if (status) query.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [jobs, total] = await Promise.all([
            Test.find(query)
                .populate('createdBy', 'firstName lastName companyId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Test.countDocuments(query),
        ]);

        res.status(200).json({
            status: true,
            jobs,
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
 * DELETE /admin/jobs/:id — admin delete a job offer
 */
async function adminDeleteJob(req, res) {
    try {
        const job = await Test.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).json({ status: false, message: 'Offre introuvable.' });
        res.status(200).json({ status: true, message: 'Offre supprimée.' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * POST /admin/notify — send notification to a user or broadcast
 */
async function adminNotify(req, res) {
    try {
        const { userId, type, title, message, link, broadcast } = req.body;

        if (broadcast) {
            // Send to all users
            const users = await userModel.find({}, '_id').lean();
            const notifs = users.map(u => ({ userId: u._id, type, title, message, link }));
            await createManyAndDispatchNotifications(notifs);
            return res.status(200).json({ status: true, message: `Notification envoyée à ${notifs.length} utilisateurs.` });
        }

        if (!userId) return res.status(400).json({ status: false, message: 'userId requis.' });
        await createAndDispatchNotification({ userId, type, title, message, link });
        res.status(201).json({ status: true, message: 'Notification envoyée.' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /admin/anti-cheat/analytics
 * Query:
 *  - startDate, endDate (ISO dates)
 *  - days (default 30 when startDate/endDate omitted)
 *  - granularity: day|week|month
 *  - recruiterId (optional)
 *  - testId (optional)
 *  - trustThreshold (default 60)
 *  - limit (default 20)
 */
async function getAntiCheatAnalytics(req, res) {
    try {
        const days = parsePositiveInt(req.query.days, 30);
        const now = new Date();
        const defaultStart = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

        const startDate = parseDateInput(req.query.startDate) || defaultStart;
        const endDate = parseDateInput(req.query.endDate) || now;
        const rangeStart = startDate <= endDate ? startDate : endDate;
        const rangeEnd = startDate <= endDate ? endDate : startDate;
        const granularity = ['day', 'week', 'month'].includes(String(req.query.granularity || 'day'))
            ? String(req.query.granularity || 'day')
            : 'day';
        const trustThreshold = parsePositiveInt(req.query.trustThreshold, 60);
        const limit = parsePositiveInt(req.query.limit, 20);

        const submissionMatch = {
            createdAt: {
                $gte: rangeStart,
                $lte: rangeEnd,
            },
        };

        if (req.query.testId) {
            if (!isValidObjectId(req.query.testId)) {
                return res.status(400).json({ status: false, message: 'testId invalide.' });
            }
            submissionMatch.testId = new mongoose.Types.ObjectId(String(req.query.testId));
        }

        if (req.query.recruiterId) {
            if (!isValidObjectId(req.query.recruiterId)) {
                return res.status(400).json({ status: false, message: 'recruiterId invalide.' });
            }
            const recruiterTestIds = await Test.find({ createdBy: req.query.recruiterId }).select('_id').lean();
            const ids = recruiterTestIds.map((t) => t._id);
            submissionMatch.testId = submissionMatch.testId
                ? { $in: ids.filter((x) => String(x) === String(submissionMatch.testId)) }
                : { $in: ids };
        }

        const baseProject = {
            anomalyCount: { $size: { $ifNull: ['$anomalyFlags', []] } },
            trustScoreSafe: { $ifNull: ['$trustScore', 100] },
            testId: '$testId',
            createdAt: '$createdAt',
        };

        const [summaryRows, byTime, byTest, byRecruiter, topFlags] = await Promise.all([
            Submission.aggregate([
                { $match: submissionMatch },
                { $project: baseProject },
                {
                    $group: {
                        _id: null,
                        totalSubmissions: { $sum: 1 },
                        flaggedSubmissions: { $sum: { $cond: [{ $gt: ['$anomalyCount', 0] }, 1, 0] } },
                        avgTrustScore: { $avg: '$trustScoreSafe' },
                        lowTrustSubmissions: { $sum: { $cond: [{ $lt: ['$trustScoreSafe', trustThreshold] }, 1, 0] } },
                    },
                },
            ]),
            Submission.aggregate([
                { $match: submissionMatch },
                { $project: baseProject },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: buildPeriodFormat(granularity),
                                date: '$createdAt',
                            },
                        },
                        totalSubmissions: { $sum: 1 },
                        flaggedSubmissions: { $sum: { $cond: [{ $gt: ['$anomalyCount', 0] }, 1, 0] } },
                        avgTrustScore: { $avg: '$trustScoreSafe' },
                    },
                },
                {
                    $addFields: {
                        flaggedRate: {
                            $cond: [
                                { $gt: ['$totalSubmissions', 0] },
                                { $multiply: [{ $divide: ['$flaggedSubmissions', '$totalSubmissions'] }, 100] },
                                0,
                            ],
                        },
                    },
                },
                { $sort: { _id: 1 } },
                {
                    $project: {
                        _id: 0,
                        period: '$_id',
                        totalSubmissions: 1,
                        flaggedSubmissions: 1,
                        flaggedRate: { $round: ['$flaggedRate', 2] },
                        avgTrustScore: { $round: ['$avgTrustScore', 2] },
                    },
                },
            ]),
            Submission.aggregate([
                { $match: submissionMatch },
                { $project: baseProject },
                {
                    $group: {
                        _id: '$testId',
                        totalSubmissions: { $sum: 1 },
                        flaggedSubmissions: { $sum: { $cond: [{ $gt: ['$anomalyCount', 0] }, 1, 0] } },
                        avgTrustScore: { $avg: '$trustScoreSafe' },
                    },
                },
                {
                    $addFields: {
                        flaggedRate: {
                            $cond: [
                                { $gt: ['$totalSubmissions', 0] },
                                { $multiply: [{ $divide: ['$flaggedSubmissions', '$totalSubmissions'] }, 100] },
                                0,
                            ],
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'tests',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'test',
                    },
                },
                { $unwind: { path: '$test', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'test.createdBy',
                        foreignField: '_id',
                        as: 'recruiter',
                    },
                },
                { $unwind: { path: '$recruiter', preserveNullAndEmptyArrays: true } },
                { $sort: { flaggedRate: -1, totalSubmissions: -1 } },
                { $limit: limit },
                {
                    $project: {
                        _id: 0,
                        testId: '$_id',
                        testTitle: { $ifNull: ['$test.title', 'Test supprimé'] },
                        recruiterId: '$recruiter._id',
                        recruiterName: {
                            $trim: {
                                input: {
                                    $concat: [
                                        { $ifNull: ['$recruiter.firstName', ''] },
                                        ' ',
                                        { $ifNull: ['$recruiter.lastName', ''] },
                                    ],
                                },
                            },
                        },
                        totalSubmissions: 1,
                        flaggedSubmissions: 1,
                        flaggedRate: { $round: ['$flaggedRate', 2] },
                        avgTrustScore: { $round: ['$avgTrustScore', 2] },
                    },
                },
            ]),
            Submission.aggregate([
                { $match: submissionMatch },
                { $project: baseProject },
                {
                    $lookup: {
                        from: 'tests',
                        localField: 'testId',
                        foreignField: '_id',
                        as: 'test',
                    },
                },
                { $unwind: { path: '$test', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$test.createdBy',
                        totalSubmissions: { $sum: 1 },
                        flaggedSubmissions: { $sum: { $cond: [{ $gt: ['$anomalyCount', 0] }, 1, 0] } },
                        avgTrustScore: { $avg: '$trustScoreSafe' },
                        testsCountSet: { $addToSet: '$testId' },
                    },
                },
                {
                    $addFields: {
                        flaggedRate: {
                            $cond: [
                                { $gt: ['$totalSubmissions', 0] },
                                { $multiply: [{ $divide: ['$flaggedSubmissions', '$totalSubmissions'] }, 100] },
                                0,
                            ],
                        },
                        testsCount: { $size: '$testsCountSet' },
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'recruiter',
                    },
                },
                { $unwind: { path: '$recruiter', preserveNullAndEmptyArrays: true } },
                { $sort: { flaggedRate: -1, totalSubmissions: -1 } },
                { $limit: limit },
                {
                    $project: {
                        _id: 0,
                        recruiterId: '$_id',
                        recruiterName: {
                            $trim: {
                                input: {
                                    $concat: [
                                        { $ifNull: ['$recruiter.firstName', ''] },
                                        ' ',
                                        { $ifNull: ['$recruiter.lastName', ''] },
                                    ],
                                },
                            },
                        },
                        totalSubmissions: 1,
                        flaggedSubmissions: 1,
                        testsCount: 1,
                        flaggedRate: { $round: ['$flaggedRate', 2] },
                        avgTrustScore: { $round: ['$avgTrustScore', 2] },
                    },
                },
            ]),
            Submission.aggregate([
                { $match: submissionMatch },
                { $unwind: '$anomalyFlags' },
                {
                    $group: {
                        _id: '$anomalyFlags.code',
                        count: { $sum: 1 },
                        highSeverity: { $sum: { $cond: [{ $eq: ['$anomalyFlags.severity', 'high'] }, 1, 0] } },
                        mediumSeverity: { $sum: { $cond: [{ $eq: ['$anomalyFlags.severity', 'medium'] }, 1, 0] } },
                        lowSeverity: { $sum: { $cond: [{ $eq: ['$anomalyFlags.severity', 'low'] }, 1, 0] } },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: limit },
                {
                    $project: {
                        _id: 0,
                        code: '$_id',
                        count: 1,
                        highSeverity: 1,
                        mediumSeverity: 1,
                        lowSeverity: 1,
                    },
                },
            ]),
        ]);

        const summary = summaryRows[0] || {
            totalSubmissions: 0,
            flaggedSubmissions: 0,
            avgTrustScore: 100,
            lowTrustSubmissions: 0,
        };

        const flaggedRate = summary.totalSubmissions > 0
            ? Math.round((summary.flaggedSubmissions / summary.totalSubmissions) * 10000) / 100
            : 0;

        res.status(200).json({
            status: true,
            filters: {
                startDate: rangeStart.toISOString(),
                endDate: rangeEnd.toISOString(),
                granularity,
                trustThreshold,
                recruiterId: req.query.recruiterId || null,
                testId: req.query.testId || null,
                limit,
            },
            summary: {
                ...summary,
                avgTrustScore: Math.round((summary.avgTrustScore || 0) * 100) / 100,
                flaggedRate,
            },
            byTime,
            byTest,
            byRecruiter,
            topFlags,
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = {
    getStats, getAllUsers, updateUser, deleteUser,
    getAllCompanies, approveCompany,
    getAllJobs, adminDeleteJob,
    adminNotify,
    getAntiCheatAnalytics,
};
