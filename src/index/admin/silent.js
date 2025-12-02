import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createApiClient } from "../../utils/createApiClient";

export default createApiClient({
  baseURL: config.adminURL,
  authStore: useAdminAuthStore,
  showToasts: false,
  redirectPath: "/admin-signin",
  useSafeJsonParsing: true,
});
