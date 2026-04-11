const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const { sendMessage: sendWebSocketMessage } = require('../utils/websocket');
const { chatAssistantReply } = require('../utils/openai');

// Get all chats for the authenticated user
async function getMyChats(req, res) {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, status = 'active' } = req.query;

        const chats = await Chat.find({
            participants: userId,
            status
        })
            .populate('participants', 'firstName lastName avatar role companyId')
            .populate('companyId', 'name logo')
            .sort({ lastMessageAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Chat.countDocuments({
            participants: userId,
            status
        });

        // Get unread count for each chat
        const chatsWithUnread = chats.map(chat => {
            const chatObj = chat.toObject();
            const unreadEntry = chatObj.unreadCount?.find(uc => uc.userId.toString() === userId);
            chatObj.unreadCount = unreadEntry?.count || 0;
            return chatObj;
        });

        res.status(200).json({
            status: true,
            chats: chatsWithUnread,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get a single chat by ID
async function getChatById(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        })
            .populate('participants', 'firstName lastName avatar role companyId email')
            .populate('companyId', 'name logo')
            .populate('jobId', 'title jobRole')
            .populate('messages.senderId', 'firstName lastName avatar role');

        if (!chat) {
            return res.status(404).json({ status: false, message: 'Chat non trouvé' });
        }

        // Mark messages as read for current user
        await chat.markAsRead(userId);

        // Refresh the chat data
        const updatedChat = await Chat.findById(id)
            .populate('participants', 'firstName lastName avatar role companyId')
            .populate('companyId', 'name logo')
            .populate('messages.senderId', 'firstName lastName avatar role email');

        res.status(200).json({
            status: true,
            chat: updatedChat
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get or create a direct chat with another user
async function getOrCreateChat(req, res) {
    try {
        const { otherUserId } = req.params;
        const userId = req.user.id;

        // Check if other user exists
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ status: false, message: 'Utilisateur non trouvé' });
        }

        // Try to find existing chat
        let chat = await Chat.findByParticipants(userId, otherUserId);

        if (!chat) {
            // Create new chat
            chat = new Chat({
                participants: [userId, otherUserId],
                type: 'direct',
                status: 'active'
            });
            await chat.save();

            // Populate participants
            await chat.populate('participants', 'firstName lastName avatar role companyId');
        }

        res.status(200).json({
            status: true,
            chat,
            created: !chat._id || chat.messages.length === 0
        });
    } catch (error) {
        console.error('Error getting or creating chat:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Send a message in a chat
async function sendMessage(req, res) {
    try {
        const { id } = req.params;
        const { content, type = 'text', fileUrl, fileName } = req.body;
        const userId = req.user.id;

        if (!content && type === 'text') {
            return res.status(400).json({ status: false, message: 'Le message ne peut pas être vide' });
        }

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({ status: false, message: 'Chat non trouvé' });
        }

        if (chat.status !== 'active') {
            return res.status(400).json({ status: false, message: 'Ce chat n\'est plus actif' });
        }

        // Add message to chat
        const message = await chat.addMessage(userId, content, type, fileUrl, fileName);

        // Populate sender info
        await chat.populate('messages.senderId', 'firstName lastName avatar role');
        const populatedMessage = chat.messages[chat.messages.length - 1];

        // Send real-time notification to other participants
        const otherParticipants = chat.participants.filter(p => p._id.toString() !== userId);
        otherParticipants.forEach(participant => {
            sendWebSocketMessage(participant._id.toString(), 'new_message', {
                chatId: chat._id,
                message: populatedMessage,
                sender: {
                    _id: userId,
                    firstName: req.user.firstName,
                    lastName: req.user.lastName
                }
            });
        });

        res.status(200).json({
            status: true,
            message: populatedMessage,
            chat: {
                _id: chat._id,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt
            }
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Mark all messages in a chat as read
async function markChatAsRead(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOne({
            _id: id,
            participants: userId
        });

        if (!chat) {
            return res.status(404).json({ status: false, message: 'Chat non trouvé' });
        }

        await chat.markAsRead(userId);

        res.status(200).json({
            status: true,
            message: 'Messages marqués comme lus'
        });
    } catch (error) {
        console.error('Error marking chat as read:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Archive a chat
async function archiveChat(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const chat = await Chat.findOneAndUpdate(
            {
                _id: id,
                participants: userId
            },
            {
                status: 'archived'
            },
            { new: true }
        );

        if (!chat) {
            return res.status(404).json({ status: false, message: 'Chat non trouvé' });
        }

        res.status(200).json({
            status: true,
            message: 'Chat archivé',
            chat
        });
    } catch (error) {
        console.error('Error archiving chat:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Create a recruitment-related chat (for job applications)
async function createRecruitmentChat(req, res) {
    try {
        const { recruiterId, jobId, submissionId, companyId, initialMessage } = req.body;
        const candidateId = req.user.id;

        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [candidateId, recruiterId] },
            jobId,
            type: 'recruitment'
        });

        if (chat) {
            return res.status(400).json({
                status: false,
                message: 'Une conversation existe déjà pour cette candidature'
            });
        }

        // Create new recruitment chat
        chat = new Chat({
            participants: [candidateId, recruiterId],
            type: 'recruitment',
            jobId,
            submissionId,
            companyId,
            status: 'active'
        });

        // Add initial message if provided
        if (initialMessage) {
            await chat.addMessage(candidateId, initialMessage);
        }

        await chat.save();
        await chat.populate('participants', 'firstName lastName avatar role companyId');

        // Notify the recruiter
        sendWebSocketMessage(recruiterId.toString(), 'new_chat', {
            chatId: chat._id,
            type: 'recruitment',
            candidate: {
                _id: candidateId,
                firstName: req.user.firstName,
                lastName: req.user.lastName
            }
        });

        res.status(201).json({
            status: true,
            message: 'Conversation créée avec succès',
            chat
        });
    } catch (error) {
        console.error('Error creating recruitment chat:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Get unread message count
async function getUnreadCount(req, res) {
    try {
        const userId = req.user.id;

        const chats = await Chat.find({
            participants: userId,
            status: 'active'
        });

        let totalUnread = 0;
        chats.forEach(chat => {
            const unreadEntry = chat.unreadCount?.find(uc => uc.userId.toString() === userId);
            totalUnread += unreadEntry?.count || 0;
        });

        res.status(200).json({
            status: true,
            totalUnread
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// Search messages in chats
async function searchMessages(req, res) {
    try {
        const userId = req.user.id;
        const { query, page = 1, limit = 20 } = req.query;

        if (!query) {
            return res.status(400).json({ status: false, message: 'Terme de recherche requis' });
        }

        const chats = await Chat.find({
            participants: userId,
            'messages.content': { $regex: query, $options: 'i' }
        })
            .populate('participants', 'firstName lastName avatar')
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Extract matching messages
        const results = chats.map(chat => {
            const matchingMessages = chat.messages.filter(msg =>
                msg.content.toLowerCase().includes(query.toLowerCase())
            );
            return {
                chat,
                messages: matchingMessages.slice(0, 5)
            };
        });

        res.status(200).json({
            status: true,
            results,
            pagination: {
                total: results.length,
                page: parseInt(page),
                pages: Math.ceil(results.length / limit)
            }
        });
    } catch (error) {
        console.error('Error searching messages:', error);
        res.status(500).json({ status: false, error: error.message });
    }
}

// AI assistant for HR/candidate chat support
async function askAssistant(req, res) {
    try {
        const { message, context = {}, history = [] } = req.body || {};
        const trimmedMessage = typeof message === 'string' ? message.trim() : '';

        if (!trimmedMessage) {
            return res.status(400).json({ status: false, message: 'Le message est requis' });
        }
        if (trimmedMessage.length > 2000) {
            return res.status(400).json({ status: false, message: 'Message trop long (max 2000 caracteres)' });
        }

        const isHr = req.user?.role === 'HR';
        const fallbackReply = isHr
            ? 'Je peux vous aider a structurer vos offres, vos criteres de screening et vos feedbacks candidat.'
            : 'Je peux vous aider a clarifier une offre et preparer votre candidature sans fournir de reponse toute faite.';

        try {
            const reply = await chatAssistantReply({
                userMessage: trimmedMessage,
                jobRole: context?.jobRole,
                testTitle: context?.testTitle,
                userRole: req.user?.role,
                history,
            });

            return res.status(200).json({
                status: true,
                reply: (reply || fallbackReply).trim(),
                fallback: !reply,
            });
        } catch (aiError) {
            console.error('AI assistant chat error:', aiError?.message || aiError);
            return res.status(200).json({
                status: true,
                reply: fallbackReply,
                fallback: true,
            });
        }
    } catch (error) {
        console.error('Error in assistant chat endpoint:', error);
        return res.status(500).json({ status: false, error: error.message });
    }
}

module.exports = {
    getMyChats,
    getChatById,
    getOrCreateChat,
    sendMessage,
    markChatAsRead,
    archiveChat,
    createRecruitmentChat,
    getUnreadCount,
    searchMessages,
    askAssistant
};
