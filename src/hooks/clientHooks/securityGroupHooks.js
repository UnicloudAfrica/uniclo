import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const fetchClientSecurityGroups = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await clientSilentApi(
    "GET",
    `/business/security-groups${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch security groups");
  return res.data;
};

const fetchSecurityGroupById = async (id) => {
  const res = await clientSilentApi("GET", `/business/security-groups/${id}`);
  if (!res.data) {
    throw new Error(`Failed to fetch security group with ID ${id}`);
  }
  return res.data;
};

const createSecurityGroup = async (securityGroupData) => {
  const res = await clientApi(
    "POST",
    "/business/security-groups",
    securityGroupData
  );
  if (!res.data) throw new Error("Failed to create security group");
  return res.data;
};

const updateSecurityGroup = async ({ id, securityGroupData }) => {
  const res = await clientApi(
    "PATCH",
    `/business/security-groups/${id}`,
    securityGroupData
  );
  if (!res.data)
    throw new Error(`Failed to update security group with ID ${id}`);
  return res.data;
};

const deleteClientSecurityGroup = async ({ id, payload }) => {
  const res = await clientApi(
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
  projectId,
  region,
  options = {}
) => {
  return useQuery({
    queryKey: ["clientSecurityGroups", { projectId, region }],
    queryFn: () => fetchClientSecurityGroups({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchSecurityGroupById = (id, options = {}) => {
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientSecurityGroups", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating security group:", error);
    },
  });
};

export const useUpdateClientSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientSecurityGroups"] });
      queryClient.invalidateQueries({
        queryKey: ["clientSecurityGroup", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating security group:", error);
    },
  });
};

export const useDeleteClientSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientSecurityGroups",
          { projectId: variables.payload.project_id },
        ],
      });
    },
    onError: (error) => {
      console.error("Error deleting security group:", error);
    },
  });
};
