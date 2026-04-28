/**
 * replicationPricingHooks — React Query hooks for the tier-aware
 * replication pricing endpoint.
 *
 * Wraps UniCloud's proxy route
 *   GET /v1/integrations/anycloudflow/pricing/replication?mode={mode}
 *
 * which forwards to AnyCloudFlow's canonical pricing endpoint and returns
 * a rate table keyed by billing tier (rsync, zfs_native, zfs_raw).
 *
 * Typical UI surfaces:
 *  - Replication creation wizard: cost preview that updates when the
 *    tenant toggles between rsync and ZFS.
 *  - Admin replication list: tooltip showing the per-tier rate on hover
 *    over the billing-tier chip.
 *  - Admin partner payout review: cross-check that recorded ledger
 *    entries used the correct tier.
 */
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ReplicationBillingTier } from "@/lib/replicationBillingTier";

export type ReplicationPricingMode = "active_passive" | "bidirectional";

export interface ReplicationRate {
  per_vm_month_cents: number;
}

export interface ReplicationPricingResponse {
  mode: ReplicationPricingMode;
  currency: string;
  rates: Record<ReplicationBillingTier, ReplicationRate>;
  /** When upstream is unreachable the proxy may flag this. */
  stale?: boolean;
  last_updated_at?: string;
}

type AnyRecord = Record<string, unknown>;

const PRICING_KEY = (mode: ReplicationPricingMode) =>
  ["acf-replication-pricing", mode] as const;

/**
 * Fetch the tier-aware replication rate table.
 *
 * Cached for 60 seconds — pricing changes are rare but we don't want to
 * hammer upstream on every keystroke in the wizard. Refetches on window
 * focus so the admin payout view always shows the freshest figures.
 */
export function useReplicationPricing(
  mode: ReplicationPricingMode = "active_passive",
  options: { enabled?: boolean } = {},
) {
  return useQuery<ReplicationPricingResponse, Error>({
    queryKey: PRICING_KEY(mode),
    queryFn: async () => {
      const res = (await api.get<AnyRecord>(
        `/v1/integrations/anycloudflow/pricing/replication?mode=${encodeURIComponent(mode)}`,
      )) as AnyRecord;

      // The proxy controller forwards the upstream payload verbatim. In
      // the happy path the top-level response IS the rate table; in the
      // wrapped-envelope path it sits under `data`.
      const payload =
        (res && typeof res === "object" && "rates" in res
          ? res
          : ((res as { data?: unknown })?.data ?? res)) as ReplicationPricingResponse;

      if (!payload || typeof payload !== "object" || !("rates" in payload)) {
        throw new Error(
          "Replication pricing endpoint returned an unexpected shape",
        );
      }

      return payload;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
    enabled: options.enabled ?? true,
  });
}

/**
 * Helper: pick the per-VM/month cents rate for a given tier, with a safe
 * fallback to the rsync rate if the requested tier is somehow missing
 * from the response.
 *
 * NOTE: the server-side billing job should NEVER silently fall back to
 * the rsync rate for a ZFS operation (that's the exact revenue-leak we're
 * fixing). This fallback is a *UI-only* guard so the cost preview doesn't
 * render blank if the response is partial. The server pipeline has its
 * own hard-failure path.
 */
export function pickTierCents(
  pricing: ReplicationPricingResponse | undefined,
  tier: ReplicationBillingTier,
): number | undefined {
  if (!pricing) return undefined;
  return (
    pricing.rates[tier]?.per_vm_month_cents ??
    pricing.rates.rsync?.per_vm_month_cents
  );
}
