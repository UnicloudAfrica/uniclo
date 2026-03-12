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

const buildQueryString = (params: any = {}) => {
  const query = new URLSearchParams();
  if (params.region) query.append("region", params.region);
  if (params.provider) query.append("provider", params.provider);
  if (params.page) query.append("page", params.page);
  if (params.perPage) query.append("per_page", params.perPage);
  if (params.search) query.append("search", params.search);
  return query.toString() ? `?${query.toString()}` : "";
};

const normaliseCollectionResponse = (res: any) => {
  if (!res) {
    throw new Error("Unexpected response from server");
  }
  if (!res.data && Array.isArray(res)) {
    return { data: res, meta: null };
  }
  return {
    data: res.data ?? [],
    meta: res.meta ?? res.pagination ?? null,
    message: res.message,
    success: res.success,
  };
};

const fetchOsImages = async ({ region, provider, page, perPage, search }: any) => {
  const queryString = buildQueryString({ region, provider, page, perPage, search });
  const res = await silentApi("GET", `/product-os-image${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch OS images");
  }
  return payload;
};

const fetchOsImageById = async (id: any) => {
  const res = await silentApi("GET", `/product-os-image/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch OS image with ID ${id}`);
  }
  return res.data;
};

const createOsImage = async (imageData: any) => {
  const res = await api("POST", "/product-os-image", imageData);
  if (!res.data) {
    throw new Error("Failed to create OS image");
  }
  return res.data;
};

const updateOsImage = async ({ id, imageData }: any) => {
  const res = await api("PATCH", `/product-os-image/${id}`, imageData);
  if (!res.data) {
    throw new Error(`Failed to update OS image with ID ${id}`);
  }
  return res.data;
};

const deleteOsImage = async (id: any) => {
  const res = await api("DELETE", `/product-os-image/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete OS image with ID ${id}`);
  }
  return res.data;
};

export const useFetchOsImages = (
  region: any,
  { page = 1, perPage = 10, search = "", provider = "" }: any = {},
  options: any = {}
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

export const useFetchOsImageById = (id: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["osImage", id],
    queryFn: () => fetchOsImageById(id),
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
    onError: (error: any) => {
      logger.error("Error creating OS image:", error);
    },
  });
};

export const useUpdateOsImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOsImage,
    onSuccess: (data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["osImages"] });
      queryClient.invalidateQueries({ queryKey: ["osImage", variables.id] });
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
      logger.error("Error deleting OS image:", error);
    },
  });
};
