import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

interface FetchSecurityGroupsParams {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}

interface SecurityGroupData {
  [key: string]: unknown;
}

const fetchClientSecurityGroups = async ({
  project_id,
  region,
  refresh = false,
}: FetchSecurityGroupsParams) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/security-groups${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch security groups");
  return res.data;
};

const fetchSecurityGroupById = async (id: string | number) => {
  const res = await clientSilentApi<{ data: unknown }>("GET", `/business/security-groups/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch security group with ID ${id}`);
  }
  return res.data;
};

const createSecurityGroup = async (securityGroupData: SecurityGroupData) => {
  const res = await clientApi<{ data: unknown }>(
    "POST",
    "/business/security-groups",
    securityGroupData
  );
  if (!res.data) throw new Error("Failed to create security group");
  return res.data;
};

const updateSecurityGroup = async ({
  id,
  securityGroupData,
}: {
  id: string | number;
  securityGroupData: SecurityGroupData;
}) => {
  const res = await clientApi<{ data: unknown }>(
    "PATCH",
    `/business/security-groups/${id}`,
    securityGroupData
  );
  if (!res.data) throw new Error(`Failed to update security group with ID ${id}`);
  return res.data;
};

const deleteClientSecurityGroup = async ({
  id,
  payload,
}: {
  id: string | number;
  payload: Record<string, unknown>;
}) => {
  const res = await clientApi<{ data: unknown }>(
    "DELETE",
    `/business/security-groups/${id}`,
    payload
  );
  if (!res.data) {
    throw new Error(`Failed to delete security group with ID ${id}`);
  }
  return res.data;
};

export const useFetchClientSecurityGroups = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientSecurityGroups", { projectId, region }],
    queryFn: () => fetchClientSecurityGroups({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchSecurityGroupById = (
  id: string | number,
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientSecurityGroup", id],
    queryFn: () => fetchSecurityGroupById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateClientSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSecurityGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientSecurityGroups", { projectId: variables.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useUpdateClientSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSecurityGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientSecurityGroups"] });
      queryClient.invalidateQueries({
        queryKey: ["clientSecurityGroup", variables.id],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useDeleteClientSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientSecurityGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientSecurityGroups", { projectId: variables.payload.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const syncClientSecurityGroupsFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchClientSecurityGroups({ project_id, region, refresh: true });
