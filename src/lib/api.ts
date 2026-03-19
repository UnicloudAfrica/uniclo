/**
 * Unified API Client — Single API client for all roles.
 *
 * Replaces the 11+ role-specific API client instances (adminApi, tenantApi,
 * clientApi, adminSilentApi, etc.) with ONE client that auto-detects
 * the base URL from the current auth session role.
 *
 * Key improvements:
 *   - Base URL auto-derived from authStore.session.role
 *   - `silent: true` option replaces separate "silent" API clients
 *   - upload() handles FormData (no Content-Type header)
 *   - download() returns Blob for file downloads
 *   - 401 → auto-logout + redirect to role-specific login
 *   - 403 + X-Auth-Status: two-factor-required → redirect to verify page
 */
import config from "../config";
import useAuthStore, { type AuthRole } from "../stores/authStore";
import ToastUtils from "../utils/toastUtil";
import logger from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  /** Suppress toast notifications (replaces "silent" API clients) */
  silent?: boolean;
  /** Override base URL (bypass role-based auto-detection) */
  baseUrl?: string;
}

type ApiBody = Record<string, unknown> | null | undefined;
type ApiResponseRecord = Record<string, unknown>;

// ─── Helpers ─────────────────────────────────────────────────────────

const ROLE_BASE_URLS: Record<AuthRole, string> = {
  admin: config.adminURL,
  tenant: config.tenantURL,
  client: config.baseURL,
};

const LOGIN_PATHS: Record<AuthRole, string> = {
  admin: "/admin-signin",
  tenant: "/sign-in",
  client: "/sign-in",
};

let isRedirecting = false;

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

const resolveBaseUrl = (override?: string): string => {
  if (override) return override;
  const role = useAuthStore.getState().session?.role;
  return role ? ROLE_BASE_URLS[role] : config.baseURL;
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  if (response.status === 204 || response.status === 205) return {};

  const contentType = response.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const text = await response.text();

  if (!text) return {};
  if (isJson) {
    try {
      return JSON.parse(text);
    } catch {
      logger.error("Failed to parse JSON response", { text });
      throw new Error("Unexpected response format from server.");
    }
  }

  logger.warn("Received non-JSON response", { text });
  throw new Error("Received unsupported response format from server.");
};

const isNotificationAuthFailure = (response: Response): boolean => {
  if (response.status !== 401 && response.status !== 403) return false;

  const url = response.url || "";
  if (!url) return false;

  try {
    const pathname = new URL(url).pathname;
    return (
      pathname.endsWith("/settings/notifications") ||
      pathname.endsWith("/settings/notifications/unread-count")
    );
  } catch {
    return (
      url.includes("/settings/notifications") ||
      url.includes("/settings/notifications/unread-count")
    );
  }
};

const handleAuthError = (
  response: Response,
  body: unknown,
  role: AuthRole | undefined
): boolean => {
  const status = response.status;
  if (status !== 401 && status !== 403) return false;

  // Check prevent-redirect flag
  const bodyRecord = toRecord(body);
  const dataRecord = toRecord(bodyRecord["data"]);
  const preventHeader = response.headers?.get?.("X-Prevent-Login-Redirect") || "";
  const preventBody =
    bodyRecord["prevent_redirect"] === true || dataRecord["prevent_redirect"] === true;
  if (preventHeader.toLowerCase() === "true" || preventBody) return false;

  // Handle 2FA requirement
  const twoFactorRequired =
    status === 403 &&
    (response.headers.get("X-Auth-Status") === "two-factor-required" ||
      Boolean(bodyRecord["two_factor_required"]) ||
      Boolean(dataRecord["two_factor_required"]));

  if (twoFactorRequired) {
    useAuthStore.getState().setTwoFactorRequired(true);
    const targetPath = role === "admin" ? "/verify-admin-mail" : "/verify-mail";
    if (typeof window !== "undefined" && globalThis.window.location.pathname !== targetPath) {
      globalThis.window.location.assign(targetPath);
    }
    return true;
  }

  // Clear session on auth errors
  useAuthStore.getState().clearSession();

  // Redirect to login
  if (isRedirecting) return true;
  isRedirecting = true;

  const targetPath = (role && LOGIN_PATHS[role]) || "/sign-in";
  const alreadyOnTarget =
    typeof window !== "undefined" && globalThis.window.location.pathname === targetPath;

  const message =
    status === 403
      ? "Access denied. Please sign in again."
      : alreadyOnTarget
        ? "Please check your account details."
        : "Session expired. Redirecting to login...";

  ToastUtils.error(message, { duration: 3000 });

  if (!alreadyOnTarget && typeof window !== "undefined") {
    globalThis.window.location.href = targetPath;
  }

  setTimeout(() => {
    isRedirecting = false;
  }, 5000);

  return true;
};

