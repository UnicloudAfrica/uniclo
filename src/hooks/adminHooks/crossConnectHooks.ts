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

const buildQueryString = ({ region, page, perPage, search }: AdminListParams) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
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

const fetchCrossConnects = async ({ region, page, perPage, search }: AdminListParams) => {
  const queryString = buildQueryString({ region, page, perPage, search });
  const res = await silentApi<ApiEnvelope<unknown[]>>(
    "GET",
    `/product-cross-connect${queryString}`
  );
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch cross-connect products");
  }
  return payload;
};

const fetchCrossConnectById = async (id: string | number) => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/product-cross-connect/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to fetch cross-connect product with ID ${id}`);
  }
  return res.data;
};

const createCrossConnect = async (productData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "POST",
    "/product-cross-connect",
    productData
  );
  if (!res?.data) {
    throw new Error("Failed to create cross-connect product");
  }
  return res.data;
};

const updateCrossConnect = async ({
  id,
  productData,
}: {
  id: string | number;
  productData: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PUT",
    `/product-cross-connect/${id}`,
    productData
  );
  if (!res?.data) {
    throw new Error(`Failed to update cross-connect product with ID ${id}`);
  }
  return res.data;
};

const deleteCrossConnect = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "DELETE",
    `/product-cross-connect/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to delete cross-connect product with ID ${id}`);
  }
  return res.data;
};

export const useFetchCrossConnects = (
  region: string | undefined,
  { page = 1, perPage = 10, search = "" }: AdminListParams = {},
  options: QueryHookOptions = {}
) => {
  return useQuery<CollectionResponse>({
    queryKey: ["crossConnects", region, page, perPage, search],
    queryFn: () => fetchCrossConnects({ region, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchCrossConnectById = (
  id: string | number | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery<AdminResourceRecord>({
    queryKey: ["crossConnect", id],
    queryFn: () => fetchCrossConnectById(id as string | number),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateCrossConnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCrossConnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossConnects"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating cross-connect product:", error);
    },
  });
};

export const useUpdateCrossConnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCrossConnect,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crossConnects"] });
      queryClient.invalidateQueries({
        queryKey: ["crossConnect", variables.id],
      });
    },
    onError: (error: unknown) => {
      logger.error("Error updating cross-connect product:", error);
    },
  });
};

export const useDeleteCrossConnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCrossConnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crossConnects"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting cross-connect product:", error);
    },
  });
};
