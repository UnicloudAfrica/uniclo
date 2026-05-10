import React, { type ReactNode } from "react";
import { usePermissions, type GateName } from "../../hooks/usePermissions";
import type { DashboardType } from "../../hooks/useDashboardProfile";

interface RoleGuardProps {
  /**
   * Dashboard context — picks which `/me/permissions` endpoint to hit.
   * Match the surrounding dashboard shell (admin / tenant / client).
   */
  dashboardType: DashboardType;
  /**
   * Backend gate name (matches `App\Services\Authorization\PermissionService`).
   * Examples: "platform_admin", "platform_financial", "super_admin".
   */
  gate: GateName;
  /**
   * Rendered when the gate allows.
   */
  children: ReactNode;
  /**
   * Rendered when the gate denies. Use a friendly upgrade-prompt for
   * "you need super-admin access" cases. Defaults to nothing (hide UI).
   */
  fallback?: ReactNode;
  /**
   * Rendered while the permission snapshot is loading.
   * Defaults to nothing — most call sites don't need a spinner.
   */
  loading?: ReactNode;
}

/**
 * Conditionally renders children based on a backend gate.
 *
 * Single source of truth — the `gate` name maps directly to a gate
 * defined in `App\Providers\AppServiceProvider`. If the backend will 403
 * on the action, this component will hide the trigger.
 *
 * Usage:
 *   <RoleGuard dashboardType="admin" gate="platform_financial">
 *     <Button onClick={updateFxRate}>Update FX rate</Button>
 *   </RoleGuard>
 */
export function RoleGuard({
  dashboardType,
  gate,
  children,
  fallback = null,
  loading = null,
}: RoleGuardProps) {
  const { can, isLoading } = usePermissions(dashboardType);

  if (isLoading) {
    return <>{loading}</>;
  }

  if (!can(gate)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RoleGuard;
