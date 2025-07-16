import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all VM instances
const fetchVmInstances = async () => {
  const res = await silentApi("GET", "/product-compute-instance");
  if (!res.data) {
    throw new Error("Failed to fetch VM instances");
  }
  return res.data;
};

// GET: Fetch VM instance by ID
const fetchVmInstanceById = async (id) => {
  const res = await silentApi("GET", `/product-compute-instance/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch VM instance with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new VM instance
const createVmInstance = async (instanceData) => {
  const res = await api("POST", "/product-compute-instance", instanceData);
  if (!res.data) {
    throw new Error("Failed to create VM instance");
  }
  return res.data;
};

// PATCH: Update a VM instance
const updateVmInstance = async ({ id, instanceData }) => {
  const res = await api(
    "PATCH",
    `/product-compute-instance/${id}`,
    instanceData
  );
  if (!res.data) {
    throw new Error(`Failed to update VM instance with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a VM instance
const deleteVmInstance = async (id) => {
  const res = await api("DELETE", `/product-compute-instance/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete VM instance with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all VM instances
export const useFetchVmInstances = (options = {}) => {
  return useQuery({
    queryKey: ["vmInstances"],
    queryFn: fetchVmInstances,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch VM instance by ID
export const useFetchVmInstanceById = (id, options = {}) => {
  return useQuery({
    queryKey: ["vmInstance", id],
    queryFn: () => fetchVmInstanceById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a VM instance
export const useCreateVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVmInstance,
    onSuccess: () => {
      // Invalidate vmInstances query to refresh the list
      queryClient.invalidateQueries(["vmInstances"]);
    },
    onError: (error) => {
      console.error("Error creating VM instance:", error);
    },
  });
};

// Hook to update a VM instance
export const useUpdateVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVmInstance,
    onSuccess: (data, variables) => {
      // Invalidate both vmInstances list and specific vmInstance query
      queryClient.invalidateQueries(["vmInstances"]);
      queryClient.invalidateQueries(["vmInstance", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating VM instance:", error);
    },
  });
};

// Hook to delete a VM instance
export const useDeleteVmInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVmInstance,
    onSuccess: () => {
      // Invalidate vmInstances query to refresh the list
      queryClient.invalidateQueries(["vmInstances"]);
    },
    onError: (error) => {
      console.error("Error deleting VM instance:", error);
    },
  });
};
