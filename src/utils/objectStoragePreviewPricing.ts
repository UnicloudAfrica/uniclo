import type { ResolvedProfile } from "../hooks/useObjectStoragePricing";

/*
 * Pre-order pricing preview for the object-storage wizard.
 *
 * POST object-storage/orders/preview quotes a configured order with the same
 * engine the create endpoint (POST object-storage/orders) bills with, so the
 * wizard can show customers the tax-inclusive total while they configure —
 * before any order exists. The previewed figures then ride on the create
 * payload as `expected_subtotal` (pre-tax) + `expected_total` (tax-inclusive)
 * so the backend 409s on price drift (root CLAUDE.md price-lock convention).
 *
 * The preview payload MUST carry the identical `object_storage_items` the
 * create call submits, so the two hooks (useObjectStoragePricing for display,
 * useOrderManagement for the submit-time price lock) fingerprint the same
 * bytes and a stale preview can never be echoed after the user edits.
 */

export const OBJECT_STORAGE_PREVIEW_DEBOUNCE_MS = 600;

export interface ObjectStorageOrderItem {
  region: string;
  availability_zone: string | undefined;
  productable_id: number;
  storage_gb: number;
  quantity: number;
  months: number;
  name: string;
  metadata: Record<string, unknown>;
}

/** One priced line item plus an optional per-line error (invalid tier). */
export interface BuiltOrderItem {
  item: ObjectStorageOrderItem | null;
  error: string | null;
}

/**
 * Build a single order item from a resolved profile. Returns `error` (never
 * throws) when the tier can't be resolved so the preview builder can skip and
 * the submit builder can throw with the per-line message the UI shows.
 *
 * Consumed by `useOrderManagement.submitOrder` (throwing) and
 * `buildObjectStoragePreviewPayload` (skip-on-error). Keep field-for-field in
 * sync — both must produce identical bytes for the fingerprint to match.
 */
export const buildObjectStorageOrderItem = (
  profile: ResolvedProfile,
  index: number
): BuiltOrderItem => {
  const tierRow = profile.tierRow || profile.tierData;
  const rawProductableId =
    (tierRow?.productable_id as unknown) ??
    ((tierRow?.product as Record<string, unknown> | undefined)?.productable_id as unknown) ??
    (tierRow?.product_id as unknown) ??
    profile.tierKey?.split("::")[1];
  // Avoid using tierRow.id as productable_id — it may be the pricing record id
  // rather than the object_storage_configuration id.
  const parsedProductableId = Number.parseInt(String(rawProductableId ?? ""), 10);
  if (!Number.isFinite(parsedProductableId) || parsedProductableId <= 0) {
    return {
      item: null,
      error:
        `Unable to resolve the storage tier for line ${index + 1}. ` +
        "Please re-select the tier and try again.",
    };
  }

  const baseName = (profile.name || profile.tierName || "").trim();
  const name =
    baseName.length >= 3 ? baseName : `Silo Storage ${profile.region || "region"}`.trim();

  const storageGb = Math.max(1, Math.floor(Number(profile.storageGb) || 0));

  return {
    item: {
      region: profile.region,
      // Object-storage pricing is seeded per-AZ; the backend resolves the
      // priced product by this AZ code (region stays the geographic code to
      // satisfy its Rule::exists check).
      availability_zone: profile.availability_zone,
      productable_id: parsedProductableId,
      storage_gb: storageGb,
      quantity: Number(profile.quantity) || 1,
      months: Number(profile.months) || 1,
      name,
      metadata: {
        ui_profile_id: profile.id,
        tier_key: profile.tierKey,
        tier_name: profile.tierName,
        currency: profile.currency,
        unit_price: profile.unitPrice,
        subtotal: profile.subtotal,
        storage_gb: profile.storageGb,
        line_index: index,
      },
    },
    error: null,
  };
};

/**
 * Build the array of order items. Returns the items and the first per-line
 * error (if any). Callers submitting the order throw on `error`; the preview
 * builder returns null so the debounced call is skipped.
 */
