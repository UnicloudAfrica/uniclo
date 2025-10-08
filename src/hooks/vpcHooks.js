// src/hooks/adminHooks/adminHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
// import silentTenantApi from "../index/tenant/silentTenant";
// import tenantApi from "../index/tenant/tenantApi";

const fetchVpcs = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/vpcs${queryString ? `?${queryString}` : ""}`
  );
  if (!res) throw new Error("Failed to fetch VPCs");
  return res;
};

const fetchVpcById = async (id) => {
  const res = await silentApi("GET", `/business/vpcs/${id}`);
  if (!res) throw new Error(`Failed to fetch VPC with ID ${id}`);
  return res;
};

const createVpc = async (vpcData) => {
  const res = await api("POST", "/business/vpcs", vpcData);
  if (!res.data) throw new Error("Failed to create VPC");
  return res.data;
};

const updateVpc = async ({ id, vpcData }) => {
  const res = await api("PATCH", `/business/vpcs/${id}`, vpcData);
  if (!res.data) throw new Error(`Failed to update VPC with ID ${id}`);
  return res.data;
};

const deleteVpc = async (id) => {
  const res = await api("DELETE", `/business/vpcs/${id}`);
  if (!res.data) throw new Error(`Failed to delete VPC with ID ${id}`);
  return res.data;
};

export const useFetchTenantVpcs = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["vpcs", { projectId, region }],
    queryFn: () => fetchVpcs({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchVpcById = (id, options = {}) => {
  return useQuery({
    queryKey: ["vpc", id],
    queryFn: () => fetchVpcById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVpc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    },
    onError: (error) => {
      console.error("Error creating VPC:", error);
    },
  });
};

export const useUpdateTenantVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVpc,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
      queryClient.invalidateQueries({ queryKey: ["vpc", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating VPC:", error);
    },
  });
};

export const useDeleteTenantVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVpc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    },
    onError: (error) => {
      console.error("Error deleting VPC:", error);
    },
  });
};
