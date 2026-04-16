/**
 * External Migration Hooks — Context-aware hooks for Migration-as-a-Service operations.
 *
 * Basic CRUD via createResourceHooks factory + custom hooks for:
 * - Cost estimation
 * - Migration initiation
 * - Confirm / cancel lifecycle
 * - Live progress polling
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type QueryOptions = Partial<
  Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">
>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Types ──────────────────────────────────────────────────────

export interface ExternalMigration {
  id: string;
  identifier: string;
  tenant_id: string;
  user_id: number;
  source_endpoint_id: string;
  target_endpoint_id: string;
  resource_type: "vm" | "database" | "storage";
  transfer_method?: string;
  migration_tier?: "same_cloud" | "cross_cloud" | "on_prem";
  status: string;
  progress_percent: number;
  estimated_cost_usd?: number;
  actual_cost_usd?: number;
  estimated_data_gb?: number;
  actual_data_gb?: number;
  cost_breakdown?: AnyRecord;
  hold_status?: string;
  error_message?: string;
  estimated_at?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  source_endpoint?: AnyRecord;
  target_endpoint?: AnyRecord;
}

export interface MigrationEstimate {
  source: AnyRecord;
  target: AnyRecord;
  migration_tier: string;
  resource_type: string;
  estimate: {
    estimated_cost_usd: number;
    breakdown: {
      base_fee: number;
      per_gb_rate: number; // Always 0 — flat per-VM pricing, no per-GB charges
      estimated_data_gb: number;
      data_cost: number; // Always 0 — flat per-VM pricing
      migration_tier: string;
    };
  };
}

export interface MigrationProgress {
  id: string;
  identifier: string;
  status: string;
  progress_percent: number;
  estimated_data_gb?: number;
  actual_data_gb?: number;
  estimated_cost_usd?: number;
  actual_cost_usd?: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

// ─── Query Keys ─────────────────────────────────────────────────

export const externalMigrationExtendedKeys = {
  ...createQueryKeys("externalMigrations"),
  list: (context: string, params?: AnyRecord) =>
    ["externalMigrations", "list", context, params] as const,
  detail: (context: string, id: string) =>
    ["externalMigrations", "detail", context, id] as const,
  progress: (context: string, id: string) =>
    ["externalMigrations", "progress", context, id] as const,
};

// ─── CRUD Hooks (factory) ───────────────────────────────────────

const migrationHooks = createResourceHooks<ExternalMigration>({
  resourcePath: "integrations/external-migrations",
  queryKeyBase: "externalMigrations",
  dataKey: "data",
});

export const {
  useFetchList: useFetchExternalMigrations,
  useFetchById: useFetchExternalMigration,
  queryKeys: externalMigrationKeys,
} = migrationHooks;

// ─── Cost Estimation ────────────────────────────────────────────

/**
 * Estimate migration cost without creating a migration record.
 */
export const useEstimateMigrationCost = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<
    MigrationEstimate,
    Error,
    { source_endpoint_id: string; target_endpoint_id: string }
  >({
    mutationFn: async (payload) => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/estimate`;
      const envelope = asEnvelope<MigrationEstimate>(
        await entry.silentApi.post<AnyRecord>(uri, payload),
      );
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Failed to estimate cost",
        );
      }
      return envelope.data as MigrationEstimate;
    },
  });
};

// ─── Migration Lifecycle ────────────────────────────────────────

/**
 * Initiate a migration (creates record in 'estimated' state).
 */
export const useInitiateExternalMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    ExternalMigration,
    Error,
    {
      source_endpoint_id: string;
      target_endpoint_id: string;
      transfer_method?: string;
      config?: AnyRecord;
    }
  >({
    mutationFn: async (payload) => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations`;
      const envelope = asEnvelope<ExternalMigration>(
        await entry.toastApi.post<AnyRecord>(uri, payload),
      );
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Failed to initiate migration",
        );
      }
      return envelope.data as ExternalMigration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: externalMigrationExtendedKeys.list(context),
      });
    },
  });
};

/**
 * Confirm a migration (places wallet hold and starts execution).
 */
export const useConfirmExternalMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { migrationId: string }>({
    mutationFn: async ({ migrationId }) => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/confirm`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri),
      );
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Failed to confirm migration",
        );
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { migrationId }) => {
      queryClient.invalidateQueries({
        queryKey: externalMigrationExtendedKeys.detail(context, migrationId),
      });
      queryClient.invalidateQueries({
        queryKey: externalMigrationExtendedKeys.list(context),
      });
    },
  });
};

/**
 * Cancel a migration (releases wallet hold).
 */
export const useCancelExternalMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { migrationId: string }>({
    mutationFn: async ({ migrationId }) => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/cancel`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri),
      );
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Failed to cancel migration",
        );
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { migrationId }) => {
      queryClient.invalidateQueries({
        queryKey: externalMigrationExtendedKeys.detail(context, migrationId),
      });
      queryClient.invalidateQueries({
        queryKey: externalMigrationExtendedKeys.list(context),
      });
    },
  });
};

// ─── Progress Polling ───────────────────────────────────────────

/**
 * Poll migration progress (auto-refreshes every 5s when in_progress).
 */
export const usePollMigrationProgress = (
  migrationId: string | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<MigrationProgress, Error>({
    queryKey: externalMigrationExtendedKeys.progress(
      context,
      migrationId ?? "",
    ),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/progress`;
      const envelope = asEnvelope<MigrationProgress>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return (envelope.data ?? {}) as MigrationProgress;
    },
    enabled: !!migrationId,
    refetchInterval: (query) => {
      const data = query.state.data as MigrationProgress | undefined;
      if (data?.status === "in_progress") {
        return 5000;
      }
      return false;
    },
    ...options,
  });
};
