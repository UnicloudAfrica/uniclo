import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

type QueryParams = Record<string, string | boolean | number | undefined | null>;

const buildQueryString = (params: QueryParams) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  return search.toString();
};

interface FetchNetworkParams {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}

const fetchClientNetworks = async ({ project_id, region, refresh = false }: FetchNetworkParams) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/networks${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch networks");
  }

  return res.data;
};

const fetchClientNetworkInterfaces = async ({
  project_id,
  region,
  refresh = false,
}: FetchNetworkParams) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/network-interfaces${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch network interfaces");
  }

  return res.data;
};

const createClientNetworkInterface = async (payload: Record<string, unknown>) => {
  const res = await clientApi("POST", "/business/network-interfaces", payload);
  if (!res) {
    throw new Error("Failed to create network interface");
  }
  return res;
};

const attachClientNetworkInterfaceSecurityGroup = async (payload: Record<string, unknown>) => {
  const res = await clientApi("POST", "/business/network-interface-security-groups", payload);
  if (!res) {
    throw new Error("Failed to attach security group");
  }
  return res;
};

const detachClientNetworkInterfaceSecurityGroup = async (payload: Record<string, unknown>) => {
  const res = await clientApi("DELETE", "/business/network-interface-security-groups", payload);
  if (!res) {
    throw new Error("Failed to detach security group");
  }
  return res;
};

export const useFetchClientNetworks = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientNetworks", { projectId, region }],
    queryFn: () => fetchClientNetworks({ project_id: projectId, region }),
    enabled: Boolean(projectId && region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchClientNetworkInterfaces = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientNetworkInterfaces", { projectId, region }],
    queryFn: () => fetchClientNetworkInterfaces({ project_id: projectId, region }),
    enabled: Boolean(projectId && region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateClientNetworkInterface = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientNetworkInterface,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientNetworkInterfaces",
          { projectId: variables.project_id, region: variables.region },
        ],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useAttachClientNetworkInterfaceSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachClientNetworkInterfaceSecurityGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientNetworkInterfaces",
          { projectId: variables.project_id, region: variables.region },
        ],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useDetachClientNetworkInterfaceSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachClientNetworkInterfaceSecurityGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientNetworkInterfaces",
          { projectId: variables.project_id, region: variables.region },
        ],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const syncClientNetworksFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchClientNetworks({ project_id, region, refresh: true });

export const syncClientNetworkInterfacesFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchClientNetworkInterfaces({ project_id, region, refresh: true });
