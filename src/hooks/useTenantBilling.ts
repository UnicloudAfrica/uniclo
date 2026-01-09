// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

/**
 * Tenant Billing Hooks
 *
 * Hooks for managing tenant billing configuration, payment gateways, and balance.
 */

// ================================
// Types
// ================================

export interface BillingConfig {
  billing_model: "direct" | "prepaid_credit" | "credit_limit" | "paystack_split" | "trust_invoice";
  allowed_billing_models: string[];
  wallet_balance_cents: number;
  wallet_balance_formatted: string;
  credit_limit_cents: number;
  available_credit_cents: number;
  margin_percent: number;
  payment_terms_days: number;
  allow_client_gateway: boolean;
  can_change_billing_model: boolean;
}

export interface PaymentGateway {
  id: number;
  provider: "paystack" | "stripe" | "flutterwave";
  has_public_key: boolean;
  has_secret_key: boolean;
  has_subaccount: boolean;
  is_active: boolean;
  is_test_mode: boolean;
  is_ready: boolean;
}

export interface Settlement {
  id: number;
  amount_cents: number;
  amount_formatted: string;
  description: string;
  created_at: string;
  due_date: string;
}

export interface BillingBalance {
  wallet_balance_cents: number;
  wallet_balance_formatted: string;
  total_outstanding_cents: number;
  total_outstanding_formatted: string;
  settlements: Settlement[];
}

// ================================
// API Functions
// ================================

const fetchBillingConfig = async () => {
  const res = await silentTenantApi("GET", "/admin/billing");
  if (!res.data) throw new Error("Failed to fetch billing config");
  return res.data as BillingConfig;
};

const selectBillingModel = async (model: string) => {
  const res = await tenantApi("POST", "/admin/billing/select-model", { billing_model: model });
  if (!res.data) throw new Error("Failed to select billing model");
  return res.data;
};

const fetchBillingBalance = async () => {
  const res = await silentTenantApi("GET", "/admin/billing/balance");
  if (!res.data) throw new Error("Failed to fetch billing balance");
  return res.data as BillingBalance;
};

const fetchPaymentGateways = async () => {
  const res = await silentTenantApi("GET", "/admin/payment-gateway");
  if (!res.data) throw new Error("Failed to fetch payment gateways");
  return res.data as { gateways: PaymentGateway[]; supported_providers: string[] };
};

const savePaymentGateway = async (data: {
  provider: string;
  public_key: string;
  secret_key: string;
  webhook_secret?: string;
  subaccount_code?: string;
  is_test_mode?: boolean;
}) => {
  const res = await tenantApi("POST", "/admin/payment-gateway", data);
  if (!res.data) throw new Error("Failed to save payment gateway");
  return res.data;
};

const deletePaymentGateway = async (gatewayId: number) => {
  const res = await tenantApi("DELETE", `/admin/payment-gateway/${gatewayId}`);
  if (!res.data) throw new Error("Failed to delete payment gateway");
  return res.data;
};

// ================================
// Hooks
// ================================

export const useTenantBillingConfig = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-billing-config"],
    queryFn: fetchBillingConfig,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useSelectBillingModel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: selectBillingModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-billing-config"] });
    },
    onError: (error) => {
      console.error("Error selecting billing model:", error);
    },
  });
};

export const useTenantBillingBalance = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-billing-balance"],
    queryFn: fetchBillingBalance,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useTenantPaymentGateways = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-payment-gateways"],
    queryFn: fetchPaymentGateways,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useSavePaymentGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePaymentGateway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-gateways"] });
    },
    onError: (error) => {
      console.error("Error saving payment gateway:", error);
    },
  });
};

export const useDeletePaymentGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePaymentGateway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-gateways"] });
    },
    onError: (error) => {
      console.error("Error deleting payment gateway:", error);
    },
  });
};

// ================================
// Bank & Subaccount API Functions
// ================================

interface Bank {
  code: string;
  name: string;
  slug?: string;
}

interface VerifyAccountResult {
  account_number: string;
  account_name: string;
  bank_id?: number;
}

const fetchBanks = async () => {
  const res = await silentTenantApi("GET", "/admin/payment-gateway/banks");
  if (!res.data?.banks) throw new Error("Failed to fetch banks");
  return res.data.banks as Bank[];
};

