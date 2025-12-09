import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

/**
 * Base API client configuration
 * Handles authentication, error handling, and request/response interceptors
 */

// API base URL from environment or default
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

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

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem("sanctum_token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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
      localStorage.removeItem("sanctum_token");
      window.location.href = "/login";
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
 * Helper function to set auth token
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("sanctum_token", token);
  } else {
    localStorage.removeItem("sanctum_token");
  }
};

/**
 * Helper function to clear auth session
 */
export const clearAuthSession = () => {
  localStorage.removeItem("sanctum_token");
  // Clear any other session data as needed
};

export default apiClient;
