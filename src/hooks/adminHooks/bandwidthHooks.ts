import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type {
  ApiEnvelope,
  AdminListParams,
  AdminResourceRecord,
  CollectionResponse,
  QueryHookOptions,
} from "@/shared/types/admin";

const buildQueryString = ({ region, provider, page, perPage, search }: AdminListParams) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (provider) params.append("provider", provider);
  if (page) params.append("page", String(page));
  if (perPage) params.append("per_page", String(perPage));
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (
  res: ApiEnvelope<unknown[]> | null | undefined
): CollectionResponse => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  return {
    data: (res.data as unknown[]) ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchBandwidthProducts = async ({
  region,
  provider,
  page,
  perPage,
  search,
}: AdminListParams) => {
  const queryString = buildQueryString({ region, provider, page, perPage, search });
  const res = await silentApi<ApiEnvelope<unknown[]>>("GET", `/product-bandwidth${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch bandwidth products");
  }
  return payload;
};

const fetchBandwidthProductById = async (id: string | number) => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/product-bandwidth/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to fetch bandwidth product with ID ${id}`);
  }
  return res.data;
};

const createBandwidthProduct = async (bandwidthData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "POST",
    "/product-bandwidth",
    bandwidthData
  );
  if (!res?.data) {
    throw new Error("Failed to create bandwidth product");
  }
  return res.data;
};

const updateBandwidthProduct = async ({
  id,
  bandwidthData,
}: {
  id: string | number;
  bandwidthData: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PATCH",
    `/product-bandwidth/${id}`,
    bandwidthData
  );
  if (!res?.data) {
    throw new Error(`Failed to update bandwidth product with ID ${id}`);
  }
  return res.data;
};

const deleteBandwidthProduct = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>("DELETE", `/product-bandwidth/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to delete bandwidth product with ID ${id}`);
  }
  return res.data;
};

export const useFetchBandwidthProducts = (
  region: string | undefined,
  { page = 1, perPage = 10, search = "", provider = "" }: AdminListParams = {},
  options: QueryHookOptions = {}
) => {
  return useQuery<CollectionResponse>({
    queryKey: ["bandwidthProducts", region, provider, page, perPage, search],
    queryFn: () => fetchBandwidthProducts({ region, provider, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchBandwidthProductById = (
  id: string | number | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery<AdminResourceRecord>({
    queryKey: ["bandwidthProduct", id],
    queryFn: () => fetchBandwidthProductById(id as string | number),
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
      queryClient.invalidateQueries({ queryKey: ["bandwidthProducts"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating bandwidth product:", error);
    },
  });
};

export const useUpdateBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBandwidthProduct,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bandwidthProducts"] });
      queryClient.invalidateQueries({
        queryKey: ["bandwidthProduct", variables.id],
      });
    },
    onError: (error: unknown) => {
      logger.error("Error updating bandwidth product:", error);
    },
  });
};

export const useDeleteBandwidthProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBandwidthProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bandwidthProducts"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting bandwidth product:", error);
    },
  });
};
