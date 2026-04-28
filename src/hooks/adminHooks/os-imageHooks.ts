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

const buildQueryString = (params: AdminListParams = {}) => {
  const query = new URLSearchParams();
  if (params.region) query.append("region", params.region);
  if (params.provider) query.append("provider", params.provider);
  if (params.page) query.append("page", String(params.page));
  if (params.perPage) query.append("per_page", String(params.perPage));
  if (params.search) query.append("search", params.search);
  return query.toString() ? `?${query.toString()}` : "";
};

const normaliseCollectionResponse = (
  res: ApiEnvelope<unknown[]> | unknown[] | null | undefined
): CollectionResponse => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  if (Array.isArray(res)) {
    return { data: res, meta: null };
  }
  const envelope = res as ApiEnvelope<unknown[]>;
  return {
    data: (envelope.data as unknown[]) ?? [],
    meta: envelope.meta ?? envelope.pagination ?? null,
    message: envelope.message,
    success: envelope.success,
  };
};

const fetchOsImages = async ({
  region,
  provider,
  page,
  perPage,
  search,
}: AdminListParams) => {
  const queryString = buildQueryString({ region, provider, page, perPage, search });
  const res = await silentApi<ApiEnvelope<unknown[]> | unknown[]>(
    "GET",
    `/product-os-image${queryString}`
  );
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch OS images");
  }
  return payload;
};

const fetchOsImageById = async (id: string | number) => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/product-os-image/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to fetch OS image with ID ${id}`);
  }
  return res.data;
};

const createOsImage = async (imageData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "POST",
    "/product-os-image",
    imageData
  );
  if (!res.data) {
    throw new Error("Failed to create OS image");
  }
  return res.data;
};

const updateOsImage = async ({
  id,
  imageData,
}: {
  id: string | number;
  imageData: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PATCH",
    `/product-os-image/${id}`,
    imageData
  );
  if (!res.data) {
    throw new Error(`Failed to update OS image with ID ${id}`);
  }
  return res.data;
};

const deleteOsImage = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>("DELETE", `/product-os-image/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete OS image with ID ${id}`);
  }
  return res.data;
};

export const useFetchOsImages = (
  region: string | undefined,
  { page = 1, perPage = 10, search = "", provider = "" }: AdminListParams = {},
  options: QueryHookOptions = {}
) => {
  return useQuery<CollectionResponse>({
    queryKey: ["osImages", region, provider, page, perPage, search],
    queryFn: () => fetchOsImages({ region, provider, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchOsImageById = (
  id: string | number | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery<AdminResourceRecord>({
    queryKey: ["osImage", id],
    queryFn: () => fetchOsImageById(id as string | number),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOsImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["osImages"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating OS image:", error);
    },
  });
};

export const useUpdateOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOsImage,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["osImages"] });
      queryClient.invalidateQueries({ queryKey: ["osImage", variables.id] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating OS image:", error);
    },
  });
};

export const useDeleteOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOsImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["osImages"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting OS image:", error);
    },
  });
};
