// src/hooks/eni.js (tenant dashboard)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";

const fetchNetworkInterfaces = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/network-interfaces${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch network interfaces");
  return res.data;
};

const createNetworkInterface = async (payload) => {
  const res = await api("POST", "/business/network-interfaces", payload);
  if (!res.data) throw new Error("Failed to create network interface");
  return res.data;
};

const deleteNetworkInterface = async ({ id, payload }) => {
  const res = await api(
    "DELETE",
    `/business/network-interfaces/${id}`,
    payload
  );
  if (!res.data) throw new Error("Failed to delete network interface");
  return res.data;
};

const attachSecurityGroup = async (params) => {
  // Backward compatibility: support old signature ({ id, securityGroupData })
  let payload = params;
  if (params && typeof params === 'object' && 'id' in params && 'securityGroupData' in params) {
    payload = { network_interface_id: params.id, ...(params.securityGroupData || {}) };
  }
  const res = await api(
    "POST",
    "/business/network-interface-security-groups",
    payload
  );
  if (!res.data)
    throw new Error(
      `Failed to attach security group to network interface`
    );
  return res.data;
};

const detachSecurityGroup = async (params) => {
  // Backward compatibility: support old signature ({ id, securityGroupData })
  let payload = params;
  if (params && typeof params === 'object' && 'id' in params && 'securityGroupData' in params) {
    payload = { network_interface_id: params.id, ...(params.securityGroupData || {}) };
  }
  const res = await api(
    "DELETE",
    "/business/network-interface-security-groups",
    payload
  );
  if (!res.data)
    throw new Error(
      `Failed to detach security group from network interface`
    );
  return res.data;
};

const syncNetworkInterfaces = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  params.append("refresh", "1");

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/network-interfaces${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to sync network interfaces");
  return res.data;
};

export const useFetchTenantNetworkInterfaces = (
  projectId,
  region,
  options = {}
) => {
  return useQuery({
    queryKey: ["networkInterfaces", { projectId, region }],
    queryFn: () => fetchNetworkInterfaces({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantNetworkInterface = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNetworkInterface,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networkInterfaces"] });
    },
    onError: (error) => {
      console.error("Error creating network interface:", error);
    },
  });
};

export const useDeleteTenantNetworkInterface = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNetworkInterface,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networkInterfaces"] });
    },
    onError: (error) => {
      console.error("Error deleting network interface:", error);
    },
  });
};

export const useAttachTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachSecurityGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networkInterfaces"] });
    },
    onError: (error) => {
      console.error("Error attaching security group:", error);
    },
  });
};

export const useDetachTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachSecurityGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networkInterfaces"] });
    },
    onError: (error) => {
      console.error("Error detaching security group:", error);
    },
  });
};

export const useSyncTenantNetworkInterfaces = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncNetworkInterfaces,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["networkInterfaces"] });
    },
    onError: (error) => {
      console.error("Error syncing network interfaces:", error);
    },
  });
};
