import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";

const adminSilentApiforUser = async (method, uri, body = null) => {
  const url = config.baseURL + uri;
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
      // Handle token updates silently
      if (res.access_token) {
        setToken(res.access_token); // Handle old case
      } else if (res.data?.message?.token) {
        setToken(res.data.message.token); // Handle new structure
      }

      return res;
    } else {
      // Handle 401 silently by clearing the token
      // if (response.status === 401) {
      //   clearToken(); // Clear token without redirecting or showing toasts
      //   throw new Error("Unauthorized");
      // }

      const errorMessage =
        res?.data?.error || res?.error || res?.message || "An error occurred";
      throw new Error(errorMessage);
    }
  } catch (err) {
    // Throw the error without showing toasts
    throw err;
  }
};

export default adminSilentApiforUser;
