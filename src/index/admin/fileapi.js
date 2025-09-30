import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";

let isRedirecting = false;

const fileApi = async (method, uri, body = null) => {
  const url = config.adminURL + uri;
  const { token, setToken, clearToken } = useAdminAuthStore.getState();

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, image/jpeg, application/pdf, */*", // Accept images, PDFs, and JSON
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

    // Log raw response for debugging
    // console.log("Response status:", response.status);
    // console.log("Content-Type:", response.headers.get("Content-Type"));
    // console.log("Response OK:", response.ok);

    if (response.ok || response.status === 201) {
      const contentType = response.headers.get("Content-Type") || "";
      let res;

      // Handle binary data (images, PDFs) first
      if (
        contentType.includes("image/") ||
        contentType.includes("application/pdf")
      ) {
        res = await response.arrayBuffer(); // Use arrayBuffer for binary data
      } else if (contentType.includes("application/json")) {
        res = await response.json(); // Use json for JSON responses
      } else if (contentType.includes("text/csv")) {
        // Handle CSV as plain text without a warning
        res = await response.text();
      } else {
        // Fallback for unexpected text data (e.g., base64 as text)
        res = await response.text();
        console.warn("Unexpected Content-Type, treating as text:", contentType);
      }

      // Handle token updates silently
      if (res.access_token) {
        setToken(res.access_token);
      } else if (res.data?.message?.token) {
        setToken(res.data.message.token);
      }

      return res;
    } else {
      if (response.status === 401) {
        clearToken();
        if (window.location.pathname === "/sign-in") {
          return;
        } else {
          window.location = "/admin-signin";
        }
        setTimeout(() => {
          isRedirecting = false;
        }, 5000);
        throw new Error("Unauthorized");
      }

      const text = await response.text(); // Get error message as text
      const errorMessage =
        JSON.parse(text)?.error || text || "An error occurred";
      throw new Error(errorMessage);
    }
  } catch (err) {
    console.error("API error:", err);
    throw err;
  }
};

export default fileApi;
