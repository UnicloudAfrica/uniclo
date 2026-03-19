/**
 * Integration Hooks — Context-aware hooks for protection services (backup, replication, migration, DR).
 *
 * Basic CRUD via createResourceHooks factory + custom hooks for:
 * - Integration config management (enable/disable per tenant)
 * - Backup operations (enable, trigger, restore, list snapshots)
 * - Replication status + failover/failback
 * - Migration operations
 * - Destinations management
 * - Operations listing with filtering
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;
type Identifier = string | number;
type QueryOptions = Partial<Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Types ──────────────────────────────────────────────────────

export type DestinationType = 's3' | 'ssh' | 'object_storage' | 'swift' | 'azure_blob' | 'gcs';

export const DESTINATION_TYPE_LABELS: Record<DestinationType, string> = {
  s3: "Amazon S3",
  ssh: "SSH/SFTP",
  object_storage: "Object Storage",
  swift: "OpenStack Swift",
  azure_blob: "Azure Blob Storage",
  gcs: "Google Cloud Storage",
};

export interface DestinationTypeInfo {
  value: DestinationType;
  label: string;
  config_fields: string[];
}

export interface IntegrationConfig {
  key: string;
  label: string;
  capabilities: string[];
  enabled: boolean;
  settings?: AnyRecord;
}

export interface IntegrationOperation {
  id: string;
  identifier: string;
  integration_key: string;
  operation_type: string;
  operation_subtype?: string;
  status: string;
  progress_percent: number;
  resource_type?: string;
  resource_id?: number;
  estimated_cost_usd?: number;
  actual_cost_usd?: number;
  data_transferred_gb?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface IntegrationSubscription {
  id: string;
  identifier: string;
  service_type: string;
  service_subtype?: string;
  status: string;
  monthly_cost_usd?: number;
  config?: AnyRecord;
  status_data?: {
    lag_seconds?: number;
    health?: string;
    status?: string;
  };
  last_health_check_at?: string;
  created_at: string;
}

export interface IntegrationDestination {
  id: number;
  integration_key: string;
  source_region: string;
  target_region: string;
  destination_type: DestinationType;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

export interface BackupStatus {
  enabled: boolean;
  subscription?: IntegrationSubscription;
  last_backup?: IntegrationOperation;
  next_backup_at?: string;
  snapshots_count?: number;
}

export interface ReplicationStatus {
  enabled: boolean;
  subscription?: IntegrationSubscription;
  lag_seconds?: number;
  health?: string;
  target_region?: string;
}

// ─── Basic CRUD via factory (operations listing) ────────────────

const integrationOperationHooks = createResourceHooks<IntegrationOperation>({
  resourcePath: "integrations/anycloudflow/operations",
  queryKeyBase: "integrationOperations",
  dataKey: "data",
});

export const {
  useFetchList: useFetchIntegrationOperations,
  useFetchById: useFetchIntegrationOperationById,
  queryKeys: integrationOperationKeys,
} = integrationOperationHooks;

// ─── Extended Query Keys ────────────────────────────────────────

export const integrationExtendedKeys = {
  ...createQueryKeys("integrations"),
  config: (context: string, key: string) =>
    ["integration-config", context, key] as const,
  configList: (context: string) =>
    ["integration-configs", context] as const,
  backupStatus: (context: string, key: string, resourceType: string, resourceId: Identifier) =>
    ["integration-backup", context, key, resourceType, resourceId] as const,
  backupSnapshots: (context: string, key: string, resourceType: string, resourceId: Identifier) =>
    ["integration-snapshots", context, key, resourceType, resourceId] as const,
  replicationStatus: (context: string, key: string, resourceType: string, resourceId: Identifier) =>
    ["integration-replication", context, key, resourceType, resourceId] as const,
  operations: (context: string, key: string, params?: AnyRecord) =>
    ["integration-operations", context, key, params ?? {}] as const,
  destinations: (context: string, key: string) =>
    ["integration-destinations", context, key] as const,
  destinationTypes: (context: string, key: string) =>
    ["integration-destination-types", context, key] as const,
  subscriptions: (context: string, key: string) =>
    ["integration-subscriptions", context, key] as const,
  drDashboard: (context: string) =>
    ["dr-dashboard", context] as const,
  drTimeline: (context: string, params?: AnyRecord) =>
    ["dr-timeline", context, params ?? {}] as const,
  replicationHealth: (context: string) =>
    ["replication-health", context] as const,
  // Bidirectional
  bidirectionalStatus: (context: string, pairId: string) =>
    ["bidirectional-status", context, pairId] as const,
  conflicts: (context: string, pairId: string, params?: AnyRecord) =>
    ["bidirectional-conflicts", context, pairId, params ?? {}] as const,
  quorumStatus: (context: string, pairId: string) =>
    ["bidirectional-quorum", context, pairId] as const,
  trafficStatus: (context: string, pairId: string) =>
    ["bidirectional-traffic", context, pairId] as const,
};

// ─── Integration Config ─────────────────────────────────────────

/** List all available integrations */
export const useFetchIntegrations = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<IntegrationConfig[], Error>({
    queryKey: integrationExtendedKeys.configList(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations`;
      const envelope = asEnvelope<IntegrationConfig[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/** Fetch config for a specific integration */
export const useFetchIntegrationConfig = (
  integrationKey: string,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<IntegrationConfig, Error>({
    queryKey: integrationExtendedKeys.config(context, integrationKey),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}`;
      const envelope = asEnvelope<IntegrationConfig>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? ({ key: integrationKey, label: "", capabilities: [], enabled: false } as IntegrationConfig);
    },
    enabled: Boolean(integrationKey) && enabled !== false,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
};

/** Enable an integration for the current tenant */
export const useEnableIntegration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { integrationKey: string }>({
    mutationFn: async ({ integrationKey }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/enable`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to enable integration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.config(context, integrationKey),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.configList(context),
      });
    },
  });
};

/** Disable an integration for the current tenant */
export const useDisableIntegration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { integrationKey: string }>({
    mutationFn: async ({ integrationKey }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/disable`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to disable integration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.config(context, integrationKey),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.configList(context),
      });
    },
  });
};

