import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import lapapi from "../../index/admin/lapapi";

// **POST**: Create a new account
const createAdminAccount = async (userData) => {
  return await api("POST", "/users", userData);
};

// **POST** login
const loginAdminAccount = async (userData) => {
  return await lapapi("POST", "/business/auth/login", userData);
};

// **POST** verify email
const verifyEmail = async (userData) => {
  return await lapapi("POST", "/business/auth/verify-email", userData);
};

// Hook to create a new account
export const useCreateAdminAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminAccount,
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};

// Hook to log in to account
export const useLoginAdminAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginAdminAccount,
    onError: (error) => {
      //   console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};

// Hook to verify mail
export const useVerifyAdminMail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmail,
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};
