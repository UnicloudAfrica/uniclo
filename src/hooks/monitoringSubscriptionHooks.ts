import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T } & AnyRecord =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T } & AnyRecord;

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface MonitoringTier {
  service_type: string;
  name: string;
  description: string;
  price_per_host: number;
  pricing_tiers?: { min_units: number; max_units: number | null; price_usd: number; label: string }[];
  features: string[];
}

export interface MonitoringSubscription {
  id: string;
  identifier: string;
  service_type: string;
  status: string;
  monthly_cost: number;
  next_billing_date: string | null;
}

export interface MonitoringStatus {
  tier: string;
  subscription: MonitoringSubscription | null;
  max_hosts: number;
  used_hosts: number;
  available_hosts: number;
  assigned_instance_ids?: number[];
  monthly_cost?: number;
  message?: string;
}

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useFetchMonitoringStatus = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["monitoring-status", context],
    queryFn: async () => {
      const res = asEnvelope<MonitoringStatus>(
        await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/monitoring/status`)
      );
      return res as unknown as MonitoringStatus;
    },
    staleTime: 30_000,
  });
};

export const useFetchMonitoringTiers = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["monitoring-tiers", context],
    queryFn: async () => {
      const res = asEnvelope<{ tiers: MonitoringTier[] }>(
        await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/monitoring/tiers`)
      );
      return (res as AnyRecord).tiers as MonitoringTier[] ?? [];
    },
    staleTime: 60_000 * 5,
  });
};

export const useSubscribeMonitoring = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { service_type: string; max_hosts?: number }) => {
      const res = await entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/monitoring/subscribe`, payload);
      return asEnvelope(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitoring-status"] });
    },
  });
};

export const useUpgradeMonitoring = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { service_type: string; max_hosts?: number }) => {
      const res = await entry.toastApi.patch<AnyRecord>(`${entry.urlPrefix}/monitoring/upgrade`, payload);
      return asEnvelope(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitoring-status"] });
    },
  });
};

export const useCancelMonitoring = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await entry.toastApi.delete<AnyRecord>(`${entry.urlPrefix}/monitoring/cancel`);
      return asEnvelope(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitoring-status"] });
    },
  });
};

export const useFetchMonitoringHosts = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["monitoring-hosts", context],
    queryFn: async () => {
      const res = asEnvelope<{ hosts: AnyRecord[]; total: number }>(
        await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/monitoring/hosts`)
      );
      return res as AnyRecord;
    },
    staleTime: 30_000,
  });
};

export const useAssignMonitoringHost = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: number) => {
      const res = await entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/monitoring/hosts/${instanceId}/assign`);
      return asEnvelope(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitoring-status"] });
      qc.invalidateQueries({ queryKey: ["monitoring-hosts"] });
    },
  });
};

export const useUnassignMonitoringHost = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (instanceId: number) => {
      const res = await entry.toastApi.delete<AnyRecord>(`${entry.urlPrefix}/monitoring/hosts/${instanceId}/unassign`);
      return asEnvelope(res);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitoring-status"] });
      qc.invalidateQueries({ queryKey: ["monitoring-hosts"] });
    },
  });
};
