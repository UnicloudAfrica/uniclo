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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryOptions = Partial<Omit<UseQueryOptions<any, Error>, "queryKey" | "queryFn">>;

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
  topology?: "one-way" | "bidirectional" | string;
  active_side?: "a" | "b" | string;
  lag_a_to_b?: number;
  lag_b_to_a?: number;
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
  replicationPairs: (context: string, params?: AnyRecord) =>
    ["replication-pairs", context, params ?? {}] as const,
  activeActiveReadiness: (context: string, pairId: string) =>
    ["active-active-readiness", context, pairId] as const,
  // Change Journal (CDC)
  changeJournalStatus: (context: string, endpointId: string) =>
    ["change-journal-status", context, endpointId] as const,
  changeJournalEntries: (context: string, endpointId: string, params?: AnyRecord) =>
    ["change-journal-entries", context, endpointId, params ?? {}] as const,
  // Transfer Tuning & Operations
  syncPreview: (context: string, pairId: string) =>
    ["sync-preview", context, pairId] as const,
  slaHistory: (context: string, pairId: string, params?: AnyRecord) =>
    ["sla-history", context, pairId, params ?? {}] as const,
  auditLog: (context: string, pairId: string, params?: AnyRecord) =>
    ["audit-log", context, pairId, params ?? {}] as const,
  verificationHistory: (context: string, pairId: string) =>
    ["verification-history", context, pairId] as const,
  // PITR (Point-in-Time Recovery)
  pitrRange: (context: string, key: string, resourceType: string, resourceId: Identifier) =>
    ["pitr-range", context, key, resourceType, resourceId] as const,
  // Ransomware Detection
  ransomwareDashboard: (context: string, key: string) =>
    ["ransomware-dashboard", context, key] as const,
  ransomwareScans: (context: string, key: string, params?: AnyRecord) =>
    ["ransomware-scans", context, key, params ?? {}] as const,
  // Hypervisor Management
  hypervisorDetect: (context: string, key: string, endpointId: string) =>
    ["hypervisor-detect", context, key, endpointId] as const,
  hypervisorVMs: (context: string, key: string, endpointId: string) =>
    ["hypervisor-vms", context, key, endpointId] as const,
  hypervisorVM: (context: string, key: string, endpointId: string, vmName: string) =>
    ["hypervisor-vm", context, key, endpointId, vmName] as const,
  hypervisorCBTStatus: (context: string, key: string, endpointId: string, vmName: string) =>
    ["hypervisor-cbt-status", context, key, endpointId, vmName] as const,
  hypervisorMigrationProgress: (context: string, key: string, endpointId: string, vmName: string) =>
    ["hypervisor-migration-progress", context, key, endpointId, vmName] as const,
  // Batch Migrations
  batchMigrations: (context: string, key: string, params?: AnyRecord) =>
    ["batch-migrations", context, key, params ?? {}] as const,
  batchMigration: (context: string, key: string, identifier: string) =>
    ["batch-migration", context, key, identifier] as const,
  // Database Replication Groups
  dbReplicationGroups: (context: string, key: string, params?: AnyRecord) =>
    ["db-replication-groups", context, key, params ?? {}] as const,
  dbReplicationGroup: (context: string, key: string, identifier: string) =>
    ["db-replication-group", context, key, identifier] as const,
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
    { integrationKey: string; resourceType: string; resourceId: Identifier; config?: AnyRecord }
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
  ReplicationPairSummary,
  QuorumStatus,
  TrafficStatus,
  SwitchModePayload,
  ResolveConflictPayload,
  ConfigureWitnessPayload,
  ConfigureTrafficControlPayload,
  ActiveActiveReadinessAssessment,
} from "@/types/bidirectional";

