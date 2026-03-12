import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { api } from "../lib/api";
import logger from "../utils/logger";

type AuthPayload = Record<string, unknown>;

// ── Auth API calls ────────────────────────────────────────────────────
// All auth endpoints use the unified API client.
// Pre-login calls (register, login, verify, etc.) resolve to config.baseURL
// because no session/role is set yet. Post-login calls (2FA) use the
// role-based URL automatically.

// **POST**: Create a new account
const createAccount = async (userData: AuthPayload) => {
  return await api.post("/business/auth/register", userData);
};
// **POST** login
const loginAccount = async (userData: AuthPayload) => {
  return await api.post("/business/auth/login", userData);
};
// **POST** verify email
const verifyEmail = async (userData: AuthPayload) => {
  return await api.post("/business/auth/verify-email", userData);
};
// **POST** forgot password
const forgotPassword = async (userData: AuthPayload) => {
  return await api.post("/business/auth/forgot-password", userData);
};
const resetPassword = async (userData: AuthPayload) => {
  return await api.post("/business/auth/reset-password-otp", userData);
};
const resendOTP = async (userData: AuthPayload) => {
  return await api.post("/business/auth/send-email", userData);
};

const setupTwoFactor = async () => {
  return await api.get("/2fa-setup");
};

const enableTwoFactor = async (payload: AuthPayload) => {
  return await api.post("/2fa-enable", payload);
};

const disableTwoFactor = async (payload: AuthPayload) => {
  return await api.post("/2fa-disable", payload);
};

// ── Hooks ─────────────────────────────────────────────────────────────

// Hook to create a new account
export const useCreateAccount = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: createAccount,
    onError: (error) => {
      logger.error(error);
    },
    onSuccess: (_data) => {
      // logger.log(data);
    },
  });
};

// Hook to log in to account
export const useLoginAccount = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: loginAccount,
    onError: (_error: Error) => {
      //   logger.error(error);
    },
    onSuccess: () => {
      // logger.log(data);
    },
  });
};

// Hook to verify mail
export const useVerifyMail = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: verifyEmail,
    onError: (error) => {
      logger.error(error);
    },
    onSuccess: (_data) => {
      // logger.log(data);
    },
  });
};

// Hook to forgot password
export const useForgotPassword = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: forgotPassword,
    onError: (error) => {
      logger.error(error);
    },
    onSuccess: (_data) => {
      // logger.log(data);
    },
  });
};

// Hook to reset password
export const useResetPassword = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: resetPassword,
    onError: (error) => {
      logger.error(error);
    },
    onSuccess: (_data) => {
      // logger.log(data);
    },
  });
};

// Hook to resend OTP
export const useResendOTP = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: resendOTP,
    onError: (error) => {
      logger.error(error);
    },
    onSuccess: (_data) => {
      // logger.log(data);
    },
  });
};

export const useSetupTwoFactor = (): UseMutationResult<unknown, Error, void> => {
  return useMutation({
    mutationFn: setupTwoFactor,
  });
};

export const useEnableTwoFactor = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: enableTwoFactor,
  });
};

export const useDisableTwoFactor = (): UseMutationResult<unknown, Error, AuthPayload> => {
  return useMutation({
    mutationFn: disableTwoFactor,
  });
};
