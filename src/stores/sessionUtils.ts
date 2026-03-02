import config from "../config";
import useAdminAuthStore from "./adminAuthStore";
import useTenantAuthStore from "./tenantAuthStore";
import useClientAuthStore from "./clientAuthStore";
import { AuthState } from "../types/auth";
import logger from "../utils/logger";

const normalizeRole = (role: string | null | undefined): string | null =>
  typeof role === "string" ? role.toLowerCase() : null;

/**
 * Clears all persisted auth sessions except the provided role.
 */
export const clearAuthSessionsExcept = (activeRole: string | null | undefined) => {
  const normalized = normalizeRole(activeRole);

  if (normalized !== "admin") {
    useAdminAuthStore.getState().clearSession?.();
  }
  if (normalized !== "tenant") {
    useTenantAuthStore.getState().clearSession?.();
  }
  if (normalized !== "client") {
    useClientAuthStore.getState().clearSession?.();
  }
};

export const clearAllAuthSessions = () => clearAuthSessionsExcept(null);

export const resolveActivePersona = (): {
  key: "admin" | "tenant" | "client" | null;
  snapshot: AuthState | null;
} => {
  const admin = useAdminAuthStore.getState?.();
  const tenant = useTenantAuthStore.getState?.();
  const client = useClientAuthStore.getState?.();

  if (admin?.isAuthenticated) return { key: "admin", snapshot: admin };
  if (tenant?.isAuthenticated) return { key: "tenant", snapshot: tenant };
  if (client?.isAuthenticated) return { key: "client", snapshot: client };
  return { key: null, snapshot: null };
};

const resolveAuthStore = (role: string | null | undefined) => {
  switch (normalizeRole(role)) {
    case "admin":
      return useAdminAuthStore;
    case "tenant":
      return useTenantAuthStore;
    case "client":
      return useClientAuthStore;
    default:
      return null;
  }
};

const resolveAuthHeaders = (role: string | null | undefined): Record<string, string> => {
  const store = resolveAuthStore(role);
  const state = store?.getState?.();
  if (state?.getAuthHeaders) {
    return state.getAuthHeaders();
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
};

const resolveLogoutBaseUrl = (role: string | null | undefined): string => {
  switch (normalizeRole(role)) {
    case "admin":
      return config.adminURL;
    case "tenant":
      return config.tenantURL;
    case "client":
      return config.baseURL;
    default:
      return config.baseURL;
  }
};

const requestLogout = async (role: string | null | undefined) => {
  const headers = resolveAuthHeaders(role);
  const baseUrl = resolveLogoutBaseUrl(role);
  const url = `${baseUrl}/business/auth/logout`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
    });
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    logger.error("Logout failed:", error);
    return null;
  }
};

export const logoutActiveSession = async () => {
  const { key } = resolveActivePersona();
  if (key) {
    await requestLogout(key);
  }
  clearAllAuthSessions();
};
