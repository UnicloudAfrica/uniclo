/**
 * Instance Hooks — Context-aware hooks for compute instances.
 *
 * Replaces duplicated instance hooks across admin/tenant/client.
 * Uses `useApiContext()` to route requests to the correct API client.
 *
 * Exports:
 *   - Basic CRUD hooks (via createResourceHooks factory)
 *   - Extended hooks shared across 2+ roles (management, actions, refresh, etc.)
 *   - Admin-only hooks (lifecycle, usage stats, logs, metadata, etc.)
 *   - Client-only hooks (purchased instances, multi-initiation, transactions, polling)
 */
import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import logger from "@/utils/logger";

type AnyRecord = Record<string, unknown>;
type Identifier = string | number;
type QueryOptions = Partial<Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">>;

/** Standard API envelope returned by the api clients */
interface ApiEnvelope<T = AnyRecord> {
  success?: boolean;
  message?: string;
  status?: string;
  data?: T;
  meta?: AnyRecord;
}

/** Cast an unknown API response to the standard envelope */
const asEnvelope = <T = AnyRecord>(res: unknown): ApiEnvelope<T> => (res ?? {}) as ApiEnvelope<T>;

// ─── Basic CRUD via factory ──────────────────────────────────────

const instanceHooks = createResourceHooks({
  resourcePath: "instances",
  queryKeyBase: "instances",
  dataKey: null, // Return full response (with .data and .meta) for backward compat
  deleteAcceptsPayload: false,
});

export const {
  useFetchList: useFetchInstances,
  useFetchById: useFetchInstanceById,
  useCreate: useCreateInstance,
  useUpdate: useUpdateInstance,
  useDelete: useDeleteInstance,
  useSync: useSyncInstances,
  queryKeys: instanceKeys,
} = instanceHooks;

// ─── Extended Query Keys ─────────────────────────────────────────

export const instanceExtendedKeys = {
  ...createQueryKeys("instances"),
  management: (context: string, identifier: Identifier) =>
    ["cube-instance", context, identifier] as const,
  lifecycle: (context: string, identifier: Identifier) =>
    ["instance-lifecycle", context, identifier] as const,
  usageStats: (context: string, identifier: Identifier, period: string) =>
    ["instance-usage", context, identifier, period] as const,
  logs: (context: string, identifier: Identifier, params: AnyRecord) =>
    ["instance-logs", context, identifier, params] as const,
  events: (context: string, identifier: Identifier, params: AnyRecord) =>
    ["instance-events", context, identifier, params] as const,
  metrics: (context: string, identifier: Identifier, params: AnyRecord) =>
    ["instance-metrics", context, identifier, params] as const,
  alarms: (context: string, identifier: Identifier, params: AnyRecord) =>
    ["instance-alarms", context, identifier, params] as const,
  purchased: (context: string, params: AnyRecord) =>
    ["instances-purchased", context, params] as const,
  transactionStatus: (transactionId: Identifier) => ["transactionStatus", transactionId] as const,
  transactionDetails: (transactionId: Identifier) => ["transactionDetails", transactionId] as const,
  transactionPolling: (transactionId: Identifier) => ["transactionPolling", transactionId] as const,
};

// ─── Helpers ──────────────────────────────────────────────────────

const buildQueryString = (params: AnyRecord = {}, defaults: AnyRecord = {}): string => {
  const merged = { ...defaults, ...params };
  const entries = Object.entries(merged).filter(
    ([, value]) => value !== undefined && value !== null
  );
  if (entries.length === 0) return "";
  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
};

const TERMINAL_TRANSACTION_STATUSES = new Set(["successful", "failed", "cancelled", "expired"]);

// ─── Shared Hooks (all roles / 2+ roles) ─────────────────────────

