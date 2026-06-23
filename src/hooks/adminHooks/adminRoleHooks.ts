/**
 * Admin RBAC hooks — custom roles + permission catalogue for the admin area.
 *
 * Mirrors the adminApi usage (callable `api` for writes, `silentApi` for reads)
 * and react-query invalidation pattern used across the other adminHooks files
 * (see adminProductFamilyHooks.ts). Admin context base is `/admin/v1`, supplied
 * by the shared api client, so paths here are relative to that.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

type ApiEnvelope<T = unknown> = { data?: T; success?: boolean; message?: string };

export type AdminRoleId = string | number;

/** A custom or system admin role returned by `GET /roles`. */
export interface AdminRole {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  member_count: number;
}

/** Permission catalogue grouped by section, e.g. { "Tenants": ["tenants.view", …] }. */
export type AdminPermissionCatalog = Record<string, string[]>;

export interface CreateAdminRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

export interface UpdateAdminRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

interface UpdateAdminRoleArgs {
  id: AdminRoleId;
  data: UpdateAdminRolePayload;
}

interface AssignAdminUserRoleArgs {
  id: AdminRoleId;
  role_id: number | null;
}

const fetchAdminRoles = async (): Promise<AdminRole[]> => {
  const res = await silentApi<ApiEnvelope<AdminRole[]>>("GET", "/roles");
  if (!res?.data) {
    throw new Error("Failed to fetch roles");
  }
  return res.data;
};

const fetchAdminPermissionCatalog = async (): Promise<AdminPermissionCatalog> => {
  const res = await silentApi<ApiEnvelope<AdminPermissionCatalog>>("GET", "/roles/catalog");
  if (!res?.data) {
    throw new Error("Failed to fetch permission catalog");
  }
  return res.data;
};

const createAdminRole = async (payload: CreateAdminRolePayload): Promise<AdminRole> => {
  const res = await api<ApiEnvelope<AdminRole>>("POST", "/roles", { ...payload });
  if (!res?.data) {
    throw new Error("Failed to create role");
  }
  return res.data;
};

const updateAdminRole = async ({ id, data }: UpdateAdminRoleArgs): Promise<AdminRole> => {
  const res = await api<ApiEnvelope<AdminRole>>("PUT", `/roles/${id}`, { ...data });
  if (!res?.data) {
    throw new Error("Failed to update role");
  }
  return res.data;
};

const deleteAdminRole = async (id: AdminRoleId): Promise<ApiEnvelope> => {
  const res = await api<ApiEnvelope>("DELETE", `/roles/${id}`);
  if (!res?.success) {
    throw new Error("Failed to delete role");
  }
  return res;
};

const assignAdminUserRole = async ({
  id,
  role_id,
}: AssignAdminUserRoleArgs): Promise<unknown> => {
  const res = await api<ApiEnvelope>("PUT", `/users/${id}/role`, { role_id });
  if (!res?.success && !res?.data) {
    throw new Error("Failed to assign role");
  }
  return res?.data ?? res;
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useAdminRoles = (options: QueryOptions<AdminRole[]> = {}) =>
  useQuery({
    queryKey: ["admin-roles"],
    queryFn: fetchAdminRoles,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useAdminPermissionCatalog = (options: QueryOptions<AdminPermissionCatalog> = {}) =>
  useQuery({
    queryKey: ["admin-role-catalog"],
    queryFn: fetchAdminPermissionCatalog,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateAdminRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating admin role:", error);
    },
  });
};

export const useUpdateAdminRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating admin role:", error);
    },
  });
};

export const useDeleteAdminRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting admin role:", error);
    },
  });
};

export const useAssignAdminUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignAdminUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (error: unknown) => {
      logger.error("Error assigning admin user role:", error);
    },
  });
};
