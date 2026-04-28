import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { api } from "../lib/api";
import config from "../config";
import logger from "../utils/logger";

type AuthPayload = Record<string, unknown>;

// ── Auth API calls ────────────────────────────────────────────────────
// All pre-login auth endpoints explicitly pin to config.baseURL so a
// stale session role (e.g. "admin") doesn't route them to the wrong
// base URL. Post-login calls (2FA) use the role-based URL automatically.

const AUTH_OPTS = { baseUrl: config.baseURL } as const;

// **POST**: Create a new account — fetch CSRF cookie first for Sanctum SPA auth
const createAccount = async (userData: AuthPayload) => {
  await api.csrfCookie();
  return await api.post("/business/auth/register", userData, AUTH_OPTS);
};
// **POST** login — fetch CSRF cookie first for Sanctum SPA auth
const loginAccount = async (userData: AuthPayload) => {
  await api.csrfCookie();
  return await api.post("/business/auth/login", userData, AUTH_OPTS);
};
// **POST** verify email
const verifyEmail = async (userData: AuthPayload) => {
  return await api.post("/business/auth/verify-email", userData, AUTH_OPTS);
};
// **POST** forgot password
const forgotPassword = async (userData: AuthPayload) => {
  return await api.post("/business/auth/forgot-password", userData, AUTH_OPTS);
};
const resetPassword = async (userData: AuthPayload) => {
  return await api.post("/business/auth/reset-password-otp", userData, AUTH_OPTS);
};
const resendOTP = async (userData: AuthPayload) => {
  return await api.post("/business/auth/send-email", userData, AUTH_OPTS);
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
