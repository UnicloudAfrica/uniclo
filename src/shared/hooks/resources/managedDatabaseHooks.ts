/**
 * Managed Database Hooks — Context-aware hooks for managed databases.
 *
 * Basic CRUD via createResourceHooks factory + custom hooks for:
 * - Credentials, backups, lifecycle actions
 * - Pricing quotes, available engines/plans
 * - Order creation (POST /managed-databases)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import logger from "@/utils/logger";
import type {
  ManagedDatabase,
  ManagedDatabaseBackup,
  DatabaseCredentials,
  DatabaseQuoteResponse,
  DatabaseOrderResponse,
  DatabaseMetrics,
  DatabaseMetricHistoryEntry,
  AvailableUpgrades,
  ManagedDatabaseOperation,
  CloudAccount,
  CloudAccountProvider,
} from "@/types/managedDatabase";

type AnyRecord = Record<string, unknown>;
type Identifier = string | number;
type QueryOptions = Partial<Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Basic CRUD via factory ──────────────────────────────────────

const managedDatabaseHooks = createResourceHooks<ManagedDatabase>({
  resourcePath: "managed-databases",
  queryKeyBase: "managedDatabases",
  dataKey: "data",
});

export const {
  useFetchList: useFetchManagedDatabases,
  useFetchById: useFetchManagedDatabaseById,
  useCreate: useCreateManagedDatabase,
  useUpdate: useUpdateManagedDatabase,
  useDelete: useDeleteManagedDatabase,
  useSync: useSyncManagedDatabases,
  queryKeys: managedDatabaseKeys,
} = managedDatabaseHooks;

// ─── Extended Query Keys ─────────────────────────────────────────

export const managedDatabaseExtendedKeys = {
  ...createQueryKeys("managedDatabases"),
  credentials: (context: string, identifier: Identifier) =>
    ["managedDatabase-credentials", context, identifier] as const,
  connectionInfo: (context: string, identifier: Identifier) =>
    ["managedDatabase-connection", context, identifier] as const,
  backups: (context: string, identifier: Identifier) =>
    ["managedDatabase-backups", context, identifier] as const,
  engines: (context: string) => ["managedDatabase-engines", context] as const,
  plans: (context: string, engine?: string) =>
    ["managedDatabase-plans", context, engine ?? "all"] as const,
  quote: (context: string, params: AnyRecord) =>
    ["managedDatabase-quote", context, params] as const,
  metrics: (context: string, identifier: Identifier) =>
    ["managedDatabase-metrics", context, identifier] as const,
  metricHistory: (context: string, identifier: Identifier, metricType: string) =>
    ["managedDatabase-metricHistory", context, identifier, metricType] as const,
  availableUpgrades: (context: string, identifier: Identifier) =>
    ["managedDatabase-upgrades", context, identifier] as const,
  operations: (context: string, identifier: Identifier) =>
    ["managedDatabase-operations", context, identifier] as const,
  operationDetail: (context: string, identifier: Identifier, operationIdentifier: Identifier) =>
    ["managedDatabase-operation", context, identifier, operationIdentifier] as const,
  backupPolicy: (context: string, identifier: Identifier) =>
    ["managedDatabase-backupPolicy", context, identifier] as const,
  dbUsers: (context: string, identifier: Identifier) =>
    ["managedDatabase-dbUsers", context, identifier] as const,
  poolingConfig: (context: string, identifier: Identifier) =>
    ["managedDatabase-pooling", context, identifier] as const,
  sslCertificate: (context: string, identifier: Identifier) =>
    ["managedDatabase-ssl", context, identifier] as const,
  replicas: (context: string, identifier: Identifier) =>
    ["managedDatabase-replicas", context, identifier] as const,
  parameterGroups: (context: string) =>
    ["managedDatabase-parameterGroups", context] as const,
  instanceClasses: (context: string, engine?: string) =>
    ["managedDatabase-instanceClasses", context, engine ?? "all"] as const,
  alertRules: (context: string, identifier: Identifier) =>
    ["managedDatabase-alertRules", context, identifier] as const,
  alertEvents: (context: string, identifier: Identifier) =>
    ["managedDatabase-alertEvents", context, identifier] as const,
  notificationChannels: (context: string) =>
    ["managedDatabase-notificationChannels", context] as const,
};

const asListPayload = <T = AnyRecord>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const record = value as AnyRecord;
    if (Array.isArray(record.data)) {
      return record.data as T[];
    }
  }

  return [];
};

export const managedDatabaseBillingKeys = {
  usage: (context: string, identifier: Identifier, params?: AnyRecord) =>
    ["managedDatabase-usage", context, identifier, params ?? {}] as const,
  costEstimate: (context: string, identifier: Identifier) =>
    ["managedDatabase-costEstimate", context, identifier] as const,
  billingSummary: (context: string, params?: AnyRecord) =>
    ["managedDatabase-billingSummary", context, params ?? {}] as const,
  billingCostBreakdown: (context: string, params?: AnyRecord) =>
    ["managedDatabase-billingBreakdown", context, params ?? {}] as const,
  billingCurrentMonth: (context: string) =>
    ["managedDatabase-billingCurrentMonth", context] as const,
};

export const webhookKeys = {
  endpoints: (context: string) => ["webhookEndpoints", context] as const,
  deliveries: (context: string, endpointId: number) =>
    ["webhookDeliveries", context, endpointId] as const,
  events: (context: string, databaseId?: number | string) =>
    ["databaseEvents", context, databaseId ?? "all"] as const,
};

// ─── Credentials ─────────────────────────────────────────────────

/** Fetch database connection credentials — on-demand (no auto-fetch) */
export const useFetchDatabaseCredentials = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = false, ...rest } = options;

  return useQuery<{ credentials: DatabaseCredentials; connection_string: string | null }, Error>({
    queryKey: managedDatabaseExtendedKeys.credentials(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/credentials`;
      const envelope = asEnvelope<{
        credentials: DatabaseCredentials;
        connection_string: string | null;
      }>(await entry.silentApi.get<AnyRecord>(uri));
      if (!envelope.data) {
        throw new Error("Failed to fetch credentials");
      }
      return envelope.data;
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 0, // Always re-fetch (sensitive data)
    ...rest,
  });
};

/** Fetch connection info (non-sensitive) */
export const useFetchConnectionInfo = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.connectionInfo(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/connection-info`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
};

// ─── Backups ─────────────────────────────────────────────────────

/** Fetch backups for a database */
export const useFetchDatabaseBackups = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.backups(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backups`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

// ─── Post-Provision Operations ──────────────────────────────────

export const useFetchDatabaseOperations = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<ManagedDatabaseOperation[], Error>({
    queryKey: managedDatabaseExtendedKeys.operations(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/operations`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return asListPayload<ManagedDatabaseOperation>(envelope.data);
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 10,
    ...rest,
  });
};

