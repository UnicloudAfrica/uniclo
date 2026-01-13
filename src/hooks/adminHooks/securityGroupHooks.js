import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi, { adminSilentApi } from "../../index/admin/api";

const fetchSecurityGroups = async ({ project_id, region, refresh = false }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await adminSilentApi(
    "GET",
    `/security-groups${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch security groups");
  return res.data;
};

const fetchSecurityGroupById = async (id) => {
  const res = await adminSilentApi("GET", `/security-groups/${id}`);
  if (!res.data)
    throw new Error(`Failed to fetch security group with ID ${id}`);
  return res.data;
};

const createSecurityGroup = async (securityGroupData) => {
  const res = await adminApi("POST", "/security-groups", securityGroupData);
  if (!res) throw new Error("Failed to create security group");
  return res;
};

const updateSecurityGroup = async ({ id, securityGroupData }) => {
  const res = await adminApi("PATCH", `/security-groups/${id}`, securityGroupData);
  if (!res.data)
    throw new Error(`Failed to update security group with ID ${id}`);
  return res.data;
};

const deleteSecurityGroup = async (id) => {
  const res = await adminApi("DELETE", `/security-groups/${id}`);
  if (!res.data)
    throw new Error(`Failed to delete security group with ID ${id}`);
  return res.data;
};

export const useFetchSecurityGroups = (projectId, region, options = {}) => {
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

export const useCreateSecurityGroup = () => {
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

export const useUpdateSecurityGroup = () => {
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

export const useDeleteSecurityGroup = () => {
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

export const syncSecurityGroupsFromProvider = async ({ project_id, region }) => {
  return fetchSecurityGroups({ project_id, region, refresh: true });
};
