/**
 * Admin Billing API
 */

import { apiClient } from "@/shared/api/client";
import type {
  Invoice,
  InvoiceListResponse,
  InvoiceDetailResponse,
  InvoiceFormData,
  InvoiceUpdateData,
  PaymentRecordData,
} from "@/shared/domains/billing/types/invoice.types";

export const adminBillingApi = {
  fetchAll: async (): Promise<InvoiceListResponse> => {
    const { data } = await apiClient.get<InvoiceListResponse>("/admin/invoices");
    return data;
  },

  fetchById: async (invoiceId: number): Promise<InvoiceDetailResponse> => {
    const { data } = await apiClient.get<InvoiceDetailResponse>(`/admin/invoices/${invoiceId}`);
    return data;
  },

  create: async (invoiceData: InvoiceFormData): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>("/admin/invoices", invoiceData);
    return data;
  },

  update: async (invoiceId: number, invoiceData: InvoiceUpdateData): Promise<Invoice> => {
    const { data } = await apiClient.put<Invoice>(`/admin/invoices/${invoiceId}`, invoiceData);
    return data;
  },

  delete: async (invoiceId: number): Promise<void> => {
    await apiClient.delete(`/admin/invoices/${invoiceId}`);
  },

  send: async (invoiceId: number): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>(`/admin/invoices/${invoiceId}/send`);
    return data;
  },

  markPaid: async (invoiceId: number, paymentData: PaymentRecordData): Promise<Invoice> => {
    const { data } = await apiClient.post<Invoice>(
      `/admin/invoices/${invoiceId}/mark-paid`,
      paymentData
    );
    return data;
  },

  downloadPdf: async (invoiceId: number): Promise<Blob> => {
    const { data } = await apiClient.get(`/admin/invoices/${invoiceId}/pdf`, {
      responseType: "blob",
    });
    return data;
  },

  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get("/admin/invoices/stats");
    return data;
  },
};

export default adminBillingApi;
