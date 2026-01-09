import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "./useApiContext";
import ToastUtils from "../utils/toastUtil";

/**
 * Hook to manage Storage (Snapshots & Images) operations across Admin, Tenant, and Client dashboards.
 */

const getApiPrefix = (context: string) => {
  return context === "admin" ? "" : "/business";
};

// ==================== Snapshots (Volumes) ====================

export const useSnapshots = (projectId: string, region: string, volumeId?: string) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["snapshots", projectId, region, volumeId],
    queryFn: async () => {
      const { data } = await axios.get(`${apiBaseUrl}${prefix}/snapshots`, {
        params: { project_id: projectId, region, volume_id: volumeId },
        headers: authHeaders,
        withCredentials: true,
      });
      return data.data || data;
    },
    enabled: !!projectId && !!region && isAuthenticated,
  });
};

export const useCreateSnapshot = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      region: string;
      volume_id: string;
      name: string;
      description?: string;
    }) => {
      const { data } = await axios.post(`${apiBaseUrl}${prefix}/snapshots`, payload, {
        headers: authHeaders,
        withCredentials: true,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      ToastUtils.success("Snapshot creation initiated");
      queryClient.invalidateQueries({ queryKey: ["snapshots", variables.project_id] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to create snapshot");
    },
  });
};

export const useDeleteSnapshot = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
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
      await axios.delete(`${apiBaseUrl}${prefix}/snapshots/${id}`, {
        params: { project_id: projectId, region },
        headers: authHeaders,
        withCredentials: true,
      });
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Snapshot deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["snapshots", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to delete snapshot");
    },
  });
};

// ==================== Machine Images ====================

/**
 * Fetch images - works at tenant level (no project/region required)
 */
export const useImages = (projectId?: string, region?: string) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["images", projectId || "tenant", region || "default"],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (region) params.region = region;

      const { data } = await axios.get(`${apiBaseUrl}${prefix}/images`, {
        params,
        headers: authHeaders,
        withCredentials: true,
      });
      return data.data || data;
    },
    enabled: isAuthenticated,
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      region,
    }: {
      id: string;
      projectId?: string;
      region?: string;
    }) => {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (region) params.region = region;

      await axios.delete(`${apiBaseUrl}${prefix}/images/${id}`, {
        params,
        headers: authHeaders,
        withCredentials: true,
      });
    },
    onSuccess: () => {
      ToastUtils.success("Image deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to delete image");
    },
  });
};

// ==================== Instance Actions (VM Snapshots & Images) ====================

export const useCreateInstanceSnapshot = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      instanceId,
      name,
      description,
    }: {
      instanceId: string;
      name: string;
      description?: string;
    }) => {
      const { data } = await axios.post(
        `${apiBaseUrl}${prefix}/instance-management/${instanceId}/actions`,
        {
          action: "snapshot",
          params: { name, description },
        },
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );
      return data;
    },
    onSuccess: () => {
      ToastUtils.success("Instance snapshot creation initiated");
      // Invalidate snapshots query to show the new snapshot if the user is looking at a list
      queryClient.invalidateQueries({ queryKey: ["snapshots"] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to create instance snapshot");
    },
  });
};

export const useCreateInstanceImage = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      instanceId,
      name,
      metadata,
    }: {
      instanceId: string;
      name: string;
      metadata?: any;
    }) => {
      const { data } = await axios.post(
        `${apiBaseUrl}${prefix}/instance-management/${instanceId}/actions`,
        {
          action: "create-image",
          params: { name, metadata },
        },
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );
      return data;
    },
    onSuccess: () => {
      ToastUtils.success("Image creation from instance initiated");
      queryClient.invalidateQueries({ queryKey: ["images"] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.message || "Failed to create image from instance");
    },
  });
};
