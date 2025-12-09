/**
 * Admin Quotes API
 */

import { apiClient } from "@/shared/api/client";
import type {
  Quote,
  QuoteListResponse,
  QuoteDetailResponse,
  QuoteFormData,
  QuoteUpdateData,
} from "@/shared/domains/quotes/types/quote.types";

export const adminQuoteApi = {
  fetchAll: async (): Promise<QuoteListResponse> => {
    const { data } = await apiClient.get<QuoteListResponse>("/admin/quotes");
    return data;
  },

  fetchById: async (quoteId: number): Promise<QuoteDetailResponse> => {
    const { data } = await apiClient.get<QuoteDetailResponse>(`/admin/quotes/${quoteId}`);
    return data;
  },

  create: async (quoteData: QuoteFormData): Promise<Quote> => {
    const { data } = await apiClient.post<Quote>("/admin/quotes", quoteData);
    return data;
  },

  update: async (quoteId: number, quoteData: QuoteUpdateData): Promise<Quote> => {
    const { data } = await apiClient.put<Quote>(`/admin/quotes/${quoteId}`, quoteData);
    return data;
  },

  delete: async (quoteId: number): Promise<void> => {
    await apiClient.delete(`/admin/quotes/${quoteId}`);
  },

  send: async (quoteId: number): Promise<Quote> => {
    const { data } = await apiClient.post<Quote>(`/admin/quotes/${quoteId}/send`);
    return data;
  },

  accept: async (quoteId: number): Promise<Quote> => {
    const { data } = await apiClient.post<Quote>(`/admin/quotes/${quoteId}/accept`);
    return data;
  },

  decline: async (quoteId: number, reason?: string): Promise<Quote> => {
    const { data } = await apiClient.post<Quote>(`/admin/quotes/${quoteId}/decline`, { reason });
    return data;
  },

  convertToInvoice: async (quoteId: number): Promise<any> => {
    const { data } = await apiClient.post(`/admin/quotes/${quoteId}/convert-to-invoice`);
    return data;
  },

  downloadPdf: async (quoteId: number): Promise<Blob> => {
    const { data } = await apiClient.get(`/admin/quotes/${quoteId}/pdf`, { responseType: "blob" });
    return data;
  },

  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get("/admin/quotes/stats");
    return data;
  },
};

export default adminQuoteApi;
