import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all EBS volumes
const fetchEbsVolumes = async () => {
  const res = await silentApi("GET", "/product-ebs-volume");
  if (!res.data) {
    throw new Error("Failed to fetch EBS volumes");
  }
  return res.data;
};

// GET: Fetch EBS volume by ID
const fetchEbsVolumeById = async (id) => {
  const res = await silentApi("GET", `/product-ebs-volume/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch EBS volume with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new EBS volume
const createEbsVolume = async (volumeData) => {
  const res = await api("POST", "/product-ebs-volume", volumeData);
  if (!res.data) {
    throw new Error("Failed to create EBS volume");
  }
  return res.data;
};

// PATCH: Update an EBS volume
const updateEbsVolume = async ({ id, volumeData }) => {
  const res = await api("PATCH", `/product-ebs-volume/${id}`, volumeData);
  if (!res.data) {
    throw new Error(`Failed to update EBS volume with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete an EBS volume
const deleteEbsVolume = async (id) => {
  const res = await api("DELETE", `/product-ebs-volume/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete EBS volume with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all EBS volumes
export const useFetchEbsVolumes = (options = {}) => {
  return useQuery({
    queryKey: ["ebsVolumes"],
    queryFn: fetchEbsVolumes,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch EBS volume by ID
export const useFetchEbsVolumeById = (id, options = {}) => {
  return useQuery({
    queryKey: ["ebsVolume", id],
    queryFn: () => fetchEbsVolumeById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create an EBS volume
export const useCreateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEbsVolume,
    onSuccess: () => {
      // Invalidate ebsVolumes query to refresh the list
      queryClient.invalidateQueries(["ebsVolumes"]);
    },
    onError: (error) => {
      console.error("Error creating EBS volume:", error);
    },
  });
};

// Hook to update an EBS volume
export const useUpdateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEbsVolume,
    onSuccess: (data, variables) => {
      // Invalidate both ebsVolumes list and specific ebsVolume query
      queryClient.invalidateQueries(["ebsVolumes"]);
      queryClient.invalidateQueries(["ebsVolume", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating EBS volume:", error);
    },
  });
};

// Hook to delete an EBS volume
export const useDeleteEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEbsVolume,
    onSuccess: () => {
      // Invalidate ebsVolumes query to refresh the list
      queryClient.invalidateQueries(["ebsVolumes"]);
    },
    onError: (error) => {
      console.error("Error deleting EBS volume:", error);
    },
  });
};
