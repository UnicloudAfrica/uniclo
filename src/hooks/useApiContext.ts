import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";
import useClientAuthStore from "../stores/clientAuthStore";

export type ApiContext = "admin" | "tenant" | "client";

interface ApiContextResult {
  context: ApiContext;
  apiBaseUrl: string;
  authToken: string | null;
  authStore: any;
}

/**
 * Hook to determine the current API context (admin/tenant/client)
 * and provide the appropriate API base URL and auth token
 */
export const useApiContext = (): ApiContextResult => {
  const location = useLocation();
  const adminToken = useAdminAuthStore((state: any) => state.token);
  const tenantToken = useTenantAuthStore((state: any) => state.token);
  const clientToken = useClientAuthStore((state: any) => state.token);

  const result = useMemo(() => {
    const path = location.pathname;

    // Determine context based on route
    if (path.startsWith("/admin-dashboard") || path.startsWith("/admin")) {
      return {
        context: "admin" as ApiContext,
        apiBaseUrl: config.adminURL,
        authToken: adminToken,
        authStore: useAdminAuthStore,
      };
    } else if (path.startsWith("/tenant-dashboard") || path.startsWith("/tenant")) {
      return {
        context: "tenant" as ApiContext,
        apiBaseUrl: config.tenantURL,
        authToken: tenantToken,
        authStore: useTenantAuthStore,
      };
    } else {
      return {
        context: "client" as ApiContext,
        apiBaseUrl: config.baseURL,
        authToken: clientToken,
        authStore: useClientAuthStore,
      };
    }
  }, [location.pathname, adminToken, tenantToken, clientToken]);

  return result;
};
