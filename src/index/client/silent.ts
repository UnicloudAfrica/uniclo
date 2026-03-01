import config from "../../config";
import useClientAuthStore from "../../stores/clientAuthStore";
import { createApiClient } from "../../utils/createApiClient";

export default createApiClient({
  baseURL: config.baseURL,
  authStore: useClientAuthStore,
  showToasts: false,
  redirectPath: "/sign-in",
  useSafeJsonParsing: false,
});
