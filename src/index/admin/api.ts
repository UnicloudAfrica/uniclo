import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createApiClient } from "../../utils/createApiClient";

export const adminSilentApi = createApiClient({
  baseURL: config.adminURL,
  authStore: useAdminAuthStore,
  showToasts: false,
  redirectPath: "/admin-signin",
  useSafeJsonParsing: true,
});

export default createApiClient({
  baseURL: config.adminURL,
  authStore: useAdminAuthStore,
  showToasts: true,
  redirectPath: "/admin-signin",
  useSafeJsonParsing: true,
});
