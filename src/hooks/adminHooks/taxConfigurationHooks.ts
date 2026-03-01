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
const fetchTaxConfigurationById = async (id: any) => {
  const res = await silentApi("GET", `/tax-configurations/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch tax configuration with ID ${id}`);
  }
  return res.data;
};

// POST: Create a new tax configuration
const createTaxConfiguration = async (configData: any) => {
  const res = await api("POST", "/tax-configurations", configData);
  if (!res.data) {
    throw new Error("Failed to create tax configuration");
  }
  return res.data;
};

// PATCH: Update a tax configuration
const updateTaxConfiguration = async ({ id, configData }: any) => {
  const res = await api("PATCH", `/tax-configurations/${id}`, configData);
  if (!res.data) {
    throw new Error(`Failed to update tax configuration with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete a tax configuration
const deleteTaxConfiguration = async (id: any) => {
  const res = await api("DELETE", `/tax-configurations/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete tax configuration with ID ${id}`);
  }
  return res.data;
};

// Hook to fetch all tax configurations
export const useFetchTaxConfigurations = (options: any = {}) => {
  return useQuery({
    queryKey: ["taxConfigurations"],
    queryFn: fetchTaxConfigurations,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch tax configuration by ID
export const useFetchTaxConfigurationById = (id: any, options: any = {}) => {
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
    onSuccess: async (created: any) => {
      const createdTaxType = created;
      if (createdTaxType) {
        queryClient.setQueryData(["taxConfigurations"], (current: any) => {
          if (!Array.isArray(current)) {
            return [createdTaxType];
          }
          const alreadyExists = current.some((item: any) => item?.id === createdTaxType.id);
          return alreadyExists ? current : [...current, createdTaxType];
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ["taxConfigurations"],
        refetchType: "active",
      });
    },
    onError: (error: any) => {
      console.error("Error creating tax configuration:", error);
    },
  });
};

// Hook to update a tax configuration
export const useUpdateTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTaxConfiguration,
    onSuccess: async (updated: any, variables: any) => {
      const updatedTaxType = updated;
      if (updatedTaxType) {
        queryClient.setQueryData(["taxConfigurations"], (current: any) => {
          if (!Array.isArray(current)) return current;
          return current.map((item: any) =>
            item?.id === updatedTaxType.id ? updatedTaxType : item
          );
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ["taxConfigurations"],
        refetchType: "active",
      });
      if (variables?.id) {
        await queryClient.invalidateQueries({
          queryKey: ["taxConfiguration", variables.id],
          refetchType: "inactive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Error updating tax configuration:", error);
    },
  });
};

// Hook to delete a tax configuration
export const useDeleteTaxConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaxConfiguration,
    onSuccess: async (_data: any, id: any) => {
      queryClient.setQueryData(["taxConfigurations"], (current: any) => {
        if (!Array.isArray(current)) return current;
        return current.filter((item: any) => item?.id !== id);
      });
      await queryClient.invalidateQueries({
        queryKey: ["taxConfigurations"],
        refetchType: "active",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting tax configuration:", error);
    },
  });
};
