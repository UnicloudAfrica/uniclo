import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "./useApiContext";
import ToastUtils from "../utils/toastUtil";

/**
 * Hook to manage Auto-scaling operations across Admin, Tenant, and Client dashboards.
 */

const getApiPrefix = (context: string) => {
  return context === "admin" ? "" : "/business";
};

// ==================== Launch Configurations ====================

/**
 * Fetch launch configurations - works at tenant level (no project/region required)
 */
export const useLaunchConfigurations = (projectId?: string, region?: string) => {
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["launch-configurations", projectId || "tenant", region || "default"],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (region) params.region = region;

      const { data } = await axios.get(`${apiBaseUrl}${prefix}/launch-configurations`, {
        params,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data.data || data;
    },
    enabled: !!authToken,
  });
};

export const useCreateLaunchConfiguration = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      region: string;
      name: string;
      instance_type: string;
      image_id?: string;
      key_pair?: string;
      security_groups?: string[];
      user_data?: string;
      description?: string;
    }) => {
      const { data } = await axios.post(`${apiBaseUrl}${prefix}/launch-configurations`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data;
    },
    onSuccess: (_, variables) => {
      ToastUtils.success("Launch configuration created successfully");
      queryClient.invalidateQueries({ queryKey: ["launch-configurations", variables.project_id] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to create launch configuration");
    },
  });
};

export const useDeleteLaunchConfiguration = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      region,
    }: {
      id: string;
      projectId: string;
      region: string;
    }) => {
      await axios.delete(`${apiBaseUrl}${prefix}/launch-configurations/${id}`, {
        params: { project_id: projectId, region },
        headers: { Authorization: `Bearer ${authToken}` },
      });
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Launch configuration deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["launch-configurations", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to delete launch configuration");
    },
  });
};

// ==================== Auto-scaling Groups ====================

/**
 * Fetch auto-scaling groups - works at tenant level (no project/region required)
 */
export const useAutoScalingGroups = (projectId?: string, region?: string) => {
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["autoscaling-groups", projectId || "tenant", region || "default"],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (region) params.region = region;

      const { data } = await axios.get(`${apiBaseUrl}${prefix}/autoscaling-groups`, {
        params,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data.data || data;
    },
    enabled: !!authToken,
  });
};

export const useAutoScalingGroup = (id: string, projectId: string, region: string) => {
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["autoscaling-group", id],
    queryFn: async () => {
      const { data } = await axios.get(`${apiBaseUrl}${prefix}/autoscaling-groups/${id}`, {
        params: { project_id: projectId, region },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data.data || data;
    },
    enabled: !!id && !!projectId && !!region && !!authToken,
  });
};

export const useCreateAutoScalingGroup = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      region: string;
      name: string;
      min_size: number;
      max_size: number;
      launch_configuration_id: string;
      desired_capacity?: number;
      subnets?: string[];
      target_group_ids?: string[];
      health_check_type?: "vm_monitor" | "load_balancer";
      health_check_grace_period?: number;
      default_cooldown?: number;
    }) => {
      const { data } = await axios.post(`${apiBaseUrl}${prefix}/autoscaling-groups`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data;
    },
    onSuccess: (_, variables) => {
      ToastUtils.success("Auto-scaling group created successfully");
      queryClient.invalidateQueries({ queryKey: ["autoscaling-groups", variables.project_id] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to create auto-scaling group");
    },
  });
};

export const useUpdateAutoScalingGroup = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      region,
      ...updates
    }: {
      id: string;
      projectId: string;
      region: string;
      name?: string;
      min_size?: number;
      max_size?: number;
      desired_capacity?: number;
      launch_configuration_id?: string;
    }) => {
      const { data } = await axios.patch(
        `${apiBaseUrl}${prefix}/autoscaling-groups/${id}`,
        {
          project_id: projectId,
          region,
          ...updates,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return data;
    },
    onSuccess: (_, { projectId, id }) => {
      ToastUtils.success("Auto-scaling group updated successfully");
      queryClient.invalidateQueries({ queryKey: ["autoscaling-groups", projectId] });
      queryClient.invalidateQueries({ queryKey: ["autoscaling-group", id] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to update auto-scaling group");
    },
  });
};

export const useDeleteAutoScalingGroup = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      region,
    }: {
      id: string;
      projectId: string;
      region: string;
    }) => {
      await axios.delete(`${apiBaseUrl}${prefix}/autoscaling-groups/${id}`, {
        params: { project_id: projectId, region },
        headers: { Authorization: `Bearer ${authToken}` },
      });
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Auto-scaling group deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["autoscaling-groups", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to delete auto-scaling group");
    },
  });
};

// ==================== Scaling Policies ====================

export const useScalingPolicies = (projectId: string, region: string, groupId?: string) => {
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["scaling-policies", projectId, region, groupId],
    queryFn: async () => {
      const { data } = await axios.get(`${apiBaseUrl}${prefix}/scaling-policies`, {
        params: { project_id: projectId, region, group_id: groupId },
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data.data || data;
    },
    enabled: !!projectId && !!region && !!authToken,
  });
};

export const useCreateScalingPolicy = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      region: string;
      name: string;
      group_id: string;
      metric_type: string;
      target_value: string;
      disable_scale_in?: boolean;
      estimated_warmup?: number;
    }) => {
      const { data } = await axios.post(`${apiBaseUrl}${prefix}/scaling-policies`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return data;
    },
    onSuccess: (_, variables) => {
      ToastUtils.success("Scaling policy created successfully");
      queryClient.invalidateQueries({
        queryKey: ["scaling-policies", variables.project_id, variables.region, variables.group_id],
      });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to create scaling policy");
    },
  });
};

export const useDeleteScalingPolicy = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authToken } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      region,
    }: {
      id: string;
      projectId: string;
      region: string;
    }) => {
      await axios.delete(`${apiBaseUrl}${prefix}/scaling-policies/${id}`, {
        params: { project_id: projectId, region },
        headers: { Authorization: `Bearer ${authToken}` },
      });
    },
    onSuccess: (_, { projectId, region }) => {
      ToastUtils.success("Scaling policy deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["scaling-policies", projectId, region] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to delete scaling policy");
    },
  });
};
