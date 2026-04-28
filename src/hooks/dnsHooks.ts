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

/**
 * Extract an array from a Zadara/Route53 API response.
 * The API may return zones as { HostedZones: [...] }, { zones: [...] }, { data: [...] },
 * or directly as an array.
 */
const extractArray = (raw: unknown, keys: string[]): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    // Check common wrapper keys
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // Check 'data' as fallback
    if (Array.isArray(obj.data)) return obj.data as unknown[];
  }
  return [];
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

      try {
        const { data } = await axios.get(`${apiBaseUrl}${prefix}/dns-zones`, {
          params,
          headers: authHeaders,
          withCredentials: true,
        });
        // Zadara Route53 API wraps zones in "zones" key per swagger spec
        return extractArray(data, ["zones", "HostedZones", "hosted_zones"]);
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { status?: number; data?: { error?: string; message?: string } };
        };
        const status = axiosError.response?.status;
        const message =
          axiosError.response?.data?.error || axiosError.response?.data?.message || "";

        // Translate known DNS-not-configured errors into a recognizable error type
        if (
          status === 404 ||
          status === 502 ||
          message.toLowerCase().includes("external service") ||
          message.toLowerCase().includes("not found")
        ) {
          const dnsError = new Error("DNS_NOT_CONFIGURED");
          (dnsError as unknown).isDnsNotConfigured = true;
          throw dnsError;
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: (failureCount: number, error: unknown) => {
      // Don't retry DNS-not-configured errors
      if (error?.isDnsNotConfigured) return false;
      return failureCount < 2;
    },
  });
};

export const useCreateDnsZone = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);

  return useMutation({
    mutationFn: async (payload: {
      project_id?: string;
      region?: string;
      name: string;
      comment?: string;
    }) => {
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
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { error?: string } } };
      ToastUtils.error(axiosError.response?.data?.error || "Failed to ... ");
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
    onError: (error: unknown) => {
      ToastUtils.error((error as {response?: {data?: {error?: string; message?: string}}}).response?.data?.error || "Failed to delete DNS Zone");
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
      // Zadara Route53 API wraps records in "rrset_list" key per swagger spec
      return extractArray(data, [
        "rrset_list",
        "ResourceRecordSets",
        "records",
        "resource_record_sets",
      ]);
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
      changeBatch: unknown;
    }) => {
      const payload: { change_batch: unknown; project_id?: string; region?: string } = {
        change_batch: changeBatch,
      };
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
    onError: (error: unknown) => {
      ToastUtils.error((error as {response?: {data?: {error?: string; message?: string}}}).response?.data?.error || "Failed to update DNS Records");
    },
  });
};