const verifyBankAccount = async (data: { account_number: string; bank_code: string }) => {
  const res = await tenantApi("POST", "/admin/payment-gateway/verify-account", data);
  if (!res.data) throw new Error("Failed to verify account");
  return res.data as VerifyAccountResult;
};

const createSubaccount = async (data: {
  account_number: string;
  bank_code: string;
  account_name?: string;
  phone?: string;
}) => {
  const res = await tenantApi("POST", "/admin/payment-gateway/subaccount", data);
  if (!res.data) throw new Error("Failed to create subaccount");
  return res.data as { subaccount_code: string };
};

// ================================
// Bank & Subaccount Hooks
// ================================

export const useBankList = (options = {}) => {
  return useQuery({
    queryKey: ["paystack-banks"],
    queryFn: fetchBanks,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useVerifyBankAccount = () => {
  return useMutation({
    mutationFn: verifyBankAccount,
    onError: (error) => {
      console.error("Error verifying bank account:", error);
    },
  });
};

export const useCreateSubaccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubaccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-gateways"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-billing-config"] });
    },
    onError: (error) => {
      console.error("Error creating subaccount:", error);
    },
  });
};

// ================================
// Settlement & Invoice API Functions
// ================================

interface InvoiceItem {
  id: number;
  invoice_number: string;
  total: number;
  amount_due: number;
  currency: string;
  status: string;
  due_at: string | null;
  days_overdue: number;
  items_count: number;
}

interface EnforcementSummary {
  total_outstanding_cents: number;
  total_outstanding_formatted: string;
  pending_settlements: number;
  overdue_settlements: number;
  pending_invoices: number;
  overdue_invoices: number;
  is_suspended: boolean;
  should_suspend: boolean;
  payment_terms_days: number;
}

const fetchInvoices = async () => {
  const res = await silentTenantApi("GET", "/admin/billing/invoices");
  if (!res.data?.invoices) throw new Error("Failed to fetch invoices");
  return res.data.invoices as InvoiceItem[];
};

const fetchEnforcementSummary = async () => {
  const res = await silentTenantApi("GET", "/admin/billing/enforcement-summary");
  if (!res.data) throw new Error("Failed to fetch enforcement summary");
  return res.data as EnforcementSummary;
};

const paySettlements = async (data: {
  amount_cents: number;
  payment_method: "wallet" | "bank_transfer" | "card";
  reference?: string;
}) => {
  const res = await tenantApi("POST", "/admin/billing/pay-settlements", data);
  if (!res.data) throw new Error("Failed to process payment");
  return res.data as { amount_applied: number; remaining: number; settlements_updated: number };
};

// ================================
// Settlement & Invoice Hooks
// ================================

export const useInvoices = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-invoices"],
    queryFn: fetchInvoices,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useEnforcementSummary = (options = {}) => {
  return useQuery({
    queryKey: ["tenant-enforcement-summary"],
    queryFn: fetchEnforcementSummary,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const usePaySettlements = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paySettlements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-billing-balance"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-enforcement-summary"] });
    },
    onError: (error) => {
      console.error("Error processing settlement payment:", error);
    },
  });
};

// Combined hook for all billing operations
export const useTenantBillingOperations = () => {
  const config = useTenantBillingConfig();
  const balance = useTenantBillingBalance();
  const gateways = useTenantPaymentGateways();
  const selectModel = useSelectBillingModel();
  const saveGateway = useSavePaymentGateway();
  const deleteGateway = useDeletePaymentGateway();
  const banks = useBankList({ enabled: false }); // Load on demand
  const verifyAccount = useVerifyBankAccount();
  const createSub = useCreateSubaccount();
  const invoices = useInvoices({ enabled: false });
  const enforcement = useEnforcementSummary({ enabled: false });
  const paySettlement = usePaySettlements();

  return {
    config,
    balance,
    gateways,
    selectModel,
    saveGateway,
    deleteGateway,
    banks,
    verifyAccount,
    createSubaccount: createSub,
    invoices,
    enforcement,
    paySettlement,
    isLoading: config.isLoading || balance.isLoading,
    error: config.error || balance.error,
  };
};