// ─── Backup Operations ──────────────────────────────────────────

/** Fetch backup status for a specific resource */
export const useBackupStatus = (
  integrationKey: string,
  resourceType: string,
  resourceId: Identifier | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<BackupStatus, Error>({
    queryKey: integrationExtendedKeys.backupStatus(
      context,
      integrationKey,
      resourceType,
      resourceId as Identifier,
    ),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/${resourceType}/${resourceId}`;
      const envelope = asEnvelope<BackupStatus>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? { enabled: false };
    },
    enabled: Boolean(resourceId) && enabled !== false,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    ...rest,
  });
};

/** Enable backup for a resource */
export const useEnableBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier; config: AnyRecord }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId, config }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/${resourceType}/${resourceId}`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, config));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to enable backup");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.backupStatus(context, integrationKey, resourceType, resourceId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

/** Disable backup for a resource */
export const useDisableBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/${resourceType}/${resourceId}`;
      const envelope = asEnvelope(await entry.toastApi.delete<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to disable backup");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.backupStatus(context, integrationKey, resourceType, resourceId),
      });
    },
  });
};

/** Trigger manual backup */
export const useTriggerBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/${resourceType}/${resourceId}/trigger`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to trigger backup");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.backupStatus(context, integrationKey, resourceType, resourceId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.backupSnapshots(context, integrationKey, resourceType, resourceId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

/** List backup snapshots for a resource */
export const useBackupSnapshots = (
  integrationKey: string,
  resourceType: string,
  resourceId: Identifier | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<AnyRecord[], Error>({
    queryKey: integrationExtendedKeys.backupSnapshots(
      context,
      integrationKey,
      resourceType,
      resourceId as Identifier,
    ),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/${resourceType}/${resourceId}/snapshots`;
      const envelope = asEnvelope<AnyRecord[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    enabled: Boolean(resourceId) && enabled !== false,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

/** Restore from a backup snapshot */
export const useRestoreBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; snapshotId: string; options?: AnyRecord }
  >({
    mutationFn: async ({ integrationKey, snapshotId, options: restoreOptions }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/restore/${snapshotId}`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, restoreOptions ?? {}),
      );
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to restore backup");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

// ─── Replication Operations ─────────────────────────────────────

/** Fetch replication status for a specific resource */
export const useReplicationStatus = (
  integrationKey: string,
  resourceType: string,
  resourceId: Identifier | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<ReplicationStatus, Error>({
    queryKey: integrationExtendedKeys.replicationStatus(
      context,
      integrationKey,
      resourceType,
      resourceId as Identifier,
    ),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/replication/${resourceType}/${resourceId}`;
      const envelope = asEnvelope<ReplicationStatus>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? { enabled: false };
    },
    enabled: Boolean(resourceId) && enabled !== false,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    ...rest,
  });
};

/** Enable replication for a resource */
export const useEnableReplication = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier; config: AnyRecord }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId, config }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/replication/${resourceType}/${resourceId}`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, config));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to enable replication");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.replicationStatus(context, integrationKey, resourceType, resourceId),
      });
    },
  });
};

