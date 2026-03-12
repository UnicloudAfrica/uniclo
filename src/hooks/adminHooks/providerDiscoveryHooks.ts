import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import silentAdminApi from "../../index/admin/silent";
import logger from "@/utils/logger";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryOptions = Record<string, unknown>;

// ================================
// Provider Discovery API Functions
// ================================

// Projects
const fetchProviderDiscoveryProjects = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/provider-discovery/projects");
  if (!res.data) throw new Error("Failed to fetch provider discovery projects");
  return res;
};

const importProviderDiscoveryProjects = async (importData: ApiPayload) => {
  const res = await adminApi<ApiResponse>(
    "POST",
    "/provider-discovery/projects/import",
    importData
  );
  if (!res.data) throw new Error("Failed to import provider discovery projects");
  return res.data;
};

const syncProviderDiscoveryProjects = async (syncData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/provider-discovery/projects/sync", syncData);
  if (!res.data) throw new Error("Failed to sync provider discovery projects");
  return res.data;
};

const fetchProviderDiscoveryProjectsDrift = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/provider-discovery/projects/drift");
  if (!res.data) throw new Error("Failed to fetch provider discovery projects drift");
  return res;
};

// Users
const fetchProviderDiscoveryUsers = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/provider-discovery/users");
  if (!res.data) throw new Error("Failed to fetch provider discovery users");
  return res;
};

const linkProviderDiscoveryUsers = async (linkData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/provider-discovery/users/link", linkData);
  if (!res.data) throw new Error("Failed to link provider discovery users");
  return res.data;
};

// Runs
const fetchProviderDiscoveryRuns = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/provider-discovery/runs");
  if (!res.data) throw new Error("Failed to fetch provider discovery runs");
  return res;
};

const fetchProviderDiscoveryRunById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/provider-discovery/runs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch provider discovery run with ID ${id}`);
  return res.data;
};

// Project User Syncs
const createProjectUserSync = async (syncData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/project-user-syncs", syncData);
  if (!res.data) throw new Error("Failed to create project user sync");
  return res.data;
};

// ================================
// Provider Discovery Hooks
// ================================

export const useFetchProviderDiscoveryProjects = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["provider-discovery-projects"],
    queryFn: fetchProviderDiscoveryProjects,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useImportProviderDiscoveryProjects = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importProviderDiscoveryProjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-discovery-projects"] });
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
    },
    onError: (error: unknown) => {
      logger.error("Error syncing provider discovery projects:", error);
    },
  });
};

export const useFetchProviderDiscoveryUsers = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["provider-discovery-users"],
    queryFn: fetchProviderDiscoveryUsers,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProviderDiscoveryRuns = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["provider-discovery-runs"],
    queryFn: fetchProviderDiscoveryRuns,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
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