export const useFetchDatabaseOperation = (
  identifier: Identifier | null | undefined,
  operationIdentifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<ManagedDatabaseOperation, Error>({
    queryKey: managedDatabaseExtendedKeys.operationDetail(
      context,
      identifier as Identifier,
      operationIdentifier as Identifier
    ),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/operations/${operationIdentifier}`;
      const envelope = asEnvelope<ManagedDatabaseOperation>(
        await entry.silentApi.get<AnyRecord>(uri)
      );

      if (!envelope.data) {
        throw new Error("Failed to fetch database operation");
      }

      return envelope.data;
    },
    enabled: Boolean(identifier) && Boolean(operationIdentifier) && enabled,
    staleTime: 1000 * 5,
    ...rest,
  });
};

export const useRotateDatabaseCredentials = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    ManagedDatabaseOperation,
    Error,
    {
      identifier: Identifier;
      username?: string | null;
      password?: string | null;
      generatePassword?: boolean;
    }
  >({
    mutationFn: async ({ identifier, username, password, generatePassword }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/operations/rotate-credentials`;
      const envelope = asEnvelope<ManagedDatabaseOperation>(
        await entry.toastApi.post<AnyRecord>(uri, {
          username: username || undefined,
          password: password || undefined,
          generate_password: generatePassword,
        })
      );

      if (!envelope.data) {
        throw new Error(envelope.message || "Failed to queue credential rotation");
      }

      return envelope.data;
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.operations(context, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.credentials(context, identifier),
      });
    },
  });
};

