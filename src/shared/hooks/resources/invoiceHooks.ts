/**
 * Invoice Hooks — Context-aware hooks for invoices across admin, tenant, and client.
 *
 * Per-context URL conventions:
 *   - admin:  GET/POST /admin/v1/invoices...           (resourcePath = "invoices")
 *   - tenant: GET/POST /tenant/v1/admin/invoices...    (resourcePath = "admin/invoices")
 *   - client: GET/POST /api/v1/invoices...             (resourcePath = "invoices")
 *
 * Statistics endpoint name also differs:
 *   - admin:  /admin/v1/invoices-statistics
 *   - tenant: /tenant/v1/admin/invoices/statistics
 *   - client: /api/v1/invoices/summary
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import type { ApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type QueryOptions<T = unknown> = Partial<
  Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T; meta?: PaginationMeta } =>
  (res ?? {}) as {
    success?: boolean;
    message?: string;
    data?: T;
    meta?: PaginationMeta;
  };

// ─── Types ──────────────────────────────────────────────────────

export type InvoiceStatus =
  | "quote"
  | "accepted"
  | "draft"
  | "pending"
  | "paid"
  | "partial"
  | "overdue"
  | "void"
  | "refunded";

export interface InvoiceItem {
  id: number;
  product_name: string;
  description: string | null;
  quantity: string | number;
  unit: string;
  unit_price: string | number;
  discount_amount: string | number;
  tax_rate: string | number;
  tax_amount: string | number;
  subtotal: string | number;
}

export interface InvoiceTransaction {
  id: number;
  amount: string | number;
  currency?: string;
  status?: string;
  reference?: string;
  paid_at?: string;
  created_at?: string;
  note?: string;
  [key: string]: unknown;
}

export interface InvoiceOwner {
  id: number;
  name?: string;
  email?: string;
  company_name?: string;
}

export interface InvoiceTenant {
  id: number;
  name: string;
}

export interface Invoice {
  id: number;
  uuid: string;
  invoice_number: string | null;
  /**
   * Quote+Invoice convergence — populated when the row was saved as a
   * quote. Quotes use `quote_number` instead of `invoice_number` until
   * they are converted.
   */
  quote_number?: string | null;
  quote_expires_at?: string | null;
  accepted_at?: string | null;
  invoiceable_type: string;
  invoiceable_id: number;
  tenant_id: number | null;
  status: InvoiceStatus;
  currency: string;
  subtotal: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total: string | number;
  amount_paid: string | number;
  amount_due: string | number;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  pdf_path: string | null;
  notes: string | null;
  terms: string | null;
  metadata: Record<string, unknown> | null;
  fx_rate?: string | number;
  fx_source_currency?: string;
  fx_display_currency?: string;
  fx_locked_at?: string;
  owner_name?: string;
  owner_email?: string;
  days_overdue?: number;
  items?: InvoiceItem[];
  transactions?: InvoiceTransaction[];
  invoiceable?: InvoiceOwner;
  tenant?: InvoiceTenant;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface InvoiceListResponse {
  data: Invoice[];
  meta: PaginationMeta;
}

export interface InvoiceStatistics {
  total_invoices: number;
  draft: number;
  pending: number;
  paid: number;
  overdue: number;
  total_outstanding: number;
  total_collected: number;
  monthly_trend?: Array<{ month: string; count: number; total: number }>;
}

export interface InvoiceListParams {
  status?: InvoiceStatus | string;
  owner_type?: "user" | "tenant" | string;
  owner_id?: string | number;
  tenant_id?: string | number;
  from_date?: string;
  to_date?: string;
  overdue_only?: boolean | 1 | 0;
  unpaid_only?: boolean | 1 | 0;
  per_page?: number;
  page?: number;
  search?: string;
}

// ─── Path Helpers ──────────────────────────────────────────────

/**
 * The admin/tenant/client URL prefix from apiRegistry already encodes the
 * "/admin" segment for tenant and "/business" for client. To hit the
 * `/tenant/v1/admin/invoices` endpoint we just append `invoices`. For the
 * client dashboard the contract uses `/api/v1/invoices` (NOT
 * `/api/v1/business/invoices`), so we bypass `urlPrefix` for client.
 */
