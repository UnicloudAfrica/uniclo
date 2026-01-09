import useAdminAuthStore from "./adminAuthStore";
import useTenantAuthStore from "./tenantAuthStore";
import useClientAuthStore from "./clientAuthStore";

const normalizeRole = (role) => (typeof role === "string" ? role.toLowerCase() : null);

/**
 * Clears all persisted auth sessions except the provided role.
 * @param {("admin"|"tenant"|"client"|null|undefined)} activeRole
 */
export const clearAuthSessionsExcept = (activeRole) => {
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

export const resolveActivePersona = () => {
  const admin = useAdminAuthStore.getState?.();
  const tenant = useTenantAuthStore.getState?.();
  const client = useClientAuthStore.getState?.();

  if (admin?.isAuthenticated) return { key: "admin", snapshot: admin };
  if (tenant?.isAuthenticated) return { key: "tenant", snapshot: tenant };
  if (client?.isAuthenticated) return { key: "client", snapshot: client };
  return { key: null, snapshot: null };
};
