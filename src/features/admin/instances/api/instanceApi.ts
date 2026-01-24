/**
 * Admin Instances API
 * API functions for admin-level instance operations
 */

import { apiClient } from "@/shared/api/client";
import config from "@/config";
import useAdminAuthStore from "@/stores/adminAuthStore";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  Instance,
  InstanceListResponse,
  InstanceDetailResponse,
  InstanceFormData,
  InstanceAction,
  BulkInstanceAction,
  InstanceConsoleOutput,
  MultiInstanceConfig,
} from "@/shared/domains/instances/types/instance.types";

export const adminInstanceApi = {
  /**
   * Fetch all instances (admin has access to all)
   */
  fetchAll: async (): Promise<InstanceListResponse> => {
    const { data } = await apiClient.get<InstanceListResponse>(API_ENDPOINTS.ADMIN.INSTANCES);
    return data;
  },

  /**
   * Fetch instance by ID
   */
  fetchById: async (instanceId: string): Promise<InstanceDetailResponse> => {
    const { data } = await apiClient.get<InstanceDetailResponse>(
      API_ENDPOINTS.ADMIN.INSTANCE_BY_ID(instanceId)
    );
    return data;
  },

  /**
   * Create new instance
   */
  create: async (instanceData: InstanceFormData): Promise<Instance> => {
    const { data } = await apiClient.post<Instance>("/admin/instances/create", instanceData);
    return data;
  },

  /**
   * Create multiple instances
   */
  createMultiple: async (config: MultiInstanceConfig): Promise<any> => {
    const { data } = await apiClient.post("/admin/instances/create", config);
    return data;
  },

  /**
   * Update instance
   */
  update: async (
    instanceId: string,
    instanceData: Partial<InstanceFormData>
  ): Promise<Instance> => {
    const { data } = await apiClient.put<Instance>(
      API_ENDPOINTS.ADMIN.INSTANCE_BY_ID(instanceId),
      instanceData
    );
    return data;
  },

  /**
   * Delete/terminate instance
   */
  delete: async (instanceId: string, force: boolean = false): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ADMIN.INSTANCE_BY_ID(instanceId), {
      params: { force },
    });
  },

  /**
   * Perform action on instance (start, stop, reboot, etc.)
   */
  performAction: async (instanceId: string, action: string): Promise<void> => {
    await apiClient.post(`/admin/instance-management/${instanceId}/actions`, { action });
  },

  /**
   * Start instance
   */
  start: async (instanceId: string): Promise<void> => {
    await adminInstanceApi.performAction(instanceId, "start");
  },

  /**
   * Stop instance
   */
  stop: async (instanceId: string, force: boolean = false): Promise<void> => {
    await adminInstanceApi.performAction(instanceId, "stop");
  },

  /**
   * Reboot instance
   */
  reboot: async (instanceId: string): Promise<void> => {
    await adminInstanceApi.performAction(instanceId, "reboot");
  },

  /**
   * Terminate instance
   */
  terminate: async (instanceId: string, force: boolean = false): Promise<void> => {
    await adminInstanceApi.performAction(instanceId, "terminate");
  },

  /**
   * Bulk action on instances
   */
  bulkAction: async (instanceIds: string[], action: string): Promise<void> => {
    await apiClient.post("/admin/instance-management/bulk-action", {
      instance_ids: instanceIds,
      action,
    });
  },

  /**
   * Get instance console output
   */
  getConsoleOutput: async (
    instanceId: string,
    consoleType = "novnc"
  ): Promise<InstanceConsoleOutput> => {
    const typeParam = consoleType ? `?type=${encodeURIComponent(consoleType)}` : "";
    const authState = useAdminAuthStore?.getState?.();
    const headers = authState?.getAuthHeaders?.() || {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await fetch(
      `${config.adminURL}/instance-management/${encodeURIComponent(instanceId)}/console${typeParam}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || payload?.message || "Failed to fetch instance console");
    }

    return payload?.data || payload;
  },

  /**
   * Refresh instance status
   */
  refreshStatus: async (instanceId: string): Promise<Instance> => {
    const { data } = await apiClient.post<Instance>(
      `/admin/instance-management/${instanceId}/refresh-status`
    );
    return data;
  },

  /**
   * Get instance usage stats
   */
  getUsageStats: async (instanceId: string): Promise<any> => {
    const { data } = await apiClient.get(`/admin/instance-management/${instanceId}/usage-stats`);
    return data;
  },

  /**
   * Get instance metrics (CPU, memory, network, etc.)
   */
  getMetrics: async (instanceId: string): Promise<any> => {
    const { data } = await apiClient.get(`/admin/instance-management/${instanceId}/metrics`);
    return data;
  },

  /**
   * Get instance status history
   */
  getStatusHistory: async (instanceId: string): Promise<any> => {
    const { data } = await apiClient.get(`/admin/instance-management/${instanceId}/status-history`);
    return data;
  },

  /**
   * Get available instance flavors/types
   */
  getAvailableFlavors: async (instanceId: string): Promise<any> => {
    const { data } = await apiClient.get(
      `/admin/instance-management/${instanceId}/available-flavors`
    );
    return data;
  },

  /**
   * Get instance logs
   */
  getLogs: async (instanceId: string): Promise<any> => {
    const { data } = await apiClient.get(`/admin/instance-management/${instanceId}/logs`);
    return data;
  },
};

export default adminInstanceApi;
