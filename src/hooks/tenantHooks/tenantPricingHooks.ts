import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import tenantMultipartApi from "../../index/tenant/multipartTenantApi";
import tenantFileApi from "../../index/tenant/fileapi";
import logger from "../../utils/logger";

type QueryMeta = Record<string, unknown>;

export interface FetchTenantPricingOverridesParams {
  productableType?: string;
  productableId?: string | number;
  provider?: string;
  region?: string;
  countryCode?: string;
  page?: number;
  perPage?: number;
}

export interface TenantPricingOverride {
  id?: string | number;
  productable_type?: string;
  productable_id?: string | number;
  provider?: string;
  region?: string | null;
  country_code?: string | null;
  price_usd?: number | null;
  [key: string]: unknown;
}

export interface TenantPricingOverridesResponse {
  data: TenantPricingOverride[];
  meta?: QueryMeta;
  message?: string;
  success?: boolean;
}

export interface TenantPricingCreatePayload {
  productable_type: string;
  productable_id: string | number;
  provider: string;
  price_usd: number;
  region?: string;
  country_code?: string;
}

export interface TenantPricingUpdatePayload {
  price_usd: number;
}

export interface TenantPricingUpdateRequest {
  id: string | number;
  payload: TenantPricingUpdatePayload;
}

export interface TenantPricingImportPayload {
  file: File;
  dry_run?: boolean;
}

export interface TenantPricingImportError {
  row?: string | number;
  messages?: string[] | string;
  [key: string]: unknown;
}

