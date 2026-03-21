import axiosClient from "../utils/axiosClient";

export async function submitTest(data) {
    try {
        const response = await axiosClient.post('/submission/submit', data);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to submit test');
    }
}

export async function fetchSubmissionDetails(submissionId) {
    try {
        const response = await axiosClient.get(`/submission/${submissionId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to get result details');
    }
}

export async function fetchMySubmissions() {
    try {
        const response = await axiosClient.get('/submission/my-results');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch candidate results');
    }
}

export async function fetchAllSubmissions() {
    try {
        const response = await axiosClient.get('/submission/all');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch all submissions');
    }
}

export async function updateSubmissionStage(id, stage) {
    try {
        const response = await axiosClient.put(`/submission/${id}/stage`, { stage });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update candidate stage');
    }
}

export async function addCandidateNote(id, text) {
    try {
        const response = await axiosClient.post(`/submission/${id}/notes`, { text });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to add note');
    }
}
export const getMyApplications = async () => {
    try {
        const response = await axiosClient.get('/submission/my-applications');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateCandidateStage = async (id, stage) => {
    try {
        const response = await axiosClient.patch(`/submission/${id}/stage`, { stage });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