/** Disable replication for a resource */
export const useDisableReplication = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/replication/${resourceType}/${resourceId}`;
      const envelope = asEnvelope(await entry.toastApi.delete<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to disable replication");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.replicationStatus(context, integrationKey, resourceType, resourceId),
      });
    },
  });
};

/** Trigger failover */
export const useFailover = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/replication/${resourceType}/${resourceId}/failover`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to trigger failover");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.replicationStatus(context, integrationKey, resourceType, resourceId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

/** Trigger failback */
export const useFailback = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/replication/${resourceType}/${resourceId}/failback`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to trigger failback");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.replicationStatus(context, integrationKey, resourceType, resourceId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

// ─── Destinations ───────────────────────────────────────────────

/** Fetch destinations for an integration */
export const useFetchDestinations = (
  integrationKey: string,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<IntegrationDestination[], Error>({
    queryKey: integrationExtendedKeys.destinations(context, integrationKey),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/destinations`;
      const envelope = asEnvelope<IntegrationDestination[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 10,
    ...options,
  });
};

/** Create a new destination */
export const useCreateDestination = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { integrationKey: string; data: AnyRecord }>({
    mutationFn: async ({ integrationKey, data }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/destinations`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, data));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to create destination");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.destinations(context, integrationKey),
      });
    },
  });
};

/** Delete a destination */
export const useDeleteDestination = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { integrationKey: string; destinationId: number }>({
    mutationFn: async ({ integrationKey, destinationId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/destinations/${destinationId}`;
      const envelope = asEnvelope(await entry.toastApi.delete<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to delete destination");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.destinations(context, integrationKey),
      });
    },
  });
};

/** Test destination connectivity */
export const useTestDestination = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<AnyRecord, Error, { integrationKey: string; destinationId: number }>({
    mutationFn: async ({ integrationKey, destinationId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/destinations/${destinationId}/test`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to test destination");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

/** Update an existing destination */
export const useUpdateDestination = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { integrationKey: string; destinationId: number; data: AnyRecord }>({
    mutationFn: async ({ integrationKey, destinationId, data }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/destinations/${destinationId}`;
      const envelope = asEnvelope(await entry.toastApi.put<AnyRecord>(uri, data));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to update destination");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.destinations(context, integrationKey),
      });
    },
  });
};

