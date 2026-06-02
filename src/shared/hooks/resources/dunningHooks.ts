/**
 * Dunning Hooks — Tenant-scoped hooks for dunning policy configuration.
 *
 * Endpoints (tenant context only):
 *   GET  /tenant/v1/admin/dunning-policy       → fetch current policy
 *   PUT  /tenant/v1/admin/dunning-policy        → save policy
 *
 * Written by: TenantDunningSettings page (consumer).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type QueryOptions<T = unknown> = Partial<Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">>;

const asEnvelope = <T = AnyRecord>(res: unknown): { data?: T } => (res ?? {}) as { data?: T };

// ─── Types ──────────────────────────────────────────────────────

export interface DunningPolicy {
  /** Number of days after invoice due-date before first reminder fires */
  grace_days: number;
  /**
   * Comma-separated or array of day offsets at which retry attempts are made,
   * e.g. [3, 7, 14] means "retry 3, 7, and 14 days after the grace window".
   */
  retry_schedule: number[];
  /** Whether to auto-suspend the client account when overdue threshold is hit */
  auto_suspend: boolean;
  /** Days after grace_days at which auto-suspension triggers (if auto_suspend is true) */
  suspend_after_days: number;
}

export interface DunningPolicyPayload {
  grace_days: number;
  retry_schedule: number[];
  auto_suspend: boolean;
  suspend_after_days: number;
}

// ─── Query Keys ────────────────────────────────────────────────

export const dunningKeys = {
  all: () => ["dunning"] as const,
  policy: () => ["dunning", "policy"] as const,
};

// ─── Path Helper ───────────────────────────────────────────────

const DUNNING_PATH = "/admin/dunning-policy";

// ─── Fetch Policy ──────────────────────────────────────────────

export function useFetchDunningPolicy(options?: QueryOptions<DunningPolicy | undefined>) {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<DunningPolicy | undefined, Error>({
    queryKey: dunningKeys.policy(),
    queryFn: async () => {
      const res = await entry.silentApi.get<AnyRecord>(DUNNING_PATH);
      return asEnvelope<DunningPolicy>(res).data;
    },
    ...options,
  });
}

// ─── Update Policy ─────────────────────────────────────────────

export function useUpdateDunningPolicy() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<{ message?: string; data?: DunningPolicy }, Error, DunningPolicyPayload>({
    mutationFn: async (payload) => {
      const res = await entry.toastApi.put<AnyRecord>(
        DUNNING_PATH,
        payload as unknown as Record<string, unknown>
      );
      return res as { message?: string; data?: DunningPolicy };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dunningKeys.policy() });
    },
  });
}
