import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

// GET: Fetch all tax configurations
const fetchTaxConfigurations = async () => {
  const res = await silentApi("GET", "/tax-configurations");
  if (!res.data) {
    throw new Error("Failed to fetch tax configurations");
  }
  return res.data;
};

// GET: Fetch tax configuration by ID
const fetchTaxConfigurationById = async (id) => {
  const res = await silentApi("GET", `/tax-configurations/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch tax configuration with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new tax configuration
const createTaxConfiguration = async (configData) => {
  const res = await api("POST", "/tax-configurations", configData);
  if (!res.data) {
    throw new Error("Failed to create tax configuration");
  }
  return res.data;
};

// PATCH: Update a tax configuration
const updateTaxConfiguration = async ({ id, configData }) => {
  const res = await api("PATCH", `/tax-configurations/${id}`, configData);
  if (!res.data) {
    throw new Error(`Failed to update tax configuration with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a tax configuration
const deleteTaxConfiguration = async (id) => {
  const res = await api("DELETE", `/tax-configurations/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete tax configuration with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all tax configurations
export const useFetchTaxConfigurations = (options = {}) => {
  return useQuery({
    queryKey: ["taxConfigurations"],
    queryFn: fetchTaxConfigurations,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch tax configuration by ID
export const useFetchTaxConfigurationById = (id, options = {}) => {
  return useQuery({
    queryKey: ["taxConfiguration", id],
    queryFn: () => fetchTaxConfigurationById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to create a tax configuration
export const useCreateTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaxConfiguration,
    onSuccess: () => {
      // Invalidate taxConfigurations query to refresh the list
      queryClient.invalidateQueries(["taxConfigurations"]);
    },
    onError: (error) => {
      console.error("Error creating tax configuration:", error);
    },
  });
};

// Hook to update a tax configuration
export const useUpdateTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaxConfiguration,
    onSuccess: (data, variables) => {
      // Invalidate both taxConfigurations list and specific taxConfiguration query
      queryClient.invalidateQueries(["taxConfigurations"]);
      queryClient.invalidateQueries(["taxConfiguration", variables.id]);
    },
    onError: (error) => {
      console.error("Error updating tax configuration:", error);
    },
  });
};

// Hook to delete a tax configuration
export const useDeleteTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaxConfiguration,
    onSuccess: () => {
      // Invalidate taxConfigurations query to refresh the list
      queryClient.invalidateQueries(["taxConfigurations"]);
    },
    onError: (error) => {
      console.error("Error deleting tax configuration:", error);
    },
  });
};
