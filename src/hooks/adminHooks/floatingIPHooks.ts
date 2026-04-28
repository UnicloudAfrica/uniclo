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

const fetchFloatingIPs = async ({
  region,
  provider,
  page,
  perPage,
  search,
}: AdminListParams) => {
  const queryString = buildQueryString({ region, provider, page, perPage, search });
  const res = await silentApi<ApiEnvelope<unknown[]>>("GET", `/product-floating-ip${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch Floating IPs");
  }
  return payload;
};

const fetchFloatingIPById = async (id: string | number) => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/product-floating-ip/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to fetch Floating IP with ID ${id}`);
  }
  return res.data;
};

const createFloatingIP = async (ipData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>("POST", "/product-floating-ip", ipData);
  if (!res?.data) {
    throw new Error("Failed to create Floating IP");
  }
  return res.data;
};

const updateFloatingIP = async ({
  id,
  ipData,
}: {
  id: string | number;
  ipData: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PATCH",
    `/product-floating-ip/${id}`,
    ipData
  );
  if (!res?.data) {
    throw new Error(`Failed to update Floating IP with ID ${id}`);
  }
  return res.data;
};

const deleteFloatingIP = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>("DELETE", `/product-floating-ip/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to delete Floating IP with ID ${id}`);
  }
  return res.data;
};

export const useFetchFloatingIPs = (
  region: string | undefined,
  { page = 1, perPage = 10, search = "", provider = "" }: AdminListParams = {},
  options: QueryHookOptions = {}
) => {
  return useQuery<CollectionResponse>({
    queryKey: ["floatingIPs", region, provider, page, perPage, search],
    queryFn: () => fetchFloatingIPs({ region, provider, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchFloatingIPById = (
  id: string | number | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery<AdminResourceRecord>({
    queryKey: ["floatingIP", id],
    queryFn: () => fetchFloatingIPById(id as string | number),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateFloatingIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFloatingIP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floatingIPs"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating Floating IP:", error);
    },
  });
};

export const useUpdateFloatingIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFloatingIP,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["floatingIPs"] });
      queryClient.invalidateQueries({
        queryKey: ["floatingIP", variables.id],
      });
    },
    onError: (error: unknown) => {
      logger.error("Error updating Floating IP:", error);
    },
  });
};

export const useDeleteFloatingIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFloatingIP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["floatingIPs"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting Floating IP:", error);
    },
  });
};
