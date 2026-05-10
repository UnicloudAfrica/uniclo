/**
 * Admin Region API - Shared Helpers
 *
 * Common utilities used across all admin region API modules.
 */

import useAuthStore from "@/stores/authStore";

/**
 * Build authorization headers from the admin auth store.
 */
export function getAuthHeaders(): Record<string, string> {
  const adminState = useAuthStore.getState();
  if (adminState?.getAuthHeaders) {
    return adminState.getAuthHeaders();
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}
