import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import fileApi from "../../index/admin/fileapi";
import multipartApi from "../../index/admin/multipartApi";
import logger from "@/utils/logger";

// ═══════════════════════════════════════════════════════════════════
// Shared types
// ═══════════════════════════════════════════════════════════════════

export interface ProductPricingQuery {
  region?: string;
  provider?: string;
  page?: number | string;
  perPage?: number | string;
  search?: string;
  productType?: string;
  countryCode?: string;
  currencyCode?: string;
  availabilityZone?: string;
  displayCurrency?: string;
}

export interface ProductPricing {
  id: number;
  productable_type?: string;
  productable_id?: number;
  region?: string;
  provider?: string;
  price_usd?: number;
  currency_code?: string;
  availability_zone?: string;
  display_currency?: string;
  [key: string]: unknown;
}

export interface PricingCollectionMeta {
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  [key: string]: unknown;
}

/**
 * Envelope shape emitted by admin endpoints. Fields are optional because
 * different endpoints in this family include different subsets — e.g.
 * list endpoints include `meta`/`pagination`, mutation endpoints just
 * return `data` + `message`.
 */
interface CollectionResponse<T> {
  data?: T[] | unknown;
  meta?: PricingCollectionMeta | null;
  pagination?: PricingCollectionMeta | null;
  message?: string;
  success?: boolean;
}

interface NormalisedPricingCollection {
  data: ProductPricing[];
  meta: PricingCollectionMeta | null;
  message?: string;
  success?: boolean;
}

export interface ProductPricingUpdatePayload {
  id: number | string;
  pricingData: Partial<ProductPricing>;
}

export interface ProductPricingUploadPayload {
  file: File;
  dry_run?: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const buildQueryString = ({
  region,
  provider,
  page,
  perPage,
  search,
  productType,
  countryCode,
  currencyCode,
  availabilityZone,
  displayCurrency,
}: ProductPricingQuery): string => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (provider) params.append("provider", provider);
  if (page !== undefined && page !== null && page !== "") params.append("page", String(page));
  if (perPage !== undefined && perPage !== null && perPage !== "")
    params.append("per_page", String(perPage));
  if (search) params.append("search", search);
  if (productType) params.append("productable_type", productType);
  if (countryCode) params.append("country_code", countryCode.toUpperCase());
  if (currencyCode) params.append("currency_code", currencyCode.toUpperCase());
  if (availabilityZone) params.append("availability_zone", availabilityZone);
  if (displayCurrency) params.append("display_currency", displayCurrency.toUpperCase());
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (
  res: CollectionResponse<ProductPricing> | null | undefined,
): NormalisedPricingCollection => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  return {
    data: Array.isArray(res.data) ? (res.data as ProductPricing[]) : [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchProductPricing = async ({
  region,
  page,
  perPage,
  search,
  productType,
  countryCode,
  currencyCode,
  availabilityZone,
  displayCurrency,
}: ProductPricingQuery): Promise<NormalisedPricingCollection> => {
  const queryString = buildQueryString({
    region,
    page,
    perPage,
    search,
    productType,
    countryCode,
    currencyCode,
    availabilityZone,
    displayCurrency,
  });
  const res = await silentApi<CollectionResponse<ProductPricing>>(
    "GET",
    `/product-pricing${queryString}`,
  );
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch product pricing");
  }
  return payload;
};

const createProductPricing = async (
  pricingData: Partial<ProductPricing>,
): Promise<CollectionResponse<ProductPricing>> => {
  const res = await api<CollectionResponse<ProductPricing>>(
    "POST",
    "/product-pricing",
    pricingData as unknown as Record<string, unknown>,
  );
  if (!res) {
    throw new Error("Failed to create product pricing");
  }
  return res;
};

const updateProductPricing = async ({
  id,
  pricingData,
}: ProductPricingUpdatePayload): Promise<CollectionResponse<ProductPricing>> => {
  if (!id) {
    throw new Error("Pricing identifier is required");
  }
  const res = await api<CollectionResponse<ProductPricing>>(
    "PATCH",
    `/product-pricing/${id}`,
    pricingData as unknown as Record<string, unknown>,
  );
  if (!res) {
    throw new Error(`Failed to update product pricing with ID ${id}`);
  }
  return res;
};

const deleteProductPricing = async (
  id: number | string,
): Promise<CollectionResponse<ProductPricing>> => {
  if (!id) {
    throw new Error("Pricing identifier is required");
  }
  const res = await api<CollectionResponse<ProductPricing>>(
    "DELETE",
    `/product-pricing/${id}`,
  );
  if (!res) {
    throw new Error(`Failed to delete product pricing with ID ${id}`);
  }
  return res;
};

const uploadProductPricingFile = async ({
  file,
  dry_run,
}: ProductPricingUploadPayload): Promise<unknown> => {
  const formData = new FormData();
  formData.append("file", file);
  if (dry_run) {
    formData.append("dry_run", ""); // Append 'dry_run' key if it's a dry run
  }

  const res = await multipartApi("POST", "/product-pricing/import", formData);
  return res;
};

const exportProductPricingTemplate = async (region: string | null | undefined): Promise<unknown> => {
  const params = new URLSearchParams();
  if (region) {
    params.append("region", region);
  }
  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await fileApi("GET", `/product-pricing/export-template${queryString}`);
  if (!res) throw new Error("Failed to download template.");
  return res;
};

export const useFetchProductPricing = (
  {
    region = "",
    provider = "",
    page = 1,
    perPage = 10,
    search = "",
    productType = "",
    countryCode = "",
    currencyCode = "",
    availabilityZone = "",
    displayCurrency = "",
  }: ProductPricingQuery = {},
  options: Record<string, unknown> = {},
) => {
  return useQuery({
    queryKey: [
      "product-pricing-admin",
      region,
      provider,
      page,
      perPage,
      search,
      productType,
      countryCode,
      currencyCode,
      availabilityZone,
      displayCurrency,
    ],
    queryFn: () =>
      fetchProductPricing({
        region,
        provider,
        page,
        perPage,
        search,
        productType,
        countryCode,
        currencyCode,
        availabilityZone,
        displayCurrency,
      }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating product pricing:", error);
    },
  });
};

export const useUpdateProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating product pricing:", error);
    },
  });
};

export const useDeleteProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting product pricing:", error);
    },
  });
};

export const useExportProductPricingTemplate = () => {
  return useMutation({
    mutationFn: exportProductPricingTemplate,
    onSuccess: (response: unknown, variables: string | null | undefined) => {
      const filename = `product-pricing-template-${variables || "all"}.csv`;
      const csvData = response as BlobPart;
      // Create a Blob from the response data
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      // Create a link and trigger the download
      const url = globalThis.window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); // Append the link to the DOM
      a.click(); // Programmatically click the link to trigger the download
      a.remove(); // Remove the link from the DOM
      globalThis.window.URL.revokeObjectURL(url);
    },
    onError: (error: unknown) => {
      logger.error("Error downloading product pricing template:", error);
    },
  });
};

const bulkUpdateProductPricing = async (updates: { id: number; price_usd: number }[]) => {
  const res = await api("PATCH", "/product-pricing/bulk-update", { updates });
  if (!res) {
    throw new Error("Failed to bulk update product pricing");
  }
  return res;
};

export const useBulkUpdateProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateProductPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error bulk updating product pricing:", error);
    },
  });
};

export const useUploadProductPricingFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProductPricingFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error uploading product pricing file:", error);
    },
  });
};
