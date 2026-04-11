import axiosClient from '../utils/axiosClient';

export async function listInterviews(params = {}) {
    const response = await axiosClient.get('/interviews', { params });
    return response.data;
}

export async function createInterview(payload) {
    const response = await axiosClient.post('/interviews', payload);
    return response.data;
}

export async function updateInterview(id, payload) {
    const response = await axiosClient.patch(`/interviews/${id}`, payload);
    return response.data;
}

export async function cancelInterview(id) {
    const response = await axiosClient.post(`/interviews/${id}/cancel`);
    return response.data;
}

export async function remindInterview(id) {
    const response = await axiosClient.post(`/interviews/${id}/remind`);
    return response.data;
}

export async function listMyInterviews(params = {}) {
    const response = await axiosClient.get('/interviews/me', { params });
    return response.data;
}

