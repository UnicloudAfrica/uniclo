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

/**
 * Read the Sanctum XSRF-TOKEN cookie (URL-encoded) and return its decoded value.
 * Returns null when not present (e.g., before the first /sanctum/csrf-cookie call).
 */
const readXsrfToken = (): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="));
  if (!match) return null;
  try {
    return decodeURIComponent(match.substring("XSRF-TOKEN=".length));
  } catch {
    return null;
  }
};

let csrfPrimed = false;

/**
 * Fetch the Sanctum CSRF cookie once per session. Subsequent calls are no-ops.
 * Called lazily before any state-changing request.
 */
const ensureCsrfCookie = async (baseURL: string): Promise<void> => {
  if (csrfPrimed) return;
  try {
    // The baseURL usually ends with /api/v1 — strip that to reach /sanctum/csrf-cookie
    const root = baseURL.replace(/\/api\/v\d+\/?$/, "").replace(/\/+$/, "");
    await fetch(`${root}/sanctum/csrf-cookie`, {
      method: "GET",
      credentials: "include",
    });
    csrfPrimed = true;
  } catch {
    // Non-fatal — if the backend isn't configured yet, cookie auth still works
    // for non-mutations and the app will show a clear CSRF error on mutation.
  }
};

/** Exported for tests and for auth stores that want to pre-warm the cookie. */
export const resetCsrfPrimed = (): void => {
  csrfPrimed = false;
};

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
 * Resolve the error message to display based on the user's role.
 *
 * Admins always see the raw API error so they can diagnose issues.
 * Tenants and clients see a friendlier "contact support" message for
 * server errors (5xx) to avoid exposing internal details.
 * Validation (422) and business-logic errors are shown to all roles.
 */
