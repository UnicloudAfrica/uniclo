import { useQuery } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import clientSilentApi from "../../index/client/silent";
import silentTenantApi from "../../index/tenant/silentTenant";
import type { DashboardType } from "./useDashboardProfile";

/**
 * Capability snapshot returned by `GET /api/v1/{ctx}/me/permissions`.
 *
 * Source of truth: `App\Services\Authorization\PermissionService::snapshotForUser()`.
 * Frontend mirror — used by `<RoleGuard>` and ad-hoc UI checks so users
 * never see actions the backend will 403 on.
 */
export interface PermissionSnapshot {
  role: "admin" | "tenant" | "client" | null;
  is_super_admin: boolean;
  gates: {
    platform_admin: boolean;
    platform_financial: boolean;
    super_admin: boolean;
    tenant_member: boolean;
    tenant_admin: boolean;
    client_member: boolean;
  };
}

export type GateName = keyof PermissionSnapshot["gates"];

const EMPTY_SNAPSHOT: PermissionSnapshot = {
  role: null,
  is_super_admin: false,
  gates: {
    platform_admin: false,
    platform_financial: false,
    super_admin: false,
    tenant_member: false,
    tenant_admin: false,
    client_member: false,
  },
};

const fetchPermissions = async (dashboardType: DashboardType): Promise<PermissionSnapshot> => {
  type ApiResponse = PermissionSnapshot;
  switch (dashboardType) {
    case "admin": {
      const res = await adminApi<ApiResponse>("GET", "/me/permissions");
      return res || EMPTY_SNAPSHOT;
    }
    case "tenant": {
      const res = await silentTenantApi<ApiResponse>("GET", "/admin/me/permissions");
      return res || EMPTY_SNAPSHOT;
    }
    case "client": {
      const res = await clientSilentApi<ApiResponse>("GET", "/business/me/permissions");
      return res || EMPTY_SNAPSHOT;
    }
    default:
      return EMPTY_SNAPSHOT;
  }
};

/**
 * Capability snapshot for the authenticated user.
 *
 * Returns `{ snapshot, can(gate), isLoading }`. Cached for 5 minutes — long
 * enough that route-level checks don't refetch on every navigation, short
 * enough that role flips reflect quickly.
 *
 * Usage:
 *   const { can } = usePermissions("admin");
 *   if (can("platform_financial")) { ... }
 */
export function usePermissions(dashboardType: DashboardType) {
  const query = useQuery({
    queryKey: ["permissions", dashboardType],
    queryFn: () => fetchPermissions(dashboardType),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const snapshot = query.data ?? EMPTY_SNAPSHOT;

  const can = (gate: GateName): boolean => Boolean(snapshot.gates[gate]);

  return {
    snapshot,
    can,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