export const useRetryDatabaseOperation = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    ManagedDatabaseOperation,
    Error,
    { identifier: Identifier; operationIdentifier: Identifier }
  >({
    mutationFn: async ({ identifier, operationIdentifier }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/operations/${operationIdentifier}/retry`;
      const envelope = asEnvelope<ManagedDatabaseOperation>(
        await entry.toastApi.post<AnyRecord>(uri)
      );

      if (!envelope.data) {
        throw new Error(envelope.message || "Failed to retry operation");
      }

      return envelope.data;
    },
    onSuccess: (_data, { identifier, operationIdentifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.operations(context, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.operationDetail(context, identifier, operationIdentifier),
      });
    },
  });
};

export const useReconcileDatabaseOperation = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<
    ManagedDatabaseOperation,
    Error,
    { identifier: Identifier; operationIdentifier: Identifier }
  >({
    mutationFn: async ({ identifier, operationIdentifier }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/operations/${operationIdentifier}/reconcile`;
      const envelope = asEnvelope<ManagedDatabaseOperation>(
        await entry.toastApi.post<AnyRecord>(uri)
      );

      if (!envelope.data) {
        throw new Error(envelope.message || "Failed to reconcile operation");
      }

      return envelope.data;
    },
    onSuccess: (_data, { identifier, operationIdentifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.operations(context, identifier),
      });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.operationDetail(context, identifier, operationIdentifier),
      });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.credentials(context, identifier),
      });
    },
  });
};

/** Create a manual backup */
export const useCreateDatabaseBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: Identifier; name?: string; description?: string }>({
    mutationFn: async ({ identifier, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backups`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, params));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to create backup");
      }
      return envelope.data ?? {};
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.backups(context, identifier),
      });
    },
  });
};

/** Restore from a backup */
export const useRestoreDatabaseBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: Identifier; backupId: number }>({
    mutationFn: async ({ identifier, backupId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backups/${backupId}/restore`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to restore backup");
      }
      return envelope.data ?? {};
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.all(context),
      });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.backups(context, identifier),
      });
    },
  });
};

// ─── Metrics & Query Analytics ──────────────────────────────────

/** Fetch the latest metrics for a database */
export const useFetchDatabaseMetrics = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<DatabaseMetrics, Error>({
    queryKey: managedDatabaseExtendedKeys.metrics(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/metrics`;
      const envelope = asEnvelope<DatabaseMetrics>(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    ...rest,
  });
};

/** Fetch metric history for charts */
export const useFetchMetricHistory = (
  identifier: Identifier | null | undefined,
  metricType: string,
  hours: number = 24,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<DatabaseMetricHistoryEntry[], Error>({
    queryKey: managedDatabaseExtendedKeys.metricHistory(
      context,
      identifier as Identifier,
      metricType
    ),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/metrics/${metricType}/history?hours=${hours}`;
      const envelope = asEnvelope<DatabaseMetricHistoryEntry[]>(
        await entry.silentApi.get<AnyRecord>(uri)
      );
      return envelope.data ?? [];
    },
    enabled: Boolean(identifier) && Boolean(metricType) && enabled,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
};

// ─── Engine Upgrades ────────────────────────────────────────────

/** Fetch available upgrades for a database */
export const useFetchAvailableUpgrades = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;

  return useQuery<AvailableUpgrades, Error>({
    queryKey: managedDatabaseExtendedKeys.availableUpgrades(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/available-upgrades`;
      const envelope = asEnvelope<AvailableUpgrades>(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? { engine: "postgresql", current_version: "", available_versions: [] };
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 30,
    ...rest,
  });
};

/** Trigger an engine upgrade */
export const useUpgradeDatabaseEngine = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: Identifier; targetVersion: string }>({
    mutationFn: async ({ identifier, targetVersion }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/upgrade`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, { target_version: targetVersion })
      );
      if (!envelope.success) {
        throw new Error(envelope.message || "Failed to initiate upgrade");
      }
      return envelope.data ?? {};
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: managedDatabaseExtendedKeys.availableUpgrades(context, identifier),
      });
    },
  });
};

