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

const fetchRegionById = async (id: any) => {
  const res = await silentApi("GET", `/regions/${id}`);
  if (!res.data) throw new Error(`Failed to fetch region with ID ${id}`);
  return res.data;
};

const createRegion = async (regionData: any) => {
  const res = await api("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const updateRegion = async ({ id, regionData }: any) => {
  const res = await api("PATCH", `/regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update region with ID ${id}`);
  return res.data;
};

const deleteRegion = async (id: any) => {
  const res = await api("DELETE", `/regions/${id}`);
  if (!res.data) throw new Error(`Failed to delete region with ID ${id}`);
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

export const useFetchTenantRegionById = (id: any, options = {}) => {
  return useQuery({
    queryKey: ["region", id],
    queryFn: () => fetchRegionById(id),
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: ["region", variables.id] });
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
