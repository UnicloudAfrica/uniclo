import axios from "axios";
import type { AxiosInstance } from "axios";
import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";

const resolveAdminBase = () => {
  const envAdminUrl = import.meta.env.VITE_API_ADMIN_URL;
  if (envAdminUrl) return envAdminUrl;
  if (config.adminURL && !config.adminURL.includes("undefined")) {
    return config.adminURL;
  }
  return "/admin/v1";
};

export const API_BASE = resolveAdminBase();

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
