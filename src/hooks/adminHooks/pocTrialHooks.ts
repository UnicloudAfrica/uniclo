import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import type {
  PocTrialConfig,
  PocTrial,
  PocTrialRequest,
  PocStatistics,
  PocTrialFilters,
  PocOverride,
} from "@/types/pocTrial";

// ── Tenant POC Configuration ────────────────────────────

export const fetchTenantPocConfig = async (tenantId: string): Promise<PocTrialConfig> => {
  const res = await silentApi<{ data: PocTrialConfig }>(
    "GET",
    `/tenants/${tenantId}/poc-trials`
  );
  return res.data;
};

export const updateTenantPocConfig = async ({
  tenantId,
  data,
}: {
  tenantId: string;
  data: Partial<PocTrialConfig>;
}): Promise<PocTrialConfig> => {
  const res = await api<{ data: PocTrialConfig }>(
    "PUT",
    `/tenants/${tenantId}/poc-trials`,
    data as unknown as Record<string, unknown>
  );
  return res.data;
};

export const updateTenantPocOverrides = async ({
  tenantId,
  overrides,
}: {
  tenantId: string;
  overrides: Array<{ product_type: string; trial_days: number; enabled?: boolean }>;
}): Promise<PocOverride[]> => {
  const res = await api<{ data: PocOverride[] }>(
    "PUT",
    `/tenants/${tenantId}/poc-trials/overrides`,
    { overrides }
  );
  return res.data;
};

export const fetchTenantPocTrials = async (
  tenantId: string,
  filters?: PocTrialFilters
): Promise<{ data: PocTrial[]; meta?: Record<string, unknown> }> => {
  const res = await silentApi<{ data: PocTrial[]; meta?: Record<string, unknown> }>(
    "GET",
    `/tenants/${tenantId}/poc-trials/list`,
    { params: filters } as unknown as Record<string, unknown>
  );
  return res;
};

// ── Global POC Trials ───────────────────────────────────

export const fetchPocTrials = async (
  filters?: PocTrialFilters
): Promise<{ data: PocTrial[]; meta?: Record<string, unknown> }> => {
  const res = await silentApi<{ data: PocTrial[]; meta?: Record<string, unknown> }>(
    "GET",
    "/poc-trials",
    { params: filters } as unknown as Record<string, unknown>
  );
  return res;
};

export const fetchPocStatistics = async (): Promise<PocStatistics> => {
  const res = await silentApi<{ data: PocStatistics }>("GET", "/poc-trials/statistics");
  return res.data;
};

export const fetchPocTrialById = async (trialId: number): Promise<PocTrial> => {
  const res = await silentApi<{ data: PocTrial }>("GET", `/poc-trials/${trialId}`);
  return res.data;
};

// ── Trial Actions ───────────────────────────────────────

export const extendPocTrial = async ({
  tenantId,
  trialId,
  additionalDays,
}: {
  tenantId: string;
  trialId: number;
  additionalDays: number;
}): Promise<PocTrial> => {
  const res = await api<{ data: PocTrial }>(
    "POST",
    `/tenants/${tenantId}/poc-trials/${trialId}/extend`,
    {
      additional_days: additionalDays,
    }
  );
  return res.data;
};

export const cancelPocTrial = async ({
  tenantId,
  trialId,
  reason,
}: {
  tenantId: string;
  trialId: number;
  reason?: string;
}): Promise<PocTrial> => {
  const res = await api<{ data: PocTrial }>(
    "POST",
    `/tenants/${tenantId}/poc-trials/${trialId}/cancel`,
    {
      reason: reason || "admin_cancelled",
    }
  );
  return res.data;
};

// ── React Query Hooks ───────────────────────────────────

export const useFetchTenantPocConfig = (tenantId: string) => {
  return useQuery({
    queryKey: ["tenant-poc-config", tenantId],
    queryFn: () => fetchTenantPocConfig(tenantId),
    enabled: !!tenantId,
  });
};

