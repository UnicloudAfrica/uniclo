import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { createMultipartApiClient } from "../../utils/createApiClient";

export default createMultipartApiClient({
  baseURL: config.tenantURL,
  authStore: useTenantAuthStore,
  showToasts: true,
  redirectPath: "/tenant-signin",
});
