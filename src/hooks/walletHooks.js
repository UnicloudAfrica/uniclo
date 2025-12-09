import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// ═══════════════════════════════════════════════════════════════════
// WALLET BALANCE
// ═══════════════════════════════════════════════════════════════════

// Fetch wallet balance for current user
export const useFetchWalletBalance = (currency = "NGN", options = {}) => {
  return useQuery({
    queryKey: ["walletBalance", currency],
    queryFn: async () => {
      const res = await silentApi("GET", `/business/wallet`, { currency });
      return res.data?.data || res.data;
    },
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  });
};

// Fetch wallet transactions
export const useFetchWalletTransactions = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["walletTransactions", params],
    queryFn: async () => {
      const res = await silentApi("GET", `/business/wallet/transactions`, params);
      return res.data;
    },
    staleTime: 1000 * 60,
    ...options,
  });
};

// Top up wallet
export const useTopUpWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, currency, payment_method }) => {
      const res = await api("POST", `/business/wallet/topup`, {
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
    mutationFn: async ({ billing_mode }) => {
      const res = await api("PUT", `/business/wallet/billing-mode`, { billing_mode });
      return res.data;
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
    mutationFn: async (config) => {
      const res = await api("PUT", `/business/wallet/auto-topup`, config);
      return res.data;
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
    mutationFn: async ({ user_id, amount, reason, currency }) => {
      const res = await api("POST", `/admin/v1/wallets/promo-credits`, {
        user_id,
        amount,
        reason,
        currency,
      });
      return res.data;
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
    mutationFn: async ({ wallet_id, amount, reason }) => {
      const res = await api("POST", `/admin/v1/wallets/${wallet_id}/adjust`, {
        amount,
        reason,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", variables.wallet_id] });
    },
  });
};
