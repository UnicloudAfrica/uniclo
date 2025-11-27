import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { handleAuthRedirect } from "../../utils/authRedirect";
import ToastUtils from "../../utils/toastUtil";

const tenantApi = async (method, uri, body = null) => {
  const url = config.tenantURL + uri;
  const { token, setToken } = useTenantAuthStore.getState();

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, options);
    const res = await response.json();

    if (response.ok || response.status === 201) {
      const dataPayload =
        res && typeof res.data === "object" ? res.data : undefined;
      const nestedDataPayload =
        dataPayload && typeof dataPayload.data === "object"
          ? dataPayload.data
          : undefined;
      const messagePayload =
        dataPayload && typeof dataPayload.message === "object"
          ? dataPayload.message
          : undefined;
      const nestedMessagePayload =
        messagePayload && typeof messagePayload.data === "object"
          ? messagePayload.data
          : undefined;

      const tokenToSet =
        res?.access_token ||
        res?.token ||
        dataPayload?.access_token ||
        dataPayload?.token ||
        nestedDataPayload?.access_token ||
        nestedDataPayload?.token ||
        messagePayload?.access_token ||
        messagePayload?.token ||
        nestedMessagePayload?.access_token ||
        nestedMessagePayload?.token;

      if (tokenToSet) {
        setToken(tokenToSet);
      }

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
      const errorMessage =
        res?.data?.error || res?.error || res?.message || "An error occurred";

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
