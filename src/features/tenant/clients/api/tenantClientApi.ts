/**
 * Tenant Clients API
 * API functions for tenant-level client operations (tenant manages their clients)
 */

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  Client,
  ClientListResponse,
  ClientDetailResponse,
  ClientFormData,
  ClientUpdateData,
} from "@/shared/domains/clients/types/client.types";

export const tenantClientApi = {
  /**
   * Fetch all tenant's clients (scoped to tenant)
   */
  fetchAll: async (): Promise<ClientListResponse> => {
    const { data } = await apiClient.get<ClientListResponse>(API_ENDPOINTS.TENANT.CLIENTS);
    return data;
  },

  /**
   * Fetch client by ID (tenant can only see their clients)
   */
  fetchById: async (clientId: number): Promise<ClientDetailResponse> => {
    const { data } = await apiClient.get<ClientDetailResponse>(
      API_ENDPOINTS.TENANT.CLIENT_BY_ID(clientId)
    );
    return data;
  },

  /**
   * Create client
   */
  create: async (clientData: ClientFormData): Promise<Client> => {
    const { data } = await apiClient.post<Client>(API_ENDPOINTS.TENANT.CLIENTS, clientData);
    return data;
  },

  /**
   * Update client
   */
  update: async (clientId: number, clientData: ClientUpdateData): Promise<Client> => {
    const { data } = await apiClient.put<Client>(
      API_ENDPOINTS.TENANT.CLIENT_BY_ID(clientId),
      clientData
    );
    return data;
  },

  /**
   * Delete client
   */
  delete: async (clientId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TENANT.CLIENT_BY_ID(clientId));
  },

  /**
   * Suspend client
   */
  suspend: async (clientId: number, reason?: string): Promise<Client> => {
    const { data } = await apiClient.post<Client>(
      `${API_ENDPOINTS.TENANT.CLIENT_BY_ID(clientId)}/suspend`,
      { reason }
    );
    return data;
  },

  /**
   * Activate client
   */
  activate: async (clientId: number): Promise<Client> => {
    const { data } = await apiClient.post<Client>(
      `${API_ENDPOINTS.TENANT.CLIENT_BY_ID(clientId)}/activate`
    );
    return data;
  },

  /**
   * Get client projects
   */
  getProjects: async (clientId: number): Promise<any> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.TENANT.CLIENT_BY_ID(clientId)}/projects`);
    return data;
  },
};

export default tenantClientApi;
