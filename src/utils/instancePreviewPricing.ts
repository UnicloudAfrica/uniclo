import { AdditionalVolume, Configuration } from "../types/InstanceConfiguration";
import { evaluateConfigurationCompleteness } from "./instanceCreationUtils";

/*
 * Pre-order pricing estimate for the instance wizard.
 *
 * POST /instances/preview-pricing quotes a configured order with the same
 * engine the create endpoint bills with (QuotePricingService), so the
 * client / tenant wizards can show customers a price while they are still
 * configuring — before any order exists. The estimate then rides on the
 * create payload as `expected_total` so the backend 409s on price drift
 * (root CLAUDE.md price-lock convention).
 *
 * The preview endpoint validates STRICTER caps than the create form
 * request (e.g. 10 instances per config and 2000 GB per volume vs the
 * create endpoint's looser limits). `buildPreviewPricingPayload` returns
 * null for anything the endpoint would 422 on so callers skip the call
 * instead of surfacing a guaranteed validation error.
 */

export const PREVIEW_PRICING_DEBOUNCE_MS = 600;

export const PREVIEW_PRICING_LIMITS = {
  maxConfigurations: 50,
  maxInstancesPerConfig: 10,
  minStorageGb: 10,
  maxStorageGb: 2000,
  maxMonths: 36,
  maxFloatingIps: 5,
} as const;

export interface PreviewPricingEstimate {
  /** Tax-inclusive grand total across every configuration. */
  total: number;
  currency: string;
}

const isWithin = (value: number, min: number, max: number) =>
  Number.isFinite(value) && value >= min && value <= max;

/**
 * Build the POST /instances/preview-pricing payload from the wizard's
 * configurations. Returns null when no estimate should be requested:
 * empty/incomplete configurations, or any value beyond the preview
 * endpoint's validation caps (see PREVIEW_PRICING_LIMITS).
 *
 * `tenantId` must be the tenant the CREATE endpoint will price against
 * (the caller's own tenant when none is explicitly selected) — the create
 * action defaults to the actor's tenant while the preview endpoint prices
 * tenant-less unless told otherwise, and tenant price overrides would
 * otherwise make the estimate drift from the billed total.
 */
export const buildPreviewPricingPayload = (
  configurations: Configuration[],
  billingCountry: string,
  tenantId?: string | number
): Record<string, unknown> | null => {
  if (!Array.isArray(configurations) || configurations.length === 0) return null;
  if (configurations.length > PREVIEW_PRICING_LIMITS.maxConfigurations) return null;
  if (configurations.some((cfg) => !evaluateConfigurationCompleteness(cfg).isComplete)) {
    return null;
  }

  const pricing_requests: Record<string, unknown>[] = [];
  for (const cfg of configurations) {
    const months = Number(cfg.months) || 1;
    const instances = Number(cfg.instance_count) || 1;
    const floatingIps = Number(cfg.floating_ip_count) || 0;
    const rootStorage = Number(cfg.storage_size_gb) || 50;

    const volumes = [
      { volume_type_id: cfg.volume_type_id, storage_size_gb: rootStorage },
      ...(cfg.additional_volumes || [])
        .map((vol: AdditionalVolume) => ({
          volume_type_id: vol.volume_type_id,
          storage_size_gb: Number(vol.storage_size_gb) || 0,
        }))
        .filter((vol) => vol.volume_type_id && vol.storage_size_gb > 0),
    ];

    if (
      !isWithin(months, 1, PREVIEW_PRICING_LIMITS.maxMonths) ||
      !isWithin(instances, 1, PREVIEW_PRICING_LIMITS.maxInstancesPerConfig) ||
      !isWithin(floatingIps, 0, PREVIEW_PRICING_LIMITS.maxFloatingIps) ||
      volumes.some(
        (vol) =>
          !isWithin(
            vol.storage_size_gb,
            PREVIEW_PRICING_LIMITS.minStorageGb,
            PREVIEW_PRICING_LIMITS.maxStorageGb
          )
      )
    ) {
      return null;
    }

    pricing_requests.push({
      region: cfg.region,
      // AZ-level pricing: multi-provider regions price per AZ, so the
      // estimate must quote the same zone the order will bill against.
      availability_zone: cfg.availability_zone || undefined,
      compute_instance_id: cfg.compute_instance_id,
      os_image_id: cfg.os_image_id,
      months,
      number_of_instances: instances,
      volume_types: volumes,
      bandwidth_id: cfg.bandwidth_id || null,
      // `bandwidth_count` is required_with:bandwidth_id on the preview
      // endpoint — only send it alongside a real selection.
      ...(cfg.bandwidth_id ? { bandwidth_count: 1 } : {}),
      floating_ip_count: floatingIps,
    });
  }

  const normalizedCountry = String(billingCountry || "")
    .trim()
    .toUpperCase();
  return {
    ...(normalizedCountry.length === 2 ? { country_iso: normalizedCountry } : {}),
    ...(tenantId ? { tenant_id: tenantId } : {}),
    pricing_requests,
  };
};

/**
 * Pull the grand total + currency out of a preview-pricing response
 * (written by MultiInstanceController::previewPricing — `data.grand_total`
 * / `data.currency`). Returns null for malformed responses or non-positive
 * totals so callers neither display nor price-lock on a useless figure.
 */
export const extractPreviewPricingEstimate = (response: unknown): PreviewPricingEstimate | null => {
  const envelope = (response ?? {}) as { data?: unknown };
  const data = (envelope.data ?? response ?? {}) as {
    grand_total?: unknown;
    currency?: unknown;
  };
  const total = Number(data.grand_total);
  if (!Number.isFinite(total) || total <= 0) return null;
  return {
    total,
    currency: typeof data.currency === "string" ? data.currency : "",
  };
};

/**
 * The figure to send as `expected_total`: the previewed compute total plus
 * the protection-plan fee for the FULL TERM, because InitiateMultiInstances-
 * Action bills the order upfront for `months` (compute lines are × months and
 * the protection line is fee × months) BEFORE the price-lock guard runs (the
 * preview endpoint knows nothing about protection plans). `months` is the
 * order's term (the longest config term the plan protects); it defaults to 1
 * so compute-only / single-month callers are unchanged.
 */
export const composeExpectedTotal = (
  estimateTotal: number,
  protectionMonthlyCost: number = 0,
  months: number = 1
): number =>
  Number(
    (
      estimateTotal +
      (Number(protectionMonthlyCost) || 0) * Math.max(1, Number(months) || 1)
    ).toFixed(2)
  );
