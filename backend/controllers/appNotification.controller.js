const AppNotification = require('../models/notification.model');
const {
    createAndDispatchNotification,
    emitUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} = require('../utils/inAppNotifications');

function buildBaseNotificationQuery(req) {
    const { unreadOnly, type, category, priority, includeArchived } = req.query;
    const query = { userId: req.user.id };

    if (includeArchived !== 'true') {
        query.archived = { $ne: true };
    }
    query.$or = [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
    ];
    if (unreadOnly === 'true') {
        query.read = false;
    }
    if (type) {
        query.type = String(type);
    }
    if (category) {
        query.category = String(category);
    }
    if (priority) {
        query.priority = String(priority);
    }
    return query;
}

/**
 * GET /app-notifications
 */
async function getNotifications(req, res) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const query = buildBaseNotificationQuery(req);

        const [notifications, total, unreadCount] = await Promise.all([
            AppNotification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AppNotification.countDocuments(query),
            AppNotification.countDocuments({
                userId: req.user.id,
                read: false,
                archived: { $ne: true },
                $or: [
                    { expiresAt: null },
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: new Date() } },
                ],
            }),
        ]);

        res.status(200).json({
            status: true,
            notifications,
            unreadCount,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
            },
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * GET /app-notifications/unread-count
 */
async function getUnreadCount(req, res) {
    try {
        const unreadCount = await AppNotification.countDocuments({
            userId: req.user.id,
            read: false,
            archived: { $ne: true },
            $or: [
                { expiresAt: null },
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } },
            ],
        });
        res.status(200).json({ status: true, unreadCount });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * PUT /app-notifications/:id/read
 */
async function markAsRead(req, res) {
    try {
        const notif = await markNotificationAsRead({
            notificationId: req.params.id,
            userId: req.user.id,
            read: true,
        });
        if (!notif) {
            return res.status(404).json({ status: false, message: 'Notification not found.' });
        }
        res.status(200).json({ status: true, notification: notif });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * PUT /app-notifications/:id/unread
 */
async function markAsUnread(req, res) {
    try {
        const notif = await markNotificationAsRead({
            notificationId: req.params.id,
            userId: req.user.id,
            read: false,
        });
        if (!notif) {
            return res.status(404).json({ status: false, message: 'Notification not found.' });
        }
        res.status(200).json({ status: true, notification: notif });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * PUT /app-notifications/read-all
 */
async function markAllAsRead(req, res) {
    try {
        const updatedCount = await markAllNotificationsAsRead(req.user.id);
        res.status(200).json({
            status: true,
            updatedCount,
            message: 'All notifications marked as read.',
        });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * DELETE /app-notifications/:id
 */
async function deleteNotification(req, res) {
    try {
        const result = await AppNotification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!result) {
            return res.status(404).json({ status: false, message: 'Notification not found.' });
        }
        await emitUnreadCount(req.user.id);
        res.status(200).json({ status: true, message: 'Notification deleted.' });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * POST /app-notifications/send
 */
async function createNotification(req, res) {
    try {
        const {
            userId,
            type,
            category,
            priority,
            title,
            message,
            link,
            actionKey,
            channels,
            data,
            expiresAt,
        } = req.body;

        if (!userId || !title || !message) {
            return res.status(400).json({
                status: false,
                message: 'userId, title and message are required.',
            });
        }

        if (
            String(userId) !== String(req.user.id) &&
            req.user.role !== 'admin' &&
            req.user.role !== 'HR'
        ) {
            return res.status(403).json({
                status: false,
                message: 'Not authorized to create notification for another user.',
            });
        }

        const notif = await createAndDispatchNotification(
            {
                userId,
                type,
                category,
                priority,
                title,
                message,
                link,
                actionKey,
                channels,
                data,
                expiresAt,
            },
            { dedupeWindowMinutes: 0, skipIfDuplicate: false }
        );

        res.status(201).json({ status: true, notification: notif });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}

/**
 * Internal helper for non-HTTP triggers
 */
async function pushNotification(payload, options = {}) {
    try {
        return await createAndDispatchNotification(payload, options);
    } catch (error) {
        console.error('pushNotification error:', error.message);
        return null;
    }
}

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    createNotification,
    pushNotification,
};
