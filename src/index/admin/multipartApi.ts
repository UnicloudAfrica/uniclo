import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createMultipartApiClient } from "../../utils/createApiClient";

export default createMultipartApiClient({
  baseURL: config.adminURL,
  authStore: useAdminAuthStore,
  showToasts: true,
  redirectPath: "/admin-signin",
});
