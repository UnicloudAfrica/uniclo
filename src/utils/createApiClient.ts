import { handleAuthRedirect } from "./authRedirect";
import ToastUtils from "./toastUtil";
import logger from "./logger";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiClientBody = Record<string, unknown> | FormData | null;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;

interface AuthStateLike {
  getAuthHeaders?: () => Record<string, string>;
  setTwoFactorRequired?: (value: boolean) => void;
  clearSession?: () => void;
  getEffectiveRole?: () => string;
  role?: string | null;
}

interface AuthStoreLike {
  getState?: () => AuthStateLike;
}

interface ApiClientConfig {
  baseURL: string;
  authStore?: AuthStoreLike;
  showToasts?: boolean;
  redirectPath?: string;
  useSafeJsonParsing?: boolean;
}

interface MultipartApiClientConfig {
  baseURL: string;
  authStore?: AuthStoreLike;
  showToasts?: boolean;
  redirectPath?: string;
}

interface FileApiClientConfig {
  baseURL: string;
  authStore?: AuthStoreLike;
  redirectPath?: string;
}

type ApiResponseRecord = Record<string, unknown>;

type ApiClient = {
  <T = ApiResponseRecord>(method: HttpMethod, uri: string, body?: ApiClientBody): Promise<T>;
  get: <T = ApiResponseRecord>(uri: string) => Promise<T>;
  post: <T = ApiResponseRecord>(uri: string, body?: ApiPayload) => Promise<T>;
  put: <T = ApiResponseRecord>(uri: string, body?: ApiPayload) => Promise<T>;
  patch: <T = ApiResponseRecord>(uri: string, body?: ApiPayload) => Promise<T>;
  delete: <T = ApiResponseRecord>(uri: string, body?: ApiPayload) => Promise<T>;
};

const toRecord = (value: unknown): ApiResponseRecord =>
  value && typeof value === "object" ? (value as ApiResponseRecord) : {};

const toMessage = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as ApiResponseRecord;
    const nested = record["message"];
    if (typeof nested === "string") return nested;
  }
  return "";
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
};

/**
 * Safe JSON parser that handles edge cases
 */
const parseJsonSafely = async (response: Response): Promise<unknown> => {
  if (response.status === 204 || response.status === 205) {
    return {};
  }

  const contentType = response.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const text = await response.text();

  if (!text) {
    return {};
  }

  if (isJson) {
    try {
      return JSON.parse(text);
    } catch (err) {
      logger.error("⚠️ Failed to parse JSON response", err, { text });
      throw new Error("Unexpected response format from server.");
    }
  }

  logger.warn("⚠️ Received non-JSON response", { text });
  throw new Error("Received unsupported response format from server.");
};

/**
 * Factory function to create API clients with consistent behavior
 *
 * @param {Object} config
 * @param {string} config.baseURL - Base URL for API calls
 * @param {Object} config.authStore - Zustand auth store
 * @param {boolean} [config.showToasts=false] - Whether to show toast notifications
 * @param {string} [config.redirectPath='/sign-in'] - Path to redirect on auth failure
 * @param {boolean} [config.useSafeJsonParsing=true] - Whether to use safe JSON parsing
 * @returns {Function} API client function
 */
