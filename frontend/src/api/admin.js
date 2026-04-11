import { baseUrl } from "./api";
import { getStoredToken } from "../utils/authStorage";

const getAuthHeaders = () => {
    return {
        'Authorization': `Bearer ${getStoredToken()}`,
        'Content-Type': 'application/json'
    };
};

export const getAdminStats = async () => {
    try {
        const response = await fetch(`${baseUrl}/admin/stats`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const getAdminUsers = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.role) queryParams.append('role', params.role);

        const response = await fetch(`${baseUrl}/admin/users?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const getAdminCompanies = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);

        const response = await fetch(`${baseUrl}/admin/companies?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const getAdminJobs = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        
        const response = await fetch(`${baseUrl}/admin/jobs?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const approveCompany = async (id, action, note = '') => {
    try {
        const response = await fetch(`${baseUrl}/admin/companies/${id}/approve`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action, note })
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const deleteUser = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/admin/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const updateAdminUser = async (id, body) => {
    try {
        const response = await fetch(`${baseUrl}/admin/users/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const deleteJobOffer = async (id) => {
    try {
        const response = await fetch(`${baseUrl}/admin/jobs/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
}

export const getAntiCheatAnalytics = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.days) queryParams.append('days', params.days);
        if (params.granularity) queryParams.append('granularity', params.granularity);
        if (params.recruiterId) queryParams.append('recruiterId', params.recruiterId);
        if (params.testId) queryParams.append('testId', params.testId);
        if (params.trustThreshold) queryParams.append('trustThreshold', params.trustThreshold);
        if (params.limit) queryParams.append('limit', params.limit);

        const response = await fetch(`${baseUrl}/admin/anti-cheat/analytics?${queryParams.toString()}`, {
            headers: getAuthHeaders(),
        });

        return await response.json();
    } catch (error) {
        return { status: false, error: error.message };
    }
};
