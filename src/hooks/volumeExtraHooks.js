// src/hooks/adminHooks/volumeExtrasHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const fetchVolumeTypes = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentTenantApi(
    "GET",
    `/admin/volume-types${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch volume types");
  return res.data;
};

const fetchVolumeAttachments = async ({ project_id, region, volume_id }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (volume_id) params.append("volume_id", volume_id);

  const queryString = params.toString();
  const res = await silentTenantApi(
    "GET",
    `/admin/volume-attachments${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch volume attachments");
  return res.data;
};

const createVolumeAttachment = async (attachmentData) => {
  const res = await tenantApi(
    "POST",
    "/admin/volume-attachments",
    attachmentData
  );
  if (!res.data) throw new Error("Failed to create volume attachment");
  return res.data;
};

const deleteVolumeAttachment = async (id) => {
  const res = await tenantApi("DELETE", `/admin/volume-attachments/${id}`);
  if (!res.data)
    throw new Error(`Failed to delete volume attachment with ID ${id}`);
  return res.data;
};

const extendVolume = async ({ id, extendData }) => {
  const res = await tenantApi(
    "POST",
    `/admin/volumes/${id}/extend`,
    extendData
  );
  if (!res.data) throw new Error(`Failed to extend volume with ID ${id}`);
  return res.data;
};

export const useFetchTenantVolumeTypes = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["volumeTypes", { projectId, region }],
    queryFn: () => fetchVolumeTypes({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchTenantVolumeAttachments = (
  projectId,
  region,
  volumeId,
  options = {}
) => {
  return useQuery({
    queryKey: ["volumeAttachments", { projectId, region, volumeId }],
    queryFn: () =>
      fetchVolumeAttachments({
        project_id: projectId,
        region,
        volume_id: volumeId,
      }),
    enabled: !!projectId && !!region && !!volumeId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantVolumeAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVolumeAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volumeAttachments"] });
    },
    onError: (error) => {
      console.error("Error creating volume attachment:", error);
    },
  });
};

export const useDeleteTenantVolumeAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVolumeAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volumeAttachments"] });
    },
    onError: (error) => {
      console.error("Error deleting volume attachment:", error);
    },
  });
};

export const useExtendTenantVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: extendVolume,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      queryClient.invalidateQueries({ queryKey: ["volume", variables.id] });
    },
    onError: (error) => {
      console.error("Error extending volume:", error);
    },
  });
};
