import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchBandwidthProducts = async (region) => {
  const res = await silentApi("GET", `/product-bandwidth?region=${region}`);
  if (!res.data) {
    throw new Error("Failed to fetch bandwidth products");
  }
  return res.data;
};

const fetchBandwidthProductById = async (id) => {
  const res = await silentApi("GET", `/product-bandwidth/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch bandwidth product with ID ${id}`);
  }
  return res.data;
};

const createBandwidthProduct = async (bandwidthData) => {
  const res = await api("POST", "/product-bandwidth", bandwidthData);
  if (!res.data) {
    throw new Error("Failed to create bandwidth product");
  }
  return res.data;
};

const updateBandwidthProduct = async ({ id, bandwidthData }) => {
  const res = await api("PATCH", `/product-bandwidth/${id}`, bandwidthData);
  if (!res.data) {
    throw new Error(`Failed to update bandwidth product with ID ${id}`);
  }
  return res.data;
};

const deleteBandwidthProduct = async (id) => {
  const res = await api("DELETE", `/product-bandwidth/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete bandwidth product with ID ${id}`);
  }
  return res.data;
};

export const useFetchBandwidthProducts = (region, options = {}) => {
  return useQuery({
    queryKey: ["bandwidthProducts", region],
    queryFn: () => fetchBandwidthProducts(region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchBandwidthProductById = (id, options = {}) => {
  return useQuery({
    queryKey: ["bandwidthProduct", id],
    queryFn: () => fetchBandwidthProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBandwidthProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["bandwidthProducts"]);
    },
    onError: (error) => {
      console.error("Error creating bandwidth product:", error);
    },
  });
};

export const useUpdateBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBandwidthProduct,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["bandwidthProducts"]);
      queryClient.invalidateQueries(["bandwidthProduct", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating bandwidth product:", error);
    },
  });
};

export const useDeleteBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBandwidthProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(["bandwidthProducts"]);
    },
    onError: (error) => {
      console.error("Error deleting bandwidth product:", error);
    },
  });
};
