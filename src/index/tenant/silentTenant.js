import config from "../../config";
import useAuthStore from "../../stores/userAuthStore";

let isRedirecting = false;

const silentTenantApi = async (method, uri, body = null) => {
  const url = config.tenantURL + uri;
  const { token, setToken, clearToken } = useAuthStore.getState();

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
      // Handle 401 silently by clearing the token
      if (response.status === 401) {
        if (!isRedirecting) {
          isRedirecting = true; // Prevent multiple redirects
          clearToken(); // Clear Zustand token

          if (window.location.pathname === "/sign-in") {
            // ToastUtils.error("Please check your account details.");
            return;
          } else {
            // ToastUtils.error("Session expired. Redirecting to login...", {
            //   duration: 3000,
            // });
            window.location = "/sign-in";
          }

          // Reset redirection state after 5 seconds
          setTimeout(() => {
            isRedirecting = false;
          }, 5000);
        } // Clear token without redirecting or showing toasts
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
