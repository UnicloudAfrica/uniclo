// src/hooks/regionHooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentApi from "../index/admin/silent";
import api from "../index/admin/api";
import logger from "../utils/logger";

type ApiEnvelope<T = unknown> = { data?: T };

export interface RegionPayload {
  [key: string]: unknown;
}

interface UpdateRegionArgs {
  code: string;
  regionData: RegionPayload;
}

const fetchRegions = async (): Promise<unknown> => {
  const res = await silentApi<ApiEnvelope>("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

const fetchRegionByCode = async (code: string): Promise<unknown> => {
  const res = await silentApi<ApiEnvelope>("GET", `/regions/${code}`);
  if (!res.data) throw new Error(`Failed to fetch region ${code}`);
  return res.data;
};

const createRegion = async (regionData: RegionPayload): Promise<unknown> => {
  const res = await api<ApiEnvelope>("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const updateRegion = async ({ code, regionData }: UpdateRegionArgs): Promise<unknown> => {
  const res = await api<ApiEnvelope>("PATCH", `/regions/${code}`, regionData);
  if (!res.data) throw new Error(`Failed to update region ${code}`);
  return res.data;
};

const deleteRegion = async (code: string): Promise<unknown> => {
  const res = await api<ApiEnvelope>("DELETE", `/regions/${code}`);
  if (!res.data) throw new Error(`Failed to delete region ${code}`);
  return res.data;
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useFetchTenantRegions = (options: QueryOptions<unknown> = {}) => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchTenantRegionById = (code: string, options: QueryOptions<unknown> = {}) => {
  return useQuery({
    queryKey: ["region", code],
    queryFn: () => fetchRegionByCode(code),
    enabled: !!code,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error) => {
      logger.error("Error creating region:", error);
    },
  });
};

export const useUpdateTenantRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRegion,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["region", variables.code] });
    },
    onError: (error) => {
      logger.error("Error updating region:", error);
    },
  });
};

export const useDeleteTenantRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
    onError: (error) => {
      logger.error("Error deleting region:", error);
    },
  });
};
