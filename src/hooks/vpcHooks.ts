/**
 * Enhanced VPC Management Hooks
 *
 * Provides comprehensive VPC operations including:
 * - VPC CRUD operations
 * - Available CIDR suggestions
 * - VPC Flow Logs management
 * - Enhanced error handling and caching
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
import { type Vpc, type VpcFlowLog, type VpcApiResponse } from "../shared/types/vpc";
import logger from "../utils/logger";

// VPC Interfaces moved to shared/types/vpc.ts

const fetchVpcs = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}): Promise<VpcApiResponse<Vpc[]>> => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res: VpcApiResponse<Vpc[]> = await silentApi(
    "GET",
    `/business/vpcs${queryString ? `?${queryString}` : ""}`
  );
  if (!res) throw new Error("Failed to fetch VPCs");
  return res;
};

const fetchVpcById = async (id: string): Promise<VpcApiResponse<Vpc>> => {
  const res: VpcApiResponse<Vpc> = await silentApi("GET", `/business/vpcs/${id}`);
  if (!res) throw new Error(`Failed to fetch VPC with ID ${id}`);
  return res;
};

const createVpc = async (vpcData: Partial<Vpc>): Promise<Vpc> => {
  const res: VpcApiResponse<Vpc> = await api("POST", "/business/vpcs", vpcData);
  if (!res.data) throw new Error("Failed to create VPC");
  return res.data;
};

const updateVpc = async ({ id, vpcData }: { id: string; vpcData: Partial<Vpc> }): Promise<Vpc> => {
  const res: VpcApiResponse<Vpc> = await api("PATCH", `/business/vpcs/${id}`, vpcData);
  if (!res.data) throw new Error(`Failed to update VPC with ID ${id}`);
  return res.data;
};

const deleteVpc = async (id: string): Promise<unknown> => {
  const res: VpcApiResponse<unknown> = await api("DELETE", `/business/vpcs/${id}`);
  if (!res.data) throw new Error(`Failed to delete VPC with ID ${id}`);
  return res.data;
};

const syncVpcs = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}): Promise<VpcApiResponse<Vpc[]>> => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  params.append("refresh", "1");

  const queryString = params.toString();
  const res: VpcApiResponse<Vpc[]> = await silentApi(
    "GET",
    `/business/vpcs${queryString ? `?${queryString}` : ""}`
  );
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
      queryClient.invalidateQueries({ queryKey: ["vpc", variables.id] });
    },
    onError: (error: unknown) => {
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
}): Promise<string[]> => {
  const params = new URLSearchParams();
  params.append("project_id", project_id);
  params.append("region", region);
  params.append("vpc_id", vpc_id);
  if (prefix_length) params.append("prefix_length", String(prefix_length));
  if (limit) params.append("limit", String(limit));
  const res: VpcApiResponse<{ suggestions?: string[] }> = await silentApi(
    "GET",
    `/business/vpcs/available-cidrs?${params.toString()}`
  );
  const suggestions = res?.data?.suggestions ?? [];
  return Array.isArray(suggestions) ? suggestions : [];
};

export const useFetchAvailableCidrs = (
  projectId: string,
  region: string,
  vpcId: string,
  prefixLength: number = 24,
  limit: number = 8,
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

// ================================
// VPC Flow Logs Operations
// ================================

const fetchVpcFlowLogs = async (
  params: Record<string, string> = {}
): Promise<VpcApiResponse<VpcFlowLog[]>> => {
  const queryString = new URLSearchParams(params).toString();
  const res: VpcApiResponse<VpcFlowLog[]> = await silentApi(
    "GET",
    `/business/vpc-flow-logs${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch VPC flow logs");
  return res;
};

const fetchVpcFlowLogById = async (id: string): Promise<VpcFlowLog> => {
  const res: VpcApiResponse<VpcFlowLog> = await silentApi("GET", `/business/vpc-flow-logs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch VPC flow log with ID ${id}`);
  return res.data;
};

const createVpcFlowLog = async (flowLogData: Partial<VpcFlowLog>): Promise<VpcFlowLog> => {
  const res: VpcApiResponse<VpcFlowLog> = await api("POST", "/business/vpc-flow-logs", flowLogData);
  if (!res.data) throw new Error("Failed to create VPC flow log");
  return res.data;
};

const updateVpcFlowLog = async ({
  id,
  flowLogData,
}: {
  id: string;
  flowLogData: Partial<VpcFlowLog>;
}): Promise<VpcFlowLog> => {
  const res: VpcApiResponse<VpcFlowLog> = await api(
    "PATCH",
    `/business/vpc-flow-logs/${id}`,
    flowLogData
  );
  if (!res.data) throw new Error(`Failed to update VPC flow log with ID ${id}`);
  return res.data;
};

const deleteVpcFlowLog = async (id: string): Promise<unknown> => {
  const res: VpcApiResponse<unknown> = await api("DELETE", `/business/vpc-flow-logs/${id}`);
  if (!res.data) throw new Error(`Failed to delete VPC flow log with ID ${id}`);
  return res.data;
};

// ================================
// VPC Flow Logs Hooks
// ================================

export const useFetchVpcFlowLogs = (
  params: Record<string, string> = {},
  options: Record<string, unknown> = {}
) => {
  return useQuery({
    queryKey: ["vpc-flow-logs", params],
    queryFn: () => fetchVpcFlowLogs(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchVpcFlowLogById = (id: string, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["vpc-flow-log", id],
    queryFn: () => fetchVpcFlowLogById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateVpcFlowLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVpcFlowLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpc-flow-logs"] });
    },
    onError: (error) => {
      logger.error("Error creating VPC flow log:", error);
    },
  });
};

export const useUpdateVpcFlowLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVpcFlowLog,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpc-flow-logs"] });
      queryClient.invalidateQueries({ queryKey: ["vpc-flow-log", variables.id] });
    },
    onError: (error) => {
      logger.error("Error updating VPC flow log:", error);
    },
  });
};

export const useDeleteVpcFlowLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVpcFlowLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpc-flow-logs"] });
    },
    onError: (error) => {
      logger.error("Error deleting VPC flow log:", error);
    },
  });
};

// ================================
// Combined VPC Operations Hook
// ================================

// Hook that provides access to all VPC operations
export const useVpcOperations = () => {
  const queryClient = useQueryClient();

  const invalidateVpcData = (vpcId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    queryClient.invalidateQueries({ queryKey: ["vpc-flow-logs"] });
    if (vpcId) {
      queryClient.invalidateQueries({ queryKey: ["vpc", vpcId] });
    }
  };

  return {
    // VPC operations
    createVpc: useCreateTenantVpc(),
    updateVpc: useUpdateTenantVpc(),
    deleteVpc: useDeleteTenantVpc(),

    // Flow logs operations
    createFlowLog: useCreateVpcFlowLog(),
    updateFlowLog: useUpdateVpcFlowLog(),
    deleteFlowLog: useDeleteVpcFlowLog(),

    // Utility functions
    invalidateVpcData,
  };
};

// Export individual functions for direct use if needed
export {
  fetchVpcs,
  fetchVpcById,
  createVpc,
  updateVpc,
  deleteVpc,
  fetchAvailableCidrs,
  fetchVpcFlowLogs,
  fetchVpcFlowLogById,
  createVpcFlowLog,
  updateVpcFlowLog,
  deleteVpcFlowLog,
};
