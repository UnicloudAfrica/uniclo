/**
 * Admin Tax API
 */

import { apiClient } from "@/shared/api/client";
import type { TaxRule, TaxFormData, TaxCalculation } from "@/shared/domains/tax/types/tax.types";

export const adminTaxApi = {
  fetchAll: async (): Promise<TaxRule[]> => {
    const { data } = await apiClient.get<TaxRule[]>("/admin/tax-rules");
    return data;
  },

  fetchById: async (taxId: number): Promise<TaxRule> => {
    const { data } = await apiClient.get<TaxRule>(`/admin/tax-rules/${taxId}`);
    return data;
  },

  create: async (taxData: TaxFormData): Promise<TaxRule> => {
    const { data } = await apiClient.post<TaxRule>("/admin/tax-rules", taxData);
    return data;
  },

  update: async (taxId: number, taxData: Partial<TaxFormData>): Promise<TaxRule> => {
    const { data } = await apiClient.put<TaxRule>(`/admin/tax-rules/${taxId}`, taxData);
    return data;
  },

  delete: async (taxId: number): Promise<void> => {
    await apiClient.delete(`/admin/tax-rules/${taxId}`);
  },

  activate: async (taxId: number): Promise<TaxRule> => {
    const { data } = await apiClient.post<TaxRule>(`/admin/tax-rules/${taxId}/activate`);
    return data;
  },

  deactivate: async (taxId: number): Promise<TaxRule> => {
    const { data } = await apiClient.post<TaxRule>(`/admin/tax-rules/${taxId}/deactivate`);
    return data;
  },

  calculateTax: async (
    subtotal: number,
    country: string,
    state?: string
  ): Promise<TaxCalculation> => {
    const { data } = await apiClient.post<TaxCalculation>("/admin/tax-rules/calculate", {
      subtotal,
      country,
      state,
    });
    return data;
  },
};

export default adminTaxApi;
