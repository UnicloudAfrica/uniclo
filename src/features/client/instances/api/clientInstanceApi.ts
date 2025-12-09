/**
 * Client Instances API
 * API functions for client-level instance operations
 */

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  Instance,
  InstanceListResponse,
  InstanceDetailResponse,
  InstanceFormData,
  InstanceAction,
} from "@/shared/domains/instances/types/instance.types";

export const clientInstanceApi = {
  /**
   * Fetch all client's instances
   */
  fetchAll: async (): Promise<InstanceListResponse> => {
    const { data } = await apiClient.get<InstanceListResponse>(API_ENDPOINTS.CLIENT.INSTANCES);
    return data;
  },

  /**
   * Fetch instance by ID
   */
  fetchById: async (instanceId: string): Promise<InstanceDetailResponse> => {
    const { data } = await apiClient.get<InstanceDetailResponse>(
      API_ENDPOINTS.CLIENT.INSTANCE_BY_ID(instanceId)
    );
    return data;
  },

  /**
   * Create new instance
   */
  create: async (instanceData: InstanceFormData): Promise<Instance> => {
    const { data } = await apiClient.post<Instance>(
      API_ENDPOINTS.CLIENT.INSTANCE_CREATE,
      instanceData
    );
    return data;
  },

  /**
   * Perform action on instance (limited actions)
   */
  performAction: async (action: InstanceAction): Promise<void> => {
    await apiClient.post(`/business/instance-management/${action.instance_id}/actions`, {
      action: action.action,
    });
  },

  /**
   * Start instance
   */
  start: async (instanceId: string): Promise<void> => {
    await clientInstanceApi.performAction({
      action: "start",
      instance_id: instanceId,
    });
  },

  /**
   * Stop instance
   */
  stop: async (instanceId: string): Promise<void> => {
    await clientInstanceApi.performAction({
      action: "stop",
      instance_id: instanceId,
    });
  },

  /**
   * Reboot instance
   */
  reboot: async (instanceId: string): Promise<void> => {
    await clientInstanceApi.performAction({
      action: "reboot",
      instance_id: instanceId,
    });
  },
};

export default clientInstanceApi;
