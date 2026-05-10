/**
 * Orbit / VM Endpoint hooks — FR-043.
 *
 * Context-aware (admin / tenant / client) React Query hooks for the
 * tenant-API source-VM surface. Mirrors the agentHooks.ts pattern.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../../api/apiRegistry";
import type {
  VmEndpoint,
  VmConnectionTestResult,
  VmScanStatus,
  VmAssessment,
  VmSourceType,
} from "@/shared/types/orbit/vmEndpoint";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Query keys (stable, hierarchical so partial invalidation works) ─────────

export const orbitVmKeys = {
  /** Whole subsystem — invalidate to refresh everything VM-related. */
  all: (context: string) => ["orbit", "vms", context] as const,
  list: (context: string, params?: AnyRecord) =>
    ["orbit", "vms", context, "list", params ?? {}] as const,
  detail: (context: string, id: string) =>
    ["orbit", "vms", context, "detail", id] as const,
  scanStatus: (context: string, id: string) =>
    ["orbit", "vms", context, "scan", id] as const,
  assessment: (context: string, id: string) =>
    ["orbit", "vms", context, "assessment", id] as const,
};

// ─── List ────────────────────────────────────────────────────────────────────

export const useFetchVmEndpoints = (params?: {
  page?: number;
  per_page?: number;
  source_type?: VmSourceType;
  tag?: string;
  q?: string;
}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<{ data: VmEndpoint[]; meta?: AnyRecord }, Error>({
    queryKey: orbitVmKeys.list(context, params),
    queryFn: async () => {
      const qs = params
        ? "?" +
          new URLSearchParams(
            Object.entries(params).filter(([, v]) => v != null) as [string, string][],
          ).toString()
        : "";
      const envelope = asEnvelope<{ data: VmEndpoint[]; meta?: AnyRecord }>(
        await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/integrations/orbit/vms${qs}`),
      );
      return envelope.data ?? { data: [] };
    },
    staleTime: 30_000,
  });
};

// ─── Detail ──────────────────────────────────────────────────────────────────

export const useFetchVmEndpoint = (identifier: string | undefined) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<VmEndpoint | null, Error>({
    queryKey: orbitVmKeys.detail(context, identifier ?? ""),
    enabled: Boolean(identifier),
    queryFn: async () => {
      const envelope = asEnvelope<VmEndpoint>(
        await entry.silentApi.get<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms/${encodeURIComponent(identifier!)}`,
        ),
      );
      return envelope.data ?? null;
    },
  });
};

// ─── Create / update / delete ────────────────────────────────────────────────

export interface CreateVmEndpointInput {
  name: string;
  host: string;
  port?: number;
  source_type: VmSourceType;
  credential_ref: string;
  tags?: string[];
}

export const useCreateVmEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<VmEndpoint, Error, CreateVmEndpointInput>({
    mutationFn: async (payload) => {
      const envelope = asEnvelope<VmEndpoint>(
        await entry.toastApi.post<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms`,
          payload as unknown as Record<string, unknown>,
        ),
      );
      return envelope.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orbitVmKeys.all(context) });
    },
  });
};

export const useUpdateVmEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<
    VmEndpoint,
    Error,
    { identifier: string; payload: Partial<CreateVmEndpointInput> }
  >({
    mutationFn: async ({ identifier, payload }) => {
      const envelope = asEnvelope<VmEndpoint>(
        await entry.toastApi.put<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms/${encodeURIComponent(identifier)}`,
          payload as unknown as Record<string, unknown>,
        ),
      );
      return envelope.data!;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: orbitVmKeys.detail(context, vars.identifier) });
      qc.invalidateQueries({ queryKey: orbitVmKeys.all(context) });
    },
  });
};

export const useDeleteVmEndpoint = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<{ deleted: true }, Error, string>({
    mutationFn: async (identifier) => {
      const envelope = asEnvelope<{ deleted: true }>(
        await entry.toastApi.delete<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms/${encodeURIComponent(identifier)}`,
        ),
      );
      return envelope.data ?? { deleted: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orbitVmKeys.all(context) });
    },
  });
};

// ─── Connection test (pre-save) ──────────────────────────────────────────────

export interface TestConnectionInput {
  host: string;
  port?: number;
  credential_ref: string;
  source_type?: VmSourceType;
}

export const useTestVmConnection = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<VmConnectionTestResult, Error, TestConnectionInput>({
    mutationFn: async (payload) => {
      const envelope = asEnvelope<VmConnectionTestResult>(
        await entry.toastApi.post<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms/test-connection`,
          payload as unknown as Record<string, unknown>,
        ),
      );
      return envelope.data!;
    },
  });
};

// ─── Discovery scan ──────────────────────────────────────────────────────────

export const useStartVmScan = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<
    AnyRecord,
    Error,
    { endpoint_ids: string[]; scan_type?: "quick" | "deep" | "full" }
  >({
    mutationFn: async (payload) => {
      const envelope = asEnvelope(
        await entry.toastApi.post<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms/scan`,
          payload as unknown as Record<string, unknown>,
        ),
      );
      return envelope.data ?? {};
    },
    onSuccess: (_data, vars) => {
      // Invalidate scan-status for every endpoint we just kicked off
      vars.endpoint_ids.forEach((id) =>
        qc.invalidateQueries({ queryKey: orbitVmKeys.scanStatus(context, id) }),
      );
    },
  });
};

/**
 * Poll scan status. Refetches every 3 seconds while the scan is running;
 * stops polling once state is "succeeded" or "failed".
 */
export const useFetchVmScanStatus = (identifier: string | undefined) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<VmScanStatus | null, Error>({
    queryKey: orbitVmKeys.scanStatus(context, identifier ?? ""),
    enabled: Boolean(identifier),
    refetchInterval: (query) => {
      const data = query.state.data as VmScanStatus | null | undefined;
      if (!data) return 3000;
      return data.state === "queued" || data.state === "running" ? 3000 : false;
    },
    queryFn: async () => {
      const envelope = asEnvelope<VmScanStatus>(
        await entry.silentApi.get<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms/${encodeURIComponent(identifier!)}/status`,
        ),
      );
      return envelope.data ?? null;
    },
  });
};

// ─── Pre-migration assessment ────────────────────────────────────────────────

export const useFetchVmAssessment = (identifier: string | undefined) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<VmAssessment | null, Error>({
    queryKey: orbitVmKeys.assessment(context, identifier ?? ""),
    enabled: Boolean(identifier),
    queryFn: async () => {
      const envelope = asEnvelope<VmAssessment>(
        await entry.silentApi.get<AnyRecord>(
          `${entry.urlPrefix}/integrations/orbit/vms/${encodeURIComponent(identifier!)}/assessment`,
        ),
      );
      return envelope.data ?? null;
    },
    // Assessments are mildly expensive on AcF; cache 60s
    staleTime: 60_000,
  });
};
