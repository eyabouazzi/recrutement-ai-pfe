const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['text', 'file', 'system'],
        default: 'text'
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    }],
    type: {
        type: String,
        enum: ['direct', 'recruitment'],
        default: 'direct'
    },
    // Link to a specific job application if type is 'recruitment'
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
    },
    // Link to a specific submission/application
    submissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission'
    },
    // Company associated with the chat
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    // Last message preview
    lastMessage: {
        type: String,
        trim: true
    },
    // Last message timestamp
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    // Unread count per participant
    unreadCount: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },
        count: {
            type: Number,
            default: 0
        }
    }],
    // Chat status
    status: {
        type: String,
        enum: ['active', 'archived', 'closed'],
        default: 'active'
    },
    // Messages in the chat
    messages: [messageSchema]
}, { timestamps: true });

// Index for efficient queries
chatSchema.index({ participants: 1, lastMessageAt: -1 });
chatSchema.index({ 'unreadCount.userId': 1, status: 1 });

// Static method to find or create a chat between two users
chatSchema.statics.findByParticipants = async function (userId1, userId2) {
    return await this.findOne({
        participants: { $all: [userId1, userId2] },
        type: 'direct'
    }).populate('participants', 'firstName lastName avatar role');
};

// Instance method to add a message
chatSchema.methods.addMessage = async function (senderId, content, type = 'text', fileUrl = null, fileName = null) {
    const message = {
        senderId,
        content,
        type,
        fileUrl,
        fileName
    };

    this.messages.push(message);
    this.lastMessage = content;
    this.lastMessageAt = new Date();

    // Update unread count for other participants
    this.unreadCount = this.participants.map(participant => {
        if (participant.toString() === senderId.toString()) {
            return { userId: participant, count: 0 };
        }
        const existing = this.unreadCount.find(uc => uc.userId.toString() === participant.toString());
        return {
            userId: participant,
            count: (existing?.count || 0) + 1
        };
    });

    await this.save();
    return message;
};

// Instance method to mark messages as read
chatSchema.methods.markAsRead = async function (userId) {
    const unreadIndex = this.unreadCount.findIndex(uc => uc.userId.toString() === userId.toString());
    if (unreadIndex !== -1) {
        this.unreadCount[unreadIndex].count = 0;
    }

    // Mark all messages from other users as read
    this.messages.forEach(msg => {
        if (msg.senderId.toString() !== userId.toString() && !msg.read) {
            msg.read = true;
            msg.readAt = new Date();
        }
    });

    await this.save();
};

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;