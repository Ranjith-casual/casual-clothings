import axios from 'axios';
import { baseURL } from '../common/SummaryApi.js';

const Axios = axios.create({
    baseURL: baseURL,
    withCredentials: true,
});

//set the authorization header

Axios.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//extend the token

Axios.interceptors.response.use(
    (response) => {
        return response;
    },
    async(error) => {
        // Only proceed if we have a proper error response object
        if (error.response && error.config) {
            const originalRequest = error.config;

            if (error.response.status === 401 && !originalRequest.retry) {
                originalRequest.retry = true;
                const refreshToken = localStorage.getItem("refreshToken");
                
                if(refreshToken) {
                    try {
                        const newAccessToken = await refreshAccessToken(refreshToken);
                        if(newAccessToken) {
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return Axios(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error("Error refreshing token:", refreshError);
                        // Clear tokens if refresh fails
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        // Redirect to login if needed
                        if (window.location.pathname !== "/login") {
                            window.location.href = "/login";
                        }
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

const refreshAccessToken = async(refreshToken) => {
    try {
        // Use axios directly for token refresh to avoid circular dependency issues
        const response = await axios.create({
            baseURL: baseURL,
        }).post(SummaryApi.refreshToken.url, {}, {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        });

        if (response.data && response.data.data && response.data.data.accessToken) {
            localStorage.setItem("accessToken", response.data.data.accessToken);
            return response.data.data.accessToken;
        }
        throw new Error('Invalid token response');
    } catch (error) {
        console.error("Token refresh failed:", error);
        // Clear tokens on refresh failure
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        throw error; // Rethrow to handle in the interceptor
    }
}

export default Axios;