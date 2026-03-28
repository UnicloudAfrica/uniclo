/**
 * Infrastructure Agent Hooks — Context-aware hooks for agent rule and decision management.
 *
 * CRUD for rules + decision approval/rejection + metrics.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Query Keys ─────────────────────────────────────────────────

export const agentKeys = {
  ...createQueryKeys("agentRules"),
  decisions: (context: string) => ["agentDecisions", context] as const,
  decision: (context: string, id: string) => ["agentDecisions", context, id] as const,
  metrics: (context: string) => ["agentMetrics", context] as const,
};

// ─── Rules CRUD Hooks ───────────────────────────────────────────

const ruleHooks = createResourceHooks<AnyRecord>({
  resourcePath: "integrations/agent/rules",
  queryKeyBase: "agentRules",
  dataKey: "data",
});

export const {
  useFetchList: useFetchAgentRules,
  useFetchById: useFetchAgentRule,
  useCreate: useCreateAgentRule,
  useUpdate: useUpdateAgentRule,
  useDelete: useDeleteAgentRule,
  queryKeys: agentRuleQueryKeys,
} = ruleHooks;

// ─── Rule Actions ───────────────────────────────────────────────

export const useToggleAgentRule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/agent/rules/${identifier}/toggle`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agentRules"] }),
  });
};

export const useTestAgentRule = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/agent/rules/${identifier}/test`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

// ─── Decisions ──────────────────────────────────────────────────

export const useFetchAgentDecisions = (params?: AnyRecord) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: agentKeys.decisions(context),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) searchParams.set(k, String(v));
        });
      }
      const qs = searchParams.toString();
      const uri = `${entry.urlPrefix}/integrations/agent/decisions${qs ? `?${qs}` : ""}`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};

export const useApproveAgentDecision = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string }>({
    mutationFn: async ({ identifier }) => {
      const uri = `${entry.urlPrefix}/integrations/agent/decisions/${identifier}/approve`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.decisions(context) }),
  });
};

export const useRejectAgentDecision = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, { identifier: string; reason?: string }>({
    mutationFn: async ({ identifier, reason }) => {
      const uri = `${entry.urlPrefix}/integrations/agent/decisions/${identifier}/reject`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri, { reason }));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: agentKeys.decisions(context) }),
  });
};

// ─── Evaluate Now ───────────────────────────────────────────────

export const useEvaluateAgentRules = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<AnyRecord, Error, void>({
    mutationFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/agent/evaluate`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agentRules"] });
      qc.invalidateQueries({ queryKey: ["agentDecisions"] });
    },
  });
};

// ─── Metrics ────────────────────────────────────────────────────

export const useFetchAgentMetrics = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord, Error>({
    queryKey: agentKeys.metrics(context),
    queryFn: async () => {
      const uri = `${entry.urlPrefix}/integrations/agent/metrics`;
      const envelope = asEnvelope(await entry.silentApi.get<AnyRecord>(uri));
      return (envelope.data ?? {}) as AnyRecord;
    },
    refetchInterval: 30_000,
  });
};
