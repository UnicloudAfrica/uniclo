import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";
import useTenantAuthStore from "../stores/tenantAuthStore";
import useClientAuthStore from "../stores/clientAuthStore";
import { AuthState } from "../types/auth";

export type ApiContext = "admin" | "tenant" | "client";

type AuthStoreHook =
  | typeof useAdminAuthStore
  | typeof useTenantAuthStore
  | typeof useClientAuthStore;

interface ApiContextResult {
  context: ApiContext;
  apiBaseUrl: string;
  authHeaders: Record<string, string>;
  isAuthenticated: boolean;
  authStore: AuthStoreHook;
}

/**
 * Hook to determine the current API context (admin/tenant/client)
 * and provide the appropriate API base URL and auth headers
 */
export const useApiContext = (): ApiContextResult => {
  const location = useLocation();

  // Use separate selectors to prevent object creation on every render
  const adminIsAuth = useAdminAuthStore((state: AuthState) => state.isAuthenticated);
  const adminGetHeaders = useAdminAuthStore((state: AuthState) => state.getAuthHeaders);

  const tenantIsAuth = useTenantAuthStore((state: AuthState) => state.isAuthenticated);
  const tenantGetHeaders = useTenantAuthStore((state: AuthState) => state.getAuthHeaders);

  const clientIsAuth = useClientAuthStore((state: AuthState) => state.isAuthenticated);
  const clientGetHeaders = useClientAuthStore((state: AuthState) => state.getAuthHeaders);

  const buildHeaders = (getAuthHeaders?: () => Record<string, string>) => {
    if (typeof getAuthHeaders === "function") {
      return getAuthHeaders();
    }
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  };

  const result = useMemo(() => {
    const path = location.pathname;

    // Determine context based on route
    if (path.startsWith("/admin-dashboard") || path.startsWith("/admin")) {
      return {
        context: "admin" as ApiContext,
        apiBaseUrl: config.adminURL,
        authHeaders: buildHeaders(adminGetHeaders),
        isAuthenticated: adminIsAuth,
        authStore: useAdminAuthStore,
      };
    } else if (
      path.startsWith("/tenant-dashboard") ||
      path.startsWith("/tenant") ||
      path.startsWith("/dashboard")
    ) {
      return {
        context: "tenant" as ApiContext,
        apiBaseUrl: config.tenantURL,
        authHeaders: buildHeaders(tenantGetHeaders),
        isAuthenticated: tenantIsAuth,
        authStore: useTenantAuthStore,
      };
    } else {
      return {
        context: "client" as ApiContext,
        apiBaseUrl: config.baseURL,
        authHeaders: buildHeaders(clientGetHeaders),
        isAuthenticated: clientIsAuth,
        authStore: useClientAuthStore,
      };
    }
  }, [
    location.pathname,
    adminIsAuth,
    tenantIsAuth,
    clientIsAuth,
    adminGetHeaders,
    tenantGetHeaders,
    clientGetHeaders,
  ]);

  return result;
};