/** Fetch replication pairs for orchestration UI selection */
export const useReplicationPairs = (
  params?: { mode?: string; quorum_state?: string; bidirectional_only?: boolean },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<ReplicationPairSummary[], Error>({
    queryKey: integrationExtendedKeys.replicationPairs(context, params as AnyRecord),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.mode) queryParams.set("mode", params.mode);
      if (params?.quorum_state) queryParams.set("quorum_state", params.quorum_state);
      if (params?.bidirectional_only) queryParams.set("bidirectional_only", "1");
      const qs = queryParams.toString();
      const uri = `${entry.urlPrefix}/integrations/replication-pairs${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope<ReplicationPairSummary[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    enabled,
    staleTime: 1000 * 30,
    ...rest,
  });
};

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

/** Fetch current enterprise active-active readiness for a replication pair */
export const useActiveActiveReadiness = (
  pairId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<ActiveActiveReadinessAssessment, Error>({
    queryKey: integrationExtendedKeys.activeActiveReadiness(context, pairId as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/active-active-readiness`;
      const envelope = asEnvelope<ActiveActiveReadinessAssessment>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data as ActiveActiveReadinessAssessment;
    },
    enabled: Boolean(pairId) && enabled !== false,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
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

/** Certify enterprise active-active for the selected replication pair */
export const useCertifyActiveActive = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { pairId: string }>({
    mutationFn: async ({ pairId }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/active-active-certify`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to certify enterprise active-active");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.activeActiveReadiness(context, pairId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.bidirectionalStatus(context, pairId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.replicationPairs(context),
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

// ─── Change Journal (CDC) ──────────────────────────────────────

export interface ChangeJournalStatus {
  status: "running" | "stopped" | "error" | "not_configured";
  engine?: string;
  events_buffered?: number;
  size_bytes?: number;
  last_flush_at?: string | null;
  paths?: string[];
}

export interface ChangeJournalEntry {
  timestamp?: string;
  event?: string;
  path?: string;
}

/** Fetch change journal status for an external endpoint. */
export const useChangeJournalStatus = (
  endpointId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<ChangeJournalStatus, Error>({
    queryKey: integrationExtendedKeys.changeJournalStatus(context, endpointId ?? ""),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/external-endpoints/${endpointId}/change-journal`;
      const envelope = asEnvelope<ChangeJournalStatus>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return (envelope.data ?? { status: "not_configured" }) as ChangeJournalStatus;
    },
    enabled: !!endpointId,
    staleTime: 1000 * 30,
    refetchInterval: endpointId ? 1000 * 30 : false,
    ...options,
  });
};

/** Enable change journal on an external endpoint. */
export const useEnableChangeJournal = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { endpointId: string; paths: string[]; engine?: string }>({
    mutationFn: async ({ endpointId, paths, engine }) => {
      const uri = `${entry.urlPrefix}/integrations/external-endpoints/${endpointId}/change-journal`;
      const payload: AnyRecord = { paths };
      if (engine) payload.engine = engine;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to enable change journal");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { endpointId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.changeJournalStatus(context, endpointId),
      });
    },
  });
};

/** Disable change journal on an external endpoint. */
export const useDisableChangeJournal = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { endpointId: string }>({
    mutationFn: async ({ endpointId }) => {
      const uri = `${entry.urlPrefix}/integrations/external-endpoints/${endpointId}/change-journal`;
      const envelope = asEnvelope(await entry.toastApi.delete<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to disable change journal");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { endpointId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.changeJournalStatus(context, endpointId),
      });
    },
  });
};

/** Fetch recent change journal entries. */
export const useChangeJournalEntries = (
  endpointId: string | null | undefined,
  params?: { since?: string },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<ChangeJournalEntry[], Error>({
    queryKey: integrationExtendedKeys.changeJournalEntries(context, endpointId ?? "", params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.since) qs.set("since", params.since);
      const uri = `${entry.urlPrefix}/integrations/external-endpoints/${endpointId}/change-journal/entries${qs.toString() ? `?${qs}` : ""}`;
      const envelope = asEnvelope<ChangeJournalEntry[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return (envelope.data ?? []) as ChangeJournalEntry[];
    },
    enabled: !!endpointId,
    staleTime: 1000 * 15,
    refetchInterval: endpointId ? 1000 * 15 : false,
    ...options,
  });
};

// ─── Transfer Tuning & Operations ──────────────────────────────

