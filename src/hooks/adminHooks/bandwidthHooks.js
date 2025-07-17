import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all bandwidth products
const fetchBandwidthProducts = async () => {
  const res = await silentApi("GET", "/product-bandwidth");
  if (!res.data) {
    throw new Error("Failed to fetch bandwidth products");
  }
  return res.data;
};

// GET: Fetch bandwidth product by ID
const fetchBandwidthProductById = async (id) => {
  const res = await silentApi("GET", `/product-bandwidth/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch bandwidth product with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new bandwidth product
const createBandwidthProduct = async (bandwidthData) => {
  const res = await api("POST", "/product-bandwidth", bandwidthData);
  if (!res.data) {
    throw new Error("Failed to create bandwidth product");
  }
  return res.data;
};

// PATCH: Update a bandwidth product
const updateBandwidthProduct = async ({ id, bandwidthData }) => {
  const res = await api("PATCH", `/product-bandwidth/${id}`, bandwidthData);
  if (!res.data) {
    throw new Error(`Failed to update bandwidth product with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a bandwidth product
const deleteBandwidthProduct = async (id) => {
  const res = await api("DELETE", `/product-bandwidth/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete bandwidth product with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all bandwidth products
export const useFetchBandwidthProducts = (options = {}) => {
  return useQuery({
    queryKey: ["bandwidthProducts"],
    queryFn: fetchBandwidthProducts,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch bandwidth product by ID
export const useFetchBandwidthProductById = (id, options = {}) => {
  return useQuery({
    queryKey: ["bandwidthProduct", id],
    queryFn: () => fetchBandwidthProductById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a bandwidth product
export const useCreateBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBandwidthProduct,
    onSuccess: () => {
      // Invalidate bandwidthProducts query to refresh the list
      queryClient.invalidateQueries(["bandwidthProducts"]);
    },
    onError: (error) => {
      console.error("Error creating bandwidth product:", error);
    },
  });
};

// Hook to update a bandwidth product
export const useUpdateBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBandwidthProduct,
    onSuccess: (data, variables) => {
      // Invalidate both bandwidthProducts list and specific bandwidthProduct query
      queryClient.invalidateQueries(["bandwidthProducts"]);
      queryClient.invalidateQueries(["bandwidthProduct", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating bandwidth product:", error);
    },
  });
};

// Hook to delete a bandwidth product
export const useDeleteBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBandwidthProduct,
    onSuccess: () => {
      // Invalidate bandwidthProducts query to refresh the list
      queryClient.invalidateQueries(["bandwidthProducts"]);
    },
    onError: (error) => {
      console.error("Error deleting bandwidth product:", error);
    },
  });
};
