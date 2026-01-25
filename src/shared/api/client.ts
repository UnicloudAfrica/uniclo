import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

/**
 * Base API client configuration
 * Handles authentication, error handling, and request/response interceptors
 */

// API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Enable cookies for session-based auth
});

// Request interceptor (Token injection handled by HttpOnly cookie/middleware now)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      // localStorage.removeItem("sanctum_token"); // Token is in cookie now
      window.location.href = "/sign-in";
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access forbidden:", error.response.data);
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error("Server error:", error.response.data);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to set auth token (No-op for HttpOnly cookies)
 */
export const setAuthToken = (token: string | null) => {
  // Token is now handled via HttpOnly cookies
};

/**
 * Helper function to clear auth session
 */
export const clearAuthSession = () => {
  // localStorage.removeItem("sanctum_token");
  // Cookies should be cleared by calling a logout endpoint
};

export default apiClient;