/** Fetch sync preview (dry-run) for a replication pair. */
export const useSyncPreview = (
  pairId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.syncPreview(context, pairId ?? ""),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/preview`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: !!pairId,
    staleTime: 1000 * 60,
    ...options,
  });
};

/** Fetch SLA compliance history for a replication pair. */
export const useSlaHistory = (
  pairId: string | null | undefined,
  params?: { days?: number; period_type?: string },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.slaHistory(context, pairId ?? "", params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.days) qs.set("days", String(params.days));
      if (params?.period_type) qs.set("period_type", params.period_type);
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/sla${qs.toString() ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: !!pairId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/** Fetch file-level audit log for a replication pair (paginated). */
export const useAuditLog = (
  pairId: string | null | undefined,
  params?: { action?: string; file_path?: string; date_from?: string; date_to?: string; direction?: string; page?: number; per_page?: number },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.auditLog(context, pairId ?? "", params),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.set(k, String(v)); });
      }
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/audit${qs.toString() ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: !!pairId,
    staleTime: 1000 * 30,
    ...options,
  });
};

/** Fetch verification history for a replication pair. */
export const useVerificationHistory = (
  pairId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord[], Error>({
    queryKey: integrationExtendedKeys.verificationHistory(context, pairId ?? ""),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/verifications`;
      const envelope = asEnvelope<AnyRecord[]>(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? []) as AnyRecord[];
    },
    enabled: !!pairId,
    staleTime: 1000 * 60,
    ...options,
  });
};

/** Mutation: set maintenance windows for a replication pair. */
export const useSetMaintenanceWindows = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { pairId: string; windows: Array<{ cron: string; duration_minutes: number; label?: string }> }>({
    mutationFn: async ({ pairId, windows }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/maintenance-windows`;
      const envelope = asEnvelope(await entry.toastApi.put<AnyRecord>(uri, { windows } as unknown as AnyRecord));
      if (!envelope.success) throw new Error(envelope.message as string || "Failed to set maintenance windows");
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({ queryKey: integrationExtendedKeys.bidirectionalStatus(context, pairId) });
    },
  });
};

/** Mutation: trigger integrity verification for a replication pair. */
export const useVerifySyncIntegrity = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { pairId: string }>({
    mutationFn: async ({ pairId }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/verify`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, {}));
      if (!envelope.success) throw new Error(envelope.message as string || "Failed to trigger verification");
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { pairId }) => {
      queryClient.invalidateQueries({ queryKey: integrationExtendedKeys.verificationHistory(context, pairId) });
    },
  });
};

/** Update replication settings (transfer tuning, webhooks, etc.) */
export const useUpdateReplicationSettings = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { pairId: string; settings: AnyRecord }
  >({
    mutationFn: async ({ pairId, settings }) => {
      const uri = `${entry.urlPrefix}/integrations/replication-pairs/${pairId}/settings`;
      const envelope = asEnvelope(await entry.toastApi.put<AnyRecord>(uri, settings));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to update replication settings");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.replicationPairs(context),
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

// ─── DR Drill Scheduling ──────────────────────────────────────

/** Mutation: configure auto-scheduling for a DR drill. */
export const useConfigureDrillSchedule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    {
      drillId: string;
      schedule_frequency: "weekly" | "monthly" | "quarterly";
      schedule_day_of_week?: number;
      schedule_hour?: number;
      is_isolated?: boolean;
    }
  >({
    mutationFn: async ({ drillId, ...config }) => {
      const uri = `${entry.urlPrefix}/integrations/anycloudflow/replication/dr-drills/${drillId}/schedule`;
      const envelope = asEnvelope(
        await entry.toastApi.put<AnyRecord>(uri, config as unknown as AnyRecord),
      );
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Failed to configure drill schedule",
        );
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.drDashboard(context),
      });
    },
  });
};

/** Mutation: disable auto-scheduling for a DR drill. */
export const useDisableDrillSchedule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { drillId: string }>({
    mutationFn: async ({ drillId }) => {
      const uri = `${entry.urlPrefix}/integrations/anycloudflow/replication/dr-drills/${drillId}/schedule`;
      const envelope = asEnvelope(
        await entry.toastApi.delete<AnyRecord>(uri),
      );
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Failed to disable drill schedule",
        );
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.drDashboard(context),
      });
    },
  });
};

// ─── SLA Report PDF Export ──────────────────────────────────────

