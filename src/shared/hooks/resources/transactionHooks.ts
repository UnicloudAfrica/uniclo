/**
 * Transaction Hooks — client wallet transaction history.
 *
 * Endpoint: GET /api/v1/business/wallet/transactions
 *   Written by: WalletController@transactions
 *
 * The client API's urlPrefix is "/business" so we hit
 * `${entry.silentApi.baseURL}/business/wallet/transactions` by using
 * the path "/wallet/transactions" (no prefix duplication — silentApi
 * already has `baseURL` set to `/api/v1` and urlPrefix is handled by
 * the apiRegistry entry, not injected into every path).
 *
 * The backend paginates via Laravel's `paginate()`, returning:
 *   { data: WalletTransaction[], links: {...}, meta: PaginationMeta }
 */
import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type QueryOptions<T = unknown> = Partial<
  Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
>;

// ─── Types ──────────────────────────────────────────────────────

export type TransactionType =
  | "credit"
  | "debit"
  | "refund"
  | "adjustment"
  | "transfer_in"
  | "transfer_out"
  | "promotional";

export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export interface WalletTransaction {
  id: number;
  uuid: string;
  type: TransactionType;
  amount: string | number;
  balance_before: string | number;
  balance_after: string | number;
  currency: string;
  source: string | null;
  reference: string | null;
  description: string | null;
  status: TransactionStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface TransactionListResponse {
  data: WalletTransaction[];
  meta: PaginationMeta;
}

export interface TransactionListParams {
  per_page?: number;
  page?: number;
  currency?: string;
}

// ─── Type labels (mirrors WalletTransaction::getTypeLabelAttribute) ──

const TYPE_LABELS: Record<TransactionType, string> = {
  credit: "Wallet Top-up",
  debit: "Service Charge",
  refund: "Refund",
  adjustment: "Admin Adjustment",
  transfer_in: "Transfer Received",
  transfer_out: "Transfer Sent",
  promotional: "Promotional Credit",
};

export const getTransactionTypeLabel = (type: string): string =>
  TYPE_LABELS[type as TransactionType] ?? type;

export const isDebitType = (type: string): boolean =>
  type === "debit" || type === "transfer_out";

// ─── Query Keys ─────────────────────────────────────────────────

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (params?: TransactionListParams) =>
    ["transactions", "list", params ?? {}] as const,
};

// ─── Helpers ────────────────────────────────────────────────────

const buildQueryString = (params?: Record<string, unknown>): string => {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const out = qs.toString();
  return out ? `?${out}` : "";
};

// ─── Hook ───────────────────────────────────────────────────────

export function useFetchTransactions(
  params?: TransactionListParams,
  options?: QueryOptions<TransactionListResponse>
) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<TransactionListResponse, Error>({
    queryKey: transactionKeys.list(params),
    queryFn: async () => {
      const qs = buildQueryString(params as Record<string, unknown> | undefined);
      const res = await entry.silentApi.get<AnyRecord>(
        `/wallet/transactions${qs}`
      );
      const envelope = (res ?? {}) as Partial<TransactionListResponse>;
      const data = Array.isArray(envelope?.data) ? envelope.data : [];
      const meta: PaginationMeta = envelope?.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: params?.per_page ?? 20,
        total: data.length,
      };
      return { data, meta };
    },
    ...options,
  });
}
