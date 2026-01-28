import { handleAuthRedirect } from "./authRedirect";
import ToastUtils from "./toastUtil";

/**
 * Safe JSON parser that handles edge cases
 */
const parseJsonSafely = async (response) => {
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
      console.error("⚠️ Failed to parse JSON response", err, { text });
      throw new Error("Unexpected response format from server.");
    }
  }

  console.warn("⚠️ Received non-JSON response", { text });
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
}) => {
  return async (method, uri, body = null) => {
    const url = baseURL + uri;
    const authState = authStore?.getState ? authStore.getState() : null;
    const headers = authState?.getAuthHeaders?.() || {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const options = {
      method,
      headers,
      credentials: "include", // Ensure cookies are sent (HttpOnly)
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : null),
    };

    try {
      const response = await fetch(url, options);
      const res = useSafeJsonParsing ? await parseJsonSafely(response) : await response.json();

      if (response.ok || response.status === 201) {
        // Handle success message for Toast (if enabled)
        if (showToasts) {
          let successMessage = "";
          if (res.data?.message) {
            successMessage =
              typeof res.data.message === "object" && res.data.message.message
                ? res.data.message.message
                : res.data.message;
          } else if (res.message) {
            successMessage = res.message;
          }

          if (successMessage) {
            ToastUtils.success(successMessage);
          }
        }

        return res;
      } else {
        // Clear session on auth errors
        if (response.status === 401 || response.status === 403) {
          authState?.clearSession?.();
        }

        const handled = handleAuthRedirect(response, res, redirectPath);
        if (handled) {
          throw new Error("Unauthorized");
        }

        const errorMessage = res?.data?.error || res?.error || res?.message || "An error occurred";

        if (showToasts) {
          ToastUtils.error(errorMessage);
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      if (showToasts && !err.message.includes("Unauthorized")) {
        ToastUtils.error(err.message);
      }
      throw err;
    }
  };
};

/**
 * Factory for multipart/form-data API clients
 */
export const createMultipartApiClient = ({
  baseURL,
  authStore,
  showToasts = false,
  redirectPath = "/sign-in",
}) => {
  return async (method, uri, formData = null) => {
    const url = baseURL + uri;
    const authState = authStore?.getState ? authStore.getState() : null;
    const headers = authState?.getAuthHeaders?.() || {
      Accept: "application/json",
    };
    delete headers["Content-Type"];
    // When using FormData, do not set the 'Content-Type' header
    const options = {
      method,
      headers,
      credentials: "include",
      body: formData,
    };

    try {
      const response = await fetch(url, options);
      const res = await response.json();

      if (response.ok || response.status === 201) {
        if (showToasts) {
          let successMessage = "";
          if (res.data?.message) {
            successMessage =
              typeof res.data.message === "object" && res.data.message.message
                ? res.data.message.message
                : res.data.message;
          } else if (res.message) {
            successMessage = res.message;
          }

          if (successMessage) {
            ToastUtils.success(successMessage);
          }
        }

        return res;
      } else {
        if (response.status === 401 || response.status === 403) {
          authState?.clearSession?.();
        }

        const handled = handleAuthRedirect(response, res, redirectPath);
        if (handled) {
          throw new Error("Unauthorized");
        }

        const errorMessage = res?.data?.error || res?.error || res?.message || "An error occurred";

        if (showToasts) {
          ToastUtils.error(errorMessage);
        }

        throw new Error(errorMessage);
      }
    } catch (err) {
      if (showToasts && !err.message.includes("Unauthorized")) {
        ToastUtils.error(err.message);
      }
      throw err;
    }
  };
};

/**
 * Factory for file API clients that handle binary responses
 */
export const createFileApiClient = ({ baseURL, authStore, redirectPath = "/sign-in" }) => {
  return async (method, uri, body = null) => {
    const url = baseURL + uri;
    const authState = authStore?.getState ? authStore.getState() : null;
    const options = {
      method,
      headers: authState?.getAuthHeaders?.() || {
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
        let res;

        // Handle binary data (images, PDFs) first
        if (contentType.includes("image/") || contentType.includes("application/pdf")) {
          res = await response.arrayBuffer();
        } else if (contentType.includes("application/json")) {
          res = await response.json();
        } else if (contentType.includes("text/csv")) {
          res = await response.text();
        } else {
          res = await response.text();
          console.warn("Unexpected Content-Type, treating as text:", contentType);
        }

        return res;
      } else {
        const text = await response.text();
        let parsed;
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          parsed = {};
        }

        if (response.status === 401 || response.status === 403) {
          authState?.clearSession?.();
        }

        const handled = handleAuthRedirect(response, parsed, redirectPath);
        if (handled) {
          throw new Error("Unauthorized");
        }

        const errorMessage = parsed?.error || parsed?.message || text || "An error occurred";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("API error:", err);
      throw err;
    }
  };
};
