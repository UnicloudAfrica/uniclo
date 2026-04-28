/**
 * Hook that auto-refreshes user permissions from the backend.
 *
 * Call this once in a top-level layout component. It will:
 *  1. Refresh permissions on mount (page load / hard refresh).
 *  2. Refresh on route changes (debounced, at most once every 5 minutes).
 *  3. Expose a manual `refreshPermissions()` for on-demand use.
 */
import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import type { AuthRole } from "@/stores/authStore";
import config from "../config";
import logger from "@/utils/logger";

/** Minimum interval between automatic refreshes (5 minutes). */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface PermissionsResponse {
  success?: boolean;
  data?: {
    permissions?: string[];
  };
}

/**
 * Resolve the correct API base URL for the user's current role.
 * Admin, tenant, and client each hit different API prefixes.
 */
function _getBaseUrlForRole(role: AuthRole | null): string {
  if (role === "admin") return config.adminURL;
  if (role === "tenant") return config.tenantURL;
  return config.baseURL;
}

async function fetchPermissions(
  role: AuthRole | null,
  headers: Record<string, string>,
): Promise<string[] | null> {
  // The permissions endpoint only exists on the public API (/api/v1),
  // not on admin or tenant prefixes. Skip for admin users.
  if (role === "admin") return null;

  try {
    // Always use the public API base URL since the route is in api.php
    const baseUrl = config.baseURL;

    const response = await fetch(`${baseUrl}/business/auth/permissions`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const json: PermissionsResponse = await response.json();
    const perms = json.data?.permissions;
    if (json.success && Array.isArray(perms)) {
      return perms;
    }
    return null;
  } catch (error: unknown) {
    logger.error("Failed to refresh permissions", error);
    return null;
  }
}

export function usePermissionRefresh() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  const lastRefreshRef = useRef<number>(0);

  const refreshPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_INTERVAL_MS) {
      return;
    }

    lastRefreshRef.current = now;

    const store = useAuthStore.getState();
    const role = store.session?.role ?? null;
    const headers = store.getAuthHeaders();
    const permissions = await fetchPermissions(role, headers);

    if (permissions) {
      const currentPermissions = useAuthStore.getState().permissions;

      // Only update if permissions actually changed
      if (JSON.stringify(currentPermissions) !== JSON.stringify(permissions)) {
        useAuthStore.getState().setPermissions(permissions);
      }
    }
  }, [isAuthenticated]);

  // Refresh on mount
  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  // Refresh on route change (debounced by REFRESH_INTERVAL_MS)
  useEffect(() => {
    void refreshPermissions();
  }, [location.pathname, refreshPermissions]);

  return { refreshPermissions };
}

export default usePermissionRefresh;
