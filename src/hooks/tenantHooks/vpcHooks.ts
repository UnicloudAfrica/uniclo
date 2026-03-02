import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import logger from "../../utils/logger";

const fetchVpcs = async ({ project_id, region }: { project_id?: string; region?: string }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await tenantSilentApi("GET", `/admin/vpcs${queryString ? `?${queryString}` : ""}`);
  if (!res) throw new Error("Failed to fetch VPCs");
  return res;
};

const fetchVpcById = async (id: string) => {
  const res = await tenantSilentApi("GET", `/admin/vpcs/${id}`);
  if (!res) throw new Error(`Failed to fetch VPC with ID ${id}`);
  return res;
};

const createVpc = async (vpcData: Record<string, unknown>) => {
  const res = await tenantApi("POST", "/admin/vpcs", vpcData);
  if (!res.data) throw new Error("Failed to create VPC");
  return res.data;
};

const updateVpc = async ({ id, vpcData }: { id: string; vpcData: Record<string, unknown> }) => {
  const res = await tenantApi("PATCH", `/admin/vpcs/${id}`, vpcData);
  if (!res.data) throw new Error(`Failed to update VPC with ID ${id}`);
  return res.data;
};

const deleteVpc = async (id: string) => {
  const res = await tenantApi("DELETE", `/admin/vpcs/${id}`);
  if (!res.data) throw new Error(`Failed to delete VPC with ID ${id}`);
  return res.data;
};

const syncVpcs = async ({ project_id, region }: { project_id?: string; region?: string }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  params.append("refresh", "1");

  const queryString = params.toString();
  const res = await tenantSilentApi("GET", `/admin/vpcs${queryString ? `?${queryString}` : ""}`);
  if (!res) throw new Error("Failed to sync VPCs");
  return res;
};

export const useFetchTenantVpcs = (
  projectId: string,
  region: string,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["vpcs", { projectId, region }],
    queryFn: () => fetchVpcs({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchVpcById = (id: string, options: Record<string, unknown> = {}) => {
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
      logger.error("Error creating VPC:", error);
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
      logger.error("Error updating VPC:", error);
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
      logger.error("Error deleting VPC:", error);
    },
  });
};

export const useSyncTenantVpcs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncVpcs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    },
    onError: (error) => {
      logger.error("Error syncing VPCs:", error);
    },
  });
};

// --- Available CIDR suggestions for a VPC (tenant) ---
const fetchAvailableCidrs = async ({
  project_id,
  region,
  vpc_id,
  prefix_length = 24,
  limit = 8,
}: {
  project_id: string;
  region: string;
  vpc_id: string;
  prefix_length?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  params.append("project_id", project_id);
  params.append("region", region);
  params.append("vpc_id", vpc_id);
  if (prefix_length) params.append("prefix_length", String(prefix_length));
  if (limit) params.append("limit", String(limit));
  const res = await tenantSilentApi("GET", `/admin/vpcs/available-cidrs?${params.toString()}`);
  const suggestions = (res as any)?.data?.suggestions ?? (res as any)?.suggestions ?? [];
  return Array.isArray(suggestions) ? suggestions : [];
};

export const useFetchAvailableCidrs = (
  projectId: string,
  region: string,
  vpcId: string,
  prefixLength = 24,
  limit = 8,
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["available-cidrs", { projectId, region, vpcId, prefixLength, limit }],
    queryFn: () =>
      fetchAvailableCidrs({
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
