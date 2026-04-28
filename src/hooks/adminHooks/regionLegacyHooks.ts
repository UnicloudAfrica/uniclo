/**
 * Legacy region hooks from the original adminHooks.ts god file.
 * These use QueryParams-based signatures and the original admin API shape.
 * See also regionHooks.ts for the newer typed versions.
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
// Regions API Functions
// ================================

const fetchRegions = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/regions${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch regions");
  return res;
};

const createRegion = async (regionData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const fetchRegionByCode = async (code: string) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/regions/${code}`);
  if (!res.data) throw new Error(`Failed to fetch region ${code}`);
  return res.data;
};

const updateRegion = async ({ id, regionData }: UpdatePayload<"regionData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update region ${id}`);
  return res.data;
};

const deleteRegion = async (code: string) => {
  const res = await adminApi<ApiResponse>("DELETE", `/regions/${code}`);
  if (!res.data) throw new Error(`Failed to delete region ${code}`);
  return res.data;
};

// ================================
// Region Hooks (legacy QueryParams versions)
// ================================

export const useFetchRegions = (params: QueryParams = {}, options: QueryOptions = {}) => {
  return useQuery({
    queryKey: ["regions", params],
    queryFn: () => fetchRegions(params),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating region:", error);
    },
  });
};

export const useUpdateRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRegion,
    onSuccess: (_data: unknown, variables: unknown) => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["region", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating region:", error);
    },
  });
};

export const useDeleteRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting region:", error);
    },
  });
};

// Export API functions for direct use
export {
  fetchRegions,
  fetchRegionByCode,
  fetchRegionByCode as fetchRegionById,
  createRegion,
  updateRegion,
  deleteRegion,
};
