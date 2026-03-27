import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        const onboardingToken = localStorage.getItem('onboardingToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (onboardingToken) {
            config.headers.Authorization = `Bearer ${onboardingToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            } else if (error.response.status === 403) {
                toast.error('Permission denied.');
            } else if (error.response.status >= 500) {
                toast.error('An unexpected server error occurred.');
            }
        } else {
            toast.error('Network error. Please try again.');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
