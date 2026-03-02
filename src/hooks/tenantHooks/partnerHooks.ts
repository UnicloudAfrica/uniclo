import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

const fetchPartners = async () => {
  const res = await silentTenantApi("GET", "/admin/partners");
  if (!res?.data) {
    throw new Error("Failed to fetch partners");
  }
  return res.data;
};

const fetchPartnerById = async (id: any) => {
  const res = await silentTenantApi("GET", `/admin/partners/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch partner with id ${id}`);
  }
  return res.data;
};

const fetchPartnerClients = async (id: any) => {
  const res = await silentTenantApi("GET", `/admin/partners/${id}/clients`);
  if (!res?.data) {
    throw new Error(`Failed to fetch partner clients for ${id}`);
  }
  return res.data;
};

const createPartner = async (payload: any) => {
  const res = await tenantApi("POST", "/admin/partners", payload);
  if (!res?.data) {
    throw new Error("Failed to create partner");
  }
  return res.data;
};

const updatePartner = async ({ id, data }: any) => {
  const res = await tenantApi("PATCH", `/admin/partners/${id}`, data);
  if (!res?.data) {
    throw new Error("Failed to update partner");
  }
  return res.data;
};

const deletePartner = async (id: any) => {
  const res = await tenantApi("DELETE", `/admin/partners/${id}`);
  if (!res?.success) {
    throw new Error("Failed to delete partner");
  }
  return res;
};

export const useFetchTenantPartners = (options: any = {}) =>
  useQuery({
    queryKey: ["tenant-partners"],
    queryFn: fetchPartners,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantPartnerById = (id: any, options = {}) =>
  useQuery({
    queryKey: ["tenant-partners", id],
    queryFn: () => fetchPartnerById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantPartnerClients = (id: any, options = {}) =>
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
