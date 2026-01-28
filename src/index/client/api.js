import config from "../../config";
import useClientAuthStore from "../../stores/clientAuthStore";
import { handleAuthRedirect } from "../../utils/authRedirect";
import ToastUtils from "../../utils/toastUtil.ts";

const clientApi = async (method, uri, body = null) => {
  const url = config.baseURL + uri;
  const clientState = useClientAuthStore.getState();

  const headers = clientState?.getAuthHeaders?.() || {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const options = {
    method,
    headers,
    credentials: "include",
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : null),
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

export default clientApi;
