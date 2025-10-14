import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import ToastUtils from "../../utils/toastUtil";

// Global variable to track redirection state
let isRedirecting = false;

const parseJsonSafely = async (response) => {
  if (response.status === 204 || response.status === 205) {
    return {};
  }

  const contentType = response.headers.get("Content-Type") || "";
  const isJson = contentType.includes("application/json");
  const text = await response.text();

  if (!text) {
    return {};
  }

  if (isJson) {
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("⚠️ Failed to parse JSON response", err, { text });
      throw new Error("Unexpected response format from server.");
    }
  }

  console.warn("⚠️ Received non-JSON response", { text });
  throw new Error("Received unsupported response format from server.");
};

const api = async (method, uri, body = null) => {
  const url = config.adminURL + uri;
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

  // Add timeout for slow requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 60000); // 60 second timeout

  options.signal = controller.signal;

  try {
    console.log(`🚀 API Request: ${method} ${url}`, body ? { payload: body } : '');
    const startTime = Date.now();
    
    const response = await fetch(url, options);
    
    const responseTime = Date.now() - startTime;
    console.log(`⏱️ API Response: ${method} ${url} - ${responseTime}ms - Status: ${response.status}`);
    
    // Log slow requests for debugging
    if (responseTime > 10000) { // Warn if request takes more than 10 seconds
      console.warn(`🐌 Slow request detected: ${method} ${url} took ${responseTime}ms`);
    }
    const res = await parseJsonSafely(response);

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
            window.location = "/admin-signin";
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
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Handle different types of errors
    let errorMessage = "An error occurred";
    
    if (err.name === 'AbortError') {
      errorMessage = "Request timed out. The server is taking too long to respond. Please try again.";
      console.error(`⏰ Request timeout: ${method} ${url}`);
    } else if (err.message.includes('Failed to fetch')) {
      errorMessage = "Network error: Unable to connect to the server. Please check your internet connection.";
      console.error(`🌐 Network error: ${method} ${url}`);
    } else {
      errorMessage = err.message;
      console.error(`❌ API Error: ${method} ${url}`, err);
    }
    
    ToastUtils.error(errorMessage);
    throw new Error(errorMessage);
  } finally {
    // Ensure timeout is always cleared
    clearTimeout(timeoutId);
  }
};

export default api;
