import axiosClient from "../utils/axiosClient";

function extractFirstErrorMessage(data) {
    const flat = data?.errors;
    if (flat?.fieldErrors && typeof flat.fieldErrors === 'object') {
        const firstFieldError = Object.values(flat.fieldErrors).flat().filter(Boolean)[0];
        if (firstFieldError) {
            return firstFieldError;
        }
    }
    if (Array.isArray(flat?.formErrors) && flat.formErrors[0]) {
        return flat.formErrors[0];
    }
    return data?.message || null;
}

function buildApiError(error, fallbackMessage) {
    const data = error.response?.data;
    const apiError = new Error(extractFirstErrorMessage(data) || error.message || fallbackMessage);
    apiError.status = error.response?.status;
    apiError.data = data;
    return apiError;
}

export async function login(credentials) {
    try {
        const response = await axiosClient.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        throw buildApiError(error, 'Login failed');
    }
}

export async function signup(payload) {
    try {
        const config = {};
        // If payload is FormData, don't set Content-Type (let axios handle it)
        if (payload instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' };
        }
        const response = await axiosClient.post('/auth/signup', payload, config);
        return response.data;
    } catch (error) {
        throw buildApiError(error, 'Signup failed');
    }
}

export async function exportMyData() {
    const response = await axiosClient.get('/auth/me/export-data');
    return response.data;
}

export async function deleteMyAccountData(confirmText) {
    const response = await axiosClient.delete('/auth/me/account-data', {
        data: { confirm: confirmText },
    });
    return response.data;
}

export async function patchPreferences(body) {
    try {
        const response = await axiosClient.patch('/auth/me/preferences', body);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Échec de la mise à jour des préférences');
    }
}

export async function getMe() {
    try {
        const response = await axiosClient.get('/auth/me');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
}

export async function updateProfile(payload) {
    try {
        const config = {};
        if (payload instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' };
        }
        const response = await axiosClient.patch('/auth/me/profile', payload, config);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
}

export async function changePassword(payload) {
    try {
        const response = await axiosClient.put('/auth/change-password', payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password change failed');
    }
}

export async function forgotPassword(payload) {
    try {
        const response = await axiosClient.post('/auth/forgot-password', payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password reset request failed');
    }
}

export async function resetPassword(payload) {
    try {
        const response = await axiosClient.post('/auth/reset-password', payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password reset failed');
    }
}

export async function getSmtpStatus() {
    try {
        const response = await axiosClient.get('/auth/smtp-status');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch SMTP status');
    }
}

export async function sendSmtpTestEmail() {
    try {
        const response = await axiosClient.post('/auth/smtp-test-email');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to send test email');
    }
}
