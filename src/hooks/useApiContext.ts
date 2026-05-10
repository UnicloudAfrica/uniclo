import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import config from "../config";
import useAuthStore from "@/stores/authStore";
import { AuthState } from "../types/auth";

export type ApiContext = "admin" | "tenant" | "client";

type AuthStoreHook =
  | typeof useAuthStore
  | typeof useAuthStore
  | typeof useAuthStore;

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
  const adminIsAuth = useAuthStore((state: AuthState) => state.isAuthenticated);
  const adminGetHeaders = useAuthStore((state: AuthState) => state.getAuthHeaders);

  const tenantIsAuth = useAuthStore((state: AuthState) => state.isAuthenticated);
  const tenantGetHeaders = useAuthStore((state: AuthState) => state.getAuthHeaders);

  const clientIsAuth = useAuthStore((state: AuthState) => state.isAuthenticated);
  const clientGetHeaders = useAuthStore((state: AuthState) => state.getAuthHeaders);

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
        authStore: useAuthStore,
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
        authStore: useAuthStore,
      };
    } else {
      return {
        context: "client" as ApiContext,
        apiBaseUrl: config.baseURL,
        authHeaders: buildHeaders(clientGetHeaders),
        isAuthenticated: clientIsAuth,
        authStore: useAuthStore,
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
