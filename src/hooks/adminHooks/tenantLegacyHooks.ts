/**
 * Legacy tenant/sub-tenant hooks from the original adminHooks.ts god file.
 * These use QueryParams-based signatures and the original admin API shape.
 * See also tenantHooks.ts for the newer typed versions.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import silentAdminApi from "../../index/admin/silent";
import logger from "@/utils/logger";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type QueryOptions = Record<string, unknown>;
type UpdatePayload<K extends string, T extends ApiPayload = ApiPayload> = { id: Id } & Record<K, T>;

const buildQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) {
    return "";
  }
  const stringParams = entries.reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
  return new URLSearchParams(stringParams).toString();
};

// ================================
// Tenants API Functions
// ================================

const fetchTenants = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/tenants${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch tenants");
  return res;
};

const createTenant = async (tenantData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/tenants", tenantData);
  if (!res.data) throw new Error("Failed to create tenant");
  return res.data;
};

const fetchTenantById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/tenants/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant with ID ${id}`);
  return res.data;
};

const updateTenant = async ({ id, tenantData }: UpdatePayload<"tenantData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/tenants/${id}`, tenantData);
  if (!res.data) throw new Error(`Failed to update tenant with ID ${id}`);
  return res.data;
};

const deleteTenant = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/tenants/${id}`);
  if (!res.data) throw new Error(`Failed to delete tenant with ID ${id}`);
  return res.data;
};

// ================================
// Sub-Tenants API Functions
// ================================

const fetchSubTenants = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/sub-tenants${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch sub-tenants");
  return res;
};

const createSubTenant = async (subTenantData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/sub-tenants", subTenantData);
  if (!res.data) throw new Error("Failed to create sub-tenant");
  return res.data;
};

const fetchSubTenantById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/sub-tenants/${id}`);
  if (!res.data) throw new Error(`Failed to fetch sub-tenant with ID ${id}`);
  return res.data;
};

const updateSubTenant = async ({ id, subTenantData }: UpdatePayload<"subTenantData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/sub-tenants/${id}`, subTenantData);
  if (!res.data) throw new Error(`Failed to update sub-tenant with ID ${id}`);
  return res.data;
};

const deleteSubTenant = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/sub-tenants/${id}`);
  if (!res.data) throw new Error(`Failed to delete sub-tenant with ID ${id}`);
  return res.data;
};

// ================================
// Tenant Clients API Functions
// ================================

const fetchTenantClientById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/tenant-clients/${id}`);
  if (!res.data) throw new Error(`Failed to fetch tenant client with ID ${id}`);
  return res.data;
};

// ================================
// Tenant Hooks (legacy QueryParams versions)
// ================================

export const useFetchTenants = (params: QueryParams = {}, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => fetchTenants(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating tenant:", error);
    },
  });
};

export const useFetchTenantById = (id: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: () => fetchTenantById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenant,
    onSuccess: (_data: unknown, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating tenant:", error);
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting tenant:", error);
    },
  });
};

// ================================
// Sub-Tenant Hooks
// ================================

export const useFetchSubTenants = (params: QueryParams = {}, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["sub-tenants", params],
    queryFn: () => fetchSubTenants(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateSubTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-tenants"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating sub-tenant:", error);
    },
  });
};

// Export API functions for direct use
export {
  fetchTenants,
  createTenant,
  fetchTenantById,
  updateTenant,
  deleteTenant,
  fetchSubTenants,
  createSubTenant,
  fetchSubTenantById,
  updateSubTenant,
  deleteSubTenant,
  fetchTenantClientById,
};