const resolveDisplayMessage = (
  rawMessage: string,
  status: number,
  role: string | null | undefined
): string => {
  if (role === "admin") return rawMessage;
  if (status >= 500) return "Something went wrong. Please contact support.";
  return rawMessage;
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

    // Sanctum SPA CSRF: prime the cookie once, then attach X-XSRF-TOKEN for mutations.
    if (method !== "GET") {
      await ensureCsrfCookie(baseURL);
      const xsrf = readXsrfToken();
      if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
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

        // Try auth redirect first — it will return false for business-logic 403s
        const suppressAuthRedirect = !showToasts;
        const handled = suppressAuthRedirect ? false : handleAuthRedirect(response, res, redirectPath);
        if (handled) {
          authState?.clearSession?.();
          throw new Error("Unauthorized");
        }

        // Only clear session on 401 (expired token), not on business-logic 403s
        if (response.status === 401 && !suppressAuthRedirect) {
          authState?.clearSession?.();
        }

        const errorMessage =
          toMessage(dataRecord["error"]) ||
          toMessage(resRecord["error"]) ||
          toMessage(resRecord["message"]) ||
          "An error occurred";

        if (showToasts) {
          const effectiveRole = authState?.getEffectiveRole?.() || authState?.role;
          ToastUtils.error(resolveDisplayMessage(errorMessage, response.status, effectiveRole));
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      const message = getErrorMessage(err, "An error occurred");
      if (showToasts && !message.includes("Unauthorized")) {
        const effectiveRole =
          authStore?.getState?.()?.getEffectiveRole?.() || authStore?.getState?.()?.role;
        ToastUtils.error(resolveDisplayMessage(message, 0, effectiveRole));
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
    // Sanctum SPA CSRF for multipart mutations.
    if (method !== "GET") {
      await ensureCsrfCookie(baseURL);
      const xsrf = readXsrfToken();
      if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
    }
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

        // Try auth redirect first — it will return false for business-logic 403s
        const suppressAuthRedirect = !showToasts;
        const handled = suppressAuthRedirect ? false : handleAuthRedirect(response, res, redirectPath);
        if (handled) {
          authState?.clearSession?.();
          throw new Error("Unauthorized");
        }

        // Only clear session on 401 (expired token), not on business-logic 403s
        if (response.status === 401 && !suppressAuthRedirect) {
          authState?.clearSession?.();
        }

        const errorMessage =
          toMessage(dataRecord["error"]) ||
          toMessage(resRecord["error"]) ||
          toMessage(resRecord["message"]) ||
          "An error occurred";

        if (showToasts) {
          const effectiveRole = authState?.getEffectiveRole?.() || authState?.role;
          ToastUtils.error(resolveDisplayMessage(errorMessage, response.status, effectiveRole));
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      const message = getErrorMessage(err, "An error occurred");
      if (showToasts && !message.includes("Unauthorized")) {
        const effectiveRole =
          authStore?.getState?.()?.getEffectiveRole?.() || authStore?.getState?.()?.role;
        ToastUtils.error(resolveDisplayMessage(message, 0, effectiveRole));
      }
      throw err;
    }
  };
};

/**
 * Factory for file API clients that handle binary responses.
 *
 * Returned client mirrors `createApiClient`'s shape (`.get/.post/.put/
 * .patch/.delete`) so call sites can treat it as a drop-in alongside
 * `entry.silentApi`/`entry.toastApi`. Difference: this one routes
 * `application/pdf`, `image/*`, and `text/csv` responses through
 * dedicated decoders instead of `parseJsonSafely`, which previously
 * threw "Received unsupported response format" for every binary
 * download.
 */
export type FileApiClient = {
  <T = unknown>(method: HttpMethod, uri: string, body?: ApiClientBody): Promise<T>;
  get: <T = unknown>(uri: string) => Promise<T>;
  post: <T = unknown>(uri: string, body?: ApiClientBody) => Promise<T>;
  put: <T = unknown>(uri: string, body?: ApiClientBody) => Promise<T>;
  patch: <T = unknown>(uri: string, body?: ApiClientBody) => Promise<T>;
  delete: <T = unknown>(uri: string, body?: ApiClientBody) => Promise<T>;
  /**
   * Issue a request and return the full `Response` so the caller can
   * read `Content-Disposition`, `Content-Type`, etc. before consuming
   * the body. Use this for downloads where the filename comes from
   * the response headers rather than the call site.
   *
   * Auth, CSRF, and credentials still flow through the same plumbing
   * as the other methods — callers no longer need to roll their own
   * `fetch()` just to peek at headers.
   */
  getRaw: (uri: string) => Promise<Response>;
};

export const createFileApiClient = ({
  baseURL,
  authStore,
  redirectPath = "/sign-in",
}: FileApiClientConfig): FileApiClient => {
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
    if (method !== "GET") {
      await ensureCsrfCookie(baseURL);
      const xsrf = readXsrfToken();
      if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
    }
    const options: RequestInit = {
      method,
      headers,
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

        const handled = handleAuthRedirect(response, parsed, redirectPath);
        if (handled) {
          authState?.clearSession?.();
          throw new Error("Unauthorized");
        }

        if (response.status === 401) {
          authState?.clearSession?.();
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
  }) as FileApiClient;

  requester.get = <T = unknown>(uri: string) => requester<T>("GET", uri);
  requester.post = <T = unknown>(uri: string, body?: ApiClientBody) =>
    requester<T>("POST", uri, body ?? null);
  requester.put = <T = unknown>(uri: string, body?: ApiClientBody) =>
    requester<T>("PUT", uri, body ?? null);
  requester.patch = <T = unknown>(uri: string, body?: ApiClientBody) =>
    requester<T>("PATCH", uri, body ?? null);
  requester.delete = <T = unknown>(uri: string, body?: ApiClientBody) =>
    requester<T>("DELETE", uri, body ?? null);

  // Raw GET — returns the full Response so the caller can inspect
  // `Content-Disposition`, `Content-Type`, etc. before consuming the
  // body. Auth headers + credentials flow through the same plumbing.
  requester.getRaw = async (uri: string): Promise<Response> => {
    const url = baseURL + uri;
    const authState = authStore?.getState ? authStore.getState() : undefined;
    const headers = (authState?.getAuthHeaders?.() as Record<string, string>) || {
      Accept: "application/octet-stream,application/pdf,image/*,*/*",
    };
    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });
    if (!response.ok) {
      // Mirror the auth-redirect handling the JSON path does so a 401
      // on a download still kicks the user back to sign-in.
      if (response.status === 401) {
        authState?.clearSession?.();
      }
      const errorText = await response.text().catch(() => "");
      throw new Error(errorText || `Request failed: ${response.status}`);
    }
    return response;
  };

  return requester;
};
