/**
 * @deprecated Use useAuthStore from "./authStore" directly.
 * This file re-exports the unified auth store for backward compatibility.
 */
import useAuthStore from "./authStore";
export type { AuthRole, Session, UnifiedAuthState, LoginResponse } from "./authStore";
/** @deprecated Use useAuthStore directly */
export const useClientAuthStore = useAuthStore;
export default useAuthStore;
