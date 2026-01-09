import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useApiContext } from "./useApiContext";
import ToastUtils from "../utils/toastUtil";

/**
 * Hook to manage DNS (Route53) operations across Admin, Tenant, and Client dashboards.
 * DNS can be managed at tenant-level (no project required) or project-level.
 */

const getApiPrefix = (context: string) => {
  return context === "admin" ? "" : "/business";
};

// ==================== DNS Zones ====================

/**
 * Fetch DNS zones - works at tenant level (no project/region required)
 */
export const useDnsZones = (projectId?: string, region?: string) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["dns-zones", projectId || "tenant", region || "default"],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (region) params.region = region;

      const { data } = await axios.get(`${apiBaseUrl}${prefix}/dns-zones`, {
        params,
        headers: authHeaders,
        withCredentials: true,
      });
      // Zadara API usually returns the list directly or wrapped in 'data'
      return data.data || data;
    },
    enabled: isAuthenticated,
  });
};

export const useCreateDnsZone = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post(`${apiBaseUrl}${prefix}/dns-zones`, payload, {
        headers: authHeaders,
        withCredentials: true,
      });
      return data;
    },
    onSuccess: () => {
      ToastUtils.success("DNS Zone created successfully");
      queryClient.invalidateQueries({ queryKey: ["dns-zones"] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create DNS Zone");
    },
  });
};

export const useDeleteDnsZone = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      zoneId,
      projectId,
      region,
    }: {
      zoneId: string;
      projectId?: string;
      region?: string;
    }) => {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (region) params.region = region;

      await axios.delete(`${apiBaseUrl}${prefix}/dns-zones/${zoneId}`, {
        params,
        headers: authHeaders,
        withCredentials: true,
      });
    },
    onSuccess: () => {
      ToastUtils.success("DNS Zone deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["dns-zones"] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete DNS Zone");
    },
  });
};

// ==================== DNS Records ====================

export const useDnsRecords = (zoneId: string, projectId?: string, region?: string) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["dns-records", zoneId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (region) params.region = region;

      const { data } = await axios.get(`${apiBaseUrl}${prefix}/dns-zones/${zoneId}/records`, {
        params,
        headers: authHeaders,
        withCredentials: true,
      });
      return data.data || data;
    },
    enabled: !!zoneId && isAuthenticated,
  });
};

export const useChangeDnsRecords = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async ({
      zoneId,
      projectId,
      region,
      changeBatch,
    }: {
      zoneId: string;
      projectId?: string;
      region?: string;
      changeBatch: any;
    }) => {
      const payload: any = { change_batch: changeBatch };
      if (projectId) payload.project_id = projectId;
      if (region) payload.region = region;

      const { data } = await axios.post(
        `${apiBaseUrl}${prefix}/dns-zones/${zoneId}/records`,
        payload,
        {
          headers: authHeaders,
          withCredentials: true,
        }
      );
      return data;
    },
    onSuccess: (_, { zoneId }) => {
      ToastUtils.success("DNS Records updated successfully");
      queryClient.invalidateQueries({ queryKey: ["dns-records", zoneId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to update DNS Records");
    },
  });
};