/** Fetch all instances (returns full API envelope) — all roles */
export const useFetchInstanceRequests = (params: AnyRecord = {}, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qs = buildQueryString(params, { per_page: 10 });

  return useQuery<AnyRecord, Error>({
    queryKey: ["instanceRequests", context, params],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/instances${qs ? `?${qs}` : ""}`;
      const res = await entry.silentApi.get<AnyRecord>(uri);
      if (!res.data) {
        throw new Error("Failed to fetch instance requests");
      }
      return res;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/** Fetch purchased instances (non-pending_payment) — all roles */
export const useFetchPurchasedInstances = (params: AnyRecord = {}, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qs = buildQueryString(params, { per_page: 10 });

  return useQuery<AnyRecord, Error>({
    queryKey: ["instanceRequests", context, "purchased", params],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/instances${qs ? `?${qs}` : ""}`;
      const res = await entry.silentApi.get<AnyRecord>(uri);
      if (!res.data) {
        throw new Error("Failed to fetch instance requests");
      }
      // Client context filters out pending_payment; admin/tenant return as-is
      if (context === "client") {
        const instances = Array.isArray(res.data) ? res.data : [];
        return {
          ...res,
          data: instances.filter((instance: AnyRecord) => instance.status !== "pending_payment"),
        };
      }
      return res;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/** Fetch instance by ID (returns data inside envelope) — all roles */
export const useFetchInstanceRequestById = (
  id: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["instanceRequest", context, id],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/instances/${id}`;
      const res = await entry.silentApi.get<AnyRecord>(uri);
      if (!res.data) {
        throw new Error(`Failed to fetch instance request with ID ${id}`);
      }
      return res.data;
    },
    enabled: Boolean(id) && enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

/** Create an instance request — all roles */
export const useCreateInstanceRequest = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceData: AnyRecord) => {
      const uri = `${entry.urlPrefix}/instances`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, instanceData));
      if (!envelope.data) {
        throw new Error("Failed to create instance request");
      }
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: instanceExtendedKeys.all(context) });
    },
    onError: (error: unknown) => {
      logger.error("Error creating instance request:", error);
    },
  });
};

/** Initiate multi-instance request — admin + client */
export const useInitiateMultiInstanceRequest = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceData: AnyRecord) => {
      const uri = `${entry.urlPrefix}/multi-initiations`;
      const res = await entry.toastApi.post<AnyRecord>(uri, instanceData);
      if (!res) {
        throw new Error("Failed to initiate instance request");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: instanceExtendedKeys.all(context) });
    },
    onError: (error: unknown) => {
      logger.error("Error creating instance request:", error);
    },
  });
};

/** Update an instance request — all roles */
export const useUpdateInstanceRequest = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, instanceData }: { id: Identifier; instanceData: AnyRecord }) => {
      const uri = `${entry.urlPrefix}/instances/${id}`;
      const envelope = asEnvelope(await entry.toastApi.patch<AnyRecord>(uri, instanceData));
      if (!envelope.data) {
        throw new Error(`Failed to update instance request with ID ${id}`);
      }
      return envelope.data;
    },
    onSuccess: (_data: AnyRecord, variables: { id: Identifier }) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["instanceRequest", context, variables.id] });
      queryClient.invalidateQueries({ queryKey: instanceExtendedKeys.all(context) });
    },
    onError: (error: unknown) => {
      logger.error("Error updating instance request:", error);
    },
  });
};

/** Fetch instance management details — admin + tenant */
export const useFetchInstanceManagementDetails = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.management(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      if (!envelope.data?.instance) {
        throw new Error(`Failed to fetch instance management details for ${identifier}`);
      }
      const details = envelope.data as AnyRecord;
      return {
        ...details,
        supports_instance_actions: Boolean(
          details.available_actions && Object.keys(details.available_actions).length
        ),
      };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

/** Execute instance management action (start, stop, reboot, etc.) — all roles */
export const useInstanceManagementAction = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      action,
      params = {},
      confirmed = false,
      async: asyncMode = false,
    }: {
      identifier: Identifier;
      action: string;
      params?: AnyRecord;
      confirmed?: boolean;
      async?: boolean;
    }) => {
      if (!identifier || !action) {
        throw new Error("Instance identifier and action are required.");
      }
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/actions`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, {
          action,
          params,
          ...(confirmed ? { confirmed: true } : {}),
          ...(asyncMode ? { async: true } : {}),
        })
      );
      if (!envelope.success) {
        throw new Error(envelope.message || `Failed to execute ${action} action`);
      }
      return envelope.data ?? envelope;
    },
    onSuccess: (_data: AnyRecord, variables: { identifier: Identifier }) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({
        queryKey: ["instanceRequest", context, variables.identifier],
      });
      queryClient.invalidateQueries({
        queryKey: instanceExtendedKeys.management(context, variables.identifier),
      });
      queryClient.invalidateQueries({ queryKey: instanceExtendedKeys.all(context) });
    },
    onError: (error: unknown) => {
      logger.error("Error executing instance management action:", error);
    },
  });
};

