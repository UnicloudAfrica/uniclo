/**
 * Legacy product pricing hooks from the original adminHooks.ts god file.
 * These use QueryParams-based signatures and the original admin API shape.
 * See also adminProductPricingHooks.ts for the newer versions.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import silentAdminApi from "../../index/admin/silent";
import logger from "@/utils/logger";

type Id = string | number;
type ApiPayload = Record<string, unknown> | FormData | null | undefined;
type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type QueryOptions = Record<string, unknown>;
type UpdatePayload<K extends string, T extends ApiPayload = ApiPayload> = { id: Id } & Record<K, T>;

const buildQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) {
    return "";
  }
  const stringParams = entries.reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value);
    return acc;
  }, {});
  return new URLSearchParams(stringParams).toString();
};

// ================================
// Product Pricing API Functions
// ================================

const fetchAdminProductPricing = async (params: QueryParams = {}) => {
  const queryString = buildQueryString(params);
  const res = await silentAdminApi<ApiResponse>(
    "GET",
    `/product-pricing${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch admin product pricing");
  return res;
};

const createAdminProductPricing = async (pricingData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/product-pricing", pricingData);
  if (!res.data) throw new Error("Failed to create admin product pricing");
  return res.data;
};

const fetchAdminProductPricingById = async (id: Id) => {
  const res = await silentAdminApi<ApiResponse>("GET", `/product-pricing/${id}`);
  if (!res.data) throw new Error(`Failed to fetch admin product pricing with ID ${id}`);
  return res.data;
};

const updateAdminProductPricing = async ({ id, pricingData }: UpdatePayload<"pricingData">) => {
  const res = await adminApi<ApiResponse>("PUT", `/product-pricing/${id}`, pricingData);
  if (!res.data) throw new Error(`Failed to update admin product pricing with ID ${id}`);
  return res.data;
};

const deleteAdminProductPricing = async (id: Id) => {
  const res = await adminApi<ApiResponse>("DELETE", `/product-pricing/${id}`);
  if (!res.data) throw new Error(`Failed to delete admin product pricing with ID ${id}`);
  return res.data;
};

const exportAdminProductPricingTemplate = async () => {
  const res = await silentAdminApi<ApiResponse>("GET", "/product-pricing/export-template");
  if (!res.data) throw new Error("Failed to export admin product pricing template");
  return res;
};

const importAdminProductPricing = async (importData: ApiPayload) => {
  const res = await adminApi<ApiResponse>("POST", "/product-pricing/import", importData);
  if (!res.data) throw new Error("Failed to import admin product pricing");
  return res.data;
};

// ================================
// Product Pricing Hooks
// ================================

export const useFetchAdminProductPricing = (
  params: QueryParams = {},
  options: QueryOptions = {}
) => {
  return useQuery({
    queryKey: ["admin-product-pricing", params],
    queryFn: () => fetchAdminProductPricing(params),
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateAdminProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-pricing"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating admin product pricing:", error);
    },
  });
};

export const useExportAdminProductPricingTemplate = () => {
  return useMutation({
    mutationFn: exportAdminProductPricingTemplate,
    onError: (error: unknown) => {
      logger.error("Error exporting admin product pricing template:", error);
    },
  });
};

export const useImportAdminProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importAdminProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-pricing"] });
    },
    onError: (error: unknown) => {
      logger.error("Error importing admin product pricing:", error);
    },
  });
};

// Export API functions for direct use
export {
  fetchAdminProductPricing,
  fetchAdminProductPricingById,
  createAdminProductPricing,
  updateAdminProductPricing,
  deleteAdminProductPricing,
  importAdminProductPricing,
  exportAdminProductPricingTemplate,
};
