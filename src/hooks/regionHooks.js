// src/hooks/adminHooks/adminHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const fetchRegions = async () => {
  const res = await silentTenantApi("GET", "/admin/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

const fetchRegionById = async (id) => {
  const res = await silentTenantApi("GET", `/admin/regions/${id}`);
  if (!res.data) throw new Error(`Failed to fetch region with ID ${id}`);
  return res.data;
};

const createRegion = async (regionData) => {
  const res = await tenantApi("POST", "/admin/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const updateRegion = async ({ id, regionData }) => {
  const res = await tenantApi("PATCH", `/admin/regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update region with ID ${id}`);
  return res.data;
};

const deleteRegion = async (id) => {
  const res = await tenantApi("DELETE", `/admin/regions/${id}`);
  if (!res.data) throw new Error(`Failed to delete region with ID ${id}`);
  return res.data;
};

export const useFetchTenantRegions = (options = {}) => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchTenantRegionById = (id, options = {}) => {
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
      queryClient.invalidateQueries(["regions"]);
    },
    onError: (error) => {
      console.error("Error creating region:", error);
    },
  });
};

export const useUpdateTenantRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRegion,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["regions"]);
      queryClient.invalidateQueries(["region", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating region:", error);
    },
  });
};

export const useDeleteTenantRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries(["regions"]);
    },
    onError: (error) => {
      console.error("Error deleting region:", error);
    },
  });
};
