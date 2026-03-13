/**
 * PermissionGate — Conditional rendering based on user permissions.
 *
 * Usage:
 *   <PermissionGate permission="billing.view">
 *     <BillingSection />
 *   </PermissionGate>
 *
 *   <PermissionGate anyOf={['billing.view', 'billing.manage']}>
 *     <BillingOverview />
 *   </PermissionGate>
 *
 *   <PermissionGate allOf={['projects.view', 'projects.manage']}>
 *     <ProjectAdmin />
 *   </PermissionGate>
 */
import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGateProps {
  /** Single permission to check. */
  permission?: string;
  /** User must have at least one of these. */
  anyOf?: string[];
  /** User must have all of these. */
  allOf?: string[];
  /** Content to show when permission is granted. */
  children: ReactNode;
  /** Optional fallback when permission is denied. */
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps): ReactNode {
  const { can, canAny, canAll } = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = canAny(anyOf);
  } else if (allOf && allOf.length > 0) {
    hasAccess = canAll(allOf);
  } else {
    // No permission specified — always render
    hasAccess = true;
  }

  return hasAccess ? children : fallback;
}

export default PermissionGate;
