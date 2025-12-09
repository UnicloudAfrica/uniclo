/**
 * Admin Clients API
 * API functions for admin-level client operations
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

export const adminClientApi = {
  /**
   * Fetch all clients (admin sees all)
   */
  fetchAll: async (): Promise<ClientListResponse> => {
    const { data } = await apiClient.get<ClientListResponse>(API_ENDPOINTS.ADMIN.CLIENTS);
    return data;
  },

  /**
   * Fetch client by ID
   */
  fetchById: async (clientId: number): Promise<ClientDetailResponse> => {
    const { data } = await apiClient.get<ClientDetailResponse>(
      API_ENDPOINTS.ADMIN.CLIENT_BY_ID(clientId)
    );
    return data;
  },

  /**
   * Create client
   */
  create: async (clientData: ClientFormData): Promise<Client> => {
    const { data } = await apiClient.post<Client>(API_ENDPOINTS.ADMIN.CLIENTS, clientData);
    return data;
  },

  /**
   * Update client
   */
  update: async (clientId: number, clientData: ClientUpdateData): Promise<Client> => {
    const { data } = await apiClient.put<Client>(
      API_ENDPOINTS.ADMIN.CLIENT_BY_ID(clientId),
      clientData
    );
    return data;
  },

  /**
   * Delete client
   */
  delete: async (clientId: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ADMIN.CLIENT_BY_ID(clientId));
  },

  /**
   * Suspend client
   */
  suspend: async (clientId: number, reason?: string): Promise<Client> => {
    const { data } = await apiClient.post<Client>(
      `${API_ENDPOINTS.ADMIN.CLIENT_BY_ID(clientId)}/suspend`,
      { reason }
    );
    return data;
  },

  /**
   * Activate client
   */
  activate: async (clientId: number): Promise<Client> => {
    const { data } = await apiClient.post<Client>(
      `${API_ENDPOINTS.ADMIN.CLIENT_BY_ID(clientId)}/activate`
    );
    return data;
  },

  /**
   * Get client projects
   */
  getProjects: async (clientId: number): Promise<any> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.ADMIN.CLIENT_BY_ID(clientId)}/projects`);
    return data;
  },

  /**
   * Get client billing info
   */
  getBillingInfo: async (clientId: number): Promise<any> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.ADMIN.CLIENT_BY_ID(clientId)}/billing`);
    return data;
  },

  /**
   * Bulk delete clients
   */
  bulkDelete: async (clientIds: number[]): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.CLIENTS}/bulk-delete`, {
      client_ids: clientIds,
    });
  },

  /**
   * Bulk suspend clients
   */
  bulkSuspend: async (clientIds: number[], reason?: string): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.CLIENTS}/bulk-suspend`, {
      client_ids: clientIds,
      reason,
    });
  },

  /**
   * Export clients
   */
  export: async (clientIds?: number[]): Promise<Blob> => {
    const { data } = await apiClient.post(
      `${API_ENDPOINTS.ADMIN.CLIENTS}/export`,
      { client_ids: clientIds },
      { responseType: "blob" }
    );
    return data;
  },
};

export default adminClientApi;
