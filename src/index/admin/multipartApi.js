import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { handleAuthRedirect } from "../../utils/authRedirect";
import ToastUtils from "../../utils/toastUtil";

const multipartApi = async (method, uri, formData = null) => {
  const url = config.adminURL + uri;
  const { token, setToken } = useAdminAuthStore.getState();

  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // When using FormData, do not set the 'Content-Type' header.
  // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
  const options = {
    method,
    headers,
    body: formData, // Pass FormData directly, without JSON.stringify
  };

  try {
    const response = await fetch(url, options);
    const res = await response.json();

    if (response.ok || response.status === 201) {
      if (res.access_token) {
        setToken(res.access_token);
      } else if (res.data?.message?.token) {
        setToken(res.data.message.token);
      }

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

      return res;
    } else {
      const handled = handleAuthRedirect(response, res, "/admin-signin");
      if (handled) {
        return;
      }

      const errorMessage =
        res?.data?.error || res?.error || res?.message || "An error occurred";
      throw new Error(errorMessage);
    }
  } catch (err) {
    ToastUtils.error(err.message);
    throw err;
  }
};

export default multipartApi;
