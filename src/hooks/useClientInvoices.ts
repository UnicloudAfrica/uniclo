import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientApi from "../index/client/api";
import silentClientApi from "../index/client/silent";

// Types
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_type: string | null;
  product_name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  subtotal: number;
  period_start: string | null;
  period_end: string | null;
}

export interface Invoice {
  id: number;
  uuid: string;
  invoice_number: string;
  status: "draft" | "pending" | "paid" | "partial" | "overdue" | "void" | "refunded";
  currency: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  items?: InvoiceItem[];
  formatted_total?: string;
  formatted_amount_due?: string;
  days_overdue?: number;
  owner_name?: string;
  owner_email?: string;
}

export interface BillingStatistics {
  total_invoices: number;
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  pending_count: number;
  overdue_count: number;
}

export interface BillingSummary {
  statistics: BillingStatistics;
  recent_invoices: Invoice[];
}

// Query keys
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
  summary: () => [...invoiceKeys.all, "summary"] as const,
  paymentHistory: () => [...invoiceKeys.all, "payment-history"] as const,
};

// Fetch client invoices
export function useClientInvoices(filters?: {
  status?: string;
  unpaid_only?: boolean;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.unpaid_only) params.append("unpaid_only", "1");
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.per_page) params.append("per_page", String(filters.per_page));

      const queryString = params.toString();
      const url = `/billing/invoices${queryString ? `?${queryString}` : ""}`;

      const response = await silentClientApi("GET", url);
      return response as {
        data: Invoice[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      };
    },
  });
}

// Fetch single invoice
export function useClientInvoice(id: number) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const response = await silentClientApi("GET", `/billing/invoices/${id}`);
      return response as { data: Invoice };
    },
    enabled: !!id,
  });
}

// Fetch billing summary
export function useBillingSummary() {
  return useQuery({
    queryKey: invoiceKeys.summary(),
    queryFn: async () => {
      const response = await silentClientApi("GET", "/billing/invoices/summary");
      return response as { data: BillingSummary };
    },
  });
}

// Fetch payment history
export function usePaymentHistory(page = 1, perPage = 15) {
  return useQuery({
    queryKey: [...invoiceKeys.paymentHistory(), page, perPage],
    queryFn: async () => {
      const response = await silentClientApi(
        "GET",
        `/billing/payment-history?page=${page}&per_page=${perPage}`
      );
      return response as {
        data: any[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      };
    },
  });
}

// Pay invoice mutation
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await clientApi("POST", `/billing/invoices/${invoiceId}/pay`);
      return response as {
        data: {
          invoice_id: number;
          invoice_number: string;
          amount: number;
          currency: string;
          email: string;
          message: string;
        };
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

// Download invoice PDF
export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await silentClientApi("GET", `/billing/invoices/${invoiceId}/download`);
      return response as {
        data: {
          invoice: Invoice;
          owner: {
            name: string;
            email: string;
          };
        };
      };
    },
  });
}

// Utility functions
export const getStatusColor = (status: Invoice["status"]): string => {
  const colors: Record<Invoice["status"], string> = {
    draft: "gray",
    pending: "yellow",
    paid: "green",
    partial: "blue",
    overdue: "red",
    void: "gray",
    refunded: "purple",
  };
  return colors[status] || "gray";
};

export const getStatusLabel = (status: Invoice["status"]): string => {
  const labels: Record<Invoice["status"], string> = {
    draft: "Draft",
    pending: "Pending",
    paid: "Paid",
    partial: "Partially Paid",
    overdue: "Overdue",
    void: "Voided",
    refunded: "Refunded",
  };
  return labels[status] || status;
};

export const formatCurrency = (amount: number, currency = "NGN"): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};
