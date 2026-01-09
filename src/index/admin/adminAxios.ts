import axios from "axios";
import type { AxiosInstance } from "axios";
import useAdminAuthStore from "../../stores/adminAuthStore";

export const API_BASE = import.meta.env.VITE_API_ADMIN_URL || "/api/v1/admin";

let adminApi: AxiosInstance | null = null;

export const getAdminApi = (): AxiosInstance => {
  if (adminApi) {
    return adminApi;
  }

  adminApi = axios.create({
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  adminApi.interceptors.request.use((config) => {
    const { getAuthHeaders } = useAdminAuthStore.getState();
    config.headers = {
      ...getAuthHeaders(),
      ...(config.headers || {}),
    };
    return config;
  });

  return adminApi;
};
