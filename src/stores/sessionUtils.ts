/**
 * @deprecated Session utilities replaced by unified auth store.
 * This file provides backward-compatible exports that delegate to useAuthStore.
 */
import useAuthStore from "./authStore";

/** @deprecated Use useAuthStore.getState() instead */
export const resolveActivePersona = () => {
  const state = useAuthStore.getState();
  const role = state.session?.role || null;
  return {
    role,
    key: role ? `unicloud_${role}_auth` : "unicloud_auth",
    snapshot: state,
    store: useAuthStore,
  };
};

/** @deprecated Use useAuthStore.getState().clearSession() instead */
export const clearAuthSessionsExcept = (_keep?: string) => {
  // No-op: unified store has single session, no need to clear "other" sessions
};

/** @deprecated Use useAuthStore.getState().clearSession() instead */
export const clearAllAuthSessions = () => {
  useAuthStore.getState().clearSession();
};

/** @deprecated Use useAuthStore.getState().logout() instead */
export const logoutActiveSession = async () => {
  await useAuthStore.getState().logout();
};

/** @deprecated Use useAuthStore directly */
export const resolveAuthStore = () => useAuthStore;

/** @deprecated Use useAuthStore.getState().getAuthHeaders() */
export const resolveAuthHeaders = () => {
  return useAuthStore.getState().getAuthHeaders();
};
