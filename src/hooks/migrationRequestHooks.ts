/**
 * Customer-facing migration request hooks. Pairs with the backend
 * Common\Migration\MigrationRequestController:
 *
 *   GET  /migration-requests              list this tenant's requests
 *   POST /migration-requests              submit a single (src→tgt) request
 *   POST /migration-requests/batch        submit up to 10 region pairs at once
 *   GET  /migration-requests/{identifier} detail with linked ProviderMigration
 *
 * Customer never sees a raw provider name (Zadara/OpenStack) — labels go
 * through cloudTerms / shared formatters where rendered.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import ToastUtils from "../utils/toastUtil";

export interface MigrationRequest {
  id: number;
  identifier: string;
  tenant_id: string;
  user_id: number | null;
  source_provider: string;
  source_region: string;
  target_region: string;
  preferred_window_start: string | null;
  preferred_window_end: string | null;
  customer_notes: string | null;
  status:
    | "pending"
    | "approved"
    | "scheduled"
    | "rejected"
    | "completed";
  admin_notes: string | null;
  provider_migration_id: number | null;
  provider_migration?: ProviderMigrationLite | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderMigrationLite {
  id: number;
  identifier: string;
  status: string;
  progress: { stage?: string; percent?: number } | null;
  resource_summary: Record<string, number> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface MigrationCostPreview {
  currency: string;
  monthly_estimate_usd: number;
  resources: { instances: number; volume_total_gb: number };
  breakdown: { instances_monthly_usd: number; volumes_monthly_usd: number };
  note: string;
}

export interface SingleMigrationPayload {
  source_provider: string;
  source_region: string;
  target_region: string;
  preferred_window_start?: string | null;
  preferred_window_end?: string | null;
  customer_notes?: string | null;
}

export interface BatchMigrationPayload {
  source_provider: string;
  pairs: { source_region: string; target_region: string }[];
  preferred_window_start?: string | null;
  preferred_window_end?: string | null;
  customer_notes?: string | null;
}

interface ListResponse<T> {
  data: T[];
}

interface ItemResponse<T> {
  data: T;
  cost_preview?: MigrationCostPreview;
  message?: string;
}

const PATH = "/migration-requests";

// ─────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────

export function useMigrationRequests() {
  return useQuery<MigrationRequest[]>({
    queryKey: ["migration-requests"],
    queryFn: async () => {
      const r = await api.get<ListResponse<MigrationRequest>>(PATH, { silent: true });
      return r?.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useMigrationRequest(identifier: string | undefined) {
  return useQuery<MigrationRequest>({
    queryKey: ["migration-request", identifier],
    queryFn: async () => {
      const r = await api.get<{ data: MigrationRequest }>(`${PATH}/${identifier}`, {
        silent: true,
      });
      return r?.data;
    },
    enabled: !!identifier,
    staleTime: 15_000,
  });
}

// ─────────────────────────────────────────────────────────────────
// Writes
// ─────────────────────────────────────────────────────────────────

export function useSubmitMigrationRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SingleMigrationPayload) =>
      api.post<ItemResponse<MigrationRequest>>(PATH, payload as unknown as Record<string, unknown>),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["migration-requests"] });
      ToastUtils.success(res?.message ?? "Migration request submitted.");
    },
    onError: (err: { message?: string } | Error) => {
      const msg = (err as { message?: string })?.message ?? "Could not submit request.";
      ToastUtils.error(msg);
    },
  });
}

export function useSubmitBatchMigrationRequests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchMigrationPayload) =>
      api.post<{ message: string; data: MigrationRequest[] }>(`${PATH}/batch`, payload as unknown as Record<string, unknown>),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["migration-requests"] });
      ToastUtils.success(res?.message ?? "Batch submitted.");
    },
    onError: (err: { message?: string } | Error) => {
      const msg = (err as { message?: string })?.message ?? "Batch submission failed.";
      ToastUtils.error(msg);
    },
  });
}
