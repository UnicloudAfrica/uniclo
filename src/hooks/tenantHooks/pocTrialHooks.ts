import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import type {
  TenantPocConfig,
  PocTrial,
  PocTrialRequest,
  PocTrialFilters,
} from "@/types/pocTrial";

// ── Tenant POC Configuration (Read-Only) ───────────────

export const fetchTenantPocConfig = async (): Promise<TenantPocConfig> => {
  const res = await silentTenantApi<{ data: TenantPocConfig }>(
    "GET",
    "/admin/poc-trials/config"
  );
  return res.data;
};

// ── Tenant POC Trials ──────────────────────────────────

export const fetchTenantPocTrials = async (
  filters?: PocTrialFilters
): Promise<{ data: PocTrial[]; meta?: Record<string, unknown> }> => {
  const res = await silentTenantApi<{ data: PocTrial[]; meta?: Record<string, unknown> }>(
    "GET",
    "/admin/poc-trials",
    { params: filters as Record<string, unknown> | undefined } as unknown as Record<string, unknown>
  );
  return res;
};

// ── Tenant POC Trial Requests ──────────────────────────

export const fetchTenantPocRequests = async (filters?: {
  status?: string;
  per_page?: number;
}): Promise<{ data: PocTrialRequest[]; meta?: Record<string, unknown> }> => {
  const res = await silentTenantApi<{
    data: PocTrialRequest[];
    meta?: Record<string, unknown>;
  }>("GET", "/admin/poc-trials/requests", {
    params: filters,
  } as unknown as Record<string, unknown>);
  return res;
};

export const submitPocTrialRequest = async (data: {
  product_type: string;
  trial_days: number;
  reason?: string;
  customer_tenant_id?: string;
  customer_user_id?: number;
  resource_description?: string;
}): Promise<PocTrialRequest> => {
  const res = await tenantApi<{ data: PocTrialRequest }>(
    "POST",
    "/admin/poc-trials/requests",
    data
  );
  return res.data;
};

// ── React Query Hooks ──────────────────────────────────

export const useFetchTenantPocConfig = () => {
  return useQuery({
    queryKey: ["tenant-self-poc-config"],
    queryFn: fetchTenantPocConfig,
  });
};

export const useFetchTenantPocTrials = (filters?: PocTrialFilters) => {
  return useQuery({
    queryKey: ["tenant-self-poc-trials", filters],
    queryFn: () => fetchTenantPocTrials(filters),
  });
};

export const useFetchTenantPocRequests = (filters?: { status?: string; per_page?: number }) => {
  return useQuery({
    queryKey: ["tenant-self-poc-requests", filters],
    queryFn: () => fetchTenantPocRequests(filters),
  });
};

export const useSubmitPocTrialRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPocTrialRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-self-poc-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-self-poc-config"] });
    },
  });
};