// ─── Lifecycle Actions ───────────────────────────────────────────

/** Execute a database lifecycle action (pause, resume, restart) */
export const useDatabaseAction = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: Identifier; action: string }>({
    mutationFn: async ({ identifier, action }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/actions`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, { action }));
      if (!envelope.success) {
        throw new Error(envelope.message || `Failed to ${action} database`);
      }
      return envelope.data ?? {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
    },
    onError: (error) => {
      logger.error("Error executing database action:", error);
    },
  });
};

// ─── Catalog & Pricing ───────────────────────────────────────────

/** Fetch available database engines */
export const useFetchAvailableEngines = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.engines(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/engines`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    staleTime: 1000 * 60 * 30, // 30 min (rarely changes)
    ...options,
  });
};

/** Fetch available plans (optionally filtered by engine) */
export const useFetchAvailablePlans = (engine?: string, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.plans(context, engine),
    queryFn: async () => {
      const qs = engine ? `?engine=${encodeURIComponent(engine)}` : "";
      const uri = `${entry.urlPrefix}/managed-databases/plans${qs}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    staleTime: 1000 * 60 * 15,
    ...options,
  });
};

/** Get a live pricing quote */
export const useDatabaseQuote = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<DatabaseQuoteResponse, Error, AnyRecord>({
    mutationFn: async (params) => {
      const uri = `${entry.urlPrefix}/managed-databases/quote`;
      const envelope = asEnvelope<DatabaseQuoteResponse>(
        await entry.silentApi.post<AnyRecord>(uri, params)
      );
      if (!envelope.data) {
        throw new Error("Failed to calculate pricing");
      }
      return envelope.data;
    },
  });
};

// ─── Order Creation ──────────────────────────────────────────────

/** Create a managed database order (initiates payment flow) */
export const useCreateDatabaseOrder = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<DatabaseOrderResponse, Error, AnyRecord>({
    mutationFn: async (payload) => {
      const uri = `${entry.urlPrefix}/managed-databases`;
      const res = await entry.toastApi.post<AnyRecord>(uri, payload);
      if (!res) {
        throw new Error("Failed to create database order");
      }
      return res as unknown as DatabaseOrderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
    },
    onError: (error) => {
      logger.error("Error creating database order:", error);
    },
  });
};

/** Update firewall rules */
export const useUpdateDatabaseFirewall = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: Identifier; firewallCidrs: string[] }>({
    mutationFn: async ({ identifier, firewallCidrs }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}`;
      const envelope = asEnvelope(
        await entry.toastApi.put<AnyRecord>(uri, { firewall_cidrs: firewallCidrs })
      );
      return envelope.data ?? {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
    },
  });
};

// ─── DR (Disaster Recovery) ──────────────────────────────────────

