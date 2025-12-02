import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { createApiClient } from "../../utils/createApiClient";

/**
 * Admin Settings API Client
 * 
 * This client is specifically for admin users accessing the shared settings endpoints
 * at /api/v1/settings/* (not /admin/v1/settings/*)
 * 
 * The settings endpoints are shared across all user types (client, tenant, admin)
 * but require the appropriate authentication token.
 */
export default createApiClient({
    baseURL: config.baseURL, // Uses /api/v1, not /admin/v1
    authStore: useAdminAuthStore, // Uses admin auth token
    showToasts: true,
    redirectPath: "/admin-signin",
    useSafeJsonParsing: true,
});
