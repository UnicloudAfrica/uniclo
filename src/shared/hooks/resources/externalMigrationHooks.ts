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
  auto_provision_destination?: boolean;
  provision_specs?: AnyRecord;
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

export interface AutoProvisionSpecs {
  provider_id: number | string;
  provider?: string;
  name?: string;
  type?: "app" | "database" | "cache" | "load-balancer";
  region: string;
  size: string;
  image_id?: string;
  offer_id?: string;
  ssh_key_ids?: number[];
  ssh_user?: string;
  auth_method?: "key" | "password";
  ssh_private_key?: string;
  ssh_password?: string;
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
  auto_provision_destination?: boolean;
  provision_specs?: AnyRecord;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

type ProgressQueryOptions = Partial<
  Omit<UseQueryOptions<MigrationProgress, Error>, "queryKey" | "queryFn">
>;

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
    {
      source_endpoint_id: string;
      target_endpoint_id?: string;
      auto_provision_destination?: boolean;
      provision_specs?: AutoProvisionSpecs;
    }
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
      target_endpoint_id?: string;
      auto_provision_destination?: boolean;
      provision_specs?: AutoProvisionSpecs;
      transfer_method?: string;
      config?: AnyRecord;
      /**
       * Target VM network reconfiguration. AcF's
       * ConfigAdapterService consumes this to write fresh
       * /etc/netplan or /etc/network/interfaces on the target
       * after data transfer. Without it, the migrated VM boots
       * with the source's IP/hostname — networking won't come up.
       */
      adapt_config?: {
        hostname?: string;
        ip?: string;
        mask?: string;
        gateway?: string;
        dns?: string[];
      };
      /**
       * Cutover plan. Persisted at create time; consumed when
       * POST /external-migrations/{id}/cutover/start fires.
       */
      cutover_plan?: {
        destination_host?: string;
        drain_seconds?: number;
        grace_period_seconds?: number;
        monitoring_window_seconds?: number;
        dependency_checks?: string[];
      };
      /** Shell commands run on source right before delta-sync. */
      source_quiesce_commands?: string[];
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
  options: ProgressQueryOptions = {},
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

// ─── Cutover state machine (RES-163) ────────────────────────────
//
// Thin proxies to AcF's CutoverController. The state shape is
// canonical — every endpoint returns the same `{ state, can_rollback,
// timestamps, plan, error_code, error_translation }` blob so the
// frontend can re-render from any response.

export interface CutoverState {
  identifier: string;
  state: string;
  is_in_progress: boolean;
  is_terminal: boolean;
  can_rollback: boolean;
  error_code: string | null;
  error_translation: string | null;
  rollback_reason: string | null;
  plan: Record<string, unknown>;
  timestamps: {
    started_at: string | null;
    tls_verified_at: string | null;
    drain_started_at: string | null;
    traffic_shifted_at: string | null;
    grace_period_ends_at: string | null;
    completed_at: string | null;
    last_check_at: string | null;
  };
}

export const useFetchMigrationCutover = (
  migrationId: string | undefined,
  options: Partial<UseQueryOptions<CutoverState | null, Error>> = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<CutoverState | null, Error>({
    queryKey: ["external-migration-cutover", context, migrationId],
    queryFn: async () => {
      if (!migrationId) return null;
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/cutover`;
      const envelope = asEnvelope<CutoverState>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return (envelope.data ?? null) as CutoverState | null;
    },
    enabled: !!migrationId,
    // Watch the cutover state machine — 5 s while in progress,
    // 30 s once terminal so we still pick up timestamp updates.
    refetchInterval: (q) => {
      const state = (q.state.data as CutoverState | null)?.state;
      const inProgress = state && state !== "completed" && state !== "failed" && state !== "rolled_back" && state !== "none";
      return inProgress ? 5_000 : 30_000;
    },
    ...options,
  });
};

export const useStartMigrationCutover = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    CutoverState,
    Error,
    { migrationId: string; plan?: Record<string, unknown> }
  >({
    mutationFn: async ({ migrationId, plan }) => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/cutover/start`;
      const envelope = asEnvelope<CutoverState>(
        await entry.toastApi.post<AnyRecord>(uri, plan ? { plan } : {}),
      );
      if (!envelope.success) {
        throw new Error((envelope.message as string) || "Failed to start cutover");
      }
      return envelope.data as CutoverState;
    },
    onSuccess: (_data, { migrationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["external-migration-cutover", context, migrationId],
      });
    },
  });
};

export const useAdvanceMigrationCutover = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<CutoverState, Error, { migrationId: string }>({
    mutationFn: async ({ migrationId }) => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/cutover/advance`;
      const envelope = asEnvelope<CutoverState>(
        await entry.toastApi.post<AnyRecord>(uri),
      );
      if (!envelope.success) {
        throw new Error((envelope.message as string) || "Failed to advance cutover");
      }
      return envelope.data as CutoverState;
    },
    onSuccess: (_data, { migrationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["external-migration-cutover", context, migrationId],
      });
    },
  });
};

export const useRollbackMigrationCutover = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    CutoverState,
    Error,
    { migrationId: string; reason: string }
  >({
    mutationFn: async ({ migrationId, reason }) => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/cutover/rollback`;
      const envelope = asEnvelope<CutoverState>(
        await entry.toastApi.post<AnyRecord>(uri, { reason }),
      );
      if (!envelope.success) {
        throw new Error((envelope.message as string) || "Cutover rollback failed");
      }
      return envelope.data as CutoverState;
    },
    onSuccess: (_data, { migrationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["external-migration-cutover", context, migrationId],
      });
    },
  });
};