const invoicesPath = (context: ApiContext): string => {
  if (context === "tenant") return "/admin/invoices";
  // admin uses prefix "" so absolute "/invoices" works.
  // client uses prefix "/business" but the spec endpoint is "/invoices",
  // so we deliberately use the absolute "/invoices".
  return "/invoices";
};

const statsPath = (context: ApiContext): string => {
  if (context === "tenant") return "/admin/invoices/statistics";
  if (context === "client") return "/invoices/summary";
  return "/invoices-statistics";
};

const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      if (value) qs.set(key, "1");
      continue;
    }
    qs.set(key, String(value));
  }
  const out = qs.toString();
  return out ? `?${out}` : "";
};

// ─── Query Keys ────────────────────────────────────────────────

export const invoiceKeys = {
  all: (context: ApiContext) => ["invoices", context] as const,
  list: (context: ApiContext, params?: InvoiceListParams) =>
    ["invoices", context, "list", params ?? {}] as const,
  detail: (context: ApiContext, id: string | number) =>
    ["invoices", context, "detail", id] as const,
  statistics: (context: ApiContext, params?: AnyRecord) =>
    ["invoices", context, "statistics", params ?? {}] as const,
};

// ─── List ──────────────────────────────────────────────────────

export function useFetchInvoices(
  params?: InvoiceListParams,
  options?: QueryOptions<InvoiceListResponse>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<InvoiceListResponse, Error>({
    queryKey: invoiceKeys.list(context, params),
    queryFn: async () => {
      const url = `${invoicesPath(context)}${buildQueryString(
        params as Record<string, unknown> | undefined
      )}`;
      const res = await entry.silentApi.get<AnyRecord>(url);
      const envelope = (res ?? {}) as Partial<InvoiceListResponse>;
      const data = Array.isArray(envelope?.data) ? envelope.data : [];
      const meta: PaginationMeta = envelope?.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: params?.per_page ?? 15,
        total: data.length,
      };
      return { data, meta };
    },
    ...options,
  });
}

// ─── Show ──────────────────────────────────────────────────────

export function useFetchInvoiceById(
  id: string | number | null | undefined,
  options?: QueryOptions<Invoice | undefined>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<Invoice | undefined, Error>({
    queryKey: invoiceKeys.detail(context, id ?? ""),
    queryFn: async () => {
      const res = await entry.silentApi.get<AnyRecord>(
        `${invoicesPath(context)}/${id}`
      );
      return asEnvelope<Invoice>(res).data;
    },
    enabled: id !== null && id !== undefined && id !== "",
    ...options,
  });
}

// ─── Statistics ────────────────────────────────────────────────

export function useFetchInvoiceStatistics(
  params?: { include_trend?: boolean | 1 | 0 } & AnyRecord,
  options?: QueryOptions<InvoiceStatistics | undefined>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<InvoiceStatistics | undefined, Error>({
    queryKey: invoiceKeys.statistics(context, params),
    queryFn: async () => {
      const url = `${statsPath(context)}${buildQueryString(
        params as Record<string, unknown> | undefined
      )}`;
      const res = await entry.silentApi.get<AnyRecord>(url);
      const envelope = asEnvelope<AnyRecord>(res).data ?? {};

      // Client returns `{ data: { statistics, recent_invoices } }`. Normalise.
      if (
        context === "client" &&
        envelope &&
        typeof envelope === "object" &&
        "statistics" in envelope &&
        envelope.statistics &&
        typeof envelope.statistics === "object"
      ) {
        const stats = envelope.statistics as Record<string, unknown>;
        const num = (v: unknown): number =>
          typeof v === "number" ? v : Number(v ?? 0) || 0;
        return {
          total_invoices: num(stats.total_invoices),
          draft: 0,
          pending: num(stats.pending_count),
          paid: num(stats.total_paid),
          overdue: num(stats.overdue_count),
          total_outstanding:
            num(stats.total_pending) + num(stats.total_overdue),
          total_collected: num(stats.total_paid),
        } as InvoiceStatistics;
      }

      return envelope as unknown as InvoiceStatistics;
    },
    ...options,
  });
}

// ─── Mark Paid ─────────────────────────────────────────────────

export function useMarkInvoicePaid() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    { message?: string; data?: Invoice },
    Error,
    { id: string | number; amount?: number; note?: string }
  >({
    mutationFn: async ({ id, amount, note }) => {
      const res = await entry.toastApi.post<AnyRecord>(
        `${invoicesPath(context)}/${id}/mark-paid`,
        {
          ...(amount !== undefined ? { amount } : {}),
          ...(note ? { note } : {}),
        }
      );
      return res as { message?: string; data?: Invoice };
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(context, id),
      });
    },
  });
}

