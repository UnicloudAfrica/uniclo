import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchRegions = async () => {
  const res = await silentApi("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

const fetchRegionById = async (id) => {
  const res = await silentApi("GET", `/regions/${id}`);
  if (!res.data) throw new Error(`Failed to fetch region with ID ${id}`);
  return res.data;
};

const createRegion = async (regionData) => {
  const res = await api("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const updateRegion = async ({ id, regionData }) => {
  const res = await api("PATCH", `/regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update region with ID ${id}`);
  return res.data;
};

const deleteRegion = async (id) => {
  const res = await api("DELETE", `/regions/${id}`);
  return res?.data ?? null;
};

export const useFetchRegions = (options = {}) => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchRegionById = (id, options = {}) => {
  return useQuery({
    queryKey: ["region", id],
    queryFn: () => fetchRegionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateRegion = () => {
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

export const useUpdateRegion = () => {
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

export const useDeleteRegion = () => {
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
