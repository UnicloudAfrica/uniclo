import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

const fetchNetworkInterfgace = async ({ project_id, region, refresh = false }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/network-interfaces${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch network interfaces");
  return res.data;
};

const createNetworkInterface = async (payload) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/network-interfaces",
    payload
  );
  if (!res) throw new Error("Failed to create network interface");
  return res;
};

const attachNetworkInterfaceSecurityGroup = async (payload) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/network-interface-security-groups",
    payload
  );
  if (!res) throw new Error("Failed to attach security group");
  return res;
};

const detachNetworkInterfaceSecurityGroup = async (payload) => {
  const res = await apiAdminforUser(
    "DELETE",
    "/business/network-interface-security-groups",
    payload
  );
  if (!res) throw new Error("Failed to detach security group");
  return res;
};

export const useFetchNetworkInterfaces = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["networkInterfaces", { projectId, region }],
    queryFn: () => fetchNetworkInterfgace({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateNetworkInterface = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNetworkInterface,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["networkInterfaces", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating network interface:", error);
    },
  });
};

export const useAttachNetworkInterfaceSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachNetworkInterfaceSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["networkInterfaces", { projectId: variables.project_id }] });
    },
  });
};

export const useDetachNetworkInterfaceSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachNetworkInterfaceSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["networkInterfaces", { projectId: variables.project_id }] });
    },
  });
};

export const syncNetworkInterfacesFromProvider = async ({ project_id, region }) => {
  return fetchNetworkInterfgace({ project_id, region, refresh: true });
};

// Fetch networks for a project and region
const fetchNetworks = async ({ project_id, region, refresh = false }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "true");

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/networks${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch networks");
  return res.data;
};

export const useFetchNetworks = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["networks", { projectId, region }],
    queryFn: () => fetchNetworks({ project_id: projectId, region }),
    enabled: Boolean(projectId && region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const syncNetworksFromProvider = async ({ project_id, region }) => {
  return fetchNetworks({ project_id, region, refresh: true });
};
