import { baseUrl } from "./api";
import { getStoredToken } from "../utils/authStorage";

const getAuthHeaders = () => {
    return {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json'
    };
};

export const getNotifications = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);

        const response = await fetch(`${baseUrl}/app-notifications?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const getUnreadCount = async () => {
    try {
        const response = await fetch(`${baseUrl}/app-notifications/unread-count`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const markAsRead = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/app-notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const markAsUnread = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/app-notifications/${id}/unread`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const markAllAsRead = async () => {
    try {
        const response = await fetch(`${baseUrl}/app-notifications/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const deleteNotification = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/app-notifications/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}
