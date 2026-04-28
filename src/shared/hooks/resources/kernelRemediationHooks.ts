/**
 * Kernel Remediation Hooks — Context-aware hooks for kernel upgrade/downgrade operations.
 *
 * Integrates with the unicloud integration API which proxies to AnyCloudFlow.
 * Supports planning, approval, polling, cancellation, and rollback.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import type {
  KernelRemediationDetail,
  KernelRemediationStatus,
} from "@/types/kernelRemediation";

type AnyRecord = Record<string, unknown>;

interface Envelope<T = AnyRecord> {
  success?: boolean;
  message?: string;
  data?: T;
}

const asEnvelope = <T = AnyRecord>(res: unknown): Envelope<T> =>
  (res ?? {}) as Envelope<T>;

const QUERY_KEY = "kernel-remediations";

const useResolvedApi = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return {
    silentApi: entry.silentApi,
    toastApi: entry.toastApi,
    contextPath: entry.urlPrefix,
  };
};

// ─── List Remediations ────────────────────────────────────────

export function useKernelRemediations(filters?: {
  status?: KernelRemediationStatus;
  endpoint_id?: number;
}) {
  const { silentApi, contextPath } = useResolvedApi();
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.endpoint_id) params.set("endpoint_id", String(filters.endpoint_id));

  const path = `${contextPath}/integrations/kernel-remediation?${params}`;

  return useQuery({
    queryKey: [QUERY_KEY, "list", filters],
    queryFn: () =>
      silentApi.get<Envelope<unknown[]>>(path).then((r) => r.data ?? []),
  });
}

// ─── Single Remediation (with optional polling) ───────────────

export function useKernelRemediation(id: number | null, poll = false) {
  const { silentApi, contextPath } = useResolvedApi();
  const path = `${contextPath}/integrations/kernel-remediation/${id}`;

  return useQuery({
    queryKey: [QUERY_KEY, "detail", id],
    queryFn: () =>
      silentApi
        .get<Envelope<KernelRemediationDetail | null>>(path)
        .then((r) => r.data ?? null),
    enabled: !!id,
    refetchInterval: poll ? 3000 : false,
  });
}

// ─── Plan ─────────────────────────────────────────────────────

export function usePlanKernelRemediation() {
  const { toastApi, contextPath } = useResolvedApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { endpoint_id: number; target_kernel: string }) =>
      toastApi
        .post<Envelope<KernelRemediationDetail>>(
          `${contextPath}/integrations/kernel-remediation/plan`,
          payload as unknown as AnyRecord
        )
        .then((r) => asEnvelope<KernelRemediationDetail>(r)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ─── Approve ──────────────────────────────────────────────────

export function useApproveKernelRemediation() {
  const { toastApi, contextPath } = useResolvedApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      toastApi
        .post<Envelope<KernelRemediationDetail>>(
          `${contextPath}/integrations/kernel-remediation/${id}/approve`
        )
        .then((r) => asEnvelope<KernelRemediationDetail>(r)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ─── Cancel ───────────────────────────────────────────────────

export function useCancelKernelRemediation() {
  const { toastApi, contextPath } = useResolvedApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      toastApi
        .post<Envelope>(`${contextPath}/integrations/kernel-remediation/${id}/cancel`)
        .then((r) => asEnvelope(r)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ─── Rollback ─────────────────────────────────────────────────

export function useRollbackKernelRemediation() {
  const { toastApi, contextPath } = useResolvedApi();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: number; reason?: string }) =>
      toastApi
        .post<Envelope<KernelRemediationDetail>>(
          `${contextPath}/integrations/kernel-remediation/${params.id}/rollback`,
          { reason: params.reason }
        )
        .then((r) => asEnvelope<KernelRemediationDetail>(r)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
