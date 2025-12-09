/**
 * Admin Support API
 * API functions for admin-level support/ticket operations
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

export const adminSupportApi = {
  /**
   * Fetch all tickets (admin sees all)
   */
  fetchAll: async (): Promise<TicketListResponse> => {
    const { data } = await apiClient.get<TicketListResponse>(API_ENDPOINTS.ADMIN.SUPPORT);
    return data;
  },

  /**
   * Fetch ticket by ID
   */
  fetchById: async (ticketId: number | string): Promise<TicketDetailResponse> => {
    const { data } = await apiClient.get<TicketDetailResponse>(
      `${API_ENDPOINTS.ADMIN.SUPPORT}/${ticketId}`
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

    const { data } = await apiClient.post<Ticket>(API_ENDPOINTS.ADMIN.SUPPORT, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  /**
   * Update ticket
   */
  update: async (ticketId: number | string, ticketData: TicketUpdateData): Promise<Ticket> => {
    const { data } = await apiClient.put<Ticket>(
      `${API_ENDPOINTS.ADMIN.SUPPORT}/${ticketId}`,
      ticketData
    );
    return data;
  },

  /**
   * Delete ticket
   */
  delete: async (ticketId: number | string): Promise<void> => {
    await apiClient.delete(`${API_ENDPOINTS.ADMIN.SUPPORT}/${ticketId}`);
  },

  /**
   * Add message to ticket
   */
  addMessage: async (ticketId: number | string, messageData: TicketMessageData): Promise<any> => {
    const formData = new FormData();
    formData.append("message", messageData.message);

    if (messageData.is_internal !== undefined) {
      formData.append("is_internal", messageData.is_internal.toString());
    }

    if (messageData.attachments) {
      messageData.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const { data } = await apiClient.post(
      `${API_ENDPOINTS.ADMIN.SUPPORT}/${ticketId}/messages`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  /**
   * Assign ticket
   */
  assign: async (ticketId: number | string, userId: number): Promise<Ticket> => {
    const { data } = await apiClient.put<Ticket>(
      `${API_ENDPOINTS.ADMIN.SUPPORT}/${ticketId}/assign`,
      { assigned_to: userId }
    );
    return data;
  },

  /**
   * Change ticket status
   */
  changeStatus: async (ticketId: number | string, status: string): Promise<Ticket> => {
    const { data } = await apiClient.put<Ticket>(
      `${API_ENDPOINTS.ADMIN.SUPPORT}/${ticketId}/status`,
      { status }
    );
    return data;
  },

  /**
   * Close ticket
   */
  close: async (ticketId: number | string): Promise<Ticket> => {
    return adminSupportApi.changeStatus(ticketId, "closed");
  },

  /**
   * Reopen ticket
   */
  reopen: async (ticketId: number | string): Promise<Ticket> => {
    return adminSupportApi.changeStatus(ticketId, "reopened");
  },

  /**
   * Get ticket statistics
   */
  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.ADMIN.SUPPORT}/stats`);
    return data;
  },

  /**
   * Bulk assign tickets
   */
  bulkAssign: async (ticketIds: number[], userId: number): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.SUPPORT}/bulk-assign`, {
      ticket_ids: ticketIds,
      assigned_to: userId,
    });
  },

  /**
   * Bulk close tickets
   */
  bulkClose: async (ticketIds: number[]): Promise<void> => {
    await apiClient.post(`${API_ENDPOINTS.ADMIN.SUPPORT}/bulk-close`, {
      ticket_ids: ticketIds,
    });
  },
};

export default adminSupportApi;
