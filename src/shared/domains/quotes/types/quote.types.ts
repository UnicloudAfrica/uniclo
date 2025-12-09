/**
 * Quote Types
 * Shared TypeScript interfaces for Quotes domain
 */

export type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
export type QuoteValidityPeriod = "7_days" | "14_days" | "30_days" | "60_days" | "90_days";

export interface QuoteLineItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
}

export interface Quote {
  id: number;
  identifier: string; // QUO-2024-001
  quote_number: string;

  // Status
  status: QuoteStatus;

  // Customer
  client_id?: number;
  client_name: string;
  client_email: string;
  client_company?: string;

  // Lead
  lead_id?: number;
  lead_name?: string;

  // Tenant
  tenant_id?: number;
  tenant_name?: string;

  // Content
  title: string;
  description?: string;
  line_items: QuoteLineItem[];

  // Amounts
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  currency: string;

  // Validity
  issue_date: string;
  valid_until: string;
  validity_period: QuoteValidityPeriod;

  // Status tracking
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  declined_at?: string;

  // Notes
  notes?: string;
  terms?: string;

  // PDF
  pdf_url?: string;

  // Conversion
  converted_to_invoice?: boolean;
  invoice_id?: number;

  // Timestamps
  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface QuoteFormData {
  client_id?: number;
  lead_id?: number;
  client_name: string;
  client_email: string;
  client_company?: string;
  title: string;
  description?: string;
  line_items: Omit<QuoteLineItem, "id" | "total">[];
  validity_period: QuoteValidityPeriod;
  discount_amount?: number;
  notes?: string;
  terms?: string;
  currency?: string;
}

export interface QuoteUpdateData {
  status?: QuoteStatus;
  line_items?: QuoteLineItem[];
  notes?: string;
  terms?: string;
}

export interface QuoteFilters {
  status?: QuoteStatus[];
  client_id?: number[];
  date_from?: string;
  date_to?: string;
  search?: string;
  expired_only?: boolean;
}

export interface QuoteStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  declined: number;
  expired: number;
  total_value: number;
  conversion_rate: number; // Calculated field
}

export interface QuoteListResponse {
  data: Quote[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
  };
}

export interface QuoteDetailResponse {
  data: Quote;
}

export interface QuotePermissions {
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
  canConvertToInvoice: boolean;
  canDownloadPdf: boolean;
}
