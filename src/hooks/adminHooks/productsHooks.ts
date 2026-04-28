import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type {
  ApiEnvelope,
  AdminResourceRecord,
  QueryHookOptions,
} from "@/shared/types/admin";

// GET: Fetch all products
const fetchProducts = async () => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord[]>>(
    "GET",
    "/product-provisioning"
  );
  if (!res.data) {
    throw new Error("Failed to fetch products");
  }

  return res.data;
};

// GET: Fetch product by ID
const fetchProductById = async (id: string | number) => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/product-provisioning/${id}`
  );
  if (!res.data) {
    throw new Error(`Failed to fetch product with ID ${id}`);
  }

  return res.data;
};

// POST: Create a new product
const createProduct = async (productData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "POST",
    "/product-provisioning",
    productData
  );
  if (!res.data) {
    throw new Error("Failed to create product");
  }
  return res.data;
};

// PATCH: Update a product
const updateProduct = async ({
  id,
  productData,
}: {
  id: string | number;
  productData: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PATCH",
    `/product-provisioning/${id}`,
    productData
  );
  if (!res.data) {
    throw new Error(`Failed to update product with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a product
const deleteProduct = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "DELETE",
    `/product-provisioning/${id}`
  );
  if (!res.data) {
    throw new Error(`Failed to delete product with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all products
export const useFetchProducts = (options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch product by ID
export const useFetchProductById = (
  id: string | number | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id as string | number),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating product:", error);
    },
  });
};

// Hook to update a product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (_data, variables) => {
      // Invalidate both products list and specific product query
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating product:", error);
    },
  });
};

// Hook to delete a product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate products query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting product:", error);
    },
  });
};
