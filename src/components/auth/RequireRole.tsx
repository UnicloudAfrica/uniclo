import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuthStore } from "../../stores/adminAuthStore";
import { useTenantAuthStore } from "../../stores/tenantAuthStore";
import { useClientAuthStore } from "../../stores/clientAuthStore";

interface RequireRoleProps {
  /** The role(s) allowed to access the children */
  role: string | string[];
  /** Where to redirect if role check fails */
  redirectTo?: string;
  /** Content to render if role check passes */
  children: React.ReactNode;
}

/**
 * Route guard component that checks if the authenticated user
 * has the required role before rendering children.
 *
 * Usage:
 *   <RequireRole role="admin">
 *     <AdminDashboard />
 *   </RequireRole>
 *
 *   <RequireRole role={["tenant", "admin"]} redirectTo="/sign-in">
 *     <TenantDashboard />
 *   </RequireRole>
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ role, redirectTo, children }) => {
  const location = useLocation();
  const adminAuth = useAdminAuthStore();
  const tenantAuth = useTenantAuthStore();
  const clientAuth = useClientAuthStore();

  const allowedRoles = Array.isArray(role) ? role : [role];

  // Determine the active store and user role
  let activeRole: string | null = null;
  let isAuthenticated = false;

  if (adminAuth.isAuthenticated) {
    activeRole = adminAuth.role;
    isAuthenticated = true;
  } else if (tenantAuth.isAuthenticated) {
    activeRole = tenantAuth.role;
    isAuthenticated = true;
  } else if (clientAuth.isAuthenticated) {
    activeRole = clientAuth.role;
    isAuthenticated = true;
  }

  // If not authenticated at all, redirect to login
  if (!isAuthenticated) {
    const defaultRedirect = redirectTo || "/sign-in";
    return <Navigate to={defaultRedirect} state={{ from: location }} replace />;
  }

  // Check if user's role is in the allowed roles
  if (activeRole && allowedRoles.includes(activeRole)) {
    return <>{children}</>;
  }

  // Role mismatch - redirect
  const roleRedirects: Record<string, string> = {
    admin: "/admin-dashboard",
    tenant: "/dashboard",
    client: "/client-dashboard",
  };

  const fallback =
    redirectTo || (activeRole ? roleRedirects[activeRole] : "/sign-in") || "/sign-in";

  return <Navigate to={fallback} state={{ from: location }} replace />;
};

export default RequireRole;
