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

interface VmQuery {
  region?: string;
  provider?: string;
  page?: number;
  perPage?: number;
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
  const r = res as Record<string, any>;
  return {
    data: (r.data as unknown[]) ?? [],
    meta: (r.meta ?? r.pagination ?? null) as Record<string, unknown> | null,
    message: String(r.message || ""),
    success: Boolean(r.success),
  };
};

const fetchVmInstances = async ({ region, provider, page, perPage, search }: VmQuery) => {
  const queryString = buildQueryString({ region, provider, page, perPage, search });
  const res = await silentApi("GET", `/product-compute-instance${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch VM instances");
  }
  return payload;
};

const fetchVmInstanceById = async (id: string | number): Promise<any> => {
  const res = await silentApi("GET", `/product-compute-instance/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch VM instance with ID ${id}`);
  }
  return res.data;
};

const createVmInstance = async (instanceData: any): Promise<any> => {
  const res = await api("POST", "/product-compute-instance", instanceData);
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
  instanceData: any;
}): Promise<any> => {
  const res = await api("PATCH", `/product-compute-instance/${id}`, instanceData);
  if (!res?.data) {
    throw new Error(`Failed to update VM instance with ID ${id}`);
  }
  return res.data;
};

const deleteVmInstance = async (id: any) => {
  const res = await api("DELETE", `/product-compute-instance/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to delete VM instance with ID ${id}`);
  }
  return res.data;
};

export const useFetchVmInstances = (
  region: any,
  { page = 1, perPage = 10, search = "", provider = "" }: any = {},
  options: any = {}
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

export const useFetchVmInstanceById = (id: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["vmInstance", id],
    queryFn: () => fetchVmInstanceById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, any>({
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
  return useMutation<any, Error, { id: string | number; instanceData: any }>({
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
    onError: (error: any) => {
      logger.error("Error deleting VM instance:", error);
    },
  });
};