/** Mutation: export SLA compliance report as PDF and trigger browser download. */
export const useExportSlaReport = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<
    void,
    Error,
    { period?: string; include_drills?: boolean; include_replication?: boolean }
  >({
    mutationFn: async (params) => {
      const qs = new URLSearchParams();
      if (params.period) qs.set("period", params.period);
      if (params.include_drills !== undefined) qs.set("include_drills", String(params.include_drills));
      if (params.include_replication !== undefined) qs.set("include_replication", String(params.include_replication));
      const uri = `${entry.urlPrefix}/integrations/reports/sla/export${qs.toString() ? `?${qs}` : ""}`;
      const response = await fetch(uri, {
        method: "GET",
        headers: ((entry.silentApi as unknown as { defaults?: { headers?: Record<string, string> } }).defaults?.headers) ?? {},
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to export SLA report");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sla-compliance-report-${params.period ?? "30d"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
};

// ─── PITR (Point-in-Time Recovery) ─────────────────────────────

export interface PitrRange {
  earliest: string;
  latest: string;
  snapshot_count: number;
  has_wal_archives: boolean;
}

/** Fetch the recoverable time range for a resource's backup policy. */
export const usePitrRange = (
  integrationKey: string,
  resourceType: string,
  resourceId: Identifier | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<PitrRange | null, Error>({
    queryKey: integrationExtendedKeys.pitrRange(context, integrationKey, resourceType, resourceId ?? ""),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/${resourceType}/${resourceId}/pitr-range`;
      const envelope = asEnvelope<PitrRange>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? null;
    },
    enabled: Boolean(resourceId) && enabled !== false,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

/** Mutation: restore a resource to a specific point in time. */
export const useRestorePitr = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; resourceType: string; resourceId: Identifier; targetTime: string; targetEndpointId?: string }
  >({
    mutationFn: async ({ integrationKey, resourceType, resourceId, targetTime, targetEndpointId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/backup/${resourceType}/${resourceId}/pitr-restore`;
      const body: AnyRecord = { target_time: targetTime };
      if (targetEndpointId) body.target_endpoint_id = targetEndpointId;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, body));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to initiate point-in-time restore");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey, resourceType, resourceId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.pitrRange(context, integrationKey, resourceType, resourceId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

// ─── Ransomware Detection ────────────────────────────────────

export interface RansomwareDashboardData {
  total_scans: number;
  threats_detected: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  none_count: number;
  last_scan_at: string | null;
}

export interface RansomwareScan {
  id: string;
  policy_name: string;
  threat_level: "none" | "low" | "medium" | "high" | "critical";
  score: number;
  status: string;
  scanned_at: string;
  acknowledged_at: string | null;
  recovered_at: string | null;
}

/** Fetch ransomware scan dashboard summary. */
export const useRansomwareDashboard = (
  integrationKey: string,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<RansomwareDashboardData | null, Error>({
    queryKey: integrationExtendedKeys.ransomwareDashboard(context, integrationKey),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/ransomware/dashboard`;
      const envelope = asEnvelope<RansomwareDashboardData>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? null;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    ...options,
  });
};

/** Fetch ransomware scans with optional filters. */
export const useRansomwareScans = (
  integrationKey: string,
  params?: { threat_level?: string; status?: string; policy_id?: string; per_page?: number; page?: number },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<{ data: RansomwareScan[]; meta?: AnyRecord }, Error>({
    queryKey: integrationExtendedKeys.ransomwareScans(context, integrationKey, params as AnyRecord),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.threat_level) queryParams.set("threat_level", params.threat_level);
      if (params?.status) queryParams.set("status", params.status);
      if (params?.policy_id) queryParams.set("policy_id", params.policy_id);
      if (params?.per_page) queryParams.set("per_page", String(params.per_page));
      if (params?.page) queryParams.set("page", String(params.page));
      const qs = queryParams.toString();
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/ransomware/scans${qs ? `?${qs}` : ""}`;
      const res = await entry.silentApi.get<AnyRecord>(uri);
      const envelope = (res ?? {}) as { success?: boolean; data?: RansomwareScan[] | { data?: RansomwareScan[]; meta?: AnyRecord }; meta?: AnyRecord };
      // Handle both flat array and paginated { data: [...], meta: {...} } responses
      const rawData = envelope.data;
      if (Array.isArray(rawData)) {
        return { data: rawData, meta: envelope.meta };
      }
      // Paginated response: envelope.data is { data: [...], meta: {...} }
      const paginated = rawData as { data?: RansomwareScan[]; meta?: AnyRecord } | undefined;
      return { data: paginated?.data ?? [], meta: paginated?.meta ?? envelope.meta };
    },
    staleTime: 1000 * 30,
    ...options,
  });
};

/** Acknowledge a ransomware scan threat. */
export const useAcknowledgeRansomware = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; scanId: string }
  >({
    mutationFn: async ({ integrationKey, scanId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/ransomware/scans/${scanId}/acknowledge`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to acknowledge ransomware scan");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.ransomwareDashboard(context, integrationKey),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.ransomwareScans(context, integrationKey),
      });
    },
  });
};

/** Trigger recovery from a ransomware scan threat. */
export const useRecoverFromRansomware = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { integrationKey: string; scanId: string }
  >({
    mutationFn: async ({ integrationKey, scanId }) => {
      const uri = `${entry.urlPrefix}/integrations/${integrationKey}/ransomware/scans/${scanId}/recover`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to initiate ransomware recovery");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { integrationKey }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.ransomwareDashboard(context, integrationKey),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.ransomwareScans(context, integrationKey),
      });
      queryClient.invalidateQueries({
        queryKey: integrationOperationKeys.all(context),
      });
    },
  });
};

// ─── Hypervisor Management ──────────────────────────────────────

export interface HypervisorDetection {
  hypervisor_type: string;
  version: string;
  capabilities: string[];
}

export interface HypervisorVM {
  name: string;
  status: string;
  memory_mb: number;
  cpu_count: number;
  disk_gb?: number;
  os?: string;
  cbt_enabled?: boolean;
}

export interface HypervisorMigrationProgress {
  status: string;
  percent: number;
  bytes_transferred?: number;
  bytes_total?: number;
  elapsed_seconds?: number;
  estimated_remaining_seconds?: number;
}

const HYPERVISOR_KEY = "anycloudflow";

/** Detect hypervisor type and capabilities on an endpoint */
export const useDetectHypervisor = (
  endpointId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<HypervisorDetection, Error>({
    queryKey: integrationExtendedKeys.hypervisorDetect(context, HYPERVISOR_KEY, endpointId as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/detect`;
      const envelope = asEnvelope<HypervisorDetection>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? { hypervisor_type: "unknown", version: "", capabilities: [] };
    },
    enabled: Boolean(endpointId) && enabled !== false,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
};

/** List VMs on a hypervisor endpoint */
export const useHypervisorVMs = (
  endpointId: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<HypervisorVM[], Error>({
    queryKey: integrationExtendedKeys.hypervisorVMs(context, HYPERVISOR_KEY, endpointId as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/vms`;
      const envelope = asEnvelope<HypervisorVM[]>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? [];
    },
    enabled: Boolean(endpointId) && enabled !== false,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    ...rest,
  });
};

/** Get details for a specific VM */
export const useHypervisorVM = (
  endpointId: string | null | undefined,
  vmName: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<HypervisorVM, Error>({
    queryKey: integrationExtendedKeys.hypervisorVM(context, HYPERVISOR_KEY, endpointId as string, vmName as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/vms/${vmName}`;
      const envelope = asEnvelope<HypervisorVM>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? ({ name: vmName, status: "unknown", memory_mb: 0, cpu_count: 0 } as HypervisorVM);
    },
    enabled: Boolean(endpointId) && Boolean(vmName) && enabled !== false,
    staleTime: 1000 * 30,
    ...rest,
  });
};

/** Execute a power action (start/stop/restart) on a VM */
export const useHypervisorVMAction = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { endpointId: string; vmName: string; action: string }
  >({
    mutationFn: async ({ endpointId, vmName, action }) => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/vms/${vmName}/action`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, { action }),
      );
      if (!envelope.success) {
        throw new Error(envelope.message as string || `Failed to ${action} VM`);
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { endpointId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.hypervisorVMs(context, HYPERVISOR_KEY, endpointId),
      });
    },
  });
};

/** Enable CBT on a VM */
export const useEnableHypervisorCBT = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { endpointId: string; vmName: string }
  >({
    mutationFn: async ({ endpointId, vmName }) => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/vms/${vmName}/cbt/enable`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri),
      );
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to enable CBT");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { endpointId, vmName }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.hypervisorCBTStatus(context, HYPERVISOR_KEY, endpointId, vmName),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.hypervisorVMs(context, HYPERVISOR_KEY, endpointId),
      });
    },
  });
};

