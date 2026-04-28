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

interface VmQuery {
  region?: string;
  provider?: string;
  page?: number | string;
  perPage?: number | string;
  search?: string;
}

const buildQueryString = ({ region, provider, page, perPage, search }: VmQuery) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (provider) params.append("provider", provider);
  if (page) params.append("page", String(page));
  if (perPage) params.append("per_page", String(perPage));
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res: unknown): CollectionResponse => {
  if (!res || typeof res !== "object") {
    throw new Error("Unexpected response from server");
  }
  const r = res as ApiEnvelope<unknown[]>;
  return {
    data: (r.data as unknown[]) ?? [],
    meta: (r.meta ?? r.pagination ?? null) as Record<string, unknown> | null,
    message: r.message ? String(r.message) : "",
    success: Boolean(r.success),
  };
};

const fetchVmInstances = async ({ region, provider, page, perPage, search }: VmQuery) => {
  const queryString = buildQueryString({ region, provider, page, perPage, search });
  const res = await silentApi<ApiEnvelope<unknown[]>>(
    "GET",
    `/product-compute-instance${queryString}`
  );
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch VM instances");
  }
  return payload;
};

const fetchVmInstanceById = async (
  id: string | number
): Promise<AdminResourceRecord> => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord>>(
    "GET",
    `/product-compute-instance/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to fetch VM instance with ID ${id}`);
  }
  return res.data;
};

const createVmInstance = async (
  instanceData: AdminResourceRecord
): Promise<AdminResourceRecord> => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "POST",
    "/product-compute-instance",
    instanceData
  );
  if (!res?.data) {
    throw new Error("Failed to create VM instance");
  }
  return res.data;
};

const updateVmInstance = async ({
  id,
  instanceData,
}: {
  id: string | number;
  instanceData: AdminResourceRecord;
}): Promise<AdminResourceRecord> => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PATCH",
    `/product-compute-instance/${id}`,
    instanceData
  );
  if (!res?.data) {
    throw new Error(`Failed to update VM instance with ID ${id}`);
  }
  return res.data;
};

const deleteVmInstance = async (id: string | number) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "DELETE",
    `/product-compute-instance/${id}`
  );
  if (!res?.data) {
    throw new Error(`Failed to delete VM instance with ID ${id}`);
  }
  return res.data;
};

export const useFetchVmInstances = (
  region: string | undefined,
  { page = 1, perPage = 10, search = "", provider = "" }: AdminListParams = {},
  options: QueryHookOptions = {}
) => {
  return useQuery<CollectionResponse>({
    queryKey: ["vmInstances", region, provider, page, perPage, search],
    queryFn: () => fetchVmInstances({ region, provider, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchVmInstanceById = (
  id: string | number | undefined,
  options: QueryHookOptions = {}
) => {
  return useQuery<AdminResourceRecord>({
    queryKey: ["vmInstance", id],
    queryFn: () => fetchVmInstanceById(id as string | number),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation<AdminResourceRecord, Error, AdminResourceRecord>({
    mutationFn: createVmInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vmInstances"] });
    },
    onError: (error: Error) => {
      logger.error("Error creating VM instance:", error);
    },
  });
};

export const useUpdateVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation<
    AdminResourceRecord,
    Error,
    { id: string | number; instanceData: AdminResourceRecord }
  >({
    mutationFn: updateVmInstance,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vmInstances"] });
      queryClient.invalidateQueries({
        queryKey: ["vmInstance", variables.id],
      });
    },
    onError: (error: Error) => {
      logger.error("Error updating VM instance:", error);
    },
  });
};

export const useDeleteVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVmInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vmInstances"] });
    },
    onError: (error: unknown) => {
      logger.error("Error deleting VM instance:", error);
    },
  });
};
