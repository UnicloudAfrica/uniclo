// src/hooks/adminHooks/regionHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/admin/silent";
import api from "../index/admin/api";
import logger from "../utils/logger";

const fetchRegions = async () => {
  const res = await silentApi("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

const fetchRegionByCode = async (code: string) => {
  const res = await silentApi("GET", `/regions/${code}`);
  if (!res.data) throw new Error(`Failed to fetch region ${code}`);
  return res.data;
};

const createRegion = async (regionData: any) => {
  const res = await api("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const updateRegion = async ({ code, regionData }: any) => {
  const res = await api("PATCH", `/regions/${code}`, regionData);
  if (!res.data) throw new Error(`Failed to update region ${code}`);
  return res.data;
};

const deleteRegion = async (code: string) => {
  const res = await api("DELETE", `/regions/${code}`);
  if (!res.data) throw new Error(`Failed to delete region ${code}`);
  return res.data;
};

export const useFetchTenantRegions = (options: any = {}) => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchTenantRegionById = (code: string, options = {}) => {
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
    onSuccess: (data, variables) => {
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
