import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";
import { handleAuthRedirect } from "../utils/authRedirect";
import ToastUtils from "../utils/toastUtil.ts";

const api = async (method, uri, body = null) => {
  const url = config.baseURL + uri;
  // Build headers, preferring admin store (handles tenant slug for admin too)
  const adminState = useAdminAuthStore.getState();
  const baseHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const headers = adminState?.getAuthHeaders
    ? { ...baseHeaders, ...adminState.getAuthHeaders() }
    : { ...baseHeaders };

  const options = {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, options);
    const res = await response.json();

    if (response.ok || response.status === 201) {
      // Handle success message for Toast
      let successMessage = "";
      if (res.data?.message) {
        // Check if message is an object with a 'message' field
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

      return res;
    } else {
      const errorMessage = res?.data?.error || res?.error || res?.message || "An error occurred";

      handleAuthRedirect(response, res, "/sign-in");
      throw new Error(errorMessage);
    }
  } catch (err) {
    ToastUtils.error(err.message);
    throw err;
  }
};

export default api;
