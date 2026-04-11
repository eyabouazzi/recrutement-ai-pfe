const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: true,
    },
    type: {
        type: String,
        default: 'general',
        trim: true,
        maxlength: 64,
    },
    category: {
        type: String,
        default: 'system',
        trim: true,
        maxlength: 64,
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 160,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    archived: { type: Boolean, default: false },
    link: { type: String, trim: true },  // Frontend route to navigate to
    actionKey: {
        type: String,
        trim: true,
        maxlength: 180,
    },
    channels: {
        inApp: { type: Boolean, default: true },
        realtime: { type: Boolean, default: true },
        email: { type: Boolean, default: false },
    },
    deliveredRealtimeAt: { type: Date, default: null },
    expiresAt: {
        type: Date,
        default: null,
        index: { expireAfterSeconds: 0 },
    },
    data: { type: mongoose.Schema.Types.Mixed }, // Extra metadata
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, archived: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, actionKey: 1, createdAt: -1 });

const AppNotification = mongoose.model('AppNotification', notificationSchema);
module.exports = AppNotification;
