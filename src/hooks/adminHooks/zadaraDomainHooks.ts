// src/hooks/adminHooks/zadaraDomainHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryOptions = Record<string, unknown>;
type Id = string | number;
type ApiPayload = Record<string, unknown>;
type DomainHierarchyParams = {
  userId: Id;
  projectId: Id;
};
type SubtenantUpdatePayload = {
  identifier: Id;
  subtenantData: ApiPayload;
};
type ApiClient = {
  <T = unknown>(method: HttpMethod, uri: string, body?: ApiPayload | null): Promise<T>;
};

const requestAdmin = async <T>(
  client: ApiClient,
  method: HttpMethod,
  uri: string,
  body?: ApiPayload
) => client<ApiResponse<T>>(method, uri, body ?? null);

const requireData = <T>(res: ApiResponse<T>, message: string): T => {
  if (!res.data) {
    throw new Error(message);
  }
  return res.data;
};

// ============== DOMAIN MANAGEMENT ==============

// GET: Fetch all Zadara domains
const fetchZadaraDomains = async () => {
  const res = await requestAdmin(silentApi, "GET", "/zadara-domains");
  return requireData(res, "Failed to fetch Zadara domains");
};

// POST: Ensure root domain (UCA_CRM_PORTAL)
const ensureRootDomain = async (domainData: ApiPayload = {}) => {
  const res = await requestAdmin(api, "POST", "/zadara-domains", domainData);
  return requireData(res, "Failed to ensure root domain");
};

// GET: Fetch domain hierarchy details
const fetchDomainHierarchy = async (domainId: Id) => {
  const res = await requestAdmin(silentApi, "GET", `/zadara-domains/${domainId}`);
  return requireData(res, `Failed to fetch domain hierarchy for ${domainId}`);
};

// GET: Fetch tenant hierarchy
const fetchTenantHierarchy = async (tenantId: Id) => {
  const res = await requestAdmin(silentApi, "GET", `/zadara-domains/tenant-hierarchy/${tenantId}`);
  return requireData(res, `Failed to fetch tenant hierarchy for ${tenantId}`);
};

// ============== SUBTENANT MANAGEMENT ==============

// GET: Fetch all subtenants
const fetchSubtenants = async (parentTenantId: Id | null = null) => {
  const endpoint = parentTenantId
    ? `/sub-tenants?parent_tenant_id=${parentTenantId}`
    : "/sub-tenants";
  const res = await requestAdmin(silentApi, "GET", endpoint);
  return requireData(res, "Failed to fetch subtenants");
};

// POST: Create subtenant with admin escalation
const createSubtenant = async (subtenantData: ApiPayload) => {
  const res = await requestAdmin(api, "POST", "/sub-tenants", subtenantData);
  return requireData(res, "Failed to create subtenant");
};

// GET: Fetch subtenant details
const fetchSubtenantById = async (identifier: Id) => {
  const res = await requestAdmin(silentApi, "GET", `/sub-tenants/${identifier}`);
  return requireData(res, `Failed to fetch subtenant ${identifier}`);
};

// PUT: Update subtenant (including verification)
const updateSubtenant = async ({ identifier, subtenantData }: SubtenantUpdatePayload) => {
  const res = await requestAdmin(api, "PUT", `/sub-tenants/${identifier}`, subtenantData);
  return requireData(res, `Failed to update subtenant ${identifier}`);
};

// DELETE: Delete subtenant
const deleteSubtenant = async (identifier: Id) => {
  const res = await requestAdmin(api, "DELETE", `/sub-tenants/${identifier}`);
  return requireData(res, `Failed to delete subtenant ${identifier}`);
};

// ============== POLICY MANAGEMENT ==============

// POST: Sync policies for project
const syncProjectPolicies = async (projectId: Id) => {
  const res = await requestAdmin(api, "POST", "/zadara-domains/sync-policies", {
    project_id: projectId,
  });
  return requireData(res, `Failed to sync policies for project ${projectId}`);
};

// POST: Assign policies to user
const assignUserPolicies = async ({ userId, projectId }: DomainHierarchyParams) => {
  const res = await requestAdmin(api, "POST", "/zadara-domains/assign-user-policies", {
    user_id: userId,
    project_id: projectId,
  });
  return requireData(res, `Failed to assign policies to user ${userId}`);
};

// GET: Fetch user policies
const fetchUserPolicies = async ({ userId, projectId }: DomainHierarchyParams) => {
  const res = await requestAdmin(
    silentApi,
    "GET",
    `/zadara-domains/user-policies?user_id=${userId}&project_id=${projectId}`
  );
  return requireData(res, `Failed to fetch policies for user ${userId} in project ${projectId}`);
};

// ============== REACT HOOKS ==============

// Hook to fetch all Zadara domains
export const useFetchZadaraDomains = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["zadara-domains"],
    queryFn: fetchZadaraDomains,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to ensure root domain
export const useEnsureRootDomain = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ensureRootDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zadara-domains"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: unknown) => {
      logger.error("Error ensuring root domain:", error);
    },
  });
};

// Hook to fetch domain hierarchy
export const useFetchDomainHierarchy = (domainId: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["domain-hierarchy", domainId],
    queryFn: () => fetchDomainHierarchy(domainId),
    enabled: !!domainId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to fetch tenant hierarchy
export const useFetchTenantHierarchy = (tenantId: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["tenant-hierarchy", tenantId],
    queryFn: () => fetchTenantHierarchy(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2, // Shorter cache for hierarchy data
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to fetch subtenants
export const useFetchSubtenants = (
  parentTenantId: Id | null = null,
  options: QueryOptions = {}
) => {
  return useQuery({
    queryKey: ["subtenants", parentTenantId],
    queryFn: () => fetchSubtenants(parentTenantId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to create subtenant
export const useCreateSubtenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubtenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-hierarchy"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating subtenant:", error);
    },
  });
};

// Hook to fetch subtenant by ID
export const useFetchSubtenantById = (identifier: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["subtenants", identifier],
    queryFn: () => fetchSubtenantById(identifier),
    enabled: !!identifier,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};

// Hook to update subtenant
export const useUpdateSubtenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSubtenant,
    onSuccess: (_data, variables: SubtenantUpdatePayload) => {
      void _data;
      queryClient.invalidateQueries({ queryKey: ["subtenants"] });
      queryClient.invalidateQueries({ queryKey: ["subtenants", variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ["tenant-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating subtenant:", error);
    },
  });
};

// Hook to delete subtenant
export const useDeleteSubtenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubtenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-hierarchy"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting subtenant:", error);
    },
  });
};

// Hook to sync project policies
export const useSyncProjectPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncProjectPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-policies"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: unknown) => {
      logger.error("Error syncing project policies:", error);
    },
  });
};

// Hook to assign user policies
export const useAssignUserPolicies = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignUserPolicies,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-policies"] });
    },
    onError: (error: unknown) => {
      logger.error("Error assigning user policies:", error);
    },
  });
};

// Hook to fetch user policies
export const useFetchUserPolicies = (
  { userId, projectId }: DomainHierarchyParams,
  options: QueryOptions = {}
) => {
  return useQuery({
    queryKey: ["user-policies", userId, projectId],
    queryFn: () => fetchUserPolicies({ userId, projectId }),
    enabled: !!(userId && projectId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });
};
