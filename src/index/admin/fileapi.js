import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createFileApiClient } from "../../utils/createApiClient";

export default createFileApiClient({
  baseURL: config.adminURL,
  authStore: useAdminAuthStore,
  redirectPath: "/admin-signin",
});