export const useUpdateTenantPocConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantPocConfig,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-poc-config", variables.tenantId] });
    },
  });
};

export const useUpdateTenantPocOverrides = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantPocOverrides,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-poc-config", variables.tenantId] });
    },
  });
};

export const useFetchTenantPocTrials = (tenantId: string, filters?: PocTrialFilters) => {
  return useQuery({
    queryKey: ["tenant-poc-trials", tenantId, filters],
    queryFn: () => fetchTenantPocTrials(tenantId, filters),
    enabled: !!tenantId,
  });
};

export const useFetchPocTrials = (filters?: PocTrialFilters) => {
  return useQuery({
    queryKey: ["poc-trials", filters],
    queryFn: () => fetchPocTrials(filters),
  });
};

export const useFetchPocStatistics = () => {
  return useQuery({
    queryKey: ["poc-statistics"],
    queryFn: fetchPocStatistics,
  });
};

export const useExtendPocTrial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: extendPocTrial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poc-trials"] });
      queryClient.invalidateQueries({ queryKey: ["poc-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-poc-trials"] });
    },
  });
};

export const useCancelPocTrial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelPocTrial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poc-trials"] });
      queryClient.invalidateQueries({ queryKey: ["poc-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-poc-trials"] });
    },
  });
};

// ── POC Trial Requests (Admin) ─────────────────────────

export const fetchPocTrialRequests = async (
  filters?: { status?: string; product_type?: string; tenant_id?: string; per_page?: number }
): Promise<{ data: PocTrialRequest[]; meta?: Record<string, unknown> }> => {
  const res = await silentApi<{ data: PocTrialRequest[]; meta?: Record<string, unknown> }>(
    "GET",
    "/poc-trial-requests",
    { params: filters } as unknown as Record<string, unknown>
  );
  return res;
};

export const fetchPocTrialRequestPendingCount = async (): Promise<number> => {
  const res = await silentApi<{ data: { count: number } }>(
    "GET",
    "/poc-trial-requests/pending-count"
  );
  return res.data.count;
};

export const approvePocTrialRequest = async ({
  requestId,
  trialDays,
  reviewNotes,
}: {
  requestId: number;
  trialDays?: number;
  reviewNotes?: string;
}): Promise<PocTrialRequest> => {
  const res = await api<{ data: PocTrialRequest }>(
    "POST",
    `/poc-trial-requests/${requestId}/approve`,
    {
      trial_days: trialDays,
      review_notes: reviewNotes,
    }
  );
  return res.data;
};

export const rejectPocTrialRequest = async ({
  requestId,
  reviewNotes,
}: {
  requestId: number;
  reviewNotes?: string;
}): Promise<PocTrialRequest> => {
  const res = await api<{ data: PocTrialRequest }>(
    "POST",
    `/poc-trial-requests/${requestId}/reject`,
    {
      review_notes: reviewNotes,
    }
  );
  return res.data;
};

export const useFetchPocTrialRequests = (filters?: {
  status?: string;
  product_type?: string;
  tenant_id?: string;
  per_page?: number;
}) => {
  return useQuery({
    queryKey: ["poc-trial-requests", filters],
    queryFn: () => fetchPocTrialRequests(filters),
  });
};

export const useFetchPocTrialRequestPendingCount = () => {
  return useQuery({
    queryKey: ["poc-trial-requests-pending-count"],
    queryFn: fetchPocTrialRequestPendingCount,
  });
};

export const useApprovePocTrialRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approvePocTrialRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poc-trial-requests"] });
      queryClient.invalidateQueries({ queryKey: ["poc-trial-requests-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["poc-statistics"] });
    },
  });
};

export const useRejectPocTrialRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectPocTrialRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poc-trial-requests"] });
      queryClient.invalidateQueries({ queryKey: ["poc-trial-requests-pending-count"] });
      queryClient.invalidateQueries({ queryKey: ["poc-statistics"] });
    },
  });
};
