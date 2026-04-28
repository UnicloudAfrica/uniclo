import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import silentAdminApi from "../../index/admin/silent";
import logger from "@/utils/logger";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryOptions = Record<string, unknown>;
type UpdatePayload<K extends string, T extends ApiPayload = ApiPayload> = { id: Id } & Record<K, T>;

// ================================
// Cloud Providers API Functions
// ================================

const fetchAdminCloudProviders = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/cloud-providers");
  if (!res.data) throw new Error("Failed to fetch admin cloud providers");
  return res;
};

const createAdminCloudProvider = async (providerData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/cloud-providers", providerData);
  if (!res.data) throw new Error("Failed to create admin cloud provider");
  return res.data;
};

const updateAdminCloudProvider = async ({ id, providerData }: UpdatePayload<"providerData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/cloud-providers/${id}`, providerData);
  if (!res.data) throw new Error(`Failed to update admin cloud provider with ID ${id}`);
  return res.data;
};

const deleteAdminCloudProvider = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/cloud-providers/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin cloud provider with ID ${id}`);
  return res.data;
};

// ================================
// Cloud Regions API Functions
// ================================

const fetchAdminCloudRegions = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/cloud-regions");
  if (!res.data) throw new Error("Failed to fetch admin cloud regions");
  return res;
};

const createAdminCloudRegion = async (regionData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/cloud-regions", regionData);
  if (!res.data) throw new Error("Failed to create admin cloud region");
  return res.data;
};

const updateAdminCloudRegion = async ({ id, regionData }: UpdatePayload<"regionData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/cloud-regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update admin cloud region with ID ${id}`);
  return res.data;
};

const deleteAdminCloudRegion = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/cloud-regions/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin cloud region with ID ${id}`);
  return res.data;
};

// ================================
// Cloud Project Regions API Functions
// ================================

const fetchAdminCloudProjectRegions = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/cloud-project-regions");
  if (!res.data) throw new Error("Failed to fetch admin cloud project regions");
  return res;
};

const fetchAdminCloudProjectRegionById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/cloud-project-regions/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin cloud project region with ID ${id}`);
  return res.data;
};

const createAdminCloudProjectRegion = async (projectRegionData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/cloud-project-regions", projectRegionData);
  if (!res.data) throw new Error("Failed to create admin cloud project region");
  return res.data;
};

const updateAdminCloudProjectRegion = async ({
  id,
  projectRegionData,
}: UpdatePayload<"projectRegionData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/cloud-project-regions/${id}`, projectRegionData);
  if (!res.data) throw new Error(`Failed to update admin cloud project region with ID ${id}`);
  return res.data;
};

const deleteAdminCloudProjectRegion = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/cloud-project-regions/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin cloud project region with ID ${id}`);
  return res.data;
};

// ================================
// Cloud Providers Hooks
// ================================

export const useFetchAdminCloudProviders = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-providers"],
    queryFn: fetchAdminCloudProviders,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminCloudProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCloudProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-providers"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating admin cloud provider:", error);
    },
  });
};

export const useUpdateAdminCloudProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminCloudProvider,
    onSuccess: (_data: unknown, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-provider", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating admin cloud provider:", error);
    },
  });
};

export const useDeleteAdminCloudProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCloudProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-providers"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting admin cloud provider:", error);
    },
  });
};

// ================================
// Cloud Regions Hooks
// ================================

export const useFetchAdminCloudRegions = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-regions"],
    queryFn: fetchAdminCloudRegions,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminCloudRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCloudRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-regions"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating admin cloud region:", error);
    },
  });
};

export const useUpdateAdminCloudRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminCloudRegion,
    onSuccess: (_data: unknown, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-regions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-region", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating admin cloud region:", error);
    },
  });
};

export const useDeleteAdminCloudRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCloudRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-regions"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting admin cloud region:", error);
    },
  });
};

// ================================
// Cloud Project Regions Hooks
// ================================

export const useFetchAdminCloudProjectRegions = (options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-project-regions"],
    queryFn: fetchAdminCloudProjectRegions,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchAdminCloudProjectRegionById = (id: Id, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["admin-cloud-project-region", id],
    queryFn: () => fetchAdminCloudProjectRegionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminCloudProjectRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminCloudProjectRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-regions"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating admin cloud project region:", error);
    },
  });
};

export const useUpdateAdminCloudProjectRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminCloudProjectRegion,
    onSuccess: (_data: unknown, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-regions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-region", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating admin cloud project region:", error);
    },
  });
};

export const useDeleteAdminCloudProjectRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminCloudProjectRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cloud-project-regions"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting admin cloud project region:", error);
    },
  });
};

// Export API functions for direct use
export {
  fetchAdminCloudProviders,
  createAdminCloudProvider,
  updateAdminCloudProvider,
  deleteAdminCloudProvider,
  fetchAdminCloudRegions,
  createAdminCloudRegion,
  updateAdminCloudRegion,
  deleteAdminCloudRegion,
  fetchAdminCloudProjectRegions,
  fetchAdminCloudProjectRegionById,
  createAdminCloudProjectRegion,
  updateAdminCloudProjectRegion,
  deleteAdminCloudProjectRegion,
};