export const useFetchDrEligibility = (identifier: string, options?: { enabled?: boolean }) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<{
    eligible: boolean;
    reason: string | null;
    available_azs: Array<{ code: string; name: string; provider: string; status: string }>;
    estimated_monthly_cost?: number;
  }>({
    queryKey: ["database-dr-eligibility", context, identifier],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/dr/eligibility`;
      const envelope = asEnvelope<{
        eligible: boolean;
        reason: string | null;
        available_azs: Array<{ code: string; name: string; provider: string; status: string }>;
        estimated_monthly_cost?: number;
      }>(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data!;
    },
    enabled: options?.enabled !== false && !!identifier,
    staleTime: 1000 * 60 * 2,
  });
};

export const useFetchDrStatus = (identifier: string, options?: { enabled?: boolean }) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<{
    dr_enabled: boolean;
    is_replica: boolean;
    replication_config: Record<string, unknown> | null;
    standby: {
      id: number;
      identifier: string;
      name: string;
      status: string;
      availability_zone: string;
      private_ip: string | null;
      created_at: string;
    } | null;
  }>({
    queryKey: ["database-dr-status", context, identifier],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/dr/status`;
      const envelope = asEnvelope<{
        dr_enabled: boolean;
        is_replica: boolean;
        replication_config: Record<string, unknown> | null;
        standby: {
          id: number;
          identifier: string;
          name: string;
          status: string;
          availability_zone: string;
          private_ip: string | null;
          created_at: string;
        } | null;
      }>(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data!;
    },
    enabled: options?.enabled !== false && !!identifier,
    refetchInterval: 15000,
  });
};

export const useEnableDr = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { identifier: string; targetAz: string }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${params.identifier}/dr/enable`;
      return entry.toastApi.post<AnyRecord>(uri, { target_az: params.targetAz });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["database-dr-eligibility", context, variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ["database-dr-status", context, variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ["managed-database", context, variables.identifier] });
    },
  });
};

export const useDrFailover = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { identifier: string }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${params.identifier}/dr/failover`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["database-dr-status", context, variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ["managed-database", context, variables.identifier] });
    },
  });
};

export const useDisableDr = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { identifier: string }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${params.identifier}/dr/disable`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["database-dr-eligibility", context, variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ["database-dr-status", context, variables.identifier] });
      queryClient.invalidateQueries({ queryKey: ["managed-database", context, variables.identifier] });
    },
  });
};

// ─── Cloud Accounts (BYOC) ──────────────────────────────────────

/** Fetch supported cloud account providers and their required fields */
export const useFetchCloudAccountProviders = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: ["cloudAccount-providers", context],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/cloud-accounts/providers`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    ...options,
  });
};

/** Fetch cloud accounts for the current tenant */
export const useFetchCloudAccounts = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: ["cloudAccounts", context],
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/cloud-accounts`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 2, // 2 min
    ...options,
  });
};

/** Create a new cloud account */
export const useCreateCloudAccount = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, AnyRecord>({
    mutationFn: async (params) => {
      const uri = `${entry.urlPrefix}/managed-databases/cloud-accounts`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloudAccounts", context] });
    },
  });
};

/** Delete a cloud account */
export const useDeleteCloudAccount = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/cloud-accounts/${id}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloudAccounts", context] });
    },
  });
};

/** Re-verify a cloud account's credentials */
export const useVerifyCloudAccount = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/cloud-accounts/${id}/verify`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloudAccounts", context] });
    },
  });
};

// ─── Backup Policy ─────────────────────────────────────────────

/** Fetch backup policy for a database */
export const useFetchDatabaseBackupPolicy = (
  identifier: Identifier | null | undefined,
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.backupPolicy(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backup-policy`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

/** Update backup policy */
export const useUpdateDatabaseBackupPolicy = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; [key: string]: unknown }>({
    mutationFn: async ({ identifier, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backup-policy`;
      return entry.toastApi.put<AnyRecord>(uri, params);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.backupPolicy(context, identifier as Identifier) });
    },
  });
};

/** Delete a backup/snapshot */
export const useDeleteDatabaseBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; backupId: number }>({
    mutationFn: async ({ identifier, backupId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backups/${backupId}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.backups(context, identifier) });
    },
  });
};

// ─── Connection & Users ────────────────────────────────────────

