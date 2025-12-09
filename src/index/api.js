import config from "../config";
import useClientAuthStore from "../stores/clientAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";
import useAdminAuthStore from "../stores/adminAuthStore";
import { handleAuthRedirect } from "../utils/authRedirect";
import ToastUtils from "../utils/toastUtil.ts";

const api = async (method, uri, body = null) => {
  const url = config.baseURL + uri;
  // Build headers, preferring admin store (handles tenant slug for admin too)
  const adminState = useAdminAuthStore.getState();
  const baseHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const headers = adminState?.getAuthHeaders
    ? { ...baseHeaders, ...adminState.getAuthHeaders() }
    : { ...baseHeaders };

  // Fallback to tenant/client tokens if no admin token is present
  if (!headers.Authorization) {
    const partnerToken = useTenantAuthStore.getState().token;
    const clientToken = useClientAuthStore.getState().token;
    const token = partnerToken || clientToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
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
      const dataPayload = res && typeof res.data === "object" ? res.data : undefined;
      const nestedDataPayload =
        dataPayload && typeof dataPayload.data === "object" ? dataPayload.data : undefined;
      const messagePayload =
        dataPayload && typeof dataPayload.message === "object" ? dataPayload.message : undefined;
      const nestedMessagePayload =
        messagePayload && typeof messagePayload.data === "object" ? messagePayload.data : undefined;

      const tokenToSet =
        res?.access_token ||
        res?.token ||
        dataPayload?.access_token ||
        dataPayload?.token ||
        nestedDataPayload?.access_token ||
        nestedDataPayload?.token ||
        messagePayload?.access_token ||
        messagePayload?.token ||
        nestedMessagePayload?.access_token ||
        nestedMessagePayload?.token;

      if (tokenToSet) {
        const rawRole =
          dataPayload?.role ||
          nestedDataPayload?.role ||
          messagePayload?.role ||
          nestedMessagePayload?.role;
        const normalizedRole = typeof rawRole === "string" ? rawRole.toLowerCase() : undefined;

        if (normalizedRole === "client") {
          const { setToken: setClientToken } = useClientAuthStore.getState();
          setClientToken(tokenToSet);
        } else if (normalizedRole === "admin") {
          useAdminAuthStore.getState().setToken(tokenToSet);
        } else {
          const { setToken: setPartnerToken } = useTenantAuthStore.getState();
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
      const errorMessage = res?.data?.error || res?.error || res?.message || "An error occurred";

      const handled = handleAuthRedirect(response, res, "/sign-in");
      if (handled) {
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
