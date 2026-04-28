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

const fetchEbsVolumes = async ({
  region,
  provider,
  page,
  perPage,
  search,
}: AdminListParams) => {
  const queryString = buildQueryString({ region, provider, page, perPage, search });
  const res = await silentApi<ApiEnvelope<unknown[]>>("GET", `/product-volume-type${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch EBS volumes");
  }
  return payload;
};

const fetchEbsVolumeById = async (id: string | number) => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/product-volume-type/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to fetch EBS volume with ID ${id}`);
  }
  return res.data;
};

const createEbsVolume = async (volumeData: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>("POST", "/product-volume-type", volumeData);
  if (!res?.data) {
    throw new Error("Failed to create EBS volume");
  }
  return res.data;
};

const updateEbsVolume = async ({
  id,
  volumeData,
}: {
  id: string | number;
  volumeData: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PATCH",
    `/product-volume-type/${id}`,
    volumeData
  );
  if (!res?.data) {
    throw new Error(`Failed to update EBS volume with ID ${id}`);
  }
  return res.data;
};

const deleteEbsVolume = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "DELETE",
    `/product-volume-type/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to delete EBS volume with ID ${id}`);
  }
  return res.data;
};

export const useFetchEbsVolumes = (
  region: string | undefined,
  { page = 1, perPage = 10, search = "", provider = "" }: AdminListParams = {},
  options: QueryHookOptions = {}
) => {
  return useQuery<CollectionResponse>({
    queryKey: ["ebsVolumes", region, provider, page, perPage, search],
    queryFn: () => fetchEbsVolumes({ region, provider, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchEbsVolumeById = (
  id: string | number | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery<AdminResourceRecord>({
    queryKey: ["ebsVolume", id],
    queryFn: () => fetchEbsVolumeById(id as string | number),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEbsVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebsVolumes"] });
    },
    onError: (error: unknown) => {
      logger.error("Error creating EBS volume:", error);
    },
  });
};

export const useUpdateEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEbsVolume,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ebsVolumes"] });
      queryClient.invalidateQueries({
        queryKey: ["ebsVolume", variables.id],
      });
    },
    onError: (error: unknown) => {
      logger.error("Error updating EBS volume:", error);
    },
  });
};

export const useDeleteEbsVolume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEbsVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ebsVolumes"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting EBS volume:", error);
    },
  });
};
