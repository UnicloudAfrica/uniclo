import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const buildQueryString = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  return search.toString();
};

const fetchClientNetworks = async ({ project_id, region, refresh = false }) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi(
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
}) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi(
    "GET",
    `/business/network-interfaces${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch network interfaces");
  }

  return res.data;
};

const createClientNetworkInterface = async (payload) => {
  const res = await clientApi("POST", "/business/network-interfaces", payload);
  if (!res) {
    throw new Error("Failed to create network interface");
  }
  return res;
};

const attachClientNetworkInterfaceSecurityGroup = async (payload) => {
  const res = await clientApi(
    "POST",
    "/business/network-interface-security-groups",
    payload
  );
  if (!res) {
    throw new Error("Failed to attach security group");
  }
  return res;
};

const detachClientNetworkInterfaceSecurityGroup = async (payload) => {
  const res = await clientApi(
    "DELETE",
    "/business/network-interface-security-groups",
    payload
  );
  if (!res) {
    throw new Error("Failed to detach security group");
  }
  return res;
};

export const useFetchClientNetworks = (projectId, region, options = {}) => {
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
  projectId,
  region,
  options = {}
) => {
  return useQuery({
    queryKey: ["clientNetworkInterfaces", { projectId, region }],
    queryFn: () =>
      fetchClientNetworkInterfaces({ project_id: projectId, region }),
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientNetworkInterfaces",
          { projectId: variables.project_id, region: variables.region },
        ],
      });
    },
    onError: (error) => {
      console.error("Error creating network interface:", error);
    },
  });
};

export const useAttachClientNetworkInterfaceSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachClientNetworkInterfaceSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientNetworkInterfaces",
          { projectId: variables.project_id, region: variables.region },
        ],
      });
    },
    onError: (error) => {
      console.error("Error attaching security group:", error);
    },
  });
};

export const useDetachClientNetworkInterfaceSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachClientNetworkInterfaceSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientNetworkInterfaces",
          { projectId: variables.project_id, region: variables.region },
        ],
      });
    },
    onError: (error) => {
      console.error("Error detaching security group:", error);
    },
  });
};

export const syncClientNetworksFromProvider = async ({
  project_id,
  region,
}) => fetchClientNetworks({ project_id, region, refresh: true });

export const syncClientNetworkInterfacesFromProvider = async ({
  project_id,
  region,
}) => fetchClientNetworkInterfaces({ project_id, region, refresh: true });
