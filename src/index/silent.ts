import config from "../config";
import useTenantAuthStore from "../stores/tenantAuthStore";
import { createApiClient } from "../utils/createApiClient";

export default createApiClient({
  baseURL: config.baseURL,
  authStore: useTenantAuthStore,
  showToasts: false,
  redirectPath: "/sign-in",
  useSafeJsonParsing: true,
});
