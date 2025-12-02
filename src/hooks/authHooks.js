import { useMutation } from "@tanstack/react-query";
import api from "../index/api";

const tryTwoFactorEndpoints = async (attempts = []) => {
  let lastError;
  for (const attempt of attempts) {
    try {
      return await api(attempt.method, attempt.path, attempt.body);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

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

const setupTwoFactor = async (payload = {}) => {
  return await tryTwoFactorEndpoints([
    { method: "GET", path: "/2fa-setup" },
  ]);
};

const enableTwoFactor = async (payload) => {
  return await tryTwoFactorEndpoints([
    { method: "POST", path: "/2fa-enable", body: payload },
  ]);
};

const disableTwoFactor = async (payload) => {
  return await tryTwoFactorEndpoints([
    { method: "POST", path: "/2fa-disable", body: payload },
  ]);
};

// Hook to create a new account
export const useCreateAccount = () => {
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

export const useSetupTwoFactor = () => {
  return useMutation({
    mutationFn: setupTwoFactor,
  });
};

export const useEnableTwoFactor = () => {
  return useMutation({
    mutationFn: enableTwoFactor,
  });
};

export const useDisableTwoFactor = () => {
  return useMutation({
    mutationFn: disableTwoFactor,
  });
};