export const buildObjectStorageOrderItems = (
  resolvedProfiles: ResolvedProfile[]
): { items: ObjectStorageOrderItem[]; error: string | null } => {
  const items: ObjectStorageOrderItem[] = [];
  for (let index = 0; index < resolvedProfiles.length; index += 1) {
    const built = buildObjectStorageOrderItem(resolvedProfiles[index]!, index);
    if (built.error || !built.item) {
      return { items: [], error: built.error };
    }
    items.push(built.item);
  }
  return { items, error: null };
};

/**
 * The preview request body: the same `object_storage_items` the create call
 * submits plus the billing context. Returns null when no preview should be
 * requested (no eligible items or an unresolved tier) so callers skip the call
 * instead of surfacing a guaranteed error.
 */
export const buildObjectStoragePreviewPayload = (
  resolvedProfiles: ResolvedProfile[],
  countryIso: string,
  tenantId?: string,
  userId?: string,
  context?: string,
  fastTrack: boolean = false
): Record<string, unknown> | null => {
  if (!Array.isArray(resolvedProfiles) || resolvedProfiles.length === 0) return null;
  const { items, error } = buildObjectStorageOrderItems(resolvedProfiles);
  if (error || items.length === 0) return null;

  const payload: Record<string, unknown> = {
    object_storage_items: items,
    fast_track: fastTrack,
  };

  const normalizedCountry = String(countryIso || "")
    .trim()
    .toUpperCase();
  if (normalizedCountry.length === 2) {
    payload.country_iso = normalizedCountry;
  }
  if (tenantId) {
    payload.tenant_id = tenantId;
  }
  const normalizedUserId = typeof userId === "string" ? userId.trim() : String(userId || "");
  if (context && context !== "client" && normalizedUserId) {
    payload.user_id = normalizedUserId;
  }

  return payload;
};

export interface ObjectStoragePreviewSnapshot {
  /** Fingerprint of the priced payload; stale previews can't be echoed. */
  key: string;
  preDiscountSubtotal: number;
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
  currency: string;
}

/**
 * Pull the pricing envelope out of a preview response. The endpoint returns
 * `{ success, data: { lines, pre_discount_subtotal, subtotal, tax, total,
 * currency, country_iso } }` (written by the object-storage order preview
 * action). Returns null for malformed responses or a non-positive subtotal so
 * callers neither display nor price-lock on a useless figure.
 */
export const extractObjectStoragePreviewSnapshot = (
  response: unknown,
  key: string,
  fallbackCurrency: string
): ObjectStoragePreviewSnapshot | null => {
  const envelope = (response ?? {}) as { data?: unknown };
  const data = (envelope.data ?? response ?? {}) as Record<string, unknown>;

  const preDiscountSubtotal = Number(data.pre_discount_subtotal ?? data.subtotal ?? 0);
  const subtotal = Number(data.subtotal ?? preDiscountSubtotal ?? 0);
  if (!Number.isFinite(preDiscountSubtotal) || preDiscountSubtotal <= 0) return null;

  const tax = Number(data.tax ?? 0);
  const total = Number(data.total ?? subtotal ?? 0);
  let taxRate = Number(data.tax_rate ?? data.applied_tax_rate ?? 0);
  if (!taxRate && subtotal > 0 && tax > 0) {
    taxRate = Number(((tax / subtotal) * 100).toFixed(2));
  }

  return {
    key,
    preDiscountSubtotal: Number(preDiscountSubtotal.toFixed(2)),
    subtotal: Number((Number.isFinite(subtotal) ? subtotal : 0).toFixed(2)),
    tax: Number((Number.isFinite(tax) ? tax : 0).toFixed(2)),
    total: Number((Number.isFinite(total) ? total : 0).toFixed(2)),
    taxRate,
    currency: typeof data.currency === "string" && data.currency ? data.currency : fallbackCurrency,
  };
};
