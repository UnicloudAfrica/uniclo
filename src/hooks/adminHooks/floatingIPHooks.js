import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all Floating IPs
const fetchFloatingIPs = async () => {
  const res = await silentApi("GET", "/product-floating-ip");
  if (!res.data) {
    throw new Error("Failed to fetch Floating IPs");
  }
  return res.data;
};

// GET: Fetch Floating IP by ID
const fetchFloatingIPById = async (id) => {
  const res = await silentApi("GET", `/product-floating-ip/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch Floating IP with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new Floating IP
const createFloatingIP = async (ipData) => {
  const res = await api("POST", "/product-floating-ip", ipData);
  if (!res.data) {
    throw new Error("Failed to create Floating IP");
  }
  return res.data;
};

// PATCH: Update an Floating IP
const updateFloatingIP = async ({ id, ipData }) => {
  const res = await api("PATCH", `/product-floating-ip/${id}`, ipData);
  if (!res.data) {
    throw new Error(`Failed to update Floating IP with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete an Floating IP
const deleteFloatingIP = async (id) => {
  const res = await api("DELETE", `/product-floating-ip/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete Floating IP with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all Floating IPs
export const useFetchFloatingIPs = (options = {}) => {
  return useQuery({
    queryKey: ["FloatingIPs"],
    queryFn: fetchFloatingIPs,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch Floating IP by ID
export const useFetchFloatingIPById = (id, options = {}) => {
  return useQuery({
    queryKey: ["FloatingIP", id],
    queryFn: () => fetchFloatingIPById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create an Floating IP
export const useCreateFloatingIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFloatingIP,
    onSuccess: () => {
      // Invalidate FloatingIPs query to refresh the list
      queryClient.invalidateQueries(["FloatingIPs"]);
    },
    onError: (error) => {
      console.error("Error creating Floating IP:", error);
    },
  });
};

// Hook to update an Floating IP
export const useUpdateFloatingIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFloatingIP,
    onSuccess: (data, variables) => {
      // Invalidate both FloatingIPs list and specific FloatingIP query
      queryClient.invalidateQueries(["FloatingIPs"]);
      queryClient.invalidateQueries(["FloatingIP", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating Floating IP:", error);
    },
  });
};

// Hook to delete an Floating IP
export const useDeleteFloatingIP = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFloatingIP,
    onSuccess: () => {
      // Invalidate FloatingIPs query to refresh the list
      queryClient.invalidateQueries(["FloatingIPs"]);
    },
    onError: (error) => {
      console.error("Error deleting Floating IP:", error);
    },
  });
};
