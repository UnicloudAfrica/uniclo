import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// ═══════════════════════════════════════════════════════════════════
// Shared wallet types
// ═══════════════════════════════════════════════════════════════════

/**
 * All wallet endpoints wrap their payload in either `{ data: T }` or
 * return `T` directly depending on the endpoint. The `unwrapData`
 * helper below accepts both shapes; these types describe what the
 * hook consumers actually see after unwrapping.
 */
export type BillingMode = "prepaid" | "postpaid" | "hybrid";

export interface WalletBalance {
  currency: string;
  balance: number;
  available_balance?: number;
  pending_balance?: number;
  billing_mode?: BillingMode;
  isLowBalance?: boolean;
  updated_at?: string;
  /** Back-compat: some endpoints return extra fields the admin UI reads. */
  [key: string]: unknown;
}

export type WalletTransactionType =
  | "credit"
  | "debit"
  | "refund"
  | "adjustment"
  | "transfer_in"
  | "transfer_out"
  | "promotional";

export interface WalletTransaction {
  id: number | string;
  uuid?: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  balance_before?: number;
  balance_after?: number;
  source?: string;
  reference?: string | null;
  description?: string;
  status?: "pending" | "completed" | "failed" | "reversed";
  created_at: string;
  /** Allow consumer-side extensions without breaking the contract. */
  [key: string]: unknown;
}

export interface WalletTransactionsPage {
  data: WalletTransaction[];
  meta?: {
    total?: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export interface WalletTransactionsQuery {
  currency?: string;
  from?: string;
  to?: string;
  type?: WalletTransactionType;
  page?: number;
  per_page?: number;
}

export interface TopUpPayload {
  amount: number;
  currency: string;
  payment_method: string;
}

export interface AutoTopUpConfig {
  enabled: boolean;
  trigger_balance: number;
  target_balance: number;
  currency: string;
  payment_method?: string;
}

export interface PromoCreditsPayload {
  user_id: string;
  amount: number;
  reason: string;
  currency: string;
}

export interface WalletAdjustmentPayload {
  wallet_id: string;
  amount: number;
  reason: string;
}

/**
 * Envelope we occasionally see from the API: `{ data: { data: T } }`
 * vs `{ data: T }`. Unwrap once when needed.
 */
type Envelope<T> = { data?: T | { data?: T } };

/**
 * Peel one or two levels of `data:` off an API response. Typed tight
 * enough to keep intellisense for T and prevent "unknown" bleed at
 * the call site.
 */
const unwrapData = <T>(res: Envelope<T>): T | undefined => {
  const first = res?.data;
  if (first && typeof first === "object" && "data" in first) {
    return (first as { data?: T }).data;
  }
  return first as T | undefined;
};

// ═══════════════════════════════════════════════════════════════════
// WALLET BALANCE
// ═══════════════════════════════════════════════════════════════════

// Fetch wallet balance for current user
export const useFetchWalletBalance = (currency = "NGN", options = {}) => {
  return useQuery<WalletBalance | undefined>({
    queryKey: ["walletBalance", currency],
    queryFn: async () => {
      const res = await silentApi<Envelope<WalletBalance>>(
        "GET",
        `/business/wallet`,
        { currency } as unknown as Record<string, unknown>,
      );
      return unwrapData(res);
    },
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
};

// Fetch wallet transactions.
// Laravel's paginator returns `{ data: [...], meta: {...} }` directly,
// so we receive that shape as-is — no envelope unwrapping needed.
export const useFetchWalletTransactions = (
  params: WalletTransactionsQuery = {},
  options = {},
) => {
  return useQuery<WalletTransactionsPage | undefined>({
    queryKey: ["walletTransactions", params],
    queryFn: async () => {
      const res = await silentApi<WalletTransactionsPage>(
        "GET",
        `/business/wallet/transactions`,
        params as unknown as Record<string, unknown>,
      );
      return res;
    },
    staleTime: 1000 * 60,
    ...options,
  });
};

// Top up wallet
export const useTopUpWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, currency, payment_method }: TopUpPayload) => {
      const res = await api<{ data?: unknown }>("POST", `/business/wallet/topup`, {
        amount,
        currency,
        payment_method,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
    },
  });
};

// Set billing mode
export const useSetBillingMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ billing_mode }: { billing_mode: BillingMode }) => {
      const res = await api<Envelope<WalletBalance>>(
        "PUT",
        `/business/wallet/billing-mode`,
        { billing_mode },
      );
      return unwrapData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
};

// Configure auto top-up
export const useConfigureAutoTopUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: AutoTopUpConfig) => {
      const res = await api<Envelope<AutoTopUpConfig>>(
        "PUT",
        `/business/wallet/auto-topup`,
        config as unknown as Record<string, unknown>,
      );
      return unwrapData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN: Wallet management
// ═══════════════════════════════════════════════════════════════════

// Admin: Give promotional credits
export const useGivePromoCredits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user_id, amount, reason, currency }: PromoCreditsPayload) => {
      const res = await api<Envelope<WalletTransaction>>(
        "POST",
        `/admin/v1/wallets/promo-credits`,
        {
          user_id,
          amount,
          reason,
          currency,
        },
      );
      return unwrapData(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
  });
};

// Admin: Adjust balance
export const useAdjustWalletBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ wallet_id, amount, reason }: WalletAdjustmentPayload) => {
      const res = await api<Envelope<WalletTransaction>>(
        "POST",
        `/admin/v1/wallets/${wallet_id}/adjust`,
        {
          amount,
          reason,
        },
      );
      return unwrapData(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", variables.wallet_id] });
    },
  });
};
