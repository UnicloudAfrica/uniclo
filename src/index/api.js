import config from "../config";
import useClientAuthStore from "../stores/clientAuthStore";
import useAuthStore from "../stores/userAuthStore";
import ToastUtils from "../utils/toastUtil";

// Global variable to track redirection state
let isRedirecting = false;

const api = async (method, uri, body = null) => {
  const url = config.baseURL + uri;
  // Attempt to get token from either store, prioritizing the main auth store
  const partnerToken = useAuthStore.getState().token;
  const clientToken = useClientAuthStore.getState().token;
  const token = partnerToken || clientToken;

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
      const tokenToSet = res.access_token || res.data?.message?.token;
      if (tokenToSet) {
        const role = res.data?.role;
        if (role === "client") {
          const { setToken: setClientToken } = useClientAuthStore.getState();
          setClientToken(tokenToSet);
        } else {
          const { setToken: setPartnerToken } = useAuthStore.getState();
          setPartnerToken(tokenToSet);
        }
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
      if (response.status === 401) {
        const preventRedirectHeader =
          response.headers.get("X-Prevent-Login-Redirect") || "";
        const preventRedirectBody =
          res?.prevent_redirect === true || res?.data?.prevent_redirect === true;
        const shouldPreventRedirect =
          preventRedirectHeader.toLowerCase() === "true" || preventRedirectBody;

        if (shouldPreventRedirect) {
          throw new Error(errorMessage || "Unauthorized");
        }

        if (!isRedirecting) {
          isRedirecting = true; // Prevent multiple redirects
          // Clear tokens from both stores to be safe
          useAuthStore.getState().clearToken();
          useClientAuthStore.getState().clearToken();

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

      throw new Error(errorMessage);
    }
  } catch (err) {
    ToastUtils.error(err.message);
    throw err;
  }
};

export default api;
