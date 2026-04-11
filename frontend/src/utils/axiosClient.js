import axios from "axios";
import errorHandler from "./errorHandler";
import { clearStoredToken, getStoredToken } from "./authStorage";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
            clearStoredToken();
            if (window.location.pathname !== '/login') {
                errorHandler.handleApiError(error, 'Authentication');
                window.location.href = "/login";
            }
        } else {
            // Handle other API errors
            errorHandler.handleApiError(error);
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
