import axiosClient from "../utils/axiosClient";

export async function listLogs(params = {}) {
    try {
        const response = await axiosClient.get('/log/', { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch logs');
    }
}

export async function getLogById(id) {
    try {
        const response = await axiosClient.get(`/log/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch log');
    }
}

export async function getLogsByActor(actorId, params = {}) {
    try {
        const response = await axiosClient.get(`/log/actor/${actorId}`, { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch actor logs');
    }
}

export async function getLogsByResource(resourceType, resourceId, params = {}) {
    try {
        const response = await axiosClient.get(`/log/resource/${resourceType}/${resourceId}`, { params });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch resource logs');
    }
}

export async function getLogStatistics() {
    try {
        const response = await axiosClient.get('/log/statistics');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch log statistics');
    }
}