/** Check whether active destinations exist for an integration */
export const useCheckDestinations = (
  integrationKey: string,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<{ has_destinations: boolean; count: number }, Error>({
    queryKey: [...integrationExtendedKeys.destinations(context, integrationKey), "check"],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/destinations/check`;
      const envelope = asEnvelope<{ has_destinations: boolean; count: number }>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? { has_destinations: false, count: 0 };
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/** Fetch available destination types with labels and config fields */
export const useFetchDestinationTypes = (
  integrationKey: string,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<DestinationTypeInfo[], Error>({
    queryKey: integrationExtendedKeys.destinationTypes(context, integrationKey),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/destination-types`;
      const envelope = asEnvelope<DestinationTypeInfo[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 60,
    ...options,
  });
};

// ─── DR Dashboard ────────────────────────────────────────────────

export interface DrDashboardData {
  replication_summary: {
    total: number;
    healthy: number;
    degraded: number;
    critical: number;
    unknown: number;
  };
  backup_summary: {
    total: number;
    enabled: number;
    by_provider: Record<string, { total: number; enabled: number; last_triggered_at?: string }>;
  };
  rpo_metrics: {
    average_lag_seconds: number | null;
    worst_lag_seconds: number | null;
    replication_coverage: number;
  };
  recent_operations: Array<{
    id: string;
    identifier?: string;
    operation_type: string;
    status: string;
    resource_type?: string;
    resource_id?: number;
    started_at?: string;
    completed_at?: string;
    duration_seconds?: number;
  }>;
  provider_health: Record<string, {
    replication_count: number;
    backup_count: number;
    healthy: number;
    degraded: number;
    critical: number;
    overall: string;
  }>;
}

export interface DrTimelineEvent {
  id: string;
  identifier?: string;
  operation_type: string;
  status: string;
  resource_type?: string;
  resource_id?: number;
  integration_key?: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  cost_usd?: number;
  progress?: number;
  error?: string;
}

/** Fetch DR dashboard aggregate data */
export const useDrDashboard = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<DrDashboardData, Error>({
    queryKey: integrationExtendedKeys.drDashboard(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/dr/dashboard`;
      const envelope = asEnvelope<DrDashboardData>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? {
        replication_summary: { total: 0, healthy: 0, degraded: 0, critical: 0, unknown: 0 },
        backup_summary: { total: 0, enabled: 0, by_provider: {} },
        rpo_metrics: { average_lag_seconds: null, worst_lag_seconds: null, replication_coverage: 0 },
        recent_operations: [],
        provider_health: {},
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    ...options,
  });
};

/** Fetch DR operations timeline */
export const useDrTimeline = (
  params?: { limit?: number; operation_type?: string },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<DrTimelineEvent[], Error>({
    queryKey: integrationExtendedKeys.drTimeline(context, params as AnyRecord),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.set("limit", String(params.limit));
      if (params?.operation_type) queryParams.set("operation_type", params.operation_type);
      const qs = queryParams.toString();
      const uri = `${entry.urlPrefix}/dr/timeline${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope<DrTimelineEvent[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    staleTime: 1000 * 30,
    ...options,
  });
};

/** Fetch aggregate replication health */
export const useReplicationHealth = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.replicationHealth(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/replication-health`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    ...options,
  });
};

/** Trigger DR drill mutation */
export const useDrDrill = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier; options?: AnyRecord }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId, options: drillOptions }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/replication/${resourceType}/${resourceId}/dr-drill`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, drillOptions ?? {}),
      );
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to trigger DR drill");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.drDashboard(context),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.drTimeline(context),
      });
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

// ─── Bidirectional Replication ────────────────────────────────────

import type {
  BidirectionalStatus,
  ReplicationConflict,
  QuorumStatus,
  TrafficStatus,
  SwitchModePayload,
  ResolveConflictPayload,
  ConfigureWitnessPayload,
  ConfigureTrafficControlPayload,
} from "@/types/bidirectional";

/** Fetch full bidirectional status for a replication pair */
export const useBidirectionalStatus = (
  pairId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<BidirectionalStatus, Error>({
    queryKey: integrationExtendedKeys.bidirectionalStatus(context, pairId as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/bidirectional-status`;
      const envelope = asEnvelope<BidirectionalStatus>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data as BidirectionalStatus;
    },
    enabled: Boolean(pairId) && enabled !== false,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    ...rest,
  });
};

/** Fetch conflicts for a replication pair */
export const useConflicts = (
  pairId: string | null | undefined,
  params?: { status?: string },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<ReplicationConflict[], Error>({
    queryKey: integrationExtendedKeys.conflicts(context, pairId as string, params as AnyRecord),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set("status", params.status);
      const qs = queryParams.toString();
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/conflicts${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope<ReplicationConflict[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    enabled: Boolean(pairId) && enabled !== false,
    staleTime: 1000 * 15,
    ...rest,
  });
};

/** Fetch quorum status */
export const useQuorumStatus = (
  pairId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<QuorumStatus, Error>({
    queryKey: integrationExtendedKeys.quorumStatus(context, pairId as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/quorum`;
      const envelope = asEnvelope<QuorumStatus>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data as QuorumStatus;
    },
    enabled: Boolean(pairId) && enabled !== false,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
    ...rest,
  });
};

