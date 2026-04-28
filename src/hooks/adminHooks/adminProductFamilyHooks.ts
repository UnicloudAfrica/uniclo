import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type { ApiEnvelope, QueryHookOptions } from "@/shared/types/admin";

const fetchProductFamilies = async () => {
  const res = await silentApi<ApiEnvelope<unknown[]>>("GET", "/product-families");
  if (!res) {
    throw new Error("Failed to fetch product families");
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchProductFamily = async (familyCode: string) => {
  if (!familyCode) {
    throw new Error("Family code is required");
  }
  const res = await silentApi<ApiEnvelope<unknown[]>>(
    "GET",
    `/product-families/${encodeURIComponent(familyCode)}`
  );
  if (!res) {
    throw new Error(`Failed to fetch product family: ${familyCode}`);
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchProductEquivalents = async (
  productId: string | number,
  filters?: { provider?: string; region?: string }
) => {
  if (!productId) {
    throw new Error("Product ID is required");
  }
  const params = new URLSearchParams();
  if (filters?.provider) params.append("provider", filters.provider);
  if (filters?.region) params.append("region", filters.region);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await silentApi<ApiEnvelope<unknown[]>>(
    "GET",
    `/products/${productId}/equivalents${queryString}`
  );
  if (!res) {
    throw new Error(`Failed to fetch equivalents for product ${productId}`);
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const updateProductFamilyCode = async ({
  productId,
  family_code,
}: {
  productId: string | number;
  family_code: string;
}) => {
  if (!productId) {
    throw new Error("Product ID is required");
  }
  const res = await api("PATCH", `/products/${productId}/family-code`, { family_code });
  if (!res) {
    throw new Error(`Failed to update family code for product ${productId}`);
  }
  return res;
};

const bulkUpdateFamilyCode = async ({
  product_ids,
  family_code,
}: {
  product_ids: (string | number)[];
  family_code: string;
}) => {
  const res = await api("POST", "/products/bulk-family-code", { product_ids, family_code });
  if (!res) {
    throw new Error("Failed to bulk update family codes");
  }
  return res;
};

export const useFetchProductFamilies = (options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: ["product-families-admin"],
    queryFn: fetchProductFamilies,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductFamily = (
  familyCode: string,
  options: QueryHookOptions = {}
) => {
  return useQuery({
    queryKey: ["product-family-admin", familyCode],
    queryFn: () => fetchProductFamily(familyCode),
    enabled: Boolean(familyCode),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductEquivalents = (
  productId: string | number,
  filters?: { provider?: string; region?: string },
  options: QueryHookOptions = {}
) => {
  return useQuery({
    queryKey: ["product-equivalents-admin", productId, filters?.provider, filters?.region],
    queryFn: () => fetchProductEquivalents(productId, filters),
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateProductFamilyCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductFamilyCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-families-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product-family-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product-equivalents-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating product family code:", error);
    },
  });
};

export const useBulkUpdateFamilyCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateFamilyCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-families-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product-family-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product-equivalents-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error bulk updating family codes:", error);
    },
  });
};