export interface TenantPricingImportResult {
  dry_run?: boolean;
  total_rows?: number;
  processed?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: TenantPricingImportError[];
  [key: string]: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const buildQueryString = ({
  productableType,
  productableId,
  provider,
  region,
  countryCode,
  page,
  perPage,
}: FetchTenantPricingOverridesParams = {}) => {
  const params = new URLSearchParams();
  if (productableType) params.append("productable_type", productableType);
  if (productableId !== undefined && productableId !== null) {
    params.append("productable_id", String(productableId));
  }
  if (provider) params.append("provider", provider);
  if (region) params.append("region", region);
  if (countryCode) params.append("country_code", countryCode.toUpperCase());
  if (page) params.append("page", String(page));
  if (perPage) params.append("per_page", String(perPage));
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normalizeCollectionResponse = (res: unknown): TenantPricingOverridesResponse => {
  const record = asRecord(res);
  const dataCandidate = record.data;
  const nestedData = asRecord(dataCandidate).data;

  const data = Array.isArray(dataCandidate)
    ? dataCandidate
    : Array.isArray(nestedData)
      ? nestedData
      : [];

  return {
    data: data as TenantPricingOverride[],
    meta:
      (record.meta as QueryMeta | undefined) ??
      (record.pagination as QueryMeta | undefined) ??
      record,
    message: typeof record.message === "string" ? record.message : undefined,
    success: typeof record.success === "boolean" ? record.success : undefined,
  };
};

const normalizeImportResponse = (res: unknown): TenantPricingImportResult => {
  const record = asRecord(res);
  const dataRecord = asRecord(record.data);
  const payload = Object.keys(dataRecord).length ? dataRecord : record;
  const errors = Array.isArray(payload.errors)
    ? payload.errors.map((item) => asRecord(item) as TenantPricingImportError)
    : [];

  return {
    ...payload,
    errors,
  } as TenantPricingImportResult;
};

const fetchTenantPricingOverrides = async (
  params: FetchTenantPricingOverridesParams = {}
): Promise<TenantPricingOverridesResponse> => {
  const queryString = buildQueryString(params);
  const res = await tenantSilentApi("GET", `/admin/product-pricing${queryString}`);
  const payload = normalizeCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch tenant price settings");
  }
  return payload;
};

const createTenantPricingOverride = async (
  payload: TenantPricingCreatePayload
): Promise<unknown> => {
  const res = await tenantApi("POST", "/admin/product-pricing", payload as any);
  if (!res) {
    throw new Error("Failed to set tenant price setting");
  }
  return res;
};

const updateTenantPricingOverride = async ({
  id,
  payload,
}: TenantPricingUpdateRequest): Promise<unknown> => {
  if (!id) {
    throw new Error("Pricing identifier is required");
  }
  const res = await tenantApi("PATCH", `/admin/product-pricing/${id}`, payload as any);
  if (!res) {
    throw new Error("Failed to update tenant price setting");
  }
  return res;
};

const deleteTenantPricingOverride = async (id: string | number): Promise<unknown> => {
  if (!id) {
    throw new Error("Pricing identifier is required");
  }
  const res = await tenantApi("DELETE", `/admin/product-pricing/${id}`);
  if (!res) {
    throw new Error("Failed to delete tenant price setting");
  }
  return res;
};

const importTenantPricingOverrides = async ({
  file,
  dry_run,
}: TenantPricingImportPayload): Promise<TenantPricingImportResult> => {
  if (!file) {
    throw new Error("File is required");
  }
  const formData = new FormData();
  formData.append("file", file);
  if (dry_run) {
    formData.append("dry_run", "1");
  }
  const res = await tenantMultipartApi("POST", "/admin/product-pricing/import", formData);
  if (!res) {
    throw new Error("Failed to import tenant price settings");
  }
  return normalizeImportResponse(res);
};

const exportTenantPricingTemplate = async (region: string): Promise<unknown> => {
  if (!region) {
    throw new Error("Region is required");
  }
  const params = new URLSearchParams();
  params.append("region", region);
  const res = await tenantFileApi(
    "GET",
    `/admin/product-pricing/export-template?${params.toString()}`
  );
  if (!res) {
    throw new Error("Failed to export tenant pricing template");
  }
  return res;
};

export const useFetchTenantPricingOverrides = (
  params: FetchTenantPricingOverridesParams = {},
  options: Omit<UseQueryOptions<TenantPricingOverridesResponse, Error>, "queryKey" | "queryFn"> = {}
) => {
  const queryKey = [
    "tenant-product-pricing",
    params.productableType ?? "",
    params.productableId ?? "",
    params.provider ?? "",
    params.region ?? "",
    params.countryCode ? params.countryCode.toUpperCase() : "",
    params.page ?? 1,
    params.perPage ?? 50,
  ];

  return useQuery<TenantPricingOverridesResponse, Error>({
    queryKey,
    queryFn: () => fetchTenantPricingOverrides(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpsertTenantPricingOverride = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, TenantPricingCreatePayload>({
    mutationFn: createTenantPricingOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["product-pricing"] });
    },
    onError: (error) => {
      logger.error("Error creating tenant pricing override:", error);
    },
  });
};

export const useUpdateTenantPricingOverride = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, TenantPricingUpdateRequest>({
    mutationFn: updateTenantPricingOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["product-pricing"] });
    },
    onError: (error) => {
      logger.error("Error updating tenant pricing override:", error);
    },
  });
};

export const useDeleteTenantPricingOverride = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string | number>({
    mutationFn: deleteTenantPricingOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["product-pricing"] });
    },
    onError: (error) => {
      logger.error("Error deleting tenant pricing override:", error);
    },
  });
};

export const useImportTenantPricingOverrides = () => {
  const queryClient = useQueryClient();
  return useMutation<TenantPricingImportResult, Error, TenantPricingImportPayload>({
    mutationFn: importTenantPricingOverrides,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["product-pricing"] });
    },
    onError: (error) => {
      logger.error("Error importing tenant price settings:", error);
    },
  });
};

export const useExportTenantPricingTemplate = () => {
  return useMutation<unknown, Error, string>({
    mutationFn: exportTenantPricingTemplate,
    onError: (error) => {
      logger.error("Error exporting tenant pricing template:", error);
    },
  });
};
