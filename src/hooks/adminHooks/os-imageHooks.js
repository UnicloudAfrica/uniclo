import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all OS images
const fetchOsImages = async () => {
  const res = await silentApi("GET", "/product-os-image");
  if (!res.data) {
    throw new Error("Failed to fetch OS images");
  }
  return res.data;
};

// GET: Fetch OS image by ID
const fetchOsImageById = async (id) => {
  const res = await silentApi("GET", `/product-os-image/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch OS image with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new OS image
const createOsImage = async (imageData) => {
  const res = await api("POST", "/product-os-image", imageData);
  if (!res.data) {
    throw new Error("Failed to create OS image");
  }
  return res.data;
};

// PATCH: Update an OS image
const updateOsImage = async ({ id, imageData }) => {
  const res = await api("PATCH", `/product-os-image/${id}`, imageData);
  if (!res.data) {
    throw new Error(`Failed to update OS image with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete an OS image
const deleteOsImage = async (id) => {
  const res = await api("DELETE", `/product-os-image/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete OS image with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all OS images
export const useFetchOsImages = (options = {}) => {
  return useQuery({
    queryKey: ["osImages"],
    queryFn: fetchOsImages,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch OS image by ID
export const useFetchOsImageById = (id, options = {}) => {
  return useQuery({
    queryKey: ["osImage", id],
    queryFn: () => fetchOsImageById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create an OS image
export const useCreateOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOsImage,
    onSuccess: () => {
      // Invalidate osImages query to refresh the list
      queryClient.invalidateQueries(["osImages"]);
    },
    onError: (error) => {
      console.error("Error creating OS image:", error);
    },
  });
};

// Hook to update an OS image
export const useUpdateOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOsImage,
    onSuccess: (data, variables) => {
      // Invalidate both osImages list and specific osImage query
      queryClient.invalidateQueries(["osImages"]);
      queryClient.invalidateQueries(["osImage", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating OS image:", error);
    },
  });
};

// Hook to delete an OS image
export const useDeleteOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOsImage,
    onSuccess: () => {
      // Invalidate osImages query to refresh the list
      queryClient.invalidateQueries(["osImages"]);
    },
    onError: (error) => {
      console.error("Error deleting OS image:", error);
    },
  });
};
