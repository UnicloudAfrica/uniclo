/**
 * Billing/Invoice Types
 * Shared TypeScript interfaces for Billing domain
 */

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "credit_card" | "bank_transfer" | "paypal" | "stripe" | "manual";
export type InvoiceType = "standard" | "proforma" | "credit_note" | "recurring";

export interface InvoiceLineItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string;
  payment_date: string;
  notes?: string;
}

export interface Invoice {
  id: number;
  identifier: string; // INV-2024-001
  invoice_number: string;

  // Type & Status
  type: InvoiceType;
  status: InvoiceStatus;

  // Customer
  client_id: number;
  client_name: string;
  client_email: string;
  client_address?: string;

  // Project/Tenant
  project_id?: string;
  project_name?: string;
  tenant_id?: number;
  tenant_name?: string;

  // Line Items
  line_items: InvoiceLineItem[];

  // Amounts
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  amount_paid?: number;
  amount_due?: number;

  // Currency
  currency: string;

  // Dates
  issue_date: string;
  due_date: string;
  paid_date?: string;

  // Payments
  payments?: InvoicePayment[];

  // Notes & Terms
  notes?: string;
  terms?: string;
  footer?: string;

  // PDF & Tracking
  pdf_url?: string;
  sent_at?: string;
  viewed_at?: string;

  // Recurring (if applicable)
  is_recurring?: boolean;
  recurring_frequency?: "monthly" | "quarterly" | "annually";
  next_invoice_date?: string;

  // Timestamps
  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface InvoiceFormData {
  client_id: number;
  project_id?: string;
  type?: InvoiceType;
  issue_date: string;
  due_date: string;
  line_items: Omit<InvoiceLineItem, "id" | "total">[];
  discount_amount?: number;
  notes?: string;
  terms?: string;
  currency?: string;
}

export interface InvoiceUpdateData {
  status?: InvoiceStatus;
  due_date?: string;
  line_items?: InvoiceLineItem[];
  notes?: string;
  terms?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  client_id?: number[];
  project_id?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
  overdue_only?: boolean;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
}

export interface InvoiceListResponse {
  data: Invoice[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
  };
}

export interface InvoiceDetailResponse {
  data: Invoice;
}

export interface InvoicePermissions {
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSend: boolean;
  canMarkPaid: boolean;
  canDownloadPdf: boolean;
  canRecordPayment: boolean;
}

export interface PaymentRecordData {
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  transaction_id?: string;
  notes?: string;
}
