import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import logger from "../../utils/logger";

const fetchTenantSecurityGroups = async ({
  project_id,
  region,
  refresh = false,
}: {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await tenantSilentApi(
    "GET",
    `/admin/security-groups${queryString ? `?${queryString}` : ""}`
  );
  if (!res?.data) throw new Error("Failed to fetch security groups");
  return res.data;
};

const fetchTenantSecurityGroupById = async (id: string) => {
  const res = await tenantSilentApi("GET", `/admin/security-groups/${id}`);
  if (!res?.data) {
    throw new Error(`Failed to fetch security group with ID ${id}`);
  }
  return res.data;
};

const createTenantSecurityGroup = async (securityGroupData: Record<string, unknown>) => {
  const res = await tenantApi("POST", "/admin/security-groups", securityGroupData);
  if (!res?.data) throw new Error("Failed to create security group");
  return res.data;
};

const updateTenantSecurityGroup = async ({
  id,
  securityGroupData,
}: {
  id: string;
  securityGroupData: Record<string, unknown>;
}) => {
  const res = await tenantApi("PATCH", `/admin/security-groups/${id}`, securityGroupData);
  if (!res?.data) {
    throw new Error(`Failed to update security group with ID ${id}`);
  }
  return res.data;
};

const deleteTenantSecurityGroup = async ({
  id,
  payload,
}: {
  id: string;
  payload: Record<string, unknown>;
}) => {
  const res = await tenantApi("DELETE", `/admin/security-groups/${id}`, payload);
  if (!res?.data) {
    throw new Error(`Failed to delete security group with ID ${id}`);
  }
  return res.data;
};

export const useFetchTenantSecurityGroups = (
  projectId: string,
  region: string,
  options: Record<string, unknown> = {}
) =>
  useQuery({
    queryKey: ["tenantSecurityGroups", { projectId, region }],
    queryFn: () => fetchTenantSecurityGroups({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantSecurityGroupById = (
  id: string,
  options: Record<string, unknown> = {}
) =>
  useQuery({
    queryKey: ["tenantSecurityGroup", id],
    queryFn: () => fetchTenantSecurityGroupById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantSecurityGroups", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      logger.error("Error creating security group:", error);
    },
  });
};

export const useUpdateTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenantSecurityGroups"] });
      queryClient.invalidateQueries({
        queryKey: ["tenantSecurityGroup", variables.id],
      });
    },
    onError: (error) => {
      logger.error("Error updating security group:", error);
    },
  });
};

export const useDeleteTenantSecurityGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantSecurityGroup,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantSecurityGroups", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error) => {
      logger.error("Error deleting security group:", error);
    },
  });
};

export const syncTenantSecurityGroupsFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchTenantSecurityGroups({ project_id, region, refresh: true });
