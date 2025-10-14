import config from "../config";
import useAuthStore from "../stores/userAuthStore";

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

const silentApi = async (method, uri, body = null) => {
  const url = config.baseURL + uri;
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
    const res = await parseJsonSafely(response);

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
        clearToken(); // Clear token without redirecting or showing toasts
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

export default silentApi;
