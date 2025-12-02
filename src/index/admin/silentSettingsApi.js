import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createApiClient } from "../../utils/createApiClient";

/**
 * Admin Silent Settings API Client
 * 
 * This is the silent version (no toasts) for admin users accessing shared settings endpoints
 * at /api/v1/settings/* (not /admin/v1/settings/*)
 */
export default createApiClient({
    baseURL: config.baseURL, // Uses /api/v1, not /admin/v1
    authStore: useAdminAuthStore, // Uses admin auth token
    showToasts: false,
    redirectPath: "/admin-signin",
    useSafeJsonParsing: true,
});
