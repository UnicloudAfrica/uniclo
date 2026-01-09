import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { handleAuthRedirect } from "../../utils/authRedirect";
import ToastUtils from "../../utils/toastUtil.ts";

const tenantApi = async (method, uri, body = null) => {
  const url = config.tenantURL + uri;
  const tenantState = useTenantAuthStore.getState();

  const headers = tenantState?.getAuthHeaders?.() || {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

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

      const handled = handleAuthRedirect(response, res, "/sign-in");
      if (handled) {
        return;
      }

      throw new Error(errorMessage);
    }
  } catch (err) {
    ToastUtils.error(err.message);
    throw err;
  }
};

export default tenantApi;
