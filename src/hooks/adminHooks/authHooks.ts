import { useMutation } from "@tanstack/react-query";
import api from "../../index/admin/api";
import lapapi from "../../index/admin/lapapi";
import logger from "../../utils/logger";

// **POST**: Create a new account
const createAdminAccount = async (userData: any) => {
  return await api("POST", "/users", userData);
};

// **POST** login
const loginAdminAccount = async (userData: any) => {
  return await lapapi("POST", "/business/auth/login", userData);
};

// **POST** verify email
const verifyEmail = async (userData: any) => {
  return await lapapi("POST", "/business/auth/verify-email", userData);
};

// Hook to create a new account
export const useCreateAdminAccount = () => {
  return useMutation({
    mutationFn: createAdminAccount,
    onError: (error: any) => {
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
    onError: (error: any) => {
      logger.error(error);
    },
    onSuccess: () => {
      // logger.log(data);
    },
  });
};
