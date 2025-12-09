/**
 * Admin Leads API
 * API functions for admin-level lead/CRM operations
 */

import { apiClient } from "@/shared/api/client";
import type {
  Lead,
  LeadListResponse,
  LeadDetailResponse,
  LeadFormData,
  LeadUpdateData,
  LeadDocument,
} from "@/shared/domains/leads/types/lead.types";

export const adminLeadApi = {
  /**
   * Fetch all leads (admin sees all)
   */
  fetchAll: async (): Promise<LeadListResponse> => {
    const { data } = await apiClient.get<LeadListResponse>("/admin/leads");
    return data;
  },

  /**
   * Fetch lead by ID
   */
  fetchById: async (leadId: number): Promise<LeadDetailResponse> => {
    const { data } = await apiClient.get<LeadDetailResponse>(`/admin/leads/${leadId}`);
    return data;
  },

  /**
   * Create lead
   */
  create: async (leadData: LeadFormData): Promise<Lead> => {
    const { data } = await apiClient.post<Lead>("/admin/leads", leadData);
    return data;
  },

  /**
   * Update lead
   */
  update: async (leadId: number, leadData: LeadUpdateData): Promise<Lead> => {
    const { data } = await apiClient.put<Lead>(`/admin/leads/${leadId}`, leadData);
    return data;
  },

  /**
   * Delete lead
   */
  delete: async (leadId: number): Promise<void> => {
    await apiClient.delete(`/admin/leads/${leadId}`);
  },

  /**
   * Change lead stage
   */
  changeStage: async (leadId: number, stageId: number): Promise<Lead> => {
    const { data } = await apiClient.put<Lead>(`/admin/leads/${leadId}/stage`, {
      stage_id: stageId,
    });
    return data;
  },

  /**
   * Assign lead
   */
  assign: async (leadId: number, userId: number): Promise<Lead> => {
    const { data } = await apiClient.put<Lead>(`/admin/leads/${leadId}/assign`, {
      assigned_to: userId,
    });
    return data;
  },

  /**
   * Add note to lead
   */
  addNote: async (leadId: number, note: string): Promise<any> => {
    const { data } = await apiClient.post(`/admin/leads/${leadId}/notes`, { note });
    return data;
  },

  /**
   * Upload document
   */
  uploadDocument: async (leadId: number, file: File, notes?: string): Promise<LeadDocument> => {
    const formData = new FormData();
    formData.append("file", file);
    if (notes) formData.append("notes", notes);

    const { data } = await apiClient.post<LeadDocument>(
      `/admin/leads/${leadId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  /**
   * Convert lead to customer
   */
  convert: async (leadId: number): Promise<any> => {
    const { data } = await apiClient.post(`/admin/leads/${leadId}/convert`);
    return data;
  },

  /**
   * Get lead statistics
   */
  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get("/admin/leads/stats");
    return data;
  },

  /**
   * Bulk assign leads
   */
  bulkAssign: async (leadIds: number[], userId: number): Promise<void> => {
    await apiClient.post("/admin/leads/bulk-assign", {
      lead_ids: leadIds,
      assigned_to: userId,
    });
  },

  /**
   * Bulk delete leads
   */
  bulkDelete: async (leadIds: number[]): Promise<void> => {
    await apiClient.post("/admin/leads/bulk-delete", {
      lead_ids: leadIds,
    });
  },
};

export default adminLeadApi;
