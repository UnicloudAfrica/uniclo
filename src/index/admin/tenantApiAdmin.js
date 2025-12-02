import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createApiClient } from "../../utils/createApiClient";

export default createApiClient({
  baseURL: config.tenantURL,
  authStore: useAdminAuthStore,
  showToasts: true,
  redirectPath: "/admin-signin",
  useSafeJsonParsing: false,
});
