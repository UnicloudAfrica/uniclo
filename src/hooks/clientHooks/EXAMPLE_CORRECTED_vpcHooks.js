import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientApi from "../../index/client/api";
import clientSilentApi from "../../index/client/silent";

/**
 * Client VPC Hooks - Corrected Implementation
 * 
 * This file demonstrates the correct patterns that should be used throughout the frontend:
 * 1. Use context-specific API clients (clientApi, clientSilentApi)
 * 2. Follow existing naming conventions (useFetchClient*, useCreateClient*, etc.)
 * 3. Use established query key patterns
 * 4. Maintain consistent error handling and cache invalidation
 * 
 * Based on API.md endpoints: /business/vpcs/*
 */

// ================================
// API Functions
// ================================

// GET: Fetch all VPCs
const fetchClientVpcs = async () => {
  const res = await clientSilentApi("GET", "/business/vpcs");
  if (!res.data) {
    throw new Error("Failed to fetch VPCs");
  }
  return res.data;
};

// GET: Fetch VPC by ID
const fetchClientVpcById = async (id) => {
  const res = await clientSilentApi("GET", `/business/vpcs/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch VPC with ID ${id}`);
  }
  return res.data;
};

// GET: Fetch available CIDRs for VPCs
const fetchClientVpcAvailableCidrs = async () => {
  const res = await clientSilentApi("GET", "/business/vpcs/available-cidrs");
  if (!res.data) {
    throw new Error("Failed to fetch available VPC CIDRs");
  }
  return res.data;
};

// POST: Create a new VPC
const createClientVpc = async (vpcData) => {
  const res = await clientApi("POST", "/business/vpcs", vpcData);
  if (!res.data) {
    throw new Error("Failed to create VPC");
  }
  return res.data;
};

// PUT/PATCH: Update VPC
const updateClientVpc = async ({ id, vpcData }) => {
  const res = await clientApi("PUT", `/business/vpcs/${id}`, vpcData);
  if (!res.data) {
    throw new Error(`Failed to update VPC with ID ${id}`);
  }
  return res.data;
};

// DELETE: Delete VPC
const deleteClientVpc = async (id) => {
  const res = await clientApi("DELETE", `/business/vpcs/${id}`);
  if (!res.data) {
    throw new Error(`Failed to delete VPC with ID ${id}`);
  }
  return res.data;
};

// ================================
// Query Hooks
// ================================

// Hook to fetch all VPCs
export const useFetchClientVpcs = (options = {}) => {
  return useQuery({
    queryKey: ["clientVpcs"], // Follow existing pattern: no "client-" prefix
    queryFn: fetchClientVpcs,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch VPC by ID
export const useFetchClientVpcById = (id, options = {}) => {
  return useQuery({
    queryKey: ["clientVpc", id], // Follow existing pattern: singular + id
    queryFn: () => fetchClientVpcById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Hook to fetch available CIDRs
export const useFetchClientVpcAvailableCidrs = (options = {}) => {
  return useQuery({
    queryKey: ["clientVpcCidrs"],
    queryFn: fetchClientVpcAvailableCidrs,
    staleTime: 1000 * 60 * 10, // Longer cache for relatively static data
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ================================
// Mutation Hooks
// ================================

// Hook to create VPC
export const useCreateClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientVpc,
    onSuccess: () => {
      // Invalidate VPCs list to refresh
      queryClient.invalidateQueries({ queryKey: ["clientVpcs"] });
    },
    onError: (error) => {
      console.error("Error creating VPC:", error);
    },
  });
};

// Hook to update VPC
export const useUpdateClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientVpc,
    onSuccess: (data, variables) => {
      // Invalidate both VPCs list and specific VPC query
      queryClient.invalidateQueries({ queryKey: ["clientVpcs"] });
      queryClient.invalidateQueries({
        queryKey: ["clientVpc", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating VPC:", error);
    },
  });
};

// Hook to delete VPC
export const useDeleteClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientVpc,
    onSuccess: () => {
      // Invalidate VPCs list to refresh
      queryClient.invalidateQueries({ queryKey: ["clientVpcs"] });
    },
    onError: (error) => {
      console.error("Error deleting VPC:", error);
    },
  });
};

// ================================
// Export all functions for direct use if needed
// ================================
export {
  fetchClientVpcs,
  fetchClientVpcById,
  fetchClientVpcAvailableCidrs,
  createClientVpc,
  updateClientVpc,
  deleteClientVpc,
};

/**
 * Usage Examples:
 * 
 * // In a component:
 * import { 
 *   useFetchClientVpcs, 
 *   useFetchClientVpcById,
 *   useCreateClientVpc 
 * } from "../../hooks/clientHooks/vpcHooks";
 * 
 * function VpcManagement() {
 *   const { data: vpcs, isLoading } = useFetchClientVpcs();
 *   const createVpc = useCreateClientVpc();
 *   
 *   const handleCreateVpc = (vpcData) => {
 *     createVpc.mutate(vpcData, {
 *       onSuccess: () => {
 *         toast.success("VPC created successfully");
 *       },
 *       onError: (error) => {
 *         toast.error("Failed to create VPC");
 *       }
 *     });
 *   };
 * }
 */