import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import logger from "@/utils/logger";
import type {
  PermissionRegistry,
  UserPermissionsData,
  UserPermissionOverride,
} from "@/types/rbac";

// ── Registry (tenant-scoped) ──

const fetchTenantPermissionRegistry = async (): Promise<PermissionRegistry> => {
  const res = await silentTenantApi<{ data?: PermissionRegistry }>(
    "GET",
    "/admin/permissions/registry"
  );
  if (!res?.data) {
    throw new Error("Failed to fetch tenant permission registry");
  }
  return res.data;
};

export const useFetchTenantPermissionRegistry = () => {
  return useQuery<PermissionRegistry>({
    queryKey: ["tenantPermissionRegistry"],
    queryFn: () => fetchTenantPermissionRegistry(),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
};

// ── Member Permissions ──

const fetchTenantMemberPermissions = async (
  memberId: number | string
): Promise<UserPermissionsData> => {
  const res = await silentTenantApi<{ data?: UserPermissionsData }>(
    "GET",
    `/admin/members/${memberId}/permissions`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch tenant member permissions");
  }
  return res.data;
};

export const useFetchTenantMemberPermissions = (
  memberId: number | string | undefined
) => {
  return useQuery<UserPermissionsData>({
    queryKey: ["tenantMemberPermissions", memberId],
    queryFn: () => fetchTenantMemberPermissions(memberId as number | string),
    enabled: !!memberId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

// ── Update Member Permissions ──

interface UpdateTenantMemberPermissionsPayload {
  memberId: number | string;
  permissions: UserPermissionOverride[];
}

const updateTenantMemberPermissions = async ({
  memberId,
  permissions,
}: UpdateTenantMemberPermissionsPayload): Promise<Record<string, unknown>> => {
  const res = await tenantApi<{ data?: Record<string, unknown> }>(
    "PUT",
    `/admin/members/${memberId}/permissions`,
    { permissions }
  );
  if (!res?.data) {
    throw new Error("Failed to update tenant member permissions");
  }
  return res.data;
};

export const useUpdateTenantMemberPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantMemberPermissions,
    onSuccess: (_data: unknown, variables: UpdateTenantMemberPermissionsPayload) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantMemberPermissions", variables.memberId],
      });
    },
    onError: (error: Error) => {
      logger.error("Error updating tenant member permissions:", error);
    },
  });
};
