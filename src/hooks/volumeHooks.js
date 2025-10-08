// src/hooks/volumeHooks.js (tenant dashboard)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";

const fetchVolumes = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/volumes${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch volumes");
  return res.data;
};

const fetchVolumeById = async (id) => {
  const res = await silentApi("GET", `/business/volumes/${id}`);
  if (!res.data) throw new Error(`Failed to fetch volume with ID ${id}`);
  return res.data;
};

const createVolume = async (volumeData) => {
  const res = await api("POST", "/business/volumes", volumeData);
  if (!res.data) throw new Error("Failed to create volume");
  return res.data;
};

const updateVolume = async ({ id, volumeData }) => {
  // Shared API supports updating metadata via /business/volumes/{id}/meta
  const res = await api("PATCH", `/business/volumes/${id}/meta`, volumeData);
  if (!res.data) throw new Error(`Failed to update volume with ID ${id}`);
  return res.data;
};

const deleteVolume = async (id) => {
  const res = await api("DELETE", `/business/volumes/${id}`);
  if (!res.data) throw new Error(`Failed to delete volume with ID ${id}`);
  return res.data;
};

export const useFetchTenantVolumes = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["volumes", { projectId, region }],
    queryFn: () => fetchVolumes({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchVolumeById = (id, options = {}) => {
  return useQuery({
    queryKey: ["volume", id],
    queryFn: () => fetchVolumeById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
    onError: (error) => {
      console.error("Error creating volume:", error);
    },
  });
};

export const useUpdateTenantVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVolume,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      queryClient.invalidateQueries({ queryKey: ["volume", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating volume:", error);
    },
  });
};

export const useDeleteTenantVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
    onError: (error) => {
      console.error("Error deleting volume:", error);
    },
  });
};
