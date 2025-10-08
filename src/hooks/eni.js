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

const attachSecurityGroup = async (securityGroupData) => {
  // Shared endpoint: POST /business/network-interface-security-groups
  const res = await api(
    "POST",
    "/business/network-interface-security-groups",
    securityGroupData
  );
  if (!res.data)
    throw new Error(
      `Failed to attach security group to network interface`
    );
  return res.data;
};

const detachSecurityGroup = async (securityGroupData) => {
  // Shared endpoint: DELETE /business/network-interface-security-groups with body
  const res = await api(
    "DELETE",
    "/business/network-interface-security-groups",
    securityGroupData
  );
  if (!res.data)
    throw new Error(
      `Failed to detach security group from network interface`
    );
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
