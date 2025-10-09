import config from "../../config";
import useClientAuthStore from "../../stores/clientAuthStore";
import ToastUtils from "../../utils/toastUtil";

// Global variable to track redirection state
let isRedirecting = false;

const clientApi = async (method, uri, body = null) => {
  const url = config.baseURL + uri;
  const { token, setToken, clearToken } = useClientAuthStore.getState();

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
        setToken(res.access_token); // Handle old case
      } else if (res.data?.message?.token) {
        setToken(res.data.message.token); // Handle new structure
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
      if (response.status === 401) {
        if (!isRedirecting) {
          isRedirecting = true; // Prevent multiple redirects
          clearToken(); // Clear Zustand token

          if (window.location.pathname === "/sign-in") {
            ToastUtils.error("Please check your account details.");
            return;
          } else {
            ToastUtils.error("Session expired. Redirecting to login...", {
              duration: 3000,
            });
            window.location = "/sign-in";
          }

          // Reset redirection state after 5 seconds
          setTimeout(() => {
            isRedirecting = false;
          }, 5000);
        }
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

export default clientApi;
