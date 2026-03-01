import config from "../../config";
import useClientAuthStore from "../../stores/clientAuthStore";
import { handleAuthRedirect } from "../../utils/authRedirect";
import ToastUtils from "../../utils/toastUtil";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ApiMessage = string | { message: string };
type ApiResponse<T = unknown> = {
  data?: T;
  message?: ApiMessage;
  error?: string;
  [key: string]: unknown;
};

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

const clientApi = async <T = ApiResponse>(
  method: HttpMethod,
  uri: string,
  body: unknown = null
): Promise<T> => {
  const url = config.baseURL + uri;
  const clientState = useClientAuthStore.getState();

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const headers: Record<string, string> = clientState?.getAuthHeaders
    ? { ...clientState.getAuthHeaders() }
    : { ...baseHeaders };

  if (body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, options);
    const raw = await response.json().catch(() => ({}));
    const res: ApiResponse = (isRecord(raw) ? raw : {}) as ApiResponse;
    const dataRecord = asRecord(res.data);

    if (response.ok || response.status === 201) {
      // Handle success message for Toast
      const successMessage =
        extractMessage(dataRecord.message) ?? extractMessage(res.message) ?? "";

      if (successMessage) {
        ToastUtils.success(successMessage);
      }

      return res as T;
    } else {
      const errorMessage =
        (typeof dataRecord?.error === "string" ? dataRecord.error : undefined) ||
        (typeof res?.error === "string" ? res.error : undefined) ||
        extractMessage(res?.message) ||
        "An error occurred";

      const handled = handleAuthRedirect(response, res, "/sign-in");
      if (handled) {
        // Return a rejected promise instead of just returning (which returns resolved undefined)
        return Promise.reject(new Error("Unauthorized"));
      }

      throw new Error(errorMessage);
    }
  } catch (err) {
    ToastUtils.error(getErrorMessage(err, "An error occurred"));
    throw err;
  }
};

export default clientApi;
