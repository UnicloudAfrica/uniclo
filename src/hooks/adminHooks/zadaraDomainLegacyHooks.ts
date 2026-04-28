/**
 * Legacy Zadara domain hooks from the original adminHooks.ts god file.
 * These use the original admin API shape with QueryParams.
 * See also zadaraDomainHooks.ts for the newer versions.
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
// Zadara Domains API Functions
// ================================

const fetchZadaraDomains = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/zadara-domains${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch Zadara domains");
  return res;
};

const createZadaraDomain = async (domainData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/zadara-domains", domainData);
  if (!res.data) throw new Error("Failed to create Zadara domain");
  return res.data;
};

const fetchZadaraDomainById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/zadara-domains/${id}`);
  if (!res.data) throw new Error(`Failed to fetch Zadara domain with ID ${id}`);
  return res.data;
};

const updateZadaraDomain = async ({ id, domainData }: UpdatePayload<"domainData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/zadara-domains/${id}`, domainData);
  if (!res.data) throw new Error(`Failed to update Zadara domain with ID ${id}`);
  return res.data;
};

const deleteZadaraDomain = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/zadara-domains/${id}`);
  if (!res.data) throw new Error(`Failed to delete Zadara domain with ID ${id}`);
  return res.data;
};

const syncZadaraDomainPolicies = async (syncData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/zadara-domains/sync-policies", syncData);
  if (!res.data) throw new Error("Failed to sync Zadara domain policies");
  return res.data;
};

const assignZadaraDomainUserPolicies = async (assignData: ApiPayload) => {
  const res = await adminApi<ApiResponse>(
    "POST",
    "/zadara-domains/assign-user-policies",
    assignData
  );
  if (!res.data) throw new Error("Failed to assign Zadara domain user policies");
  return res.data;
};

const fetchZadaraDomainUserPolicies = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/zadara-domains/user-policies");
  if (!res.data) throw new Error("Failed to fetch Zadara domain user policies");
  return res;
};

const fetchZadaraDomainTenantHierarchy = async (tenantId: Id) => {
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/zadara-domains/tenant-hierarchy/${tenantId}`
  );
  if (!res.data)
    throw new Error(`Failed to fetch Zadara domain tenant hierarchy for tenant ${tenantId}`);
  return res.data;
};

// ================================
// Zadara Domain Hooks
// ================================

export const useFetchZadaraDomains = (params: QueryParams = {}, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["zadara-domains", params],
    queryFn: () => fetchZadaraDomains(params),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateZadaraDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createZadaraDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating Zadara domain:", error);
    },
  });
};

export const useUpdateZadaraDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateZadaraDomain,
    onSuccess: (_data: unknown, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
      queryClient.invalidateQueries({ queryKey: ["zadara-domain", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating Zadara domain:", error);
    },
  });
};

export const useDeleteZadaraDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteZadaraDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting Zadara domain:", error);
    },
  });
};

export const useSyncZadaraDomainPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncZadaraDomainPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
    },
    onError: (error: unknown) => {
      logger.error("Error syncing Zadara domain policies:", error);
    },
  });
};

export const useAssignZadaraDomainUserPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignZadaraDomainUserPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
      queryClient.invalidateQueries({ queryKey: ["zadara-domain-user-policies"] });
    },
    onError: (error: unknown) => {
      logger.error("Error assigning Zadara domain user policies:", error);
    },
  });
};

export const useFetchZadaraDomainUserPolicies = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["zadara-domain-user-policies"],
    queryFn: fetchZadaraDomainUserPolicies,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchZadaraDomainTenantHierarchy = (tenantId: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["zadara-domain-tenant-hierarchy", tenantId],
    queryFn: () => fetchZadaraDomainTenantHierarchy(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Export API functions for direct use
export {
  fetchZadaraDomains,
  fetchZadaraDomainById,
  createZadaraDomain,
  updateZadaraDomain,
  deleteZadaraDomain,
  syncZadaraDomainPolicies,
  assignZadaraDomainUserPolicies,
  fetchZadaraDomainUserPolicies,
  fetchZadaraDomainTenantHierarchy,
};
