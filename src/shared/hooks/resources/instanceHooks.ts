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

type AnyRecord = Record<string, any>;
type Identifier = string | number;
type QueryOptions = Partial<Omit<UseQueryOptions<any, Error>, "queryKey" | "queryFn">>;

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
    ["instance-management", context, identifier] as const,
  lifecycle: (context: string, identifier: Identifier) =>
    ["instance-lifecycle", context, identifier] as const,
  usageStats: (context: string, identifier: Identifier, period: string) =>
    ["instance-usage", context, identifier, period] as const,
  logs: (context: string, identifier: Identifier, params: AnyRecord) =>
    ["instance-logs", context, identifier, params] as const,
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
      const uri = `${entry.urlPrefix}/instance-management/${identifier}`;
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
    }: {
      identifier: Identifier;
      action: string;
      params?: AnyRecord;
      confirmed?: boolean;
    }) => {
      if (!identifier || !action) {
        throw new Error("Instance identifier and action are required.");
      }
      const uri = `${entry.urlPrefix}/instance-management/${identifier}/actions`;
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(uri, {
          action,
          params,
          ...(confirmed ? { confirmed: true } : {}),
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
      const uri = `${entry.urlPrefix}/instance-management/${identifier}/refresh-status`;
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

/** Fetch instance usage stats — admin only (stub) */
export const useInstanceUsageStats = (
  identifier: Identifier | null | undefined,
  period: string = "24h",
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.usageStats(context, identifier as Identifier, period),
    queryFn: async () => null,
    enabled: Boolean(identifier) && enabled,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...rest,
  });
};

/** Fetch instance logs — admin only (stub) */
export const useInstanceLogs = (
  identifier: Identifier | null | undefined,
  params: { lines?: number; since?: string } = {},
  options: QueryOptions = {}
) => {
  const { context } = useApiContext();
  const { enabled = true, ...rest } = options;

  return useQuery({
    queryKey: instanceExtendedKeys.logs(context, identifier as Identifier, params),
    queryFn: async () => ({
      lines: [],
      last_updated: null,
    }),
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

// ─── Client-Only Hooks ───────────────────────────────────────────

/** Get instance details (via instance-management) — client */
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
      const uri = `${entry.urlPrefix}/instance-management/${identifier}`;
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
      const uri = `${entry.urlPrefix}/instance-management/${identifier}/actions`;
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
