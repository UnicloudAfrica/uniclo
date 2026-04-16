import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;
const asEnvelope = <T = AnyRecord>(res: unknown): { success?: boolean; data?: T } & AnyRecord =>
  (res ?? {}) as { success?: boolean; data?: T } & AnyRecord;

export interface AcfService {
  service_type: string;
  name: string;
  description: string;
  billing_model: "one_time" | "monthly_flat";
  unit_label: string;
  unit_price: number;
  pricing_tiers: { min_units: number; max_units: number | null; price_usd: number; label: string }[] | null;
  is_one_time: boolean;
  is_recurring: boolean;
}

export interface CalculatorItem {
  service_type: string;
  quantity?: number;
  data_gb?: number;
  months?: number;
}

export interface CalculatorLine {
  service_type: string;
  name: string;
  billing_model: string;
  unit_price: number;
  quantity: number;
  data_gb: number;
  months: number;
  frequency: string;
  monthly_cost: number;
  line_total: number;
  breakdown: string;
  tier_applied: string | null;
}

export interface CalculatorResult {
  lines: CalculatorLine[];
  summary: {
    one_time_total: number;
    monthly_recurring: number;
    total_for_period: number;
    tax: number;
    grand_total: number;
    currency: string;
    vat_rate: number;
  };
}

export interface QuotaStatus {
  [serviceType: string]: {
    quota_key: string;
    used: number;
    limit: number;
    available: number;
    percentage_used: number;
    fast_tracked: boolean;
    fast_track_expires_at: string | null;
  };
}

export const useFetchAcfServices = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery({
    queryKey: ["acf-services", context],
    queryFn: async () => {
      const res = asEnvelope<AcfService[]>(await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/anycloudflow/calculator/services`));
      return (res.data ?? []) as AcfService[];
    },
    staleTime: 60_000 * 5,
  });
};

export const useCalculateMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useMutation({
    mutationFn: async (payload: { items: CalculatorItem[]; tenant_id?: string; country_code?: string }) => {
      const res = asEnvelope<CalculatorResult>(await entry.silentApi.post<AnyRecord>(`${entry.urlPrefix}/anycloudflow/calculator/estimate`, payload));
      return (res.data ?? res) as CalculatorResult;
    },
  });
};

export const useFetchAcfQuotas = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  return useQuery({
    queryKey: ["acf-quotas", context],
    queryFn: async () => {
      const res = asEnvelope<QuotaStatus>(await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/anycloudflow/quotas`));
      return (res.data ?? {}) as QuotaStatus;
    },
    staleTime: 30_000,
  });
};

export const useUpgradeAcfQuota = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ serviceType, newLimit }: { serviceType: string; newLimit: number }) => {
      const res = asEnvelope(await entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/anycloudflow/quotas/${serviceType}/upgrade`, { new_limit: newLimit }));
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acf-quotas"] }),
  });
};
