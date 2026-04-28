import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentTenantApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

type ApiEnvelope<T = unknown> = { data?: T; success?: boolean };

export type PartnerId = string | number;

export interface PartnerPayload {
  [key: string]: unknown;
}

interface UpdatePartnerArgs {
  id: PartnerId;
  data: PartnerPayload;
}

const fetchPartners = async (): Promise<unknown> => {
  const res = await silentTenantApi<ApiEnvelope>("GET", "/admin/partners");
  if (!res?.data) {
    throw new Error("Failed to fetch partners");
  }
  return res.data;
};

const fetchPartnerById = async (id: PartnerId): Promise<unknown> => {
  const res = await silentTenantApi<ApiEnvelope>("GET", `/admin/partners/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch partner with id ${id}`);
  }
  return res.data;
};

const fetchPartnerClients = async (id: PartnerId): Promise<unknown> => {
  const res = await silentTenantApi<ApiEnvelope>("GET", `/admin/partners/${id}/clients`);
  if (!res?.data) {
    throw new Error(`Failed to fetch partner clients for ${id}`);
  }
  return res.data;
};

const createPartner = async (payload: PartnerPayload): Promise<unknown> => {
  const res = await tenantApi<ApiEnvelope>("POST", "/admin/partners", payload);
  if (!res?.data) {
    throw new Error("Failed to create partner");
  }
  return res.data;
};

const updatePartner = async ({ id, data }: UpdatePartnerArgs): Promise<unknown> => {
  const res = await tenantApi<ApiEnvelope>("PATCH", `/admin/partners/${id}`, data);
  if (!res?.data) {
    throw new Error("Failed to update partner");
  }
  return res.data;
};

const deletePartner = async (id: PartnerId): Promise<ApiEnvelope> => {
  const res = await tenantApi<ApiEnvelope>("DELETE", `/admin/partners/${id}`);
  if (!res?.success) {
    throw new Error("Failed to delete partner");
  }
  return res;
};

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

export const useFetchTenantPartners = (options: QueryOptions<unknown> = {}) =>
  useQuery({
    queryKey: ["tenant-partners"],
    queryFn: fetchPartners,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantPartnerById = (
  id: PartnerId,
  options: QueryOptions<unknown> = {}
) =>
  useQuery({
    queryKey: ["tenant-partners", id],
    queryFn: () => fetchPartnerById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantPartnerClients = (
  id: PartnerId,
  options: QueryOptions<unknown> = {}
) =>
  useQuery({
    queryKey: ["tenant-partner-clients", id],
    queryFn: () => fetchPartnerClients(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateTenantPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-partners"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-partner-clients"] });
    },
  });
};

export const useUpdateTenantPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePartner,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-partners"] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["tenant-partners", variables.id] });
      }
    },
  });
};

export const useDeleteTenantPartner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePartner,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-partners"] });
      queryClient.removeQueries({ queryKey: ["tenant-partners", id] });
      queryClient.invalidateQueries({ queryKey: ["tenant-partner-clients", id] });
    },
  });
};