/** Refresh instance status from provider — admin + client */
export const useRefreshInstanceStatus = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (identifier: Identifier) => {
      if (!identifier) {
        throw new Error("Instance identifier is required to refresh status.");
      }
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/refresh-status`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to refresh instance status");
      }
      return envelope.data ?? envelope;
    },
    onSuccess: (_data: AnyRecord, identifier: Identifier) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: ["instanceRequest", context, identifier] });
      queryClient.invalidateQueries({
        queryKey: instanceExtendedKeys.management(context, identifier),
      });
      queryClient.invalidateQueries({ queryKey: instanceExtendedKeys.all(context) });
    },
    onError: (error: unknown) => {
      logger.error("Error refreshing instance status:", error);
    },
  });
};

// ─── Admin-Only Hooks ────────────────────────────────────────────

/** Fetch instance lifecycle by ID — admin only */
export const useFetchInstanceLifeCycleById = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.lifecycle(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/instances/${identifier}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      const instance = envelope.data ?? {};
      const candidateHistory =
        instance.status_history ||
        instance.lifecycle_history ||
        instance.lifecycle_events ||
        instance.history ||
        [];

      return {
        events: Array.isArray(candidateHistory) ? candidateHistory : [],
      };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Fetch instance usage stats — admin only */
export const useInstanceUsageStats = (
  identifier: Identifier | null | undefined,
  period: string = "24h",
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.usageStats(context, identifier as Identifier, period),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/usage-stats?period=${period}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? null;
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Fetch instance logs — admin only */
export const useInstanceLogs = (
  identifier: Identifier | null | undefined,
  params: { lines?: number; since?: string } = {},
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.logs(context, identifier as Identifier, params),
    queryFn: async () => {
      const qs = buildQueryString(params);
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/logs${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { lines: [], last_updated: null };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Update instance metadata — admin only */
export const useUpdateInstanceMetadata = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ identifier, payload }: { identifier: Identifier; payload: AnyRecord }) => {
      if (!identifier) {
        throw new Error("Instance identifier is required to update metadata.");
      }
      const uri = `${entry.urlPrefix}/instances/${identifier}`;
      const envelope = asEnvelope(await entry.silentApi.put<AnyRecord>(uri, payload));
      if (!envelope.success) {
        throw new Error(envelope.message || `Failed to update metadata for ${identifier}`);
      }
      return envelope.data ?? envelope;
    },
    onSuccess: (_data: AnyRecord, _variables: { identifier: Identifier; payload: AnyRecord }) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: instanceExtendedKeys.all(context) });
    },
    onError: (error: unknown) => {
      logger.error("Error updating instance metadata:", error);
    },
  });
};

// ─── Provider Data Hooks (events, metrics, alarms) ──────────────

/** Fetch instance events from provider */
export const useInstanceEvents = (
  identifier: Identifier | null | undefined,
  params: { limit?: number; start_timestamp?: number; end_timestamp?: number } = {},
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.events(context, identifier as Identifier, params),
    queryFn: async () => {
      const qs = buildQueryString(params);
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/events${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { events: [], total: 0 };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Fetch instance metrics from provider (time-series) */
export const useInstanceMetrics = (
  identifier: Identifier | null | undefined,
  params: {
    metric?: string;
    start_timestamp?: number;
    end_timestamp?: number;
    statistic?: string;
    interval?: number;
  } = {},
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.metrics(context, identifier as Identifier, params),
    queryFn: async () => {
      const qs = buildQueryString(params);
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/metrics${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { metric: params.metric ?? "cpu", data: [] };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Fetch instance alarms from provider */
export const useInstanceAlarms = (
  identifier: Identifier | null | undefined,
  params: { severity?: string; status?: string } = {},
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.alarms(context, identifier as Identifier, params),
    queryFn: async () => {
      const qs = buildQueryString(params);
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/alarms${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { alarms: [], total: 0 };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

// ─── Per-Instance Backup Protection Hooks ────────────────────────
//
// Backed by the stateful per-instance backup endpoints under
// /cube-instance/{identifier}/protection/backup (written by
// InstanceProtectionController on the backend). The response shape is
// neutral by design — no provider names, no RRULE, no endpoint ids.
// Status keys (consumer side; must stay character-for-character in sync
// with InstanceProtectionController::buildStatus): configured, enabled,
// state, schedule_label, frequency, retention_days, start_time,
// last_backup_at, snapshots_count.

/** Neutral per-instance backup status (Protection tab). */
export interface InstanceBackupStatus {
  configured: boolean;
  /** Whether the instance's plan includes backup (a paid add-on). */
  entitled?: boolean;
  enabled?: boolean;
  state?: string;
  schedule_label?: string;
  frequency?: string;
  retention_days?: number;
  start_time?: string;
  rpo_hours?: number;
  last_backup_at?: string | null;
  last_recovery_point_at?: string | null;
  snapshots_count?: number;
}

/** Payload for enabling / editing a per-instance backup schedule. */
export interface InstanceBackupConfig {
  frequency?: "daily" | "weekly" | "monthly";
  interval?: number;
  retention_days?: number;
  start_time?: string | null;
  enabled?: boolean;
}

const instanceBackupKeys = {
  status: (context: string, identifier: Identifier) =>
    ["instance-backup-status", context, identifier] as const,
  snapshots: (context: string, identifier: Identifier) =>
    ["instance-backup-snapshots", context, identifier] as const,
};

const invalidateInstanceBackup = (
  queryClient: ReturnType<typeof useQueryClient>,
  context: string,
  identifier: Identifier
) => {
  queryClient.invalidateQueries({ queryKey: instanceBackupKeys.status(context, identifier) });
  queryClient.invalidateQueries({ queryKey: instanceBackupKeys.snapshots(context, identifier) });
};

/** Fetch this instance's backup protection status. */
export const useInstanceBackupStatus = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceBackupKeys.status(context, identifier as Identifier),
    queryFn: async (): Promise<InstanceBackupStatus> => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup`;
      const envelope = asEnvelope<InstanceBackupStatus>(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { configured: false };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Enable per-instance backup (idempotent on the backend). */
export const useEnableInstanceBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      config = {},
    }: {
      identifier: Identifier;
      config?: InstanceBackupConfig;
    }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup/enable`;
      const envelope = asEnvelope<InstanceBackupStatus>(
        await entry.toastApi.post<AnyRecord>(uri, config as AnyRecord)
      );
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to enable backup");
      }
      return envelope.data ?? { configured: true };
    },
    onSuccess: (_data, variables) => {
      invalidateInstanceBackup(queryClient, context, variables.identifier);
    },
    onError: (error: unknown) => {
      logger.error("Error enabling instance backup:", error);
    },
  });
};

/** Trigger an on-demand backup for this instance. */
export const useTriggerInstanceBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ identifier }: { identifier: Identifier }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup/trigger`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to trigger backup");
      }
      return envelope.data ?? {};
    },
    onSuccess: (_data, variables) => {
      invalidateInstanceBackup(queryClient, context, variables.identifier);
    },
    onError: (error: unknown) => {
      logger.error("Error triggering instance backup:", error);
    },
  });
};