export const createApiClient = ({
  baseURL,
  authStore,
  showToasts = false,
  redirectPath = "/sign-in",
  useSafeJsonParsing = true,
}: ApiClientConfig): ApiClient => {
  const requester = (async <T = unknown>(
    method: HttpMethod,
    uri: string,
    body: ApiClientBody = null
  ): Promise<T> => {
    const url = baseURL + uri;
    const authState = authStore?.getState ? authStore.getState() : undefined;
    const headers = (authState?.getAuthHeaders?.() as Record<string, string>) || {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const options: RequestInit = {
      method,
      headers,
      credentials: "include", // Ensure cookies are sent (HttpOnly)
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
    };

    try {
      const response = await fetch(url, options);
      const res = useSafeJsonParsing ? await parseJsonSafely(response) : await response.json();
      const resRecord = toRecord(res);
      const dataRecord = toRecord(resRecord["data"]);

      if (response.ok || response.status === 201) {
        // Handle success message for Toast (if enabled)
        if (showToasts) {
          let successMessage = "";
          successMessage =
            toMessage(dataRecord["message"]) ||
            toMessage(resRecord["message"]) ||
            toMessage(resRecord["data"]);

          if (successMessage) {
            ToastUtils.success(successMessage);
          }
        }

        return res as T;
      } else {
        const twoFactorRequired =
          response.status === 403 &&
          (response.headers.get("X-Auth-Status") === "two-factor-required" ||
            Boolean(resRecord["two_factor_required"]) ||
            Boolean(dataRecord["two_factor_required"]));

        if (twoFactorRequired) {
          authState?.setTwoFactorRequired?.(true);
          const effectiveRole = authState?.getEffectiveRole?.() || authState?.role;
          const targetPath = effectiveRole === "admin" ? "/verify-admin-mail" : "/verify-mail";
          if (
            globalThis.window !== undefined &&
            globalThis.window.location.pathname !== targetPath
          ) {
            globalThis.window.location.assign(targetPath);
          }
          throw new Error(
            toMessage(resRecord["error"]) ||
              toMessage(resRecord["message"]) ||
              "Two-factor authentication required."
          );
        }

        // Clear session on auth errors
        if (response.status === 401 || response.status === 403) {
          authState?.clearSession?.();
        }

        const handled = handleAuthRedirect(response, res, redirectPath);
        if (handled) {
          throw new Error("Unauthorized");
        }

        const errorMessage =
          toMessage(dataRecord["error"]) ||
          toMessage(resRecord["error"]) ||
          toMessage(resRecord["message"]) ||
          "An error occurred";

        if (showToasts) {
          ToastUtils.error(errorMessage);
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      const message = getErrorMessage(err, "An error occurred");
      if (showToasts && !message.includes("Unauthorized")) {
        ToastUtils.error(message);
      }
      throw err;
    }
  }) as ApiClient;

  requester.get = <T = unknown>(uri: string) => requester<T>("GET", uri);
  requester.post = <T = unknown>(uri: string, body?: ApiPayload) =>
    requester<T>("POST", uri, body ?? null);
  requester.put = <T = unknown>(uri: string, body?: ApiPayload) =>
    requester<T>("PUT", uri, body ?? null);
  requester.patch = <T = unknown>(uri: string, body?: ApiPayload) =>
    requester<T>("PATCH", uri, body ?? null);
  requester.delete = <T = unknown>(uri: string, body?: ApiPayload) =>
    requester<T>("DELETE", uri, body ?? null);

  return requester;
};

/**
 * Factory for multipart/form-data API clients
 */
export const createMultipartApiClient = ({
  baseURL,
  authStore,
  showToasts = false,
  redirectPath = "/sign-in",
}: MultipartApiClientConfig) => {
  return async <T = unknown>(
    method: HttpMethod,
    uri: string,
    formData: FormData | null = null
  ): Promise<T> => {
    const url = baseURL + uri;
    const authState = authStore?.getState ? authStore.getState() : undefined;
    const headers = (authState?.getAuthHeaders?.() as Record<string, string>) || {
      Accept: "application/json",
    };
    delete headers["Content-Type"];
    // When using FormData, do not set the 'Content-Type' header
    const options: RequestInit = {
      method,
      headers,
      credentials: "include",
      body: formData,
    };

    try {
      const response = await fetch(url, options);
      const res: unknown = await response.json();
      const resRecord = toRecord(res);
      const dataRecord = toRecord(resRecord["data"]);

      if (response.ok || response.status === 201) {
        if (showToasts) {
          let successMessage = "";
          successMessage =
            toMessage(dataRecord["message"]) ||
            toMessage(resRecord["message"]) ||
            toMessage(resRecord["data"]);

          if (successMessage) {
            ToastUtils.success(successMessage);
          }
        }

        return res as T;
      } else {
        const twoFactorRequired =
          response.status === 403 &&
          (response.headers.get("X-Auth-Status") === "two-factor-required" ||
            Boolean(resRecord["two_factor_required"]) ||
            Boolean(dataRecord["two_factor_required"]));

        if (twoFactorRequired) {
          authState?.setTwoFactorRequired?.(true);
          const effectiveRole = authState?.getEffectiveRole?.() || authState?.role;
          const targetPath = effectiveRole === "admin" ? "/verify-admin-mail" : "/verify-mail";
          if (
            globalThis.window !== undefined &&
            globalThis.window.location.pathname !== targetPath
          ) {
            globalThis.window.location.assign(targetPath);
          }
          throw new Error(
            toMessage(resRecord["error"]) ||
              toMessage(resRecord["message"]) ||
              "Two-factor authentication required."
          );
        }

        if (response.status === 401 || response.status === 403) {
          authState?.clearSession?.();
        }

        const handled = handleAuthRedirect(response, res, redirectPath);
        if (handled) {
          throw new Error("Unauthorized");
        }

        const errorMessage =
          toMessage(dataRecord["error"]) ||
          toMessage(resRecord["error"]) ||
          toMessage(resRecord["message"]) ||
          "An error occurred";

        if (showToasts) {
          ToastUtils.error(errorMessage);
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      const message = getErrorMessage(err, "An error occurred");
      if (showToasts && !message.includes("Unauthorized")) {
        ToastUtils.error(message);
      }
      throw err;
    }
  };
};

/**
 * Factory for file API clients that handle binary responses
 */
export const createFileApiClient = ({
  baseURL,
  authStore,
  redirectPath = "/sign-in",
}: FileApiClientConfig) => {
  return async <T = unknown>(
    method: HttpMethod,
    uri: string,
    body: ApiClientBody = null
  ): Promise<T> => {
    const url = baseURL + uri;
    const authState = authStore?.getState ? authStore.getState() : undefined;
    const options: RequestInit = {
      method,
      headers: (authState?.getAuthHeaders?.() as Record<string, string>) || {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : null,
    };

    try {
      const response = await fetch(url, options);

      if (response.ok || response.status === 201) {
        const contentType = response.headers.get("Content-Type") || "";
        let res: unknown;

        // Handle binary data (images, PDFs) first
        if (contentType.includes("image/") || contentType.includes("application/pdf")) {
          res = await response.arrayBuffer();
        } else if (contentType.includes("application/json")) {
          res = await response.json();
        } else if (contentType.includes("text/csv")) {
          res = await response.text();
        } else {
          res = await response.text();
          logger.warn("Unexpected Content-Type, treating as text:", contentType);
        }

        return res as T;
      } else {
        const text = await response.text();
        let parsed: unknown;
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          parsed = {};
        }
        const parsedRecord = toRecord(parsed);
        const parsedData = toRecord(parsedRecord["data"]);

        const twoFactorRequired =
          response.status === 403 &&
          (response.headers.get("X-Auth-Status") === "two-factor-required" ||
            Boolean(parsedRecord["two_factor_required"]) ||
            Boolean(parsedData["two_factor_required"]));

        if (twoFactorRequired) {
          authState?.setTwoFactorRequired?.(true);
          const effectiveRole = authState?.getEffectiveRole?.() || authState?.role;
          const targetPath = effectiveRole === "admin" ? "/verify-admin-mail" : "/verify-mail";
          if (
            globalThis.window !== undefined &&
            globalThis.window.location.pathname !== targetPath
          ) {
            globalThis.window.location.assign(targetPath);
          }
          throw new Error(
            toMessage(parsedRecord["error"]) ||
              toMessage(parsedRecord["message"]) ||
              "Two-factor authentication required."
          );
        }

        if (response.status === 401 || response.status === 403) {
          authState?.clearSession?.();
        }

        const handled = handleAuthRedirect(response, parsed, redirectPath);
        if (handled) {
          throw new Error("Unauthorized");
        }

        const errorMessage =
          toMessage(parsedRecord["error"]) ||
          toMessage(parsedRecord["message"]) ||
          text ||
          "An error occurred";
        throw new Error(errorMessage);
      }
    } catch (err) {
      logger.error("API error:", err);
      throw err;
    }
  };
};
