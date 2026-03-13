/**
 * PermissionRoute — Route guard that redirects if user lacks permission.
 *
 * Usage in router:
 *   <Route element={<PermissionRoute permission="billing.view" />}>
 *     <Route path="billing" element={<BillingPage />} />
 *   </Route>
 */
import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import useAuthStore from "@/stores/authStore";

interface PermissionRouteProps {
  /** Single permission to check. */
  permission?: string;
  /** User must have at least one of these. */
  anyOf?: string[];
  /** Custom redirect path when denied. Defaults to dashboard home. */
  redirectTo?: string;
}

export function PermissionRoute({ permission, anyOf, redirectTo }: PermissionRouteProps) {
  const { can, canAny } = usePermissions();
  const role = useAuthStore((s) => s.session?.role);

  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (anyOf && anyOf.length > 0) {
    hasAccess = canAny(anyOf);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    const defaultRedirect =
      role === "admin"
        ? "/admin-dashboard"
        : role === "tenant"
          ? "/dashboard"
          : "/client-dashboard";

    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return <Outlet />;
}

export default PermissionRoute;
