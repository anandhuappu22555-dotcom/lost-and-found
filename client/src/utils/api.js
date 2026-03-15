import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "/api/" : "http://localhost:5000/api/");

const api = axios.create({
    baseURL: API_URL,
});

// Automatically add token to every request
api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
