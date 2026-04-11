import { baseUrl } from './api';
import { getStoredToken } from '../utils/authStorage';

const getAuthHeaders = () => {
    return {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json'
    };
};

// Get all chats for current user
export const getMyChats = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);

        const response = await fetch(`${baseUrl}/chat?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Get single chat by ID
export const getChatById = async (chatId) => {
    try {
        const response = await fetch(`${baseUrl}/chat/${chatId}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Get or create chat with another user
export const getOrCreateChat = async (otherUserId) => {
    try {
        const response = await fetch(`${baseUrl}/chat/users/${otherUserId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Send message in chat
export const sendMessage = async (chatId, content, type = 'text', fileUrl = null, fileName = null) => {
    try {
        const response = await fetch(`${baseUrl}/chat/${chatId}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content, type, fileUrl, fileName })
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Mark chat as read
export const markChatAsRead = async (chatId) => {
    try {
        const response = await fetch(`${baseUrl}/chat/${chatId}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Archive chat
export const archiveChat = async (chatId) => {
    try {
        const response = await fetch(`${baseUrl}/chat/${chatId}/archive`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Create recruitment chat
export const createRecruitmentChat = async (data) => {
    try {
        const response = await fetch(`${baseUrl}/chat/recruitment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Get unread count
export const getUnreadCount = async () => {
    try {
        const response = await fetch(`${baseUrl}/chat/unread/count`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// Search messages
export const searchMessages = async (query, params = {}) => {
    try {
        const queryParams = new URLSearchParams({ query, ...params });
        const response = await fetch(`${baseUrl}/chat/search?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};

// AI assistant (HR/candidat) with graceful fallback
export const sendAssistantMessage = async (message, context = {}, history = []) => {
    const fallbackReply =
        `Je suis en mode secours pour le moment. ` +
        `Je peux quand meme vous aider a structurer votre demarche pour "${context.testTitle || 'votre sujet'}".`;

    try {
        const response = await fetch(`${baseUrl}/chat/assistant`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message, context, history })
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
            throw new Error(data.message || data.error || 'Assistant indisponible');
        }

        return data;
    } catch (error) {
        return {
            status: true,
            reply: fallbackReply,
            fallback: true,
            error: error.message
        };
    }
};
