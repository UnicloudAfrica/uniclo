// src/hooks/adminHooks/subnetHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
// import silentTenantApi from "../index/tenant/silentTenant";
// import tenantApi from "../index/tenant/tenantApi";

const fetchSubnets = async ({ project_id, region }: { project_id?: string; region?: string }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi("GET", `/business/subnets${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch subnets");
  return res.data;
};

const fetchSubnetById = async (id: string) => {
  const res = await silentApi("GET", `/business/subnets/${id}`);
  if (!res.data) throw new Error(`Failed to fetch subnet with ID ${id}`);
  return res.data;
};

const createSubnet = async (subnetData: Record<string, unknown>) => {
  const res = await api("POST", "/business/subnets", subnetData);
  if (!res.data) throw new Error("Failed to create subnet");
  return res.data;
};

const updateSubnet = async ({
  id,
  subnetData,
}: {
  id: string;
  subnetData: Record<string, unknown>;
}) => {
  const res = await api("PATCH", `/business/subnets/${id}`, subnetData);
  if (!res.data) throw new Error(`Failed to update subnet with ID ${id}`);
  return res.data;
};

const deleteSubnet = async (id: string) => {
  const res = await api("DELETE", `/business/subnets/${id}`);
  if (!res.data) throw new Error(`Failed to delete subnet with ID ${id}`);
  return res.data;
};

const syncSubnets = async ({ project_id, region }: { project_id?: string; region?: string }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  params.append("refresh", "1");

  const queryString = params.toString();
  const res = await silentApi("GET", `/business/subnets${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to sync subnets");
  return res.data;
};

export const useFetchTenantSubnets = (
  projectId: string,
  region: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["subnets", { projectId, region }],
    queryFn: () => fetchSubnets({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchSubnetById = (id: string, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["subnet", id],
    queryFn: () => fetchSubnetById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubnet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
    },
    onError: (error) => {
      console.error("Error creating subnet:", error);
    },
  });
};

export const useUpdateTenantSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSubnet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["subnet", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating subnet:", error);
    },
  });
};

export const useDeleteTenantSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubnet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
    },
    onError: (error) => {
      console.error("Error deleting subnet:", error);
    },
  });
};

export const useSyncTenantSubnets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncSubnets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
    },
    onError: (error) => {
      console.error("Error syncing subnets:", error);
    },
  });
};
