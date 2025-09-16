import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

const fetchFloatingIPs = async (region) => {
  const res = await silentApi("GET", `/product-floating-ip?region=${region}`);
  if (!res.data) {
    throw new Error("Failed to fetch Floating IPs");
  }
  return res.data;
};

const fetchFloatingIPById = async (id) => {
  const res = await silentApi("GET", `/product-floating-ip/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch Floating IP with ID ${id}`);
  }
  return res.data;
};

const createFloatingIP = async (ipData) => {
  const res = await api("POST", "/product-floating-ip", ipData);
  if (!res.data) {
    throw new Error("Failed to create Floating IP");
  }
  return res.data;
};

const updateFloatingIP = async ({ id, ipData }) => {
  const res = await api("PATCH", `/product-floating-ip/${id}`, ipData);
  if (!res.data) {
    throw new Error(`Failed to update Floating IP with ID ${id}`);
  }
  return res.data;
};

const deleteFloatingIP = async (id) => {
  const res = await api("DELETE", `/product-floating-ip/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete Floating IP with ID ${id}`);
  }
  return res.data;
};

export const useFetchFloatingIPs = (region, options = {}) => {
  return useQuery({
    queryKey: ["floatingIPs", region],
    queryFn: () => fetchFloatingIPs(region),
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
      queryClient.invalidateQueries(["floatingIPs"]);
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
      queryClient.invalidateQueries(["floatingIPs"]);
      queryClient.invalidateQueries(["floatingIP", variables.id]);
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
      queryClient.invalidateQueries(["floatingIPs"]);
    },
    onError: (error) => {
      console.error("Error deleting Floating IP:", error);
    },
  });
};
