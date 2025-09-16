import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchEbsVolumes = async (region) => {
  const res = await silentApi("GET", `/product-volume-type?region=${region}`);
  if (!res.data) {
    throw new Error("Failed to fetch EBS volumes");
  }
  return res.data;
};

const fetchEbsVolumeById = async (id) => {
  const res = await silentApi("GET", `/product-volume-type/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch EBS volume with ID ${id}`);
  }
  return res.data;
};

const createEbsVolume = async (volumeData) => {
  const res = await api("POST", "/product-volume-type", volumeData);
  if (!res.data) {
    throw new Error("Failed to create EBS volume");
  }
  return res.data;
};

const updateEbsVolume = async ({ id, volumeData }) => {
  const res = await api("PATCH", `/product-volume-type/${id}`, volumeData);
  if (!res.data) {
    throw new Error(`Failed to update EBS volume with ID ${id}`);
  }
  return res.data;
};

const deleteEbsVolume = async (id) => {
  const res = await api("DELETE", `/product-volume-type/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete EBS volume with ID ${id}`);
  }
  return res.data;
};

export const useFetchEbsVolumes = (region, options = {}) => {
  return useQuery({
    queryKey: ["ebsVolumes", region],
    queryFn: () => fetchEbsVolumes(region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchEbsVolumeById = (id, options = {}) => {
  return useQuery({
    queryKey: ["ebsVolume", id],
    queryFn: () => fetchEbsVolumeById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEbsVolume,
    onSuccess: () => {
      queryClient.invalidateQueries(["ebsVolumes"]);
    },
    onError: (error) => {
      console.error("Error creating EBS volume:", error);
    },
  });
};

export const useUpdateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEbsVolume,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["ebsVolumes"]);
      queryClient.invalidateQueries(["ebsVolume", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating EBS volume:", error);
    },
  });
};

export const useDeleteEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEbsVolume,
    onSuccess: () => {
      queryClient.invalidateQueries(["ebsVolumes"]);
    },
    onError: (error) => {
      console.error("Error deleting EBS volume:", error);
    },
  });
};
