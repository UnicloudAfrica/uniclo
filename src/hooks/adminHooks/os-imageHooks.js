import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchOsImages = async (region) => {
  const res = await silentApi("GET", `/product-os-image?region=${region}`);
  if (!res.data) {
    throw new Error("Failed to fetch OS images");
  }
  return res.data;
};

const fetchOsImageById = async (id) => {
  const res = await silentApi("GET", `/product-os-image/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch OS image with ID ${id}`);
  }
  return res.data;
};

const createOsImage = async (imageData) => {
  const res = await api("POST", "/product-os-image", imageData);
  if (!res.data) {
    throw new Error("Failed to create OS image");
  }
  return res.data;
};

const updateOsImage = async ({ id, imageData }) => {
  const res = await api("PATCH", `/product-os-image/${id}`, imageData);
  if (!res.data) {
    throw new Error(`Failed to update OS image with ID ${id}`);
  }
  return res.data;
};

const deleteOsImage = async (id) => {
  const res = await api("DELETE", `/product-os-image/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete OS image with ID ${id}`);
  }
  return res.data;
};

export const useFetchOsImages = (region, options = {}) => {
  return useQuery({
    queryKey: ["osImages", region],
    queryFn: () => fetchOsImages(region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchOsImageById = (id, options = {}) => {
  return useQuery({
    queryKey: ["osImage", id],
    queryFn: () => fetchOsImageById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOsImage,
    onSuccess: () => {
      queryClient.invalidateQueries(["osImages"]);
    },
    onError: (error) => {
      console.error("Error creating OS image:", error);
    },
  });
};

export const useUpdateOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOsImage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["osImages"]);
      queryClient.invalidateQueries(["osImage", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating OS image:", error);
    },
  });
};

export const useDeleteOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOsImage,
    onSuccess: () => {
      queryClient.invalidateQueries(["osImages"]);
    },
    onError: (error) => {
      console.error("Error deleting OS image:", error);
    },
  });
};
