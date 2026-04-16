/**
 * Serverless DR Hooks — Context-aware hooks for Serverless DR policy management.
 *
 * CRUD via createResourceHooks factory + custom action hooks for:
 * - Activate / Pause
 * - Failover / Failback
 * - DR Drill
 * - Sync history / Failover history
 * - Real-time status
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import type { ServerlessDrPolicy, ServerlessDrStatusResponse } from "@/types/serverlessDr";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Query Keys ─────────────────────────────────────────────────

export const serverlessDrKeys = {
  ...createQueryKeys("serverlessDr"),
  status: (context: string, identifier: string) =>
    ["serverlessDr", "status", context, identifier] as const,
  syncs: (context: string, identifier: string) =>
    ["serverlessDr", "syncs", context, identifier] as const,
  failovers: (context: string, identifier: string) =>
    ["serverlessDr", "failovers", context, identifier] as const,
};

// ─── CRUD Hooks (factory) ───────────────────────────────────────

const sdrHooks = createResourceHooks<ServerlessDrPolicy>({
  resourcePath: "integrations/serverless-dr",
  queryKeyBase: "serverlessDr",
  dataKey: "data",
  updateMethod: "put",
});

export const {
  useFetchList: useFetchServerlessDrPolicies,
  useFetchById: useFetchServerlessDrPolicy,
  useCreate: useCreateServerlessDrPolicy,
  useUpdate: useUpdateServerlessDrPolicy,
  useDelete: useDeleteServerlessDrPolicy,
  queryKeys: serverlessDrQueryKeys,
} = sdrHooks;

// ─── Action Hooks ────────────────────────────────────────────────

export const useActivateServerlessDrPolicy = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/serverless-dr/${identifier}/activate`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: serverlessDrKeys.all }),
  });
};

export const usePauseServerlessDrPolicy = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/serverless-dr/${identifier}/pause`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: serverlessDrKeys.all }),
  });
};

export const useServerlessDrFailover = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/serverless-dr/${identifier}/failover`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: serverlessDrKeys.all }),
  });
};

export const useServerlessDrFailback = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/serverless-dr/${identifier}/failback`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: serverlessDrKeys.all }),
  });
};

export const useServerlessDrDrill = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/serverless-dr/${identifier}/drill`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: serverlessDrKeys.all }),
  });
};

// ─── Status Hook (auto-refresh) ─────────────────────────────────

export const useFetchServerlessDrStatus = (identifier: string) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<ServerlessDrStatusResponse, Error>({
    queryKey: serverlessDrKeys.status(context, identifier),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/serverless-dr/${identifier}/status`;
      const envelope = asEnvelope<ServerlessDrStatusResponse>(
        await entry.silentApi.get<AnyRecord>(uri),
      );
      return envelope.data!;
    },
    refetchInterval: 10_000,
    enabled: !!identifier,
  });
};
