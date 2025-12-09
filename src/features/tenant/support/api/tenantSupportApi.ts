/**
 * Tenant Support API
 * API functions for tenant-level support/ticket operations
 */

import { apiClient } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  Ticket,
  TicketListResponse,
  TicketDetailResponse,
  TicketFormData,
  TicketUpdateData,
  TicketMessageData,
} from "@/shared/domains/support/types/ticket.types";

export const tenantSupportApi = {
  /**
   * Fetch all tenant's tickets (scoped to tenant)
   */
  fetchAll: async (): Promise<TicketListResponse> => {
    const { data } = await apiClient.get<TicketListResponse>(API_ENDPOINTS.TENANT.SUPPORT);
    return data;
  },

  /**
   * Fetch ticket by ID (tenant can only see their tickets)
   */
  fetchById: async (ticketId: number | string): Promise<TicketDetailResponse> => {
    const { data } = await apiClient.get<TicketDetailResponse>(
      `${API_ENDPOINTS.TENANT.SUPPORT}/${ticketId}`
    );
    return data;
  },

  /**
   * Create ticket
   */
  create: async (ticketData: TicketFormData): Promise<Ticket> => {
    const formData = new FormData();
    formData.append("subject", ticketData.subject);
    formData.append("description", ticketData.description);
    formData.append("category", ticketData.category);

    if (ticketData.priority) {
      formData.append("priority", ticketData.priority);
    }

    if (ticketData.project_id) {
      formData.append("project_id", ticketData.project_id);
    }

    if (ticketData.instance_id) {
      formData.append("instance_id", ticketData.instance_id);
    }

    if (ticketData.attachments) {
      ticketData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const { data } = await apiClient.post<Ticket>(API_ENDPOINTS.TENANT.SUPPORT, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /**
   * Update ticket
   */
  update: async (ticketId: number | string, ticketData: TicketUpdateData): Promise<Ticket> => {
    const { data } = await apiClient.put<Ticket>(
      `${API_ENDPOINTS.TENANT.SUPPORT}/${ticketId}`,
      ticketData
    );
    return data;
  },

  /**
   * Add message to ticket
   */
  addMessage: async (ticketId: number | string, messageData: TicketMessageData): Promise<any> => {
    const formData = new FormData();
    formData.append("message", messageData.message);

    if (messageData.attachments) {
      messageData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const { data } = await apiClient.post(
      `${API_ENDPOINTS.TENANT.SUPPORT}/${ticketId}/messages`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  /**
   * Close ticket
   */
  close: async (ticketId: number | string): Promise<Ticket> => {
    const { data } = await apiClient.put<Ticket>(
      `${API_ENDPOINTS.TENANT.SUPPORT}/${ticketId}/close`
    );
    return data;
  },

  /**
   * Reopen ticket
   */
  reopen: async (ticketId: number | string): Promise<Ticket> => {
    const { data } = await apiClient.put<Ticket>(
      `${API_ENDPOINTS.TENANT.SUPPORT}/${ticketId}/reopen`
    );
    return data;
  },
};

export default tenantSupportApi;