/** List this instance's backups (Laravel paginator under .data). */
export const useInstanceBackupSnapshots = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceBackupKeys.snapshots(context, identifier as Identifier),
    queryFn: async (): Promise<AnyRecord> => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup/snapshots`;
      const envelope = asEnvelope<AnyRecord>(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { data: [], total: 0 };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/**
 * Restore a ready backup into a NEW, separately-tracked instance.
 *
 * This is non-destructive: the source instance is untouched. The backend
 * creates a fresh PROVISIONING Instance row from the backup and advances it
 * to active via its normal lifecycle poll. The FE posts the LOCAL snapshot id
 * (snapshotId); the provider-side snapshot uuid is read server-side and never
 * leaves the backend.
 */
export const useRestoreInstanceFromBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      snapshotId,
      name,
      powerup,
    }: {
      identifier: Identifier;
      snapshotId: Identifier;
      name?: string;
      powerup?: boolean;
    }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup/snapshots/${snapshotId}/restore`;
      const payload: AnyRecord = {};
      if (name) payload.name = name;
      if (powerup !== undefined) payload.powerup = powerup;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to restore from backup");
      }
      return envelope.data ?? {};
    },
    onSuccess: (_data, variables) => {
      // The new PROVISIONING instance appears in the instance lists.
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({ queryKey: instanceExtendedKeys.all(context) });
      // Refresh the source instance's backup snapshots view.
      queryClient.invalidateQueries({
        queryKey: instanceBackupKeys.snapshots(context, variables.identifier),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error restoring instance from backup:", error);
    },
  });
};

