import axiosClient from "../utils/axiosClient";

export async function login(credentials) {
    try {
        const response = await axiosClient.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
}

export async function signup(payload) {
    try {
        const response = await axiosClient.post('/auth/signup', payload);
        return response.data;
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.errors || "Signup failed";
        if (typeof errorMsg === 'object') {
            let extractedError = "Signup failed due to invalid data";
            if (errorMsg.fieldErrors && Object.keys(errorMsg.fieldErrors).length > 0) {
                extractedError = Object.values(errorMsg.fieldErrors)[0][0];
            } else if (errorMsg.formErrors && errorMsg.formErrors.length > 0) {
                extractedError = errorMsg.formErrors[0];
            } else if (Object.values(errorMsg)[0]?.[0]) {
                extractedError = Object.values(errorMsg)[0][0];
            }
            throw new Error(extractedError);
        }
        throw new Error(errorMsg);
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
