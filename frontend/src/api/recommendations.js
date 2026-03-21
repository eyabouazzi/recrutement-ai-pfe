import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Get stored recommendations for authenticated user
export const getRecommendations = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Generate new recommendations
export const generateRecommendations = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/recommendations/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Refresh recommendations
export const refreshRecommendations = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/recommendations/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Get profile insights
export const getProfileInsights = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/recommendations/insights`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
