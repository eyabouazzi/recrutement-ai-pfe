const logModel = require('../models/log.model');
const mongoose = require('mongoose');

async function getLogs(req, res) {
    try {
        const { 
            page = 1, 
            limit = 20, 
            action, 
            actorId, 
            resourceType, 
            startDate, 
            endDate,
            severity 
        } = req.query;

        // Build filter object
        let filter = {};
        
        if (action) filter.action = action;
        if (actorId) filter.actorId = actorId;
        if (resourceType) filter.resourceType = resourceType;
        if (severity) filter.severity = severity;
        
        // Date range filtering
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            logModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('actorId', 'firstName lastName email role'),
            logModel.countDocuments(filter)
        ]);

        res.status(200).json({
            status: true,
            message: "Logs found successfully",
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalLogs: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error listing logs",
            error: error.message
        });
    }
}

async function getLogByActorId(req, res) {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            logModel.find({ actorId: id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            logModel.countDocuments({ actorId: id })
        ]);

        res.status(200).json({
            status: true,
            message: "Logs found successfully",
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalLogs: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error getting logs",
            error: error.message
        });
    }
}

async function getLogById(req, res) {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: false,
                message: "Invalid log ID"
            });
        }

        const log = await logModel.findById(id)
            .populate('actorId', 'firstName lastName email role');

        if (!log) {
            return res.status(404).json({
                status: false,
                message: "Log not found"
            });
        }

        res.status(200).json({
            status: true,
            message: "Log found successfully",
            log
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error getting log",
            error: error.message
        });
    }
}

async function getLogsByResource(req, res) {
    try {
        const { resourceType, resourceId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            logModel.find({ resourceType, resourceId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('actorId', 'firstName lastName email role'),
            logModel.countDocuments({ resourceType, resourceId })
        ]);

        res.status(200).json({
            status: true,
            message: "Resource logs found successfully",
            logs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalLogs: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error getting resource logs",
            error: error.message
        });
    }
}

async function getLogStatistics(req, res) {
    try {
        const stats = await logModel.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    lastOccurrence: { $max: '$createdAt' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const severityStats = await logModel.aggregate([
            {
                $group: {
                    _id: '$severity',
                    count: { $sum: 1 }
                }
            }
        ]);

        const recentActivity = await logModel.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('actorId', 'firstName lastName email');

        res.status(200).json({
            status: true,
            message: "Log statistics retrieved successfully",
            stats,
            severityStats,
            recentActivity
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Error getting log statistics",
            error: error.message
        });
    }
}

module.exports = { 
    getLogs, 
    getLogByActorId, 
    getLogById, 
    getLogsByResource,
    getLogStatistics 
};