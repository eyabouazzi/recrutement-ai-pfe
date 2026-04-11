import { baseUrl } from "./api";
import { getStoredToken } from "../utils/authStorage";

const getAuthHeaders = () => {
    return {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json'
    };
};

export const getFavorites = async () => {
    try {
        const response = await fetch(`${baseUrl}/favorites`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const addFavorite = async (jobId) => {
    try {
        const response = await fetch(`${baseUrl}/favorites/${jobId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const removeFavorite = async (jobId) => {
    try {
        const response = await fetch(`${baseUrl}/favorites/${jobId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const checkFavorite = async (jobId) => {
    try {
        const response = await fetch(`${baseUrl}/favorites/check/${jobId}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}
