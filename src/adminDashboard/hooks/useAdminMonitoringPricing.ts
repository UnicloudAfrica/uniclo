/**
 * Admin monitoring pricing hooks (B7 frontend).
 *
 * Pairs with the backend `MonitoringPricingController` mounted under
 *   `/admin/v1/monitoring/pricing/*`
 * The admin baseURL `${API_BASE_URL}/admin/v1` is auto-prepended by the
 * shared `silentApi` client — call sites pass paths relative to it.
 *
 * Exposes:
 *  - useMonitoringPricing()                              — list tiers
 *  - useUpdateMonitoringPricing()                        — update a tier's price
 *  - useTenantMonitoringPricing(tenantId)                — list tenant overrides
 *  - useUpsertTenantMonitoringPricing(tenantId)          — set a tenant override for a tier
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";

// ─── Types ────────────────────────────────────────────────────────────

export type MonitoringTier = "standard" | "professional" | "enterprise";

export interface MonitoringPricingRow {
  tier: MonitoringTier;
  price_per_host_usd: number;
  retention_days: number;
  features: string[];
}

export interface TenantMonitoringPricingRow {
  tier: MonitoringTier;
  price_per_host_usd: number;
  is_override: true;
}

export interface UpdateMonitoringPricingPayload {
  tier: MonitoringTier;
  price_per_host_usd: number;
}

export interface UpsertTenantMonitoringPricingPayload {
  tier: MonitoringTier;
  price_per_host_usd: number;
}

// ─── Query key factory ────────────────────────────────────────────────

export const monitoringPricingKeys = {
  all: ["admin", "monitoring-pricing"] as const,
  list: () => [...monitoringPricingKeys.all, "list"] as const,
  tenant: (tenantId: string) =>
    [...monitoringPricingKeys.all, "tenant", tenantId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────

/**
 * List the three monitoring tier prices (admin default).
 * Written by the backend `MonitoringPricingController@index`.
 */
export function useMonitoringPricing() {
  return useQuery<MonitoringPricingRow[]>({
    queryKey: monitoringPricingKeys.list(),
    queryFn: async () => {
      const r = await silentApi<{ data: MonitoringPricingRow[] }>(
        "GET",
        "/monitoring/pricing",
      );
      return r?.data ?? [];
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Update the admin default price for a single tier.
 * Written by the backend `MonitoringPricingController@update`.
 */
export function useUpdateMonitoringPricing() {
  const queryClient = useQueryClient();
  return useMutation<MonitoringPricingRow, Error, UpdateMonitoringPricingPayload>({
    mutationFn: async ({ tier, price_per_host_usd }) => {
      const r = await silentApi<{ data: MonitoringPricingRow }>(
        "PATCH",
        `/monitoring/pricing/${tier}`,
        { price_per_host_usd },
      );
      if (!r?.data) throw new Error("Failed to update tier price.");
      return r.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringPricingKeys.list() });
    },
  });
}

/**
 * List a tenant's tier-level price overrides.
 * Written by the backend `MonitoringPricingController@tenantIndex`.
 */
export function useTenantMonitoringPricing(tenantId: string | undefined) {
  return useQuery<TenantMonitoringPricingRow[]>({
    queryKey: tenantId
      ? monitoringPricingKeys.tenant(tenantId)
      : [...monitoringPricingKeys.all, "tenant-pending"],
    queryFn: async () => {
      const r = await silentApi<{ data: TenantMonitoringPricingRow[] }>(
        "GET",
        `/monitoring/pricing/tenants/${tenantId}`,
      );
      return r?.data ?? [];
    },
    enabled: !!tenantId,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Upsert a tenant-specific tier price override.
 * Written by the backend `MonitoringPricingController@tenantUpsert`.
 */
export function useUpsertTenantMonitoringPricing(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation<
    TenantMonitoringPricingRow,
    Error,
    UpsertTenantMonitoringPricingPayload
  >({
    mutationFn: async ({ tier, price_per_host_usd }) => {
      if (!tenantId) throw new Error("Missing tenant id.");
      const r = await silentApi<{ data: TenantMonitoringPricingRow }>(
        "PUT",
        `/monitoring/pricing/tenants/${tenantId}/${tier}`,
        { price_per_host_usd },
      );
      if (!r?.data) throw new Error("Failed to save tenant override.");
      return r.data;
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({
          queryKey: monitoringPricingKeys.tenant(tenantId),
        });
      }
    },
  });
}
