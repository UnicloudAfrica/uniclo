import { useMutation, UseMutationResult } from "@tanstack/react-query";
import api, { HttpMethod } from "../index/api";
import config from "../config";
import { resolveActivePersona } from "../stores/sessionUtils";
import logger from "../utils/logger";

type AuthPayload = Record<string, unknown>;

const resolveAuthHeaders = (): Record<string, string> => {
  const { snapshot } = resolveActivePersona();
  if (snapshot?.getAuthHeaders) {
    return snapshot.getAuthHeaders();
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const sharedAuthApi = async (
  method: HttpMethod,
  uri: string,
  body: AuthPayload | null = null
): Promise<unknown> => {
  const url = `${config.baseURL}${uri}`;
  const headers = resolveAuthHeaders();
  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  };

  const response = await fetch(url, options);
  const res = await response.json().catch(() => ({}));

  if (response.ok || response.status === 201) {
    return res;
  }

  const errorMessage = res?.data?.error || res?.error || res?.message || "An error occurred";
  throw new Error(errorMessage);
};

const tryTwoFactorEndpoints = async (
  attempts: { method: HttpMethod; path: string; body?: AuthPayload }[] = []
) => {
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await sharedAuthApi(attempt.method, attempt.path, attempt.body);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

// **POST**: Create a new account
const createAccount = async (userData: AuthPayload) => {
  return await api("POST", "/business/auth/register", userData);
};
// **POST** login
const loginAccount = async (userData: AuthPayload) => {
  return await api("POST", "/business/auth/login", userData);
};
// **POST** verify email
const verifyEmail = async (userData: AuthPayload) => {
  return await api("POST", "/business/auth/verify-email", userData);
};
// **POST** verify email
const forgotPassword = async (userData: AuthPayload) => {
  return await api("POST", "/business/auth/forgot-password", userData);
};
const resetPassword = async (userData: AuthPayload) => {
  return await api("POST", "/business/auth/reset-password-otp", userData);
};
const resendOTP = async (userData: AuthPayload) => {
  return await api("POST", "/business/auth/send-email", userData);
};

const setupTwoFactor = async () => {
  return await tryTwoFactorEndpoints([{ method: "GET", path: "/2fa-setup" }]);
};

const enableTwoFactor = async (payload: AuthPayload) => {
  return await tryTwoFactorEndpoints([{ method: "POST", path: "/2fa-enable", body: payload }]);
};

const disableTwoFactor = async (payload: AuthPayload) => {
  return await tryTwoFactorEndpoints([{ method: "POST", path: "/2fa-disable", body: payload }]);
};

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

// Hook to verify mail
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
// Hook to verify mail
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
// Hook to verify mail
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
