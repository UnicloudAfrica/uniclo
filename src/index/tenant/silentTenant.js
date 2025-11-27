import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { handleAuthRedirect } from "../../utils/authRedirect";

const silentTenantApi = async (method, uri, body = null) => {
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
      // Handle token updates silently
      if (res.access_token) {
        setToken(res.access_token); // Handle old case
      } else if (res.data?.message?.token) {
        setToken(res.data.message.token); // Handle new structure
      }

      return res;
    } else {
      const handled = handleAuthRedirect(response, res, "/sign-in");
      if (handled) {
        throw new Error("Unauthorized");
      }

      const errorMessage =
        res?.data?.error || res?.error || res?.message || "An error occurred";
      throw new Error(errorMessage);
    }
  } catch (err) {
    // Throw the error without showing toasts
    throw err;
  }
};

export default silentTenantApi;
