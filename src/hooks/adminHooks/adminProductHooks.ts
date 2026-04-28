import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type {
  ApiEnvelope,
  AdminResourceRecord,
  QueryHookOptions,
} from "@/shared/types/admin";

interface FetchProductsParams {
  country_code?: string;
  provider?: string;
  productType?: string;
}

const fetchProducts = async ({
  country_code,
  provider,
  productType,
}: FetchProductsParams) => {
  const params: string[] = [];
  if (country_code) {
    params.push(`country_code=${encodeURIComponent(country_code)}`);
  }
  if (provider) {
    params.push(`provider=${encodeURIComponent(provider)}`);
  }
  if (productType) {
    params.push(`productable_type=${encodeURIComponent(productType)}`);
  }
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";
  const res = await silentApi<ApiEnvelope<AdminResourceRecord[]>>(
    "GET",
    `/products${queryString}`
  );
  if (!res.data) {
    throw new Error("Failed to fetch product pricing");
  }
  return res.data;
};

const createProducts = async (productData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>("POST", "/products", productData);
  if (!res.data) {
    throw new Error("Failed to create product pricing");
  }
  return res.data;
};

const updateProduct = async ({
  id,
  productData,
}: {
  id: string | number;
  productData: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PUT",
    `/products/${id}`,
    productData
  );
  if (!res.data) {
    throw new Error("Failed to update product");
  }
  return res.data;
};

const deleteProduct = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>("DELETE", `/products/${id}`);
  if (!res.data) {
    throw new Error("Failed to delete product");
  }
  return res.data;
};

export const useFetchProducts = (
  country_code: string = "",
  provider: string = "",
  options: QueryHookOptions & { productType?: string } = {}
) => {
  const { productType = "", ...queryOptions } = options || {};

  return useQuery({
    queryKey: ["productsadmin", country_code || "none", provider || "none", productType || "all"],
    queryFn: () =>
      fetchProducts({
        country_code,
        provider,
        productType,
      }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

export const useCreateProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productsadmin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating product pricing:", error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productsadmin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating product:", error);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productsadmin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting product:", error);
    },
  });
};
