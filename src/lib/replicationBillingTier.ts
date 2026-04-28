/**
 * replicationBillingTier — UI helpers for the ZFS-aware billing tier chip.
 *
 * UniCloud now tiers replication billing by the underlying transport that
 * AnyCloudFlow negotiated for each ReplicationPair:
 *
 *   - rsync       → file-level sync. Baseline rate, no chip shown.
 *   - zfs_native  → ZFS send/recv. Premium tier, blue chip.
 *   - zfs_raw     → ZFS send --raw (encrypted datasets). Highest tier, purple chip.
 *
 * Until this module shipped, UniCloud billed every replication at the
 * rsync rate regardless of transport, which was silently leaking revenue
 * on every ZFS customer. The chip is the visible confirmation that a pair
 * is being billed at the correct tier — useful in the admin replication
 * list and as a last-line sanity check before approving partner payouts.
 */

export type ReplicationBillingTier = "rsync" | "zfs_native" | "zfs_raw";

/**
 * Map a raw AnyCloudFlow TransferMethod string to its billing tier.
 *
 * Mirrors the server-side ReplicationPair::deriveBillingTier() so UI
 * rendering stays consistent even when the API returns only the raw
 * transport (older pair records, before the billing_tier column was
 * backfilled).
 */
export function deriveBillingTier(
  transferMethod?: string | null,
): ReplicationBillingTier {
  switch (transferMethod) {
    case "zfs_native_raw":
      return "zfs_raw";
    case "zfs_native":
    case "zfs_native_compressed":
      return "zfs_native";
    default:
      // Everything unknown or rsync-family (block_dd, block_diff_*, robocopy)
      // defaults to the rsync rate. ZFS must be explicitly signalled.
      return "rsync";
  }
}

export interface BillingTierChip {
  label: string;
  tone: string;
  title: string;
}

/**
 * Presentation metadata for the tier chip.
 *
 * Returns `null` for rsync so callers can `chip ?? null` and render
 * nothing — the baseline tier deliberately has no badge so the ZFS
 * indicators remain noticeable.
 */
export function billingTierChip(
  tier: ReplicationBillingTier,
): BillingTierChip | null {
  switch (tier) {
    case "zfs_native":
      return {
        label: "ZFS",
        tone: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        title:
          "ZFS native replication (zfs send/recv) — billed at the ZFS tier.",
      };
    case "zfs_raw":
      return {
        label: "ZFS Raw",
        tone: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        title:
          "ZFS raw replication (zfs send --raw, encrypted datasets) — billed at the ZFS raw tier.",
      };
    case "rsync":
    default:
      return null;
  }
}

/**
 * Convenience: given either an explicit tier or a raw transport string,
 * return the chip metadata. Prefer the explicit tier when both are present.
 */
export function resolveBillingTierChip(params: {
  billing_tier?: ReplicationBillingTier | string | null;
  replication_transport?: string | null;
}): BillingTierChip | null {
  const tier =
    (params.billing_tier as ReplicationBillingTier | undefined) ??
    deriveBillingTier(params.replication_transport);
  return billingTierChip(tier);
}

/**
 * Format a per-VM/month cents price into a display string.
 *
 * Intentionally currency-agnostic: accepts the currency code from the
 * pricing endpoint payload so tenants see NGN or USD without us hardcoding
 * the symbol. Falls back to the ISO code if no symbol is known.
 */
export function formatPerVmMonthPrice(
  cents: number,
  currency: string = "NGN",
): string {
  const value = cents / 100;
  const symbol =
    currency === "NGN"
      ? "\u20A6" // ₦
      : currency === "USD"
        ? "$"
        : `${currency} `;
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}/VM/mo`;
}
