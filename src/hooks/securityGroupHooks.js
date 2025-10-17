import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
// import silentTenantApi from "../index/tenant/silentTenant";
// import tenantApi from "../index/tenant/tenantApi";

const fetchSecurityGroups = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/security-groups${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch security groups");
  return res.data;
};

const fetchSecurityGroupById = async (id) => {
  const res = await silentApi("GET", `/business/security-groups/${id}`);
  if (!res.data)
    throw new Error(`Failed to fetch security group with ID ${id}`);
  return res.data;
};

const createSecurityGroup = async (securityGroupData) => {
  const res = await api("POST", "/business/security-groups", securityGroupData);
  if (!res.data) throw new Error("Failed to create security group");
  return res.data;
};

const updateSecurityGroup = async ({ id, securityGroupData }) => {
  const res = await api(
    "PATCH",
    `/business/security-groups/${id}`,
    securityGroupData
  );
  if (!res.data)
    throw new Error(`Failed to update security group with ID ${id}`);
  return res.data;
};

const deleteSecurityGroup = async (id) => {
  const res = await api("DELETE", `/business/security-groups/${id}`);
  if (!res.data)
    throw new Error(`Failed to delete security group with ID ${id}`);
  return res.data;
};

const syncSecurityGroups = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  params.append("refresh", "1");

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/security-groups${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to sync security groups");
  return res.data;
};

export const useFetchTenantSecurityGroups = (
  projectId,
  region,
  options = {}
) => {
  return useQuery({
    queryKey: ["securityGroups", { projectId, region }],
    queryFn: () => fetchSecurityGroups({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchSecurityGroupById = (id, options = {}) => {
  return useQuery({
    queryKey: ["securityGroup", id],
    queryFn: () => fetchSecurityGroupById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSecurityGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
    },
    onError: (error) => {
      console.error("Error creating security group:", error);
    },
  });
};

export const useUpdateTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
      queryClient.invalidateQueries({
        queryKey: ["securityGroup", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating security group:", error);
    },
  });
};

export const useDeleteTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSecurityGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
    },
    onError: (error) => {
      console.error("Error deleting security group:", error);
    },
  });
};

export const useSyncTenantSecurityGroups = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncSecurityGroups,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
    },
    onError: (error) => {
      console.error("Error syncing security groups:", error);
    },
  });
};
