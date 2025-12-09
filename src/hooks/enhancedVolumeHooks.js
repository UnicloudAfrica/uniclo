import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

/**
 * Enhanced Volume Management Hooks
 *
 * These hooks provide comprehensive volume management functionality including:
 * - Volume CRUD operations
 * - Volume attachments/detachments
 * - Volume resizing
 * - Volume type management
 * - Volume metadata operations
 */

// ================================
// Volume CRUD Operations
// ================================

const fetchVolumes = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi("GET", `/business/volumes${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch volumes");
  return res;
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
  const res = await api("PATCH", `/business/volumes/${id}`, volumeData);
  if (!res.data) throw new Error(`Failed to update volume with ID ${id}`);
  return res.data;
};

const deleteVolume = async (id) => {
  const res = await api("DELETE", `/business/volumes/${id}`);
  if (!res.data) throw new Error(`Failed to delete volume with ID ${id}`);
  return res.data;
};

const updateVolumeMeta = async ({ id, metaData }) => {
  const res = await api("PATCH", `/business/volumes/${id}/meta`, metaData);
  if (!res.data) throw new Error(`Failed to update volume metadata with ID ${id}`);
  return res.data;
};

// ================================
// Volume Types Operations
// ================================

const fetchVolumeTypes = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi(
    "GET",
    `/business/volume-types${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch volume types");
  return res;
};

// ================================
// Volume Attachment Operations
// ================================

const fetchVolumeAttachments = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await silentApi(
    "GET",
    `/business/volume-attachments${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch volume attachments");
  return res;
};

const attachVolume = async (attachmentData) => {
  const res = await api("POST", "/business/volume-attachments", attachmentData);
  if (!res.data) throw new Error("Failed to attach volume");
  return res.data;
};

const detachVolume = async (attachmentId) => {
  const res = await api("DELETE", `/business/volume-attachments/${attachmentId}`);
  if (!res.data) throw new Error(`Failed to detach volume with attachment ID ${attachmentId}`);
  return res.data;
};

// Alternative detach method that may accept volume ID directly
const detachVolumeById = async (volumeId) => {
  const res = await api("DELETE", `/business/volume-attachments`, { volume_id: volumeId });
  if (!res.data) throw new Error(`Failed to detach volume with ID ${volumeId}`);
  return res.data;
};

// ================================
// Volume Resize Operations
// ================================

const resizeVolume = async (resizeData) => {
  const res = await api("POST", "/business/volume-resizes", resizeData);
  if (!res.data) throw new Error("Failed to resize volume");
  return res.data;
};

// ================================
// HOOKS - Volume CRUD
// ================================

export const useFetchVolumes = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["volumes", params],
    queryFn: () => fetchVolumes(params),
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

export const useCreateVolume = () => {
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

export const useUpdateVolume = () => {
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

export const useDeleteVolume = () => {
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

export const useUpdateVolumeMeta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVolumeMeta,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      queryClient.invalidateQueries({ queryKey: ["volume", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating volume metadata:", error);
    },
  });
};

// ================================
// HOOKS - Volume Types
// ================================

export const useFetchVolumeTypes = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["volume-types", params],
    queryFn: () => fetchVolumeTypes(params),
    staleTime: 1000 * 60 * 10, // Cache longer since volume types change less frequently
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// HOOKS - Volume Attachments
// ================================

export const useFetchVolumeAttachments = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["volume-attachments", params],
    queryFn: () => fetchVolumeAttachments(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useAttachVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volume-attachments"] });
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
    onError: (error) => {
      console.error("Error attaching volume:", error);
    },
  });
};

export const useDetachVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volume-attachments"] });
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
    onError: (error) => {
      console.error("Error detaching volume:", error);
    },
  });
};

export const useDetachVolumeById = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachVolumeById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volume-attachments"] });
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
    },
    onError: (error) => {
      console.error("Error detaching volume by ID:", error);
    },
  });
};

// ================================
// HOOKS - Volume Resize
// ================================

export const useResizeVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resizeVolume,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["volumes"] });
      if (data?.volume_id) {
        queryClient.invalidateQueries({ queryKey: ["volume", data.volume_id] });
      }
    },
    onError: (error) => {
      console.error("Error resizing volume:", error);
    },
  });
};

// ================================
// Combined Hooks for Comprehensive Volume Management
// ================================

// Hook that fetches a volume along with its attachments
export const useFetchVolumeWithAttachments = (volumeId, options = {}) => {
  const volumeQuery = useFetchVolumeById(volumeId, options);
  const attachmentsQuery = useFetchVolumeAttachments(
    { volume_id: volumeId },
    { enabled: !!volumeId }
  );

  return {
    volume: volumeQuery.data,
    attachments: attachmentsQuery.data?.data || [],
    isLoading: volumeQuery.isLoading || attachmentsQuery.isLoading,
    error: volumeQuery.error || attachmentsQuery.error,
    refetch: () => {
      volumeQuery.refetch();
      attachmentsQuery.refetch();
    },
  };
};

// Hook for volume operations that affect both the volume and its attachments
export const useVolumeOperations = () => {
  const queryClient = useQueryClient();

  const invalidateVolumeData = (volumeId) => {
    queryClient.invalidateQueries({ queryKey: ["volumes"] });
    queryClient.invalidateQueries({ queryKey: ["volume-attachments"] });
    if (volumeId) {
      queryClient.invalidateQueries({ queryKey: ["volume", volumeId] });
    }
  };

  return {
    createVolume: useCreateVolume(),
    updateVolume: useUpdateVolume(),
    deleteVolume: useDeleteVolume(),
    attachVolume: useAttachVolume(),
    detachVolume: useDetachVolume(),
    resizeVolume: useResizeVolume(),
    invalidateVolumeData,
  };
};

// Export individual functions for direct use if needed
export {
  fetchVolumes,
  fetchVolumeById,
  createVolume,
  updateVolume,
  deleteVolume,
  fetchVolumeTypes,
  fetchVolumeAttachments,
  attachVolume,
  detachVolume,
  detachVolumeById,
  resizeVolume,
  updateVolumeMeta,
};
