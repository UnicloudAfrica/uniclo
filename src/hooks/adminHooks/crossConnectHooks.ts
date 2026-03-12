import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

type CollectionResponse = {
  data: unknown[];
  meta: Record<string, unknown> | null;
  message?: string;
  success?: boolean;
};

const buildQueryString = ({ region, page, perPage, search }: any) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (page) params.append("page", page);
  if (perPage) params.append("per_page", perPage);
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res: any) => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchCrossConnects = async ({ region, page, perPage, search }: any) => {
  const queryString = buildQueryString({ region, page, perPage, search });
  const res = await silentApi("GET", `/product-cross-connect${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch cross-connect products");
  }
  return payload;
};

const fetchCrossConnectById = async (id: any) => {
  const res = await silentApi("GET", `/product-cross-connect/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch cross-connect product with ID ${id}`);
  }
  return res.data;
};

const createCrossConnect = async (productData: any) => {
  const res = await api("POST", "/product-cross-connect", productData);
  if (!res?.data) {
    throw new Error("Failed to create cross-connect product");
  }
  return res.data;
};

const updateCrossConnect = async ({ id, productData }: any) => {
  const res = await api("PUT", `/product-cross-connect/${id}`, productData);
  if (!res?.data) {
    throw new Error(`Failed to update cross-connect product with ID ${id}`);
  }
  return res.data;
};

const deleteCrossConnect = async (id: any) => {
  const res = await api("DELETE", `/product-cross-connect/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to delete cross-connect product with ID ${id}`);
  }
  return res.data;
};

export const useFetchCrossConnects = (
  region: any,
  { page = 1, perPage = 10, search = "" }: any = {},
  options: any = {}
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

export const useFetchCrossConnectById = (id: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["crossConnect", id],
    queryFn: () => fetchCrossConnectById(id),
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
    onError: (error: any) => {
      logger.error("Error creating cross-connect product:", error);
    },
  });
};

export const useUpdateCrossConnect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCrossConnect,
    onSuccess: (data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["crossConnects"] });
      queryClient.invalidateQueries({
        queryKey: ["crossConnect", variables.id],
      });
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
      logger.error("Error deleting cross-connect product:", error);
    },
  });
};
