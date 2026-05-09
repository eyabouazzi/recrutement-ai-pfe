const AppNotification = require('../models/notification.model');
const User = require('../models/user.model');
const { sendMessage } = require('./websocket');

function toRealtimePayload(notification) {
    if (!notification) return null;

    const doc = typeof notification.toObject === 'function'
        ? notification.toObject()
        : notification;

    return {
        id: String(doc._id),
        _id: doc._id,
        userId: doc.userId,
        type: doc.type || 'general',
        category: doc.category || 'system',
        priority: doc.priority || 'normal',
        targetRole: doc.targetRole || 'all',
        title: doc.title,
        message: doc.message,
        read: Boolean(doc.read),
        link: doc.link || '',
        actionKey: doc.actionKey || '',
        data: doc.data || {},
        timestamp: doc.createdAt || new Date(),
    };
}

async function emitUnreadCount(userId) {
    if (!userId) return 0;
    const unreadCount = await AppNotification.countDocuments({
        userId,
        read: false,
        archived: { $ne: true },
        $or: [
            { expiresAt: null },
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
        ],
    });
    sendMessage(userId, 'notificationUnreadCount', { unreadCount, timestamp: new Date() });
    return unreadCount;
}

async function resolveNotificationTargetRole(payload = {}) {
    if (payload.targetRole) return String(payload.targetRole);
    if (!payload.userId) return 'all';
    const recipient = await User.findById(payload.userId).select('role').lean();
    const role = String(recipient?.role || '').trim();
    if (role === 'HR' || role === 'candidat') return role;
    return 'all';
}

async function normalizeInput(payload = {}) {
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
    const targetRole = await resolveNotificationTargetRole(payload);
    return {
        userId: payload.userId,
        type: payload.type || 'general',
        category: payload.category || 'system',
        priority: payload.priority || 'normal',
        targetRole,
        title: String(payload.title || '').trim(),
        message: String(payload.message || '').trim(),
        link: payload.link || '',
        actionKey: payload.actionKey || '',
        channels: {
            inApp: payload.channels?.inApp !== false,
            realtime: payload.channels?.realtime !== false,
            email: payload.channels?.email === true,
        },
        data: payload.data || {},
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    };
}

async function createAndDispatchNotification(
    payload,
    options = {}
) {
    const {
        emitRealtime = true,
        emitUnread = true,
        dedupeWindowMinutes = 30,
        skipIfDuplicate = true,
    } = options;

    const input = await normalizeInput(payload);
    if (!input.userId || !input.title || !input.message) {
        throw new Error('Notification requires userId, title, and message');
    }

    let notification = null;
    let duplicateHit = false;

    if (input.actionKey && skipIfDuplicate && dedupeWindowMinutes > 0) {
        const threshold = new Date(Date.now() - dedupeWindowMinutes * 60 * 1000);
        notification = await AppNotification.findOne({
            userId: input.userId,
            actionKey: input.actionKey,
            createdAt: { $gte: threshold },
        }).sort({ createdAt: -1 });
        duplicateHit = Boolean(notification);
    }

    if (!notification) {
        notification = await AppNotification.create(input);
    }

    if (!duplicateHit && emitRealtime && input.channels.realtime && input.userId) {
        sendMessage(input.userId, 'applicationNotification', toRealtimePayload(notification));
        if (!notification.deliveredRealtimeAt) {
            notification.deliveredRealtimeAt = new Date();
            await notification.save();
        }
    }

    if (!duplicateHit && emitUnread && input.userId) {
        await emitUnreadCount(input.userId);
    }

    return notification;
}

async function createManyAndDispatchNotifications(notifications = [], options = {}) {
    if (!Array.isArray(notifications) || notifications.length === 0) return [];
    const created = [];
    const unreadTargets = new Set();

    for (const item of notifications) {
        // Keep flow resilient on bulk sends: continue if one payload is invalid.
        try {
            const notification = await createAndDispatchNotification(item, {
                ...options,
                emitUnread: false,
            });
            created.push(notification);
            if (notification?.userId) unreadTargets.add(String(notification.userId));
        } catch (error) {
            // no-op
        }
    }

    if (options.emitUnread !== false && unreadTargets.size > 0) {
        await Promise.all(Array.from(unreadTargets).map((userId) => emitUnreadCount(userId)));
    }

    return created;
}

async function markNotificationAsRead({ notificationId, userId, read = true }) {
    if (!notificationId || !userId) return null;
    const update = read
        ? { read: true, readAt: new Date() }
        : { read: false, readAt: null };
    const notification = await AppNotification.findOneAndUpdate(
        { _id: notificationId, userId },
        update,
        { new: true }
    );
    if (notification) {
        await emitUnreadCount(userId);
    }
    return notification;
}

async function markAllNotificationsAsRead(userId) {
    if (!userId) return 0;
    const result = await AppNotification.updateMany(
        { userId, read: false },
        { read: true, readAt: new Date() }
    );
    await emitUnreadCount(userId);
    return Number(result.modifiedCount || 0);
}

module.exports = {
    toRealtimePayload,
    createAndDispatchNotification,
    createManyAndDispatchNotifications,
    emitUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};
