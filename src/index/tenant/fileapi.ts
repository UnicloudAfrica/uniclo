import config from "../../config";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { createFileApiClient } from "../../utils/createApiClient";

export default createFileApiClient({
  baseURL: config.tenantURL,
  authStore: useTenantAuthStore,
  redirectPath: "/tenant-signin",
});