/** Fetch database users */
export const useFetchDatabaseUsers = (identifier: Identifier | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.dbUsers(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/users`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

/** Create database user */
export const useCreateDatabaseUser = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; username: string; role: string; password: string }>({
    mutationFn: async ({ identifier, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/users`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.dbUsers(context, identifier) });
    },
  });
};

/** Delete database user */
export const useDeleteDatabaseUser = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; userId: number }>({
    mutationFn: async ({ identifier, userId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/users/${userId}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.dbUsers(context, identifier) });
    },
  });
};

/** Rotate user password */
export const useRotateDatabaseUserPassword = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; userId: number }>({
    mutationFn: async ({ identifier, userId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/users/${userId}/rotate-password`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.dbUsers(context, identifier) });
    },
  });
};

/** Rotate master password */
export const useRotateDatabaseMasterPassword = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/rotate-master-password`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
    },
  });
};

/** Fetch pooling config */
export const useFetchDatabasePoolingConfig = (identifier: Identifier | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.poolingConfig(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/pooling`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
};

/** Update pooling config */
export const useUpdateDatabasePoolingConfig = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; config: Record<string, unknown> }>({
    mutationFn: async ({ identifier, config }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/pooling`;
      return entry.toastApi.put<AnyRecord>(uri, config);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.poolingConfig(context, identifier) });
    },
  });
};

/** Fetch SSL certificate */
export const useFetchDatabaseSslCertificate = (identifier: Identifier | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.sslCertificate(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/ssl-certificate`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 10,
    ...rest,
  });
};

// ─── Scaling & Replicas ────────────────────────────────────────

/** Fetch instance classes */
export const useFetchInstanceClasses = (engine?: string, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.instanceClasses(context, engine),
    queryFn: async () => {
      const qs = engine ? `?engine=${engine}` : "";
      const uri = `${entry.urlPrefix}/managed-databases/scaling/instance-classes${qs}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 30,
    ...options,
  });
};

/** Resize database */
export const useResizeDatabase = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; instance_class?: string; storage_gb?: number; apply_immediately?: boolean }>({
    mutationFn: async ({ identifier, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/resize`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.detail(context, identifier) });
    },
  });
};

/** Fetch replicas */
export const useFetchDatabaseReplicas = (identifier: Identifier | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.replicas(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/replicas`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

/** Create replica */
export const useCreateDatabaseReplica = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; region: string; instance_class?: string }>({
    mutationFn: async ({ identifier, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/replicas`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.replicas(context, identifier) });
    },
  });
};

/** Promote replica */
export const usePromoteDatabaseReplica = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; replicaId: number }>({
    mutationFn: async ({ identifier, replicaId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/replicas/${replicaId}/promote`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.all(context) });
    },
  });
};

/** Delete replica */
export const useDeleteDatabaseReplica = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; replicaId: number }>({
    mutationFn: async ({ identifier, replicaId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/replicas/${replicaId}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.replicas(context, identifier) });
    },
  });
};

/** Fetch parameter groups */
export const useFetchParameterGroups = (engine?: string, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.parameterGroups(context),
    queryFn: async () => {
      const qs = engine ? `?engine=${engine}` : "";
      const uri = `${entry.urlPrefix}/managed-databases/parameter-groups${qs}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/** Create parameter group */
export const useCreateParameterGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, AnyRecord>({
    mutationFn: async (params) => {
      const uri = `${entry.urlPrefix}/managed-databases/parameter-groups`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.parameterGroups(context) });
    },
  });
};

/** Update parameter group */
export const useUpdateParameterGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { groupId: number; params: AnyRecord }>({
    mutationFn: async ({ groupId, params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/parameter-groups/${groupId}`;
      return entry.toastApi.patch<AnyRecord>(uri, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.parameterGroups(context) });
    },
  });
};

