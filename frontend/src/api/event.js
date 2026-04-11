import { baseUrl } from "./api";
import { getStoredToken } from "../utils/authStorage";

const getAuthHeaders = () => {
    return {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json'
    };
};

export const getEvents = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.type) queryParams.append('type', params.type);
        if (params.upcoming) queryParams.append('upcoming', params.upcoming);

        const response = await fetch(`${baseUrl}/events?${queryParams.toString()}`);
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const getEventById = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/events/${id}`);
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const createEvent = async (formData) => {
    try {
        const response = await fetch(`${baseUrl}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getStoredToken()}`
            },
            body: formData, // Because of image upload
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const registerToEvent = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/events/${id}/register`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const deleteEvent = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/events/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}
