const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
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
} = require('../controllers/chat.controller');

// All routes require authentication
router.use(protect);

// Get my chats list
router.get('/', getMyChats);

// Get unread message count
router.get('/unread/count', getUnreadCount);

// Search messages
router.get('/search', searchMessages);

// AI assistant chat (HR/candidat)
router.post('/assistant', askAssistant);

// Get or create chat with specific user
router.post('/users/:otherUserId', getOrCreateChat);

// Create recruitment chat
router.post('/recruitment', createRecruitmentChat);

// Get chat by ID
router.get('/:id', getChatById);

// Send message in chat
router.post('/:id/messages', sendMessage);

// Mark chat as read
router.put('/:id/read', markChatAsRead);

// Archive chat
router.put('/:id/archive', archiveChat);

module.exports = router;
