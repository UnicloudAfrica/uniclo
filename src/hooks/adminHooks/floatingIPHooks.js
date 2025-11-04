import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const buildQueryString = ({ region, page, perPage, search }) => {
  const params = new URLSearchParams();
  if (region) params.append("region", region);
  if (page) params.append("page", page);
  if (perPage) params.append("per_page", perPage);
  if (search) params.append("search", search);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const normaliseCollectionResponse = (res) => {
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

const fetchFloatingIPs = async ({ region, page, perPage, search }) => {
  const queryString = buildQueryString({ region, page, perPage, search });
  const res = await silentApi("GET", `/product-floating-ip${queryString}`);
  const payload = normaliseCollectionResponse(res);
  if (!Array.isArray(payload.data)) {
    throw new Error("Failed to fetch Floating IPs");
  }
  return payload;
};

const fetchFloatingIPById = async (id) => {
  const res = await silentApi("GET", `/product-floating-ip/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch Floating IP with ID ${id}`);
  }
  return res.data;
};

const createFloatingIP = async (ipData) => {
  const res = await api("POST", "/product-floating-ip", ipData);
  if (!res?.data) {
    throw new Error("Failed to create Floating IP");
  }
  return res.data;
};

const updateFloatingIP = async ({ id, ipData }) => {
  const res = await api("PATCH", `/product-floating-ip/${id}`, ipData);
  if (!res?.data) {
    throw new Error(`Failed to update Floating IP with ID ${id}`);
  }
  return res.data;
};

const deleteFloatingIP = async (id) => {
  const res = await api("DELETE", `/product-floating-ip/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to delete Floating IP with ID ${id}`);
  }
  return res.data;
};

export const useFetchFloatingIPs = (
  region,
  { page = 1, perPage = 10, search = "" } = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["floatingIPs", region, page, perPage, search],
    queryFn: () => fetchFloatingIPs({ region, page, perPage, search }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !!region,
    ...options,
  });
};

export const useFetchFloatingIPById = (id, options = {}) => {
  return useQuery({
    queryKey: ["floatingIP", id],
    queryFn: () => fetchFloatingIPById(id),
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
    onError: (error) => {
      console.error("Error creating Floating IP:", error);
    },
  });
};

export const useUpdateFloatingIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFloatingIP,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["floatingIPs"] });
      queryClient.invalidateQueries({
        queryKey: ["floatingIP", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating Floating IP:", error);
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
    onError: (error) => {
      console.error("Error deleting Floating IP:", error);
    },
  });
};

