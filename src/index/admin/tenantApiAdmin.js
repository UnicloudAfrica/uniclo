import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { handleAuthRedirect } from "../../utils/authRedirect";
import ToastUtils from "../../utils/toastUtil";

const tenantApiAdmin = async (method, uri, body = null) => {
  const url = config.tenantURL + uri;
  const { token, setToken } = useAdminAuthStore.getState();

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
      const handled = handleAuthRedirect(response, res, "/admin-signin");
      if (handled) {
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
