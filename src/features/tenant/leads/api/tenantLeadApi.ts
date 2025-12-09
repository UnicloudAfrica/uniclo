/**
 * Tenant Leads API
 * API functions for tenant-level lead/CRM operations
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

export const tenantLeadApi = {
  /**
   * Fetch all tenant's leads (scoped to tenant)
   */
  fetchAll: async (): Promise<LeadListResponse> => {
    const { data } = await apiClient.get<LeadListResponse>("/tenant/leads");
    return data;
  },

  /**
   * Fetch lead by ID
   */
  fetchById: async (leadId: number): Promise<LeadDetailResponse> => {
    const { data } = await apiClient.get<LeadDetailResponse>(`/tenant/leads/${leadId}`);
    return data;
  },

  /**
   * Create lead
   */
  create: async (leadData: LeadFormData): Promise<Lead> => {
    const { data } = await apiClient.post<Lead>("/tenant/leads", leadData);
    return data;
  },

  /**
   * Update lead
   */
  update: async (leadId: number, leadData: LeadUpdateData): Promise<Lead> => {
    const { data } = await apiClient.put<Lead>(`/tenant/leads/${leadId}`, leadData);
    return data;
  },

  /**
   * Delete lead
   */
  delete: async (leadId: number): Promise<void> => {
    await apiClient.delete(`/tenant/leads/${leadId}`);
  },

  /**
   * Change lead stage
   */
  changeStage: async (leadId: number, stageId: number): Promise<Lead> => {
    const { data } = await apiClient.put<Lead>(`/tenant/leads/${leadId}/stage`, {
      stage_id: stageId,
    });
    return data;
  },

  /**
   * Add note to lead
   */
  addNote: async (leadId: number, note: string): Promise<any> => {
    const { data } = await apiClient.post(`/tenant/leads/${leadId}/notes`, { note });
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
      `/tenant/leads/${leadId}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  /**
   * Convert lead to customer
   */
  convert: async (leadId: number): Promise<any> => {
    const { data } = await apiClient.post(`/tenant/leads/${leadId}/convert`);
    return data;
  },
};

export default tenantLeadApi;
