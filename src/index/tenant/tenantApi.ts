import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { createApiClient } from "../../utils/createApiClient";

export default createApiClient({
  baseURL: config.tenantURL,
  authStore: useTenantAuthStore,
  showToasts: true,
  redirectPath: "/sign-in",
  useSafeJsonParsing: true,
});
