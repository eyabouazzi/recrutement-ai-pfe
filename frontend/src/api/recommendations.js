import axiosClient from '../utils/axiosClient';

// Get stored recommendations for authenticated user
export const getRecommendations = async () => {
    const response = await axiosClient.get('/recommendations');
    return response.data;
};

// Generate new recommendations
export const generateRecommendations = async () => {
    const response = await axiosClient.post('/recommendations/generate');
    return response.data;
};

// Refresh recommendations
export const refreshRecommendations = async () => {
    const response = await axiosClient.post('/recommendations/refresh');
    return response.data;
};

// Get profile insights
export const getProfileInsights = async () => {
    const response = await axiosClient.get('/recommendations/insights');
    return response.data;
};