/** Delete parameter group */
export const useDeleteParameterGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (groupId) => {
      const uri = `${entry.urlPrefix}/managed-databases/parameter-groups/${groupId}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.parameterGroups(context) });
    },
  });
};

/** Apply parameter group to database */
export const useApplyParameterGroup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; groupId: number }>({
    mutationFn: async ({ identifier, groupId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/apply-parameter-group`;
      return entry.toastApi.post<AnyRecord>(uri, { parameter_group_id: groupId });
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseKeys.detail(context, identifier) });
    },
  });
};

/** Reset parameter group to engine defaults */
export const useResetParameterGroupDefaults = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (groupId) => {
      const uri = `${entry.urlPrefix}/managed-databases/parameter-groups/${groupId}/reset`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.parameterGroups(context) });
    },
  });
};

// ─── Alerts & Notification Channels ────────────────────────────

/** Fetch alert rules */
export const useFetchAlertRules = (identifier: Identifier | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.alertRules(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/alerts`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

/** Create alert rule */
export const useCreateAlertRule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; [key: string]: unknown }>({
    mutationFn: async ({ identifier, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/alerts`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.alertRules(context, identifier as Identifier) });
    },
  });
};

/** Update alert rule */
export const useUpdateAlertRule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; alertId: number; [key: string]: unknown }>({
    mutationFn: async ({ identifier, alertId, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/alerts/${alertId}`;
      return entry.toastApi.patch<AnyRecord>(uri, params);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.alertRules(context, identifier as Identifier) });
    },
  });
};

/** Delete alert rule */
export const useDeleteAlertRule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; alertId: number }>({
    mutationFn: async ({ identifier, alertId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/alerts/${alertId}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.alertRules(context, identifier as Identifier) });
    },
  });
};

/** Toggle alert rule */
export const useToggleAlertRule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { identifier: Identifier; alertId: number }>({
    mutationFn: async ({ identifier, alertId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/alerts/${alertId}/toggle`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.alertRules(context, identifier as Identifier) });
    },
  });
};

/** Fetch alert events */
export const useFetchAlertEvents = (identifier: Identifier | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.alertEvents(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/alert-events`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 30,
    ...rest,
  });
};

/** Acknowledge alert event */
export const useAcknowledgeAlertEvent = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { eventId: number; identifier: Identifier }>({
    mutationFn: async ({ eventId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/alert-events/${eventId}/acknowledge`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.alertEvents(context, identifier) });
    },
  });
};

/** Resolve alert event */
export const useResolveAlertEvent = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { eventId: number; identifier: Identifier }>({
    mutationFn: async ({ eventId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/alert-events/${eventId}/resolve`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: (_data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.alertEvents(context, identifier) });
    },
  });
};

/** Fetch notification channels */
export const useFetchNotificationChannels = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseExtendedKeys.notificationChannels(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/notification-channels`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/** Create notification channel */
export const useCreateNotificationChannel = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, AnyRecord>({
    mutationFn: async (params) => {
      const uri = `${entry.urlPrefix}/managed-databases/notification-channels`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.notificationChannels(context) });
    },
  });
};

/** Delete notification channel */
export const useDeleteNotificationChannel = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/notification-channels/${id}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.notificationChannels(context) });
    },
  });
};

/** Update notification channel */
export const useUpdateNotificationChannel = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, AnyRecord>({
    mutationFn: async ({ channelId, ...params }) => {
      const uri = `${entry.urlPrefix}/managed-databases/notification-channels/${channelId}`;
      return entry.toastApi.patch<AnyRecord>(uri, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managedDatabaseExtendedKeys.notificationChannels(context) });
    },
  });
};

