import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

interface FetchSubnetsParams {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}

interface SubnetData {
  [key: string]: unknown;
}

const fetchClientSubnets = async ({ project_id, region, refresh = false }: FetchSubnetsParams) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/subnets${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch subnets");
  return res.data;
};

const fetchSubnetById = async (id: string | number) => {
  const res = await clientSilentApi<{ data: unknown }>("GET", `/business/subnets/${id}`);
  if (!res.data) throw new Error(`Failed to fetch subnet with ID ${id}`);
  return res.data;
};

const createClientSubnet = async (subnetData: SubnetData) => {
  const res = await clientApi<{ data: unknown }>("POST", "/business/subnets", subnetData);
  if (!res.data) throw new Error("Failed to create subnet");
  return res.data;
};

const updateClientSubnet = async ({
  id,
  subnetData,
}: {
  id: string | number;
  subnetData: SubnetData;
}) => {
  const res = await clientApi<{ data: unknown }>("PATCH", `/business/subnets/${id}`, subnetData);
  if (!res.data) throw new Error(`Failed to update subnet with ID ${id}`);
  return res.data;
};

const deleteClientSubnet = async ({
  id,
  payload,
}: {
  id: string | number;
  payload: Record<string, unknown>;
}) => {
  const res = await clientApi<{ data: unknown }>("DELETE", `/business/subnets/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete subnet with ID ${id}`);
  return res.data;
};

export const useFetchClientSubnets = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientSubnets", { projectId, region }],
    queryFn: () => fetchClientSubnets({ project_id: projectId, region }),
    enabled: !!projectId && !!region,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchClientSubnetById = (
  id: string | number,
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientSubnet", id],
    queryFn: () => fetchSubnetById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateClientSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientSubnet,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientSubnets", { projectId: variables.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useUpdateClientSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientSubnet,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientSubnets"] });
      queryClient.invalidateQueries({
        queryKey: ["clientSubnet", variables.id],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useDeleteClientSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientSubnet,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientSubnets", { projectId: variables.payload.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const syncClientSubnetsFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchClientSubnets({ project_id, region, refresh: true });