// ─── Core request function ───────────────────────────────────────────

const request = async <T = unknown>(
  method: HttpMethod,
  path: string,
  body: ApiBody = null,
  opts: RequestOptions = {}
): Promise<T> => {
  const { silent = false, baseUrl } = opts;
  const url = resolveBaseUrl(baseUrl) + path;
  const authState = useAuthStore.getState();
  const headers = authState.getAuthHeaders();
  const role = authState.session?.role;

  // FormData: let browser set Content-Type with boundary
  if (body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, fetchOptions);
    const res = await parseJsonSafely(response);
    const resRecord = toRecord(res);
    const dataRecord = toRecord(resRecord["data"]);

    if (response.ok || response.status === 201) {
      // Success toast
      if (!silent) {
        const successMessage =
          toMessage(dataRecord["message"]) ||
          toMessage(resRecord["message"]) ||
          toMessage(resRecord["data"]);
        if (successMessage) {
          ToastUtils.success(successMessage);
        }
      }
      return res as T;
    }

    // Handle auth errors (2FA, 401, 403)
    const suppressAuthRedirect = silent || isNotificationAuthFailure(response);
    const handled = suppressAuthRedirect ? false : handleAuthError(response, res, role);
    if (handled) {
      throw new Error(
        toMessage(resRecord["error"]) ||
          toMessage(resRecord["message"]) ||
          "Authentication required."
      );
    }

    // Regular error
    const errorMessage =
      toMessage(dataRecord["error"]) ||
      toMessage(resRecord["error"]) ||
      toMessage(resRecord["message"]) ||
      "An error occurred";

    if (!silent) {
      ToastUtils.error(errorMessage);
    }

    throw new Error(errorMessage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    if (
      !silent &&
      !message.includes("Unauthorized") &&
      !message.includes("Authentication required")
    ) {
      ToastUtils.error(message);
    }
    throw err;
  }
};

// ─── Public API ──────────────────────────────────────────────────────

export const api = {
  get: <T = unknown>(path: string, opts?: RequestOptions) => request<T>("GET", path, null, opts),

  post: <T = unknown>(path: string, body?: ApiBody, opts?: RequestOptions) =>
    request<T>("POST", path, body ?? null, opts),

  put: <T = unknown>(path: string, body?: ApiBody, opts?: RequestOptions) =>
    request<T>("PUT", path, body ?? null, opts),

  patch: <T = unknown>(path: string, body?: ApiBody, opts?: RequestOptions) =>
    request<T>("PATCH", path, body ?? null, opts),

  delete: <T = unknown>(path: string, body?: ApiBody, opts?: RequestOptions) =>
    request<T>("DELETE", path, body ?? null, opts),

  /**
   * Upload a file via FormData.
   * Replaces the separate multipartApi clients.
   */
  upload: <T = unknown>(path: string, formData: FormData, opts?: RequestOptions) =>
    request<T>("POST", path, formData as unknown as ApiBody, opts),

  /**
   * Download a file as Blob.
   * Replaces the separate fileApi clients.
   */
  download: async (path: string, opts?: RequestOptions): Promise<Blob> => {
    const { baseUrl } = opts || {};
    const url = resolveBaseUrl(baseUrl) + path;
    const authState = useAuthStore.getState();
    const headers = authState.getAuthHeaders();

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  },

  /**
   * Raw request — for cases that need full control.
   */
  request,
};

// ─── Backward-compatibility: default export as callable ──────────────
// Some old code uses `api("POST", "/path", body)` — this supports both
// the old callable style and the new `api.post("/path", body)` style.

export type { HttpMethod, RequestOptions };
export default api;
