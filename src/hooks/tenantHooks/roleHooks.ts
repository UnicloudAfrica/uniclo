import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentTenantApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

type ApiEnvelope<T = unknown> = { data?: T; success?: boolean };

export type RoleId = string | number;

/** A tenant-defined (or system) role returned by `GET /admin/roles`. */
export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  member_count: number;
}

/** Permission catalogue grouped by section, e.g. { "Projects": ["projects.view", ...] }. */
export type PermissionCatalog = Record<string, string[]>;

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

interface UpdateRoleArgs {
  id: RoleId;
  data: UpdateRolePayload;
}

interface AssignMemberRoleArgs {
  id: RoleId;
  role_id: number | null;
}

const fetchRoles = async (): Promise<Role[]> => {
  const res = await silentTenantApi<ApiEnvelope<Role[]>>("GET", "/admin/roles");
  if (!res?.data) {
    throw new Error("Failed to fetch roles");
  }
  return res.data;
};

const fetchPermissionCatalog = async (): Promise<PermissionCatalog> => {
  const res = await silentTenantApi<ApiEnvelope<PermissionCatalog>>(
    "GET",
    "/admin/roles/catalog"
  );
  if (!res?.data) {
    throw new Error("Failed to fetch permission catalog");
  }
  return res.data;
};

const createRole = async (payload: CreateRolePayload): Promise<Role> => {
  const res = await tenantApi<ApiEnvelope<Role>>("POST", "/admin/roles", {
    ...payload,
  });
  if (!res?.data) {
    throw new Error("Failed to create role");
  }
  return res.data;
};

const updateRole = async ({ id, data }: UpdateRoleArgs): Promise<Role> => {
  const res = await tenantApi<ApiEnvelope<Role>>("PUT", `/admin/roles/${id}`, {
    ...data,
  });
  if (!res?.data) {
    throw new Error("Failed to update role");
  }
  return res.data;
};

const deleteRole = async (id: RoleId): Promise<ApiEnvelope> => {
  const res = await tenantApi<ApiEnvelope>("DELETE", `/admin/roles/${id}`);
  if (!res?.success) {
    throw new Error("Failed to delete role");
  }
  return res;
};

const assignMemberRole = async ({ id, role_id }: AssignMemberRoleArgs): Promise<unknown> => {
  const res = await tenantApi<ApiEnvelope>("PUT", `/admin/members/${id}/role`, {
    role_id,
  });
  if (!res?.data) {
    throw new Error("Failed to assign member role");
  }
  return res.data;
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useFetchRoles = (options: QueryOptions<Role[]> = {}) =>
  useQuery({
    queryKey: ["tenant-roles"],
    queryFn: fetchRoles,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchPermissionCatalog = (options: QueryOptions<PermissionCatalog> = {}) =>
  useQuery({
    queryKey: ["tenant-role-catalog"],
    queryFn: fetchPermissionCatalog,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-roles"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-roles"] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-roles"] });
    },
  });
};

export const useAssignMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignMemberRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-roles"] });
    },
  });
};
