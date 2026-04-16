import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T } & AnyRecord =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T } & AnyRecord;

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface Bank {
  name: string;
  code: string;
  slug: string;
}

export interface BankVerification {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface IntegrationSplit {
  id: number;
  integration_key: string;
  name: string;
  paystack_subaccount_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  split_type: string;
  default_share_amount: number;
  default_share_percentage: number;
  is_active: boolean;
  is_verified: boolean;
}

export interface TenantSplitStatus {
  has_subaccount: boolean;
  subaccount_code: string | null;
  bank_details: {
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
  } | null;
  is_active: boolean;
}

export interface SplitBreakdown {
  total: number;
  integration_share: number;
  integration_key: string | null;
  tenant_share: number;
  platform_share: number;
  paystack_fee: number;
  currency: string;
}

// ═══════════════════════════════════════════════════════════════════
// SHARED HOOKS (Banks + Verification)
// ═══════════════════════════════════════════════════════════════════

export const useFetchBanks = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const prefix = context === "admin" ? "" : "/admin";

  return useQuery({
    queryKey: ["banks", context],
    queryFn: async () => {
      const res = asEnvelope<Bank[]>(
        await entry.silentApi.get<AnyRecord>(`${prefix}/payment-splits/banks`)
      );
      return (res.data ?? []) as Bank[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useVerifyBankAccount = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const prefix = context === "admin" ? "" : "/admin";

  return useMutation({
    mutationFn: async (payload: { account_number: string; bank_code: string }) => {
      const res = asEnvelope<BankVerification>(
        await entry.toastApi.post<AnyRecord>(`${prefix}/payment-splits/verify-account`, payload)
      );
      return res.data as BankVerification;
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// ADMIN HOOKS (Integration partner splits)
// ═══════════════════════════════════════════════════════════════════

export const useFetchIntegrationSplits = () => {
  const entry = apiRegistry.admin;

  return useQuery({
    queryKey: ["integration-splits"],
    queryFn: async () => {
      const res = asEnvelope<IntegrationSplit[]>(
        await entry.silentApi.get<AnyRecord>("/payment-splits/integrations")
      );
      return (res.data ?? []) as IntegrationSplit[];
    },
    staleTime: 1000 * 60,
  });
};

export const useCreateIntegrationSplit = () => {
  const entry = apiRegistry.admin;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      integration_key: string;
      business_name: string;
      bank_code: string;
      account_number: string;
      default_share_amount?: number;
      default_share_percentage?: number;
    }) => {
      const res = asEnvelope<IntegrationSplit>(
        await entry.toastApi.post<AnyRecord>("/payment-splits/integrations", payload)
      );
      return res.data as IntegrationSplit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integration-splits"] });
    },
  });
};

export const usePreviewSplit = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const prefix = context === "admin" ? "" : "/admin";

  return useMutation({
    mutationFn: async (payload: {
      total_amount: number;
      integration_key?: string;
      integration_cost?: number;
      tenant_markup?: number;
    }) => {
      const res = asEnvelope<SplitBreakdown>(
        await entry.silentApi.post<AnyRecord>(`${prefix}/payment-splits/preview`, payload)
      );
      return res.data as SplitBreakdown;
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// TENANT HOOKS (Their own settlement account)
// ═══════════════════════════════════════════════════════════════════

export const useFetchTenantSplitStatus = () => {
  const entry = apiRegistry.tenant;

  return useQuery({
    queryKey: ["tenant-split-status"],
    queryFn: async () => {
      const res = asEnvelope<TenantSplitStatus>(
        await entry.silentApi.get<AnyRecord>("/admin/payment-splits/status")
      );
      return (res.data ?? res) as TenantSplitStatus;
    },
    staleTime: 1000 * 60,
  });
};

export const useSetupTenantSplit = () => {
  const entry = apiRegistry.tenant;
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      bank_code: string;
      account_number: string;
      business_name: string;
    }) => {
      const res = asEnvelope(
        await entry.toastApi.post<AnyRecord>("/admin/payment-splits/setup", payload)
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenant-split-status"] });
    },
  });
};
