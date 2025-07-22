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

            // Explicitly check for token expired message from our backend
            const isTokenExpired = 
                error.response.status === 401 && 
                (error.response.data?.tokenExpired || 
                error.response.data?.message?.includes('expired') ||
                error.response.data?.message?.includes('JWT'));
                
            // Handle token refresh if token expired and this isn't already a retry
            if ((error.response.status === 401) && !originalRequest.retry) {
                originalRequest.retry = true;
                const refreshToken = localStorage.getItem("refreshToken");
                
                if(refreshToken) {
                    try {
                        console.log("Attempting to refresh token...");
                        const newAccessToken = await refreshAccessToken(refreshToken);
                        if(newAccessToken) {
                            console.log("Token refreshed successfully");
                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            return Axios(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error("Error refreshing token:", refreshError);
                        // Clear tokens if refresh fails
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        
                        // Only redirect to login if not already there
                        if (window.location.pathname !== "/login") {
                            console.log("Redirecting to login due to authentication failure");
                            // Use a small delay to allow any pending operations to complete
                            setTimeout(() => {
                                window.location.href = "/login?expired=true";
                            }, 100);
                        }
                    }
                } else {
                    console.log("No refresh token available");
                    // No refresh token available, clear any access token
                    localStorage.removeItem("accessToken");
                }
            }
            
            // Add specific error information for debugging
            if (error.response.status === 500) {
                console.error("Server error details:", {
                    endpoint: originalRequest.url,
                    method: originalRequest.method,
                    responseData: error.response.data
                });
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