// ─── Send Reminder ─────────────────────────────────────────────

export function useSendInvoiceReminder() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    { message?: string; sent?: boolean },
    Error,
    { id: string | number }
  >({
    mutationFn: async ({ id }) => {
      const res = await entry.toastApi.post<AnyRecord>(
        `${invoicesPath(context)}/${id}/send-reminder`
      );
      return res as { message?: string; sent?: boolean };
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(context, id),
      });
    },
  });
}

// ─── Void (admin only) ─────────────────────────────────────────

export function useVoidInvoice() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    { message?: string; data?: Invoice },
    Error,
    { id: string | number; reason?: string }
  >({
    mutationFn: async ({ id, reason }) => {
      if (context !== "admin") {
        throw new Error("Voiding invoices is only available to administrators.");
      }
      const res = await entry.toastApi.post<AnyRecord>(
        `${invoicesPath(context)}/${id}/void`,
        reason ? { reason } : {}
      );
      return res as { message?: string; data?: Invoice };
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(context, id),
      });
    },
  });
}

// ─── Convert Quote → Invoice ───────────────────────────────────

export interface ConvertQuoteResponse {
  message?: string;
  data?: {
    id: number;
    uuid: string;
    invoice_number: string;
    quote_number: string | null;
    status: InvoiceStatus;
    accepted_at: string | null;
  };
}

/**
 * Promote a quote (or `accepted` quote) into a real invoice. Backed by
 * `POST /admin/v1/invoices/{invoice}/convert-to-invoice` (admin) and the
 * matching tenant-scoped path. Refreshes the invoice list + detail
 * caches on success so the UI flips to the new status immediately.
 */
export function useConvertQuoteToInvoice() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<ConvertQuoteResponse, Error, { id: string | number }>({
    mutationFn: async ({ id }) => {
      const res = await entry.toastApi.post<AnyRecord>(
        `${invoicesPath(context)}/${id}/convert-to-invoice`
      );
      return res as ConvertQuoteResponse;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(context, id),
      });
    },
  });
}

// ─── Finalize (admin only) ─────────────────────────────────────

export function useFinalizeInvoice() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    { message?: string; data?: Invoice },
    Error,
    { id: string | number }
  >({
    mutationFn: async ({ id }) => {
      if (context !== "admin") {
        throw new Error(
          "Finalizing invoices is only available to administrators."
        );
      }
      const res = await entry.toastApi.post<AnyRecord>(
        `${invoicesPath(context)}/${id}/finalize`
      );
      return res as { message?: string; data?: Invoice };
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(context, id),
      });
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────

const STATUS_TONE: Record<
  InvoiceStatus,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  // `quote` and `accepted` are documented as blue/teal in the design
  // system. The shared StatusPill only ships with the limited tone
  // palette below — `info` (blue) gives the best visual fit for both,
  // so we map both to `info` and rely on `getInvoiceStatusLabel` for
  // textual disambiguation. List/detail views that need finer-grained
  // colour can read `status` directly.
  quote: "info",
  accepted: "info",
  draft: "neutral",
  pending: "warning",
  paid: "success",
  partial: "info",
  overdue: "danger",
  void: "neutral",
  refunded: "info",
};

export const getInvoiceStatusTone = (
  status?: string
): "success" | "warning" | "danger" | "info" | "neutral" =>
  STATUS_TONE[(status ?? "").toLowerCase() as InvoiceStatus] ?? "neutral";

export const getInvoiceStatusLabel = (status?: string): string => {
  if (!status) return "Unknown";
  const map: Record<InvoiceStatus, string> = {
    quote: "Quote",
    accepted: "Accepted",
    draft: "Draft",
    pending: "Pending",
    paid: "Paid",
    partial: "Partially Paid",
    overdue: "Overdue",
    void: "Voided",
    refunded: "Refunded",
  };
  return map[status.toLowerCase() as InvoiceStatus] ?? status;
};

const toNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatInvoiceCurrency = (
  amount: string | number | null | undefined,
  currency = "NGN"
): string => {
  const n = toNumber(amount);
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
};

export const invoiceNumber = toNumber;
