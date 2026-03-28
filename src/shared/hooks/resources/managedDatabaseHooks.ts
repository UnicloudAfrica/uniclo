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
} from "@/types/managedDatabase";

type AnyRecord = Record<string, any>;
type Identifier = string | number;
type QueryOptions = Partial<Omit<UseQueryOptions<any, Error>, "queryKey" | "queryFn">>;

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

  return useQuery<ManagedDatabaseBackup[], Error>({
    queryKey: managedDatabaseExtendedKeys.backups(context, identifier as Identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backups`;
      const envelope = asEnvelope<{ data: ManagedDatabaseBackup[] }>(
        await entry.silentApi.get<AnyRecord>(uri)
      );
      return envelope.data?.data ?? (envelope.data as unknown as ManagedDatabaseBackup[]) ?? [];
    },
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
};

/** Create a manual backup */
export const useCreateDatabaseBackup = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: Identifier }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/managed-databases/${identifier}/backups`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
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

export default managedDatabaseHooks;
