import { message } from "antd";
import axios from "axios";
import errorHandler from "./errorHandler";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth-token");
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
            localStorage.removeItem("auth-token");
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