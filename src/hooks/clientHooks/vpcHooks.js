// src/hooks/clientHooks/vpcHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const fetchClientVpcs = async ({ project_id, region, refresh = false }) => {
  // Validate required parameters before making API call
  if (!project_id || !region) {
    console.warn("fetchClientVpcs: project_id and region are required");
    return [];
  }

  const params = new URLSearchParams();
  params.append("project_id", project_id);
  params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await clientSilentApi("GET", `/business/vpcs${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch VPCs");
  return res.data;
};

const fetchClientVpcById = async (id) => {
  const res = await clientSilentApi("GET", `/business/vpcs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch VPC with ID ${id}`);
  return res.data;
};

const createClientVpc = async (vpcData) => {
  const res = await clientApi("POST", "/business/vpcs", vpcData);
  if (!res.data) throw new Error("Failed to create VPC");
  return res.data;
};

const updateClientVpc = async ({ id, vpcData }) => {
  const res = await clientApi("PATCH", `/business/vpcs/${id}`, vpcData);
  if (!res.data) throw new Error(`Failed to update VPC with ID ${id}`);
  return res.data;
};

const deleteClientVpc = async ({ id, payload }) => {
  const res = await clientApi("DELETE", `/business/vpcs/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete VPC with ID ${id}`);
  return res.data;
};

export const useFetchClientVpcs = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["clientVpcs", { projectId, region }],
    queryFn: () => fetchClientVpcs({ project_id: projectId, region }),
    // Only enable if both projectId and region are non-empty strings
    enabled: !!projectId?.trim?.() && !!region?.trim?.(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchClientVpcById = (id, options = {}) => {
  return useQuery({
    queryKey: ["clientVpc", id],
    queryFn: () => fetchClientVpcById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientVpc,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientVpcs", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating VPC:", error);
    },
  });
};

export const useUpdateClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientVpc,
    onSuccess: (data, variables) => {
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

export const useDeleteClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientVpc,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientVpcs", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error deleting VPC:", error);
    },
  });
};

export const syncClientVpcsFromProvider = async ({ project_id, region }) =>
  fetchClientVpcs({ project_id, region, refresh: true });

// --- Available CIDR suggestions for a VPC (client) ---
const fetchAvailableClientCidrs = async ({
  project_id,
  region,
  vpc_id,
  prefix_length = 24,
  limit = 8,
}) => {
  const params = new URLSearchParams();
  params.append("project_id", project_id);
  params.append("region", region);
  params.append("vpc_id", vpc_id);
  if (prefix_length) params.append("prefix_length", String(prefix_length));
  if (limit) params.append("limit", String(limit));
  const res = await clientSilentApi("GET", `/business/vpcs/available-cidrs?${params.toString()}`);
  const suggestions = res?.data?.suggestions ?? res?.suggestions ?? [];
  return Array.isArray(suggestions) ? suggestions : [];
};

export const useFetchAvailableClientCidrs = (
  projectId,
  region,
  vpcId,
  prefixLength = 24,
  limit = 8,
  options = {}
) => {
  return useQuery({
    queryKey: ["clientAvailableCidrs", { projectId, region, vpcId, prefixLength, limit }],
    queryFn: () =>
      fetchAvailableClientCidrs({
        project_id: projectId,
        region,
        vpc_id: vpcId,
        prefix_length: prefixLength,
        limit,
      }),
    enabled: !!projectId && !!region && !!vpcId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};