/** Edit this instance's schedule/retention or pause/resume. */
export const useUpdateInstanceBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      config,
    }: {
      identifier: Identifier;
      config: InstanceBackupConfig;
    }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup`;
      const envelope = asEnvelope<InstanceBackupStatus>(
        await entry.toastApi.patch<AnyRecord>(uri, config as AnyRecord)
      );
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to update backup");
      }
      return envelope.data ?? { configured: true };
    },
    onSuccess: (_data, variables) => {
      invalidateInstanceBackup(queryClient, context, variables.identifier);
    },
    onError: (error: unknown) => {
      logger.error("Error updating instance backup:", error);
    },
  });
};

/** Disable backup for this instance (detach + teardown if empty). */
export const useDisableInstanceBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ identifier }: { identifier: Identifier }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup`;
      const envelope = asEnvelope<InstanceBackupStatus>(
        await entry.toastApi.delete<AnyRecord>(uri)
      );
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to disable backup");
      }
      return envelope.data ?? { configured: false };
    },
    onSuccess: (_data, variables) => {
      invalidateInstanceBackup(queryClient, context, variables.identifier);
    },
    onError: (error: unknown) => {
      logger.error("Error disabling instance backup:", error);
    },
  });
};

// ─── Self-Service Backup Purchase (paid add-on) ──────────────────
//
// Lets a CLIENT buy backup for an existing, non-entitled instance. Backup
// rides the instance's prepaid term ("match the locker"): one prorated
// current-period charge now, no separate recurring debit. Mirrors the
// resize preview→confirm price-lock — the confirm re-derives server-side
// and 409s on drift, so nobody is charged a figure they didn't approve.

/** Quote returned by the purchase-preview endpoint. */
export interface BackupPurchasePreview {
  /** Set when the plan already includes backup → show Enable, not Purchase. */
  already_entitled?: boolean;
  plan?: string;
  /** Recurring monthly backup fee, in `currency`. */
  monthly_fee?: number;
  /** One-time charge for the rest of the current prepaid period. */
  prorated_amount?: number;
  days_remaining?: number;
  total_days?: number;
  billing_cycle?: string;
  period_start?: string | null;
  period_end?: string | null;
  currency?: string;
  payment_method?: string;
  wallet_balance?: number | null;
  wallet_exists?: boolean;
  sufficient_funds?: boolean;
  shortfall?: number;
  resource_label?: string;
}

/** Quote the cost of buying backup for this instance (monthly + prorated). */
export const useBackupPurchasePreview = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: ["instance-backup-purchase-preview", context, identifier] as const,
    queryFn: async (): Promise<BackupPurchasePreview> => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup/purchase-preview`;
      const envelope = asEnvelope<BackupPurchasePreview>(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/**
 * Confirm a backup purchase. Pass the previewed `prorated_amount` as
 * `acceptedAmount` (price-lock). The api client throws an ApiError with
 * `status === 409` when the price drifted — the caller re-quotes and asks the
 * customer to confirm the new figure. Uses the silent client so the caller
 * owns all messaging (no duplicate toast on the re-quote path).
 */
export const useBackupPurchaseConfirm = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      acceptedAmount,
    }: {
      identifier: Identifier;
      acceptedAmount: number;
    }): Promise<InstanceBackupStatus> => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/protection/backup/purchase`;
      const envelope = asEnvelope<InstanceBackupStatus>(
        await entry.silentApi.post<AnyRecord>(uri, { accepted_amount: acceptedAmount })
      );
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to purchase backup");
      }
      return envelope.data ?? { configured: true };
    },
    onSuccess: (_data, variables) => {
      invalidateInstanceBackup(queryClient, context, variables.identifier);
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
};

/** Fetch restore groups */
export const useInstanceRestoreGroups = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: ["instance-restore-groups", context, identifier],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/restore-groups`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { restore_groups: [], total: 0 };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Create restore group */
export const useCreateRestoreGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      params,
    }: {
      identifier: Identifier;
      params: AnyRecord;
    }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/restore-groups`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, params));
      return envelope.data ?? envelope;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instance-restore-groups"] });
    },
  });
};

