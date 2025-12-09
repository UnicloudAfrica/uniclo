/**
 * Tenant Instances API
 * API functions for tenant-level instance operations
 */

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  Instance,
  InstanceListResponse,
  InstanceDetailResponse,
  InstanceFormData,
  InstanceAction,
  MultiInstanceConfig,
} from "@/shared/domains/instances/types/instance.types";

export const tenantInstanceApi = {
  /**
   * Fetch all tenant's instances
   */
  fetchAll: async (): Promise<InstanceListResponse> => {
    const { data } = await apiClient.get<InstanceListResponse>(API_ENDPOINTS.TENANT.INSTANCES);
    return data;
  },

  /**
   * Fetch instance by ID
   */
  fetchById: async (instanceId: string): Promise<InstanceDetailResponse> => {
    const { data } = await apiClient.get<InstanceDetailResponse>(
      API_ENDPOINTS.TENANT.INSTANCE_BY_ID(instanceId)
    );
    return data;
  },

  /**
   * Create new instance
   */
  create: async (instanceData: InstanceFormData): Promise<Instance> => {
    const { data } = await apiClient.post<Instance>(
      API_ENDPOINTS.TENANT.INSTANCE_CREATE,
      instanceData
    );
    return data;
  },

  /**
   * Create multiple instances
   */
  createMultiple: async (config: MultiInstanceConfig): Promise<any> => {
    const { data } = await apiClient.post(API_ENDPOINTS.TENANT.INSTANCE_CREATE, config);
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
      API_ENDPOINTS.TENANT.INSTANCE_BY_ID(instanceId),
      instanceData
    );
    return data;
  },

  /**
   * Delete/terminate instance
   */
  delete: async (instanceId: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TENANT.INSTANCE_BY_ID(instanceId));
  },

  /**
   * Perform action on instance
   */
  performAction: async (action: InstanceAction): Promise<void> => {
    await apiClient.post(`/tenant/admin/instance-management/${action.instance_id}/actions`, {
      action: action.action,
      force: action.force,
    });
  },

  /**
   * Start instance
   */
  start: async (instanceId: string): Promise<void> => {
    await tenantInstanceApi.performAction({
      action: "start",
      instance_id: instanceId,
    });
  },

  /**
   * Stop instance
   */
  stop: async (instanceId: string, force: boolean = false): Promise<void> => {
    await tenantInstanceApi.performAction({
      action: "stop",
      instance_id: instanceId,
      force,
    });
  },

  /**
   * Reboot instance
   */
  reboot: async (instanceId: string): Promise<void> => {
    await tenantInstanceApi.performAction({
      action: "reboot",
      instance_id: instanceId,
    });
  },

  /**
   * Get instance console
   */
  getConsole: async (instanceId: string): Promise<any> => {
    const { data } = await apiClient.get(`/tenant/admin/instance-consoles/${instanceId}`);
    return data;
  },
};

export default tenantInstanceApi;
