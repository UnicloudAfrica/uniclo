import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

interface FetchVpcsParams {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}

interface VpcData {
  [key: string]: unknown;
}

const fetchClientVpcs = async ({ project_id, region, refresh = false }: FetchVpcsParams) => {
  // Validate required parameters before making API call
  if (!project_id || !region) {
    return [];
  }

  const params = new URLSearchParams();
  params.append("project_id", project_id);
  params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/vpcs${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch VPCs");
  return res.data;
};

const fetchClientVpcById = async (id: string | number) => {
  const res = await clientSilentApi<{ data: unknown }>("GET", `/business/vpcs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch VPC with ID ${id}`);
  return res.data;
};

const createClientVpc = async (vpcData: VpcData) => {
  const res = await clientApi<{ data: unknown }>("POST", "/business/vpcs", vpcData);
  if (!res.data) throw new Error("Failed to create VPC");
  return res.data;
};

const updateClientVpc = async ({ id, vpcData }: { id: string | number; vpcData: VpcData }) => {
  const res = await clientApi<{ data: unknown }>("PATCH", `/business/vpcs/${id}`, vpcData);
  if (!res.data) throw new Error(`Failed to update VPC with ID ${id}`);
  return res.data;
};

const deleteClientVpc = async ({
  id,
  payload,
}: {
  id: string | number;
  payload: Record<string, unknown>;
}) => {
  const res = await clientApi<{ data: unknown }>("DELETE", `/business/vpcs/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete VPC with ID ${id}`);
  return res.data;
};

export const useFetchClientVpcs = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientVpcs", { projectId, region }],
    queryFn: () => fetchClientVpcs({ project_id: projectId, region }),
    // Only enable if both projectId and region are non-empty strings
    enabled: !!projectId && !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchClientVpcById = (
  id: string | number,
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientVpcs", { projectId: variables.project_id }],
      });
    },
    onError: () => {
      // Error handling logic
    },
  });
};

export const useUpdateClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientVpc,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientVpcs"] });
      queryClient.invalidateQueries({
        queryKey: ["clientVpc", variables.id],
      });
    },
    onError: () => {
      // Error handling logic
    },
  });
};

export const useDeleteClientVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientVpc,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientVpcs", { projectId: variables.payload.project_id }],
      });
    },
    onError: () => {
      // Error handling logic
    },
  });
};

export const syncClientVpcsFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchClientVpcs({ project_id, region, refresh: true });

// --- Available CIDR suggestions for a VPC (client) ---
interface FetchAvailableCidrsParams {
  project_id: string;
  region: string;
  vpc_id: string;
  prefix_length?: number;
  limit?: number;
}

const fetchAvailableClientCidrs = async ({
  project_id,
  region,
  vpc_id,
  prefix_length = 24,
  limit = 8,
}: FetchAvailableCidrsParams) => {
  const params = new URLSearchParams();
  params.append("project_id", project_id);
  params.append("region", region);
  params.append("vpc_id", vpc_id);
  if (prefix_length) params.append("prefix_length", String(prefix_length));
  if (limit) params.append("limit", String(limit));
  const res = await clientSilentApi<{
    data?: { suggestions: string[] };
    suggestions?: string[];
  }>("GET", `/business/vpcs/available-cidrs?${params.toString()}`);
  const suggestions = res?.data?.suggestions ?? res?.suggestions ?? [];
  return Array.isArray(suggestions) ? suggestions : [];
};

export const useFetchAvailableClientCidrs = (
  projectId: string,
  region: string,
  vpcId: string,
  prefixLength = 24,
  limit = 8,
  options: Omit<UseQueryOptions<string[], Error>, "queryKey" | "queryFn"> = {}
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
