import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type { QueryHookOptions } from "@/shared/types/hooks";
import type {
  PermissionRegistry,
  UserPermissionsData,
  UserPermissionOverride,
} from "@/types/rbac";

// ── Registry ──

const fetchPermissionRegistry = async (scope: string): Promise<PermissionRegistry> => {
  const res = await silentApi<{ data?: PermissionRegistry }>(
    "GET",
    `/permissions/registry?scope=${scope}`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch permission registry");
  }
  return res.data;
};

export const useFetchPermissionRegistry = (scope: string, options: QueryHookOptions = {}) => {
  return useQuery<PermissionRegistry>({
    queryKey: ["permissionRegistry", scope],
    queryFn: () => fetchPermissionRegistry(scope),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ── User Permissions ──

const fetchUserPermissions = async (userId: number | string): Promise<UserPermissionsData> => {
  const res = await silentApi<{ data?: UserPermissionsData }>(
    "GET",
    `/users/${userId}/permissions`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch user permissions");
  }
  return res.data;
};

export const useFetchUserPermissions = (
  userId: number | string | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery<UserPermissionsData>({
    queryKey: ["userPermissions", userId],
    queryFn: () => fetchUserPermissions(userId as number | string),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ── Update User Permissions ──

interface UpdatePermissionsPayload {
  userId: number | string;
  permissions: UserPermissionOverride[];
  tenantId?: string;
}

const updateUserPermissions = async ({
  userId,
  permissions,
  tenantId,
}: UpdatePermissionsPayload): Promise<Record<string, unknown>> => {
  const res = await api<{ data?: Record<string, unknown> }>(
    "PUT",
    `/users/${userId}/permissions`,
    {
      permissions,
      tenant_id: tenantId,
    }
  );
  if (!res?.data) {
    throw new Error("Failed to update user permissions");
  }
  return res.data;
};

export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserPermissions,
    onSuccess: (_data: unknown, variables: UpdatePermissionsPayload) => {
      queryClient.invalidateQueries({ queryKey: ["userPermissions", variables.userId] });
    },
    onError: (error: Error) => {
      logger.error("Error updating user permissions:", error);
    },
  });
};
