import { useMutation } from "@tanstack/react-query";
import api from "../../index/admin/api";
import config from "../../config";
import { api as unifiedApi } from "../../lib/api";
import logger from "@/utils/logger";

// **POST**: Create a new account
const createAdminAccount = async (userData: unknown) => {
  return await api("POST", "/users", userData);
};

// **POST** login — fetch CSRF cookie first for Sanctum SPA auth
const loginAdminAccount = async (userData: unknown) => {
  await unifiedApi.csrfCookie();
  return await unifiedApi.post("/business/auth/login", userData, { baseUrl: config.baseURL });
};

// **POST** verify email — always hits api/v1
const verifyEmail = async (userData: unknown) => {
  return await unifiedApi.post("/business/auth/verify-email", userData, { baseUrl: config.baseURL });
};

// Hook to create a new account
export const useCreateAdminAccount = () => {
  return useMutation({
    mutationFn: createAdminAccount,
    onError: (error: unknown) => {
      logger.error(error);
    },
    onSuccess: () => {
      // logger.log(data);
    },
  });
};

// Hook to log in to account
export const useLoginAdminAccount = () => {
  return useMutation({
    mutationFn: loginAdminAccount,
    onError: () => {
      //   logger.error(error);
    },
    onSuccess: () => {
      // logger.log(data);
    },
  });
};

// Hook to verify mail
export const useVerifyAdminMail = () => {
  return useMutation({
    mutationFn: verifyEmail,
    onError: (error: unknown) => {
      logger.error(error);
    },
    onSuccess: () => {
      // logger.log(data);
    },
  });
};