/** Get CBT status for a VM */
export const useHypervisorCBTStatus = (
  endpointId: string | null | undefined,
  vmName: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.hypervisorCBTStatus(context, HYPERVISOR_KEY, endpointId as string, vmName as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/vms/${vmName}/cbt/status`;
      const envelope = asEnvelope(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: Boolean(endpointId) && Boolean(vmName) && enabled !== false,
    staleTime: 1000 * 30,
    ...rest,
  });
};

/** Initiate VM migration */
export const useMigrateHypervisorVM = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { endpointId: string; vmName: string; target_endpoint_identifier: string; migration_type: string; bandwidth_mbps?: number }
  >({
    mutationFn: async ({ endpointId, vmName, ...payload }) => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/vms/${vmName}/migrate`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, payload),
      );
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to initiate VM migration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { endpointId }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.hypervisorVMs(context, HYPERVISOR_KEY, endpointId),
      });
    },
  });
};

/** Poll migration progress for a VM */
export const useHypervisorMigrationProgress = (
  endpointId: string | null | undefined,
  vmName: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<HypervisorMigrationProgress, Error>({
    queryKey: integrationExtendedKeys.hypervisorMigrationProgress(context, HYPERVISOR_KEY, endpointId as string, vmName as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${HYPERVISOR_KEY}/hypervisor/${endpointId}/vms/${vmName}/migrate/progress`;
      const envelope = asEnvelope<HypervisorMigrationProgress>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data ?? { status: "unknown", percent: 0 };
    },
    enabled: Boolean(endpointId) && Boolean(vmName) && enabled !== false,
    staleTime: 1000 * 5,
    refetchInterval: 1000 * 5,
    ...rest,
  });
};

// ─── Batch Migrations ──────────────────────────────────────────

const INTEGRATION_KEY = "anycloudflow";

/** List batch migrations. */
export const useBatchMigrations = (
  params?: { page?: number; per_page?: number; status?: string; search?: string },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.batchMigrations(context, INTEGRATION_KEY, params as AnyRecord),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.set(k, String(v)); });
      }
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations${qs.toString() ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    staleTime: 1000 * 30,
    ...options,
  });
};

/** Create a batch migration. */
export const useCreateBatchMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    {
      name: string;
      strategy: "parallel" | "sequential" | "wave";
      max_concurrent?: number;
      consolidation_mode?: "namespace_isolated" | "merge" | null;
      wave_size?: number;
      transfer_method?: string;
      include_databases?: boolean;
      exclude_paths?: string[];
      migrations: AnyRecord[];
    }
  >({
    mutationFn: async (payload) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to create batch migration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigrations(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Start a draft batch migration. */
export const useStartBatchMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations/${identifier}/start`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to start batch migration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigration(context, INTEGRATION_KEY, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigrations(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Fetch a single batch migration. */
export const useBatchMigration = (
  identifier: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.batchMigration(context, INTEGRATION_KEY, identifier as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations/${identifier}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: Boolean(identifier) && enabled !== false,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
    ...rest,
  });
};

/** Pause a batch migration. */
export const usePauseBatchMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations/${identifier}/pause`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to pause batch migration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigration(context, INTEGRATION_KEY, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigrations(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Resume a batch migration. */
export const useResumeBatchMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations/${identifier}/resume`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to resume batch migration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigration(context, INTEGRATION_KEY, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigrations(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Cancel a batch migration. */
export const useCancelBatchMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations/${identifier}/cancel`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to cancel batch migration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigration(context, INTEGRATION_KEY, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigrations(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Re-validate a draft batch migration with fresh SSH data. */
export const useRevalidateBatchMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/batch-migrations/${identifier}/revalidate`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to re-validate batch migration");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.batchMigration(context, INTEGRATION_KEY, identifier),
      });
    },
  });
};

// ─── Database Replication Groups ───────────────────────────────

/** Fetch the dynamic database engine catalog. */
export const useDatabaseEngines = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord[], Error>({
    queryKey: ["database-engines", context, INTEGRATION_KEY],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-engines`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      const data = envelope.data;
      // Handle both flat array and nested data shape
      return (Array.isArray(data) ? data : (data as AnyRecord)?.data ?? data ?? []) as AnyRecord[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes — engines rarely change
    ...options,
  });
};

/** List database replication groups. */
export const useDatabaseReplicationGroups = (
  params?: { page?: number; per_page?: number; status?: string; engine?: string; search?: string },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.dbReplicationGroups(context, INTEGRATION_KEY, params as AnyRecord),
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.set(k, String(v)); });
      }
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups${qs.toString() ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    staleTime: 1000 * 30,
    ...options,
  });
};

/** Create a database replication group. */
export const useCreateDatabaseReplicationGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    {
      name: string;
      engine: "postgresql" | "mysql" | "mongodb" | "redis" | "sqlserver" | "mssql";
      sync_mode?: "full" | "cdc";
      interval_minutes?: number;
      rpo_target_minutes?: number;
      source_endpoint_id?: string;
      source_config: AnyRecord;
      replica_endpoint_id?: string;
      replica_config?: AnyRecord;
      table_filter?: { mode: "include" | "exclude"; tables: string[] } | null;
      targets?: AnyRecord[];
    }
  >({
    mutationFn: async (payload) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to create database replication group");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroups(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Fetch a single database replication group. */
export const useDatabaseReplicationGroup = (
  identifier: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<AnyRecord, Error>({
    queryKey: integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, identifier as string),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: Boolean(identifier) && enabled !== false,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
    ...rest,
  });
};

/** Delete a database replication group. */
export const useDeleteDatabaseReplicationGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}`;
      const envelope = asEnvelope(await entry.toastApi.delete<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to delete database replication group");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroups(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Add a replication target to a group. */
export const useAddReplicationTarget = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    {
      identifier: string;
      target_endpoint_id?: string;
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
      schema_mapping?: AnyRecord[];
    }
  >({
    mutationFn: async ({ identifier, ...payload }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/targets`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to add replication target");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, identifier),
      });
    },
  });
};

/** Pause database replication for a group. */
export const usePauseDatabaseReplication = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/pause`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to pause database replication");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroups(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Resume database replication for a group. */
export const useResumeDatabaseReplication = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/resume`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to resume database replication");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroups(context, INTEGRATION_KEY),
      });
    },
  });
};

/** Trigger manual sync for a database replication group. */
export const useSyncDatabaseReplication = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/sync`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to trigger database replication sync");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, identifier),
      });
    },
  });
};

/** List tables from the source database. */
export const useListDatabaseTables = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/tables`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) throw new Error(envelope.message as string || "Failed to list tables");
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

/** Initialize CDC for a replication group. */
export const useInitDatabaseCDC = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/init-cdc`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) throw new Error(envelope.message as string || "Failed to initialize CDC");
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, variables.identifier),
      });
    },
  });
};

