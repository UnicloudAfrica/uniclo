/**
 * Hook for checking user permissions in components.
 *
 * Usage:
 *   const { can, canAny, canAll } = usePermissions();
 *   if (can('billing.view')) { ... }
 */
import useAuthStore from "@/stores/authStore";

export function usePermissions() {
  const permissions = useAuthStore((s) => s.permissions);
  const scope = useAuthStore((s) => s.session?.role);

  const can = (permission: string): boolean => permissions.includes(permission);

  const canAny = (perms: string[]): boolean => perms.some((p) => permissions.includes(p));

  const canAll = (perms: string[]): boolean => perms.every((p) => permissions.includes(p));

  return { can, canAny, canAll, permissions, scope };
}

export default usePermissions;
