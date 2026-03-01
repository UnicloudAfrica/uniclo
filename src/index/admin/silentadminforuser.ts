import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createApiClient } from "../../utils/createApiClient";

export default createApiClient({
  baseURL: config.baseURL,
  authStore: useAdminAuthStore,
  showToasts: false,
  redirectPath: "/admin-signin",
  useSafeJsonParsing: false,
});