/** Fetch traffic pool status */
export const useTrafficStatus = (
  pairId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<TrafficStatus, Error>({
    queryKey: integrationExtendedKeys.trafficStatus(context, pairId as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/traffic`;
      const envelope = asEnvelope<TrafficStatus>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data as TrafficStatus;
    },
    enabled: Boolean(pairId) && enabled !== false,
    staleTime: 1000 * 30,
    ...rest,
  });
};

/** Switch replication mode */
export const useSwitchMode = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { pairId: string; payload: SwitchModePayload }>({
    mutationFn: async ({ pairId, payload }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/mode`;
      const envelope = asEnvelope(await entry.toastApi.put<AnyRecord>(uri, payload as unknown as AnyRecord));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to switch mode");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.bidirectionalStatus(context, pairId),
      });
    },
  });
};

/** Restore bidirectional sync after degradation */
export const useRestoreBidirectional = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { pairId: string }>({
    mutationFn: async ({ pairId }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/restore-bidirectional`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to restore bidirectional");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.bidirectionalStatus(context, pairId),
      });
    },
  });
};

/** Resolve a specific conflict */
export const useResolveConflict = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { pairId: string; conflictId: string; payload: ResolveConflictPayload }
  >({
    mutationFn: async ({ pairId, conflictId, payload }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/conflicts/${conflictId}/resolve`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload as unknown as AnyRecord));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to resolve conflict");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.conflicts(context, pairId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.bidirectionalStatus(context, pairId),
      });
    },
  });
};

/** Configure witness node */
export const useConfigureWitness = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { pairId: string; payload: ConfigureWitnessPayload }>({
    mutationFn: async ({ pairId, payload }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/witness`;
      const envelope = asEnvelope(await entry.toastApi.put<AnyRecord>(uri, payload as unknown as AnyRecord));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to configure witness");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.quorumStatus(context, pairId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.bidirectionalStatus(context, pairId),
      });
    },
  });
};

/** Configure traffic control */
export const useConfigureTrafficControl = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { pairId: string; payload: ConfigureTrafficControlPayload }>({
    mutationFn: async ({ pairId, payload }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/traffic-control`;
      const envelope = asEnvelope(await entry.toastApi.put<AnyRecord>(uri, payload as unknown as AnyRecord));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to configure traffic control");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.trafficStatus(context, pairId),
      });
    },
  });
};

// ─── Kernel Compatibility ────────────────────────────────────────

/** Mutation: check kernel compatibility between two endpoints. */
export const useKernelCompatibilityCheck = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<
    AnyRecord,
    Error,
    { source_endpoint_id: string; target_endpoint_id: string }
  >({
    mutationFn: async (payload) => {
      const uri = `${entry.urlPrefix}/integrations/kernel-compatibility/check`;
      const envelope = asEnvelope(
        await entry.silentApi.post<AnyRecord>(uri, payload),
      );
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Kernel compatibility check failed",
        );
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

/** Query: get the kernel compatibility matrix (paginated). */
export const useKernelCompatibilityMatrix = (
  params?: { page?: number; per_page?: number },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: ["kernelCompatibility", "matrix", context, params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.page) { qs.set("page", String(params.page)); }
      if (params?.per_page) { qs.set("per_page", String(params.per_page)); }
      const uri = `${entry.urlPrefix}/integrations/kernel-compatibility/matrix${qs.toString() ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    ...options,
  });
};

/** Query: get preflight results for a migration. */
export const useMigrationPreflight = (
  migrationId: string | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: ["externalMigrations", "preflight", context, migrationId],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/external-migrations/${migrationId}/preflight`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: !!migrationId,
    ...options,
  });
};

export default integrationOperationHooks;