/** Test notification channel */
export const useTestNotificationChannel = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/notification-channels/${id}/test`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
  });
};

// ─── Billing & Usage ───────────────────────────────────────────

/** Fetch usage records for a database */
export const useFetchDatabaseUsage = (
  identifier: Identifier | null | undefined,
  params: { start?: string; end?: string; dimension?: string } = {},
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseBillingKeys.usage(context, identifier as Identifier, params as AnyRecord),
    queryFn: async () => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/usage${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
};

/** Fetch cost estimate for a database */
export const useFetchDatabaseCostEstimate = (identifier: Identifier | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseBillingKeys.costEstimate(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/cost-estimate`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
};

/** Fetch current month billing */
export const useFetchBillingCurrentMonth = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseBillingKeys.billingCurrentMonth(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/billing/current-month`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/** Fetch billing cost breakdown */
export const useFetchBillingCostBreakdown = (params: { start?: string; end?: string } = {}, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<AnyRecord, Error>({
    queryKey: managedDatabaseBillingKeys.billingCostBreakdown(context, params as AnyRecord),
    queryFn: async () => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
      const uri = `${entry.urlPrefix}/managed-databases/billing/cost-breakdown${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? {};
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

/** Export billing CSV */
export const useExportBillingCsv = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useMutation<void, Error, { start: string; end: string }>({
    mutationFn: async ({ start, end }) => {
      const uri = `${entry.urlPrefix}/managed-databases/billing/export?start=${start}&end=${end}`;
      const response = await entry.silentApi.get<string>(uri);
      const blob = new Blob([response as unknown as string], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usage-records-${start}-to-${end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
};

// ─── Webhooks ──────────────────────────────────────────────────

/** Fetch webhook endpoints */
export const useFetchWebhookEndpoints = (options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<AnyRecord, Error>({
    queryKey: webhookKeys.endpoints(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

/** Create webhook endpoint */
export const useCreateWebhookEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, AnyRecord>({
    mutationFn: async (params) => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks`;
      return entry.toastApi.post<AnyRecord>(uri, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.endpoints(context) });
    },
  });
};

/** Delete webhook endpoint */
export const useDeleteWebhookEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks/${id}`;
      return entry.toastApi.delete<AnyRecord>(uri);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.endpoints(context) });
    },
  });
};

/** Pause webhook */
export const usePauseWebhookEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks/${id}/pause`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.endpoints(context) });
    },
  });
};

/** Resume webhook */
export const useResumeWebhookEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks/${id}/resume`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.endpoints(context) });
    },
  });
};

/** Test webhook */
export const useTestWebhookEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useMutation<AnyRecord, Error, number>({
    mutationFn: async (id) => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks/${id}/test`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
  });
};

/** Fetch webhook deliveries */
export const useFetchWebhookDeliveries = (endpointId: number | null | undefined, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { enabled = true, ...rest } = options;
  return useQuery<AnyRecord, Error>({
    queryKey: webhookKeys.deliveries(context, endpointId as number),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks/${endpointId}/deliveries`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    enabled: Boolean(endpointId) && enabled,
    staleTime: 1000 * 30,
    ...rest,
  });
};

/** Retry a webhook delivery */
export const useRetryWebhookDelivery = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  return useMutation<AnyRecord, Error, { endpointId: number; deliveryId: number }>({
    mutationFn: async ({ endpointId, deliveryId }) => {
      const uri = `${entry.urlPrefix}/managed-databases/webhooks/${endpointId}/deliveries/${deliveryId}/retry`;
      return entry.toastApi.post<AnyRecord>(uri, {});
    },
    onSuccess: (_data, { endpointId }) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.deliveries(context, endpointId) });
    },
  });
};

/** Fetch events */
export const useFetchDatabaseEvents = (databaseId?: number | string, options: QueryOptions = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery<AnyRecord, Error>({
    queryKey: webhookKeys.events(context, databaseId),
    queryFn: async () => {
      const qs = databaseId ? `?database_id=${databaseId}` : "";
      const uri = `${entry.urlPrefix}/managed-databases/events${qs}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return envelope.data ?? [];
    },
    staleTime: 1000 * 30,
    ...options,
  });
};

export default managedDatabaseHooks;
