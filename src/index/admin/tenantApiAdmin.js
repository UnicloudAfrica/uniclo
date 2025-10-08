import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import ToastUtils from "../../utils/toastUtil";

// Admin token, but target tenant URL endpoints
let isRedirecting = false;

const tenantApiAdmin = async (method, uri, body = null) => {
  const url = config.tenantURL + uri;
  const { token, setToken, clearToken } = useAdminAuthStore.getState();

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
      if (res.access_token) {
        setToken(res.access_token);
      } else if (res.data?.message?.token) {
        setToken(res.data.message.token);
      }
      return res;
    } else {
      if (response.status === 401) {
        if (!isRedirecting) {
          isRedirecting = true;
          clearToken();
          ToastUtils.error("Session expired. Redirecting to admin login...", { duration: 3000 });
          window.location = "/admin-signin";
          setTimeout(() => {
            isRedirecting = false;
          }, 5000);
        }
        return;
      }
      const errorMessage = res?.data?.error || res?.error || res?.message || "An error occurred";
      throw new Error(errorMessage);
    }
  } catch (err) {
    ToastUtils.error(err.message);
    throw err;
  }
};

export default tenantApiAdmin;
