// src/hooks/adminHooks/networkInterfaceHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const fetchNetworkInterfaces = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentTenantApi(
    "GET",
    `/admin/network-interfaces${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch network interfaces");
  return res.data;
};

const attachSecurityGroup = async ({ id, securityGroupData }) => {
  const res = await tenantApi(
    "POST",
    `/admin/network-interfaces/${id}/attach-security-group`,
    securityGroupData
  );
  if (!res.data)
    throw new Error(
      `Failed to attach security group to network interface ${id}`
    );
  return res.data;
};

const detachSecurityGroup = async ({ id, securityGroupData }) => {
  const res = await tenantApi(
    "POST",
    `/admin/network-interfaces/${id}/detach-security-group`,
    securityGroupData
  );
  if (!res.data)
    throw new Error(
      `Failed to detach security group from network interface ${id}`
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
