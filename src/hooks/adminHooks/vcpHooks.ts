import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";
import { type Vpc, type VpcApiResponse } from "../../shared/types/vpc";

// VPC Interfaces moved to shared/types/vpc.ts

const fetchVpcs = async ({
  project_id,
  region,
  refresh = false,
}: {
  project_id: string;
  region: string;
  refresh?: boolean;
}): Promise<VpcApiResponse<Vpc[]>> => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1"); // Laravel boolean: 1 = true, 0 = false

  const queryString = params.toString();
  const res: VpcApiResponse<Vpc[]> = await adminSilentApiforUser(
    "GET",
    `/business/vpcs${queryString ? `?${queryString}` : ""}`
  );
  if (!res) throw new Error("Failed to fetch VPCs");
  return res;
};

// Separate function for explicit refresh/sync
export const syncVpcsFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => {
  return fetchVpcs({ project_id, region, refresh: true });
};

const fetchVpcById = async (id: string): Promise<Vpc> => {
  const res: VpcApiResponse<Vpc> = await adminSilentApiforUser("GET", `/business/vpcs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch VPC with ID ${id}`);
  return res.data;
};

const createVpc = async (vpcData: Partial<Vpc>): Promise<VpcApiResponse<Vpc>> => {
  const res: VpcApiResponse<Vpc> = await apiAdminforUser("POST", "/business/vpcs", vpcData);
  if (!res) throw new Error("Failed to create VPC");
  return res;
};

const updateVpc = async ({ id, vpcData }: { id: string; vpcData: Partial<Vpc> }): Promise<Vpc> => {
  const res: VpcApiResponse<Vpc> = await apiAdminforUser("PATCH", `/business/vpcs/${id}`, vpcData);
  if (!res.data) throw new Error(`Failed to update VPC with ID ${id}`);
  return res.data;
};

const deleteVpc = async (id: string): Promise<VpcApiResponse<unknown>> => {
  const res: VpcApiResponse<unknown> = await apiAdminforUser("DELETE", `/business/vpcs/${id}`);
  if (!res) throw new Error(`Failed to delete VPC with ID ${id}`);
  return res;
};

export const useFetchVpcs = (
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

export const useCreateVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVpc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    },
    onError: (error: unknown) => {
      console.error("Error creating VPC:", error);
    },
  });
};

export const useUpdateVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVpc,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
      queryClient.invalidateQueries({ queryKey: ["vpc", variables.id] });
    },
    onError: (error: unknown) => {
      console.error("Error updating VPC:", error);
    },
  });
};

export const useDeleteVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVpc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    },
    onError: (error: unknown) => {
      console.error("Error deleting VPC:", error);
    },
  });
};

// --- Available CIDR suggestions for a VPC ---
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
  const res: VpcApiResponse<{ suggestions?: string[] }> = await adminSilentApiforUser(
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
