import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import silentAdminApi from "../../index/admin/silent";
import logger from "@/utils/logger";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryOptions = Record<string, unknown>;

// ================================
// Query Param Helpers
// ================================

export interface ProjectFilters {
  provider?: string;
  region?: string;
  only_unlinked?: boolean;
  include_infra?: boolean;
  search?: string;
  domain_id?: string;
  [key: string]: unknown;
}

export interface UserFilters {
  provider?: string;
  region?: string;
  search?: string;
  domain_id?: string;
  [key: string]: unknown;
}

export interface RunFilters {
  provider?: string;
  region?: string;
  action?: string;
  status?: string;
  per_page?: number;
  [key: string]: unknown;
}

const buildQueryString = (params: Record<string, unknown>): string => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  });
  const result = qs.toString();
  return result ? `?${result}` : "";
};

// ================================
// Provider Discovery API Functions
// ================================

// Projects
const fetchProviderDiscoveryProjects = async (filters: ProjectFilters = {}) => {
  const qs = buildQueryString(filters);
  const res = await silentAdminApi<ApiResponse>("GET", `/provider-discovery/projects${qs}`);
  return res;
};

const importProviderDiscoveryProjects = async (importData: ApiPayload) => {
  const res = await adminApi<ApiResponse>(
    "POST",
    "/provider-discovery/projects/import",
    importData
  );
  return res;
};

const syncProviderDiscoveryProjects = async (syncData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/provider-discovery/projects/sync", syncData);
  return res;
};

const fetchProviderDiscoveryProjectsDrift = async (filters: ProjectFilters = {}) => {
  const qs = buildQueryString(filters);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/provider-discovery/projects/drift${qs}`
  );
  return res;
};

// Users
const fetchProviderDiscoveryUsers = async (filters: UserFilters = {}) => {
  const qs = buildQueryString(filters);
  const res = await silentAdminApi<ApiResponse>("GET", `/provider-discovery/users${qs}`);
  return res;
};

const linkProviderDiscoveryUsers = async (linkData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/provider-discovery/users/link", linkData);
  return res;
};

// Runs
const fetchProviderDiscoveryRuns = async (filters: RunFilters = {}) => {
  const qs = buildQueryString(filters);
  const res = await silentAdminApi<ApiResponse>("GET", `/provider-discovery/runs${qs}`);
  return res;
};

const fetchProviderDiscoveryRunById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/provider-discovery/runs/${id}`);
  return res;
};

// Project User Syncs
const createProjectUserSync = async (syncData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/project-user-syncs", syncData);
  return res;
};

// ================================
// Provider Discovery Hooks
// ================================

export const useFetchProviderDiscoveryProjects = (
  filters: ProjectFilters = {},
  options: QueryOptions = {}
) => {
  return useQuery({
    queryKey: ["provider-discovery-projects", filters],
    queryFn: () => fetchProviderDiscoveryProjects(filters),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: Boolean(filters.region),
    ...options,
  });
};

export const useImportProviderDiscoveryProjects = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importProviderDiscoveryProjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-projects"] });
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-runs"] });
    },
    onError: (error: unknown) => {
      logger.error("Error importing provider discovery projects:", error);
    },
  });
};

export const useSyncProviderDiscoveryProjects = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncProviderDiscoveryProjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-projects"] });
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-runs"] });
    },
    onError: (error: unknown) => {
      logger.error("Error syncing provider discovery projects:", error);
    },
  });
};

export const useFetchProviderDiscoveryDrift = (
  filters: ProjectFilters = {},
  options: QueryOptions = {}
) => {
  return useQuery({
    queryKey: ["provider-discovery-drift", filters],
    queryFn: () => fetchProviderDiscoveryProjectsDrift(filters),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: false,
    ...options,
  });
};

export const useFetchProviderDiscoveryUsers = (
  filters: UserFilters = {},
  options: QueryOptions = {}
) => {
  return useQuery({
    queryKey: ["provider-discovery-users", filters],
    queryFn: () => fetchProviderDiscoveryUsers(filters),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: Boolean(filters.region),
    ...options,
  });
};

export const useLinkProviderDiscoveryUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: linkProviderDiscoveryUsers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-users"] });
    },
    onError: (error: unknown) => {
      logger.error("Error linking provider discovery user:", error);
    },
  });
};

export const useFetchProviderDiscoveryRuns = (
  filters: RunFilters = {},
  options: QueryOptions = {}
) => {
  return useQuery({
    queryKey: ["provider-discovery-runs", filters],
    queryFn: () => fetchProviderDiscoveryRuns(filters),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProviderDiscoveryRunById = (id: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["provider-discovery-runs", id],
    queryFn: () => fetchProviderDiscoveryRunById(id),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    enabled: Boolean(id),
    ...options,
  });
};

// Export API functions for direct use
export {
  fetchProviderDiscoveryProjects,
  fetchProviderDiscoveryProjectsDrift,
  importProviderDiscoveryProjects,
  syncProviderDiscoveryProjects,
  fetchProviderDiscoveryUsers,
  linkProviderDiscoveryUsers,
  fetchProviderDiscoveryRuns,
  fetchProviderDiscoveryRunById,
  createProjectUserSync,
};