/** Delete restore group */
export const useDeleteRestoreGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      groupId,
    }: {
      identifier: Identifier;
      groupId: string;
    }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/restore-groups/${groupId}`;
      const envelope = asEnvelope(await entry.toastApi.delete<AnyRecord>(uri));
      return envelope.data ?? envelope;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instance-restore-groups"] });
    },
  });
};

/** Close an alarm */
export const useCloseAlarm = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      alarmId,
    }: {
      identifier: Identifier;
      alarmId: string;
    }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/alarms/${alarmId}/close`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return envelope.data ?? envelope;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instance-alarms"] });
    },
  });
};

// ─── Client-Only Hooks ───────────────────────────────────────────

/** Get instance details (via cube-instance) — client */
export const useGetInstanceDetails = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.management(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}`;
      const envelope = asEnvelope(await entry.toastApi.get<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to get instance details");
      }
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

/** Execute instance action (client legacy pattern) — client */
export const useExecuteInstanceAction = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      identifier,
      action,
      params = {},
    }: {
      identifier: Identifier;
      action: string;
      params?: AnyRecord;
    }) => {
      const uri = `${entry.urlPrefix}/cube-instance/${identifier}/actions`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, {
          action,
          params,
          confirmed: Boolean(params.confirmed),
        })
      );
      if (!envelope.success) {
        throw new Error(envelope.message || `Failed to execute ${action} action`);
      }
      return envelope.data ?? {};
    },
    onSuccess: (_data: AnyRecord, variables: { identifier: Identifier }) => {
      queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
      queryClient.invalidateQueries({
        queryKey: ["instanceRequest", context, variables.identifier],
      });
      queryClient.invalidateQueries({
        queryKey: instanceExtendedKeys.management(context, variables.identifier),
      });
    },
    onError: (error: unknown) => {
      logger.error("Error executing instance action:", error);
    },
  });
};

/** Get transaction status — client */
export const useGetTransactionStatus = (
  transactionId: Identifier | null | undefined,
  options: QueryOptions & { autoRefresh?: boolean } = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { autoRefresh = false, enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.transactionStatus(transactionId as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/transactions/${transactionId}/status`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to get transaction status");
      }
      return envelope.data ?? {};
    },
    enabled: Boolean(transactionId) && enabled,
    staleTime: 1000 * 30,
    refetchInterval: autoRefresh ? 30000 : false,
    refetchOnWindowFocus: true,
    ...queryOptions,
  });
};

/** Get transaction details — client */
export const useGetTransactionDetails = (
  transactionId: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.transactionDetails(transactionId as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/transactions/${transactionId}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to get transaction details");
      }
      return envelope.data ?? {};
    },
    enabled: Boolean(transactionId) && enabled,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...queryOptions,
  });
};

/** Poll transaction status until completion — client */
export const useTransactionPolling = (
  transactionId: Identifier | null | undefined,
  onComplete?: (data: AnyRecord) => void
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  const completionRef = useRef<string | null>(null);

  useEffect(() => {
    completionRef.current = null;
  }, [transactionId]);

  const pollingQuery = useQuery({
    queryKey: instanceExtendedKeys.transactionPolling(transactionId as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/transactions/${transactionId}/status`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to get transaction status");
      }
      return envelope.data ?? {};
    },
    enabled: Boolean(transactionId),
    refetchInterval: (query) => {
      const data = query.state.data as AnyRecord | undefined;
      if (data?.status && TERMINAL_TRANSACTION_STATUSES.has(data.status)) {
        return false;
      }
      return 30000;
    },
  });

  const pollingData = (pollingQuery as { data?: AnyRecord }).data;

  useEffect(() => {
    const status = pollingData?.status;
    if (status !== "successful") {
      return;
    }

    const completionKey = String(transactionId ?? "");
    if (completionRef.current === completionKey) {
      return;
    }

    completionRef.current = completionKey;

    if (pollingData && onComplete) {
      onComplete(pollingData);
    }

    queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
    queryClient.invalidateQueries({
      queryKey: instanceExtendedKeys.transactionDetails(transactionId as Identifier),
    });
  }, [onComplete, pollingData, queryClient, transactionId]);

  return pollingQuery;
};

export default instanceHooks;
