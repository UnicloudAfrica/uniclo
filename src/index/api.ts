import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";
import { handleAuthRedirect } from "../utils/authRedirect";
import ToastUtils from "../utils/toastUtil";
import { resolveActivePersona } from "../stores/sessionUtils";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type ApiMessage = string | { message: string };

interface ApiResponse<T = unknown> {
  data?: T;
  message?: ApiMessage;
  error?: string;
  two_factor_required?: boolean;
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

const extractMessage = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (isRecord(value) && typeof value.message === "string" && value.message.trim() !== "") {
    return value.message;
  }
  return undefined;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim() !== "") return error;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
};

const api = async <T = unknown>(
  method: HttpMethod,
  uri: string,
  body: unknown = null
): Promise<ApiResponse<T>> => {
  const url = config.baseURL + uri;
  // Build headers, preferring admin store (handles tenant slug for admin too)
  const adminState = useAdminAuthStore.getState();
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const headers = adminState?.getAuthHeaders
    ? { ...baseHeaders, ...adminState.getAuthHeaders() }
    : { ...baseHeaders };

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, options);
    const raw = await response.json().catch(() => ({}));
    const res: ApiResponse<T> = (isRecord(raw) ? raw : {}) as ApiResponse<T>;
    const dataRecord = asRecord(res.data);

    if (response.ok || response.status === 201) {
      // Handle success message for Toast
      let successMessage = "";
      const dataMessage = extractMessage(dataRecord.message);
      const responseMessage = extractMessage(res.message);
      successMessage = dataMessage ?? responseMessage ?? "";

      if (successMessage) {
        ToastUtils.success(successMessage);
      }

      return res;
    } else {
      const twoFactorRequired =
        response.status === 403 &&
        (response?.headers?.get?.("X-Auth-Status") === "two-factor-required" ||
          Boolean(res?.two_factor_required) ||
          Boolean(dataRecord?.two_factor_required));

      if (twoFactorRequired) {
        const { key } = resolveActivePersona();
        if (key === "admin") {
          useAdminAuthStore.getState().setTwoFactorRequired(true);
        } else {
          useTenantAuthStore.getState().setTwoFactorRequired(true);
        }
        const targetPath = key === "admin" ? "/verify-admin-mail" : "/verify-mail";
        if (typeof window !== "undefined" && globalThis.window.location.pathname !== targetPath) {
          globalThis.window.location.href = targetPath;
        }
        throw new Error(
          extractMessage(res?.error) ||
            extractMessage(res?.message) ||
            "Two-factor authentication required."
        );
      }

      const errorMessage =
        (typeof dataRecord?.error === "string" ? dataRecord.error : undefined) ||
        (typeof res?.error === "string" ? res.error : undefined) ||
        extractMessage(res?.message) ||
        "An error occurred";

      handleAuthRedirect(response, res, "/sign-in");
      throw new Error(errorMessage);
    }
  } catch (err) {
    const errorMessage = getErrorMessage(err, "An error occurred");
    const errorRecord = asRecord(err);
    const name = typeof errorRecord.name === "string" ? errorRecord.name : "";
    if (name !== "AbortError") {
      ToastUtils.error(errorMessage);
    }
    throw err;
  }
};

export default api;
