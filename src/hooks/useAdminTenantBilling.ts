// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentAdminApi from "../index/admin/silent";
import adminApi from "../index/admin/api";

/**
 * Admin Tenant Billing Hooks
 *
 * Hooks for admins to manage tenant billing configurations.
 */

// ================================
// Types
// ================================

export interface TenantBillingConfig {
  tenant_id: string;
  tenant_name: string;
  billing_model: string;
  allowed_billing_models: string[];
  credit_limit_cents: number;
  credit_limit_formatted: string;
  margin_percent: number;
  payment_terms_days: number;
  auto_suspend_on_overdue: boolean;
  allow_client_gateway: boolean;
  available_billing_models: string[];
  payment_gateways: Array<{
    id: number;
    provider: string;
    is_active: boolean;
    is_test_mode: boolean;
    has_subaccount: boolean;
  }>;
}

export interface TenantBillingSummary {
  tenant_id: string;
  billing_model: string;
  wallet_balance_cents: number;
  wallet_balance_formatted: string;
  credit_limit_cents: number;
  available_credit_cents: number;
  total_outstanding_cents: number;
  total_outstanding_formatted: string;
  pending_settlements_count: number;
  oldest_settlement_date: string | null;
  days_since_oldest: number;
  is_overdue: boolean;
  payment_terms_days: number;
}

// ================================
// API Functions
// ================================

const fetchTenantBillingConfig = async (tenantId: string) => {
  const res = await silentAdminApi("GET", `/tenants/${tenantId}/billing`);
  if (!res.data) throw new Error("Failed to fetch tenant billing config");
  return res.data as TenantBillingConfig;
};

const updateTenantBillingConfig = async ({
  tenantId,
  data,
}: {
  tenantId: string;
  data: {
    billing_model?: string;
    allowed_billing_models?: string[];
    credit_limit_cents?: number;
    margin_percent?: number;
    payment_terms_days?: number;
    auto_suspend_on_overdue?: boolean;
    allow_client_gateway?: boolean;
  };
}) => {
  const res = await adminApi("PUT", `/tenants/${tenantId}/billing`, data);
  if (!res.data) throw new Error("Failed to update tenant billing config");
  return res.data;
};

const addTenantCredit = async ({
  tenantId,
  amount_cents,
  description,
}: {
  tenantId: string;
  amount_cents: number;
  description?: string;
}) => {
  const res = await adminApi("POST", `/tenants/${tenantId}/billing/credit`, {
    amount_cents,
    description,
  });
  if (!res.data) throw new Error("Failed to add credit");
  return res.data;
};

const fetchTenantBillingSummary = async (tenantId: string) => {
  const res = await silentAdminApi("GET", `/tenants/${tenantId}/billing/summary`);
  if (!res.data) throw new Error("Failed to fetch tenant billing summary");
  return res.data as TenantBillingSummary;
};

// ================================
// Hooks
// ================================

export const useAdminTenantBillingConfig = (tenantId: string, options = {}) => {
  return useQuery({
    queryKey: ["admin-tenant-billing", tenantId],
    queryFn: () => fetchTenantBillingConfig(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateTenantBillingConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantBillingConfig,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-billing", variables.tenantId] });
    },
    onError: (error) => {
      console.error("Error updating tenant billing config:", error);
    },
  });
};

export const useAddTenantCredit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTenantCredit,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-billing", variables.tenantId] });
    },
    onError: (error) => {
      console.error("Error adding tenant credit:", error);
    },
  });
};

export const useAdminTenantBillingSummary = (tenantId: string, options = {}) => {
  return useQuery({
    queryKey: ["admin-tenant-billing-summary", tenantId],
    queryFn: () => fetchTenantBillingSummary(tenantId),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// Combined hook for admin tenant billing operations
export const useAdminTenantBilling = (tenantId: string) => {
  const config = useAdminTenantBillingConfig(tenantId);
  const summary = useAdminTenantBillingSummary(tenantId);
  const updateConfig = useUpdateTenantBillingConfig();
  const addCredit = useAddTenantCredit();

  return {
    config,
    summary,
    updateConfig,
    addCredit,
    isLoading: config.isLoading || summary.isLoading,
    error: config.error || summary.error,
  };
};
