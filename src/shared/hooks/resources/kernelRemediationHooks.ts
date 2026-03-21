/**
 * Kernel Remediation Hooks — Context-aware hooks for kernel upgrade/downgrade operations.
 *
 * Integrates with the unicloud integration API which proxies to AnyCloudFlow.
 * Supports planning, approval, polling, cancellation, and rollback.
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import type {
  KernelRemediationRef,
  KernelRemediationDetail,
  KernelRemediationStatus,
} from "@/types/kernelRemediation";
import { isActiveStatus } from "@/types/kernelRemediation";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

const QUERY_KEY = "kernel-remediations";

// ─── List Remediations ────────────────────────────────────────

export function useKernelRemediations(filters?: {
  status?: KernelRemediationStatus;
  endpoint_id?: number;
}) {
  const { apiClient, contextPath } = useApiContext();
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.endpoint_id)
    params.set("endpoint_id", String(filters.endpoint_id));

  const path = `${contextPath}/integrations/kernel-remediation?${params}`;

  return useQuery({
    queryKey: [QUERY_KEY, "list", filters],
    queryFn: () => apiClient.get(path).then((r) => r.data?.data ?? []),
  });
}

// ─── Single Remediation (with optional polling) ───────────────

export function useKernelRemediation(id: number | null, poll = false) {
  const { apiClient, contextPath } = useApiContext();
  const path = `${contextPath}/integrations/kernel-remediation/${id}`;

  return useQuery({
    queryKey: [QUERY_KEY, "detail", id],
    queryFn: () => apiClient.get(path).then((r) => r.data?.data ?? null),
    enabled: !!id,
    refetchInterval: poll ? 3000 : false,
  });
}

// ─── Plan ─────────────────────────────────────────────────────

export function usePlanKernelRemediation() {
  const { apiClient, contextPath } = useApiContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      endpoint_id: number;
      target_kernel: string;
    }) =>
      apiClient
        .post(`${contextPath}/integrations/kernel-remediation/plan`, payload)
        .then((r) => asEnvelope<KernelRemediationDetail>(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ─── Approve ──────────────────────────────────────────────────

export function useApproveKernelRemediation() {
  const { apiClient, contextPath } = useApiContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient
        .post(`${contextPath}/integrations/kernel-remediation/${id}/approve`)
        .then((r) => asEnvelope<KernelRemediationDetail>(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ─── Cancel ───────────────────────────────────────────────────

export function useCancelKernelRemediation() {
  const { apiClient, contextPath } = useApiContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient
        .post(`${contextPath}/integrations/kernel-remediation/${id}/cancel`)
        .then((r) => asEnvelope(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ─── Rollback ─────────────────────────────────────────────────

export function useRollbackKernelRemediation() {
  const { apiClient, contextPath } = useApiContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: number; reason?: string }) =>
      apiClient
        .post(
          `${contextPath}/integrations/kernel-remediation/${params.id}/rollback`,
          { reason: params.reason },
        )
        .then((r) => asEnvelope<KernelRemediationDetail>(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
