import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;
const asEnvelope = <T = AnyRecord>(res: unknown): { success?: boolean; data?: T } & AnyRecord =>
  (res ?? {}) as { success?: boolean; data?: T } & AnyRecord;

export type AcfServiceCategory =
  | "subscription"
  | "migration"
  | "replication"
  | "backup"
  | "bucket"
  | "other";

export interface AcfService {
  service_type: string;
  name: string;
  description: string;
  billing_model: "one_time" | "monthly_flat";
  unit_label: string;
  unit_price: number;
  /**
   * Currency of `unit_price` as resolved by the backend for the
   * caller's country. Defaults to "NGN" if absent — older API
   * responses pre-dating the rebranding patch don't include it.
   */
  currency?: string;
  /** Friendly group key — UI uses this to bucket cards. */
  category?: AcfServiceCategory;
  /** Plain-English label rendered on cards (e.g. "Move a server"). */
  friendly_name?: string;
  /** Plain-English one-line description for the card body. */
  friendly_description?: string;
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

export const useFetchAcfServices = (params: { tenantId?: string; countryCode?: string } = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { tenantId, countryCode } = params;
  return useQuery({
    queryKey: ["acf-services", context, tenantId ?? "self", countryCode ?? "default"],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (tenantId) search.set("tenant_id", tenantId);
      if (countryCode) search.set("country_code", countryCode);
      const qs = search.toString() ? `?${search.toString()}` : "";
      const res = asEnvelope<AcfService[]>(
        await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/anycloudflow/calculator/services${qs}`),
      );
      return (res.data ?? []) as AcfService[];
    },
    staleTime: 60_000 * 5,
  });
};

export const useCalculateMigration = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  // Use `toastApi` here (not `silentApi`): if the estimate call fails
  // we MUST surface the error. Silent failures on the calculate flow
  // make the "Show me the total" button look broken — historically a
  // backend `pricing_tiers` shape mismatch produced a 500 that the
  // user never saw, leaving them guessing what went wrong.
  return useMutation({
    mutationFn: async (payload: { items: CalculatorItem[]; tenant_id?: string; country_code?: string }) => {
      const res = asEnvelope<CalculatorResult>(await entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/anycloudflow/calculator/estimate`, payload));
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