/** Trigger data validation for a replication group. */
export const useValidateDatabaseReplication = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<AnyRecord, Error, { identifier: string; target_identifier?: string }>({
    mutationFn: async ({ identifier, ...payload }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/validate`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload));
      if (!envelope.success) throw new Error(envelope.message as string || "Failed to trigger validation");
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

/** Run binary preflight checks for a replication group. */
export const usePreflightDatabaseReplication = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/preflight`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) throw new Error(envelope.message as string || "Preflight check failed");
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

/** List validation results for a replication group. */
export const useDatabaseValidations = (
  identifier: string | null | undefined,
  params?: { page?: number; per_page?: number },
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: [...integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, identifier as string), "validations", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) qs.set(k, String(v)); });
      }
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/validations${qs.toString() ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: Boolean(identifier),
    staleTime: 1000 * 30,
    ...options,
  });
};

/** Get target history. */
export const useDatabaseTargetHistory = (
  identifier: string | null | undefined,
  targetIdentifier: string | null | undefined,
  options: QueryOptions = {},
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: [...integrationExtendedKeys.dbReplicationGroup(context, INTEGRATION_KEY, identifier as string), "target-history", targetIdentifier],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/${identifier}/targets/${targetIdentifier}/history`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    enabled: Boolean(identifier) && Boolean(targetIdentifier),
    staleTime: 1000 * 15,
    ...options,
  });
};

/** Test a database connection. */
export const useTestDatabaseConnection = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<
    AnyRecord,
    Error,
    { engine: string; host: string; port: number; database: string; username: string; password: string }
  >({
    mutationFn: async (payload) => {
      const uri = `${entry.urlPrefix}/integrations/${INTEGRATION_KEY}/database-replication-groups/test-connection`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, payload));
      if (!envelope.success) {
        throw new Error(envelope.message as string || "Failed to test database connection");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

export default integrationOperationHooks;
