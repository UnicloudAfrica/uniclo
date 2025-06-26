import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";

// **POST**: Create a new account
const createAccount = async (userData) => {
  return await api("POST", "/business/auth/register", userData);
};
// **POST** login
const loginAccount = async (userData) => {
  return await api("POST", "/business/auth/login", userData);
};
// **POST** verify email
const verifyEmail = async (userData) => {
  return await api("POST", "/business/auth/verify-email", userData);
};
// **POST** verify email
const forgotPassword = async (userData) => {
  return await api("POST", "/business/auth/forgot-password", userData);
};
const resetPassword = async (userData) => {
  return await api("POST", "/business/auth/reset-password-otp", userData);
};
const resendOTP = async (userData) => {
  return await api("POST", "/business/auth/send-email", userData);
};

// Hook to create a new account
export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};

// Hook to log in to account
export const useLoginAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginAccount,
    onError: (error) => {
      //   console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};

// Hook to verify mail
export const useVerifyMail = () => {
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

// Hook to verify mail
export const useForgotPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forgotPassword,
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};
// Hook to verify mail
export const useResetPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetPassword,
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};
// Hook to verify mail
export const useResendOTP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resendOTP,
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
    },
  });
};
