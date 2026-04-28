import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";
import logger from "../utils/logger";

/**
 * Tenant Billing Hooks
 *
 * Hooks for managing tenant billing configuration, payment gateways, and balance.
 */

// ================================
// Types
// ================================

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, readonly unknown[]>,
  "queryKey" | "queryFn"
>;

type QueryParams = Record<string, string | number | boolean | null | undefined>;

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

const fetchBillingConfig = async (): Promise<BillingConfig> => {
  const res = await silentTenantApi<{ data?: BillingConfig }>("GET", "/admin/billing");
  if (!res.data) throw new Error("Failed to fetch billing config");
  return res.data;
};

const selectBillingModel = async (model: string): Promise<unknown> => {
  const res = await tenantApi<{ data?: unknown }>("POST", "/admin/billing/select-model", {
    billing_model: model,
  });
  if (!res.data) throw new Error("Failed to select billing model");
  return res.data;
};

const fetchBillingBalance = async (): Promise<BillingBalance> => {
  const res = await silentTenantApi<{ data?: BillingBalance }>("GET", "/admin/billing/balance");
  if (!res.data) throw new Error("Failed to fetch billing balance");
  return res.data;
};

interface PaymentGatewaysResponse {
  gateways: PaymentGateway[];
  supported_providers: string[];
}

const fetchPaymentGateways = async (): Promise<PaymentGatewaysResponse> => {
  const res = await silentTenantApi<{ data?: PaymentGatewaysResponse }>(
    "GET",
    "/admin/payment-gateway"
  );
  if (!res.data) throw new Error("Failed to fetch payment gateways");
  return res.data;
};

const savePaymentGateway = async (data: {
  provider: string;
  public_key: string;
  secret_key: string;
  webhook_secret?: string;
  subaccount_code?: string;
  is_test_mode?: boolean;
}): Promise<unknown> => {
  const res = await tenantApi<{ data?: unknown }>("POST", "/admin/payment-gateway", data);
  if (!res.data) throw new Error("Failed to save payment gateway");
  return res.data;
};

const deletePaymentGateway = async (gatewayId: number): Promise<unknown> => {
  const res = await tenantApi<{ data?: unknown }>(
    "DELETE",
    `/admin/payment-gateway/${gatewayId}`
  );
  if (!res.data) throw new Error("Failed to delete payment gateway");
  return res.data;
};

// ================================
// Hooks
// ================================

export const useTenantBillingConfig = (options: QueryOptions<BillingConfig> = {}) => {
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
      logger.error("Error selecting billing model:", error);
    },
  });
};

export const useTenantBillingBalance = (options: QueryOptions<BillingBalance> = {}) => {
  return useQuery({
    queryKey: ["tenant-billing-balance"],
    queryFn: fetchBillingBalance,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useTenantPaymentGateways = (
  options: QueryOptions<{ gateways: PaymentGateway[]; supported_providers: string[] }> = {}
) => {
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
      logger.error("Error saving payment gateway:", error);
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
      logger.error("Error deleting payment gateway:", error);
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

const fetchBanks = async (): Promise<Bank[]> => {
  const res = await silentTenantApi<{ data?: { banks?: Bank[] } }>(
    "GET",
    "/admin/payment-gateway/banks"
  );
  if (!res.data?.banks) throw new Error("Failed to fetch banks");
  return res.data.banks;
};

const verifyBankAccount = async (data: {
  account_number: string;
  bank_code: string;
}): Promise<VerifyAccountResult> => {
  const res = await tenantApi<{ data?: VerifyAccountResult }>(
    "POST",
    "/admin/payment-gateway/verify-account",
    data
  );
  if (!res.data) throw new Error("Failed to verify account");
  return res.data;
};

const createSubaccount = async (data: {
  account_number: string;
  bank_code: string;
  account_name?: string;
  phone?: string;
}): Promise<{ subaccount_code: string }> => {
  const res = await tenantApi<{ data?: { subaccount_code: string } }>(
    "POST",
    "/admin/payment-gateway/subaccount",
    data
  );
  if (!res.data) throw new Error("Failed to create subaccount");
  return res.data;
};

// ================================
// Bank & Subaccount Hooks
// ================================

export const useBankList = (options: QueryOptions<Bank[]> = {}) => {
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
      logger.error("Error verifying bank account:", error);
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
      logger.error("Error creating subaccount:", error);
    },
  });
};

// ================================
// Settlement & Invoice API Functions
// ================================

export interface InvoiceItem {
  id: number;
  invoice_number: string;
  total: number;
  amount_due: number;
  currency: string;
  status: string;
  due_at: string | null;
  days_overdue: number;
  items_count: number;
  created_at?: string;
}

export interface EnforcementSummary {
  total_outstanding_cents: number;
  total_outstanding_formatted: string;
  pending_settlements: number;
  overdue_settlements: number;
  pending_invoices: number;
  overdue_invoices: number;
  overdue_count?: number;
  is_suspended: boolean;
  should_suspend: boolean;
  payment_terms_days: number;
}

export type InvoiceQueryParams = {
  status?: string;
  page?: number;
  per_page?: number;
};

const toQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    return true;
  });
  if (entries.length === 0) return "";
  return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
};

const fetchInvoices = async (params: InvoiceQueryParams = {}): Promise<InvoiceItem[]> => {
  const query = toQueryString(params);
  const url = `/admin/billing/invoices${query ? `?${query}` : ""}`;
  const res = await silentTenantApi<{ data?: { invoices?: InvoiceItem[] } }>("GET", url);
  if (!res.data?.invoices) throw new Error("Failed to fetch invoices");
  return res.data.invoices;
};

const fetchEnforcementSummary = async (): Promise<EnforcementSummary> => {
  const res = await silentTenantApi<{ data?: EnforcementSummary }>(
    "GET",
    "/admin/billing/enforcement-summary"
  );
  if (!res.data) throw new Error("Failed to fetch enforcement summary");
  return res.data;
};

interface PaySettlementsResult {
  amount_applied: number;
  remaining: number;
  settlements_updated: number;
}

const paySettlements = async (data: {
  amount_cents: number;
  payment_method: "wallet" | "bank_transfer" | "card";
  reference?: string;
}): Promise<PaySettlementsResult> => {
  const res = await tenantApi<{ data?: PaySettlementsResult }>(
    "POST",
    "/admin/billing/pay-settlements",
    data
  );
  if (!res.data) throw new Error("Failed to process payment");
  return res.data;
};

// ================================
// Settlement & Invoice Hooks
// ================================

export const useInvoices = (
  params: InvoiceQueryParams = {},
  options: QueryOptions<InvoiceItem[]> = {}
) => {
  return useQuery({
    queryKey: ["tenant-invoices", params],
    queryFn: () => fetchInvoices(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useEnforcementSummary = (options: QueryOptions<EnforcementSummary> = {}) => {
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
      logger.error("Error processing settlement payment:", error);
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
  const invoices = useInvoices({}, { enabled: false });
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
