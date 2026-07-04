import { useEffect, useMemo, useState } from "react";
import {
  Option,
  ServiceProfile,
  resolveTierUnitPricePerGb,
  resolveTierQuota,
  resolveTierCurrency,
  getTierDisplayName,
  GLOBAL_TIER_KEY,
} from "./objectStorageUtils";
import {
  OBJECT_STORAGE_PREVIEW_DEBOUNCE_MS,
  buildObjectStoragePreviewPayload,
  extractObjectStoragePreviewSnapshot,
  type ObjectStoragePreviewSnapshot,
} from "../utils/objectStoragePreviewPricing";
import logger from "../utils/logger";

type UnknownRecord = Record<string, unknown>;
type RegionLike = UnknownRecord;
type TierRow = UnknownRecord & { product?: UnknownRecord };

type PricingBreakdown = {
  pre_discount_subtotal?: number;
  subtotal?: number;
  tax?: number;
  tax_rate?: number;
  applied_tax_rate?: number;
  total?: number;
  currency?: string;
  lines?: UnknownRecord[];
};

type TransactionSummary = {
  metadata?: { pricing_breakdown?: PricingBreakdown };
  transaction_fee?: number;
  third_party_fee?: number;
  status?: string;
  identifier?: string | number;
  reference?: string | number;
  id?: string | number;
  payment_gateway_options?: unknown;
};

type PaymentSummary = {
  required?: boolean;
  status?: string;
  payment_gateway_options?: PaymentOptionLike[];
  gateway?: string;
};

type OrderSummaryData = {
  identifier?: string | number;
  id?: string | number;
  items?: UnknownRecord[];
  pricing_breakdown?: PricingBreakdown;
};

export type ObjectStorageOrderSummary = UnknownRecord & {
  transaction?: TransactionSummary;
  order?: OrderSummaryData;
  payment?: PaymentSummary;
  paymentOptions?: unknown;
  accounts?: UnknownRecord[];
  account?: UnknownRecord;
  order_items?: UnknownRecord[];
  serviceProfiles?: unknown[];
  object_storage_account_id?: string | number;
  order_id?: string | number;
};

export type PaymentOptionLike = {
  id?: string | number;
  name?: string;
  payment_type?: string;
  transaction_reference?: string;
  public_key?: string;
  publicKey?: string;
  gateway?: string;
  provider?: string;
  charge_breakdown?: {
    total_fees?: number;
    subtotal?: number;
    tax?: number;
  };
  subtotal?: number;
  tax?: number;
  fees?: number;
  total_fees?: number;
  total?: number;
  currency?: string;
  details?: {
    account_name?: string;
    account_number?: string;
    bank_name?: string;
  };
  reference?: string;
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

// ResolvedProfile extends ServiceProfile with computed fields
export interface ResolvedProfile extends Omit<ServiceProfile, "months" | "storageGb"> {
  months: number; // Override as number for calculations
  storageGb: number;
  regionKey: string;
  regionData: RegionLike | null;
  tierOptions: Option[];
  usingFallbackCatalog: boolean;
  tierRow: TierRow | null;
  tierData: TierRow | null; // Alias for tierRow
  tierQuotaGb: number;
  fallbackUnitPrice: number;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  currency: string;
  hasTierData: boolean;
  tierName: string;
}

export interface SummaryTotals {
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  taxRate: number;
}

export interface BackendPricingTotals extends SummaryTotals {
  lines?: BackendPricingLine[];
}

export interface BackendPricingLine {
  id: string;
  region: string;
  name: string;
  months: number | null;
  subtotal: number;
  unitPrice: number;
  storageGb?: number | null;
  currency: string;
}

/**
 * Billing context needed to quote the order via the preview endpoint. The
 * preview payload must mirror the create payload exactly, so these are the
 * same values `useOrderManagement` sends on submit.
 */
export interface ObjectStoragePreviewOptions {
  previewOrderFn?: (payload: Record<string, unknown>) => Promise<unknown>;
  effectiveCountryCode?: string;
  selectedTenantId?: string;
  selectedUserId?: string;
  context?: string;
  isFastTrack?: boolean;
}

export interface UseObjectStoragePricingReturn {
  resolvedProfiles: ResolvedProfile[];
  summaryTotals: SummaryTotals;
  summaryCurrency: string;
  hasCurrencyMismatch: boolean;
  grandTotalWithFees: number;
  backendPricingTotals: BackendPricingTotals | null;
  backendPricingLines: BackendPricingLine[] | null;
  displayedTotals: SummaryTotals;
  /**
   * Fingerprint of the currently priced payload. `previewSnapshot` is only
   * valid to display / price-lock when its `key` equals this.
   */
  previewPayloadKey: string;
  /** Latest preview response keyed by the payload that produced it. */
  previewSnapshot: ObjectStoragePreviewSnapshot | null;
}

export const useObjectStoragePricing = (
  serviceProfiles: ServiceProfile[],
  regionMap: Map<string, RegionLike>,
  tierCatalog: Map<string, { options: Option[]; map: Map<string, TierRow> }>,
  selectedCurrency: string = "USD",
  lastOrderSummary: ObjectStorageOrderSummary | null = null,
  selectedPaymentOption: PaymentOptionLike | null = null,
  previewOptions: ObjectStoragePreviewOptions = {}
): UseObjectStoragePricingReturn => {
  // Resolve profiles with pricing data
  const resolvedProfiles = useMemo((): ResolvedProfile[] => {
    return serviceProfiles.map((profile) => {
      const regionTrimmed = profile.region.trim();
      const regionKey = regionTrimmed.toLowerCase();
      const regionData = regionTrimmed ? regionMap.get(regionKey) || null : null;
      const regionBucket = regionKey ? tierCatalog.get(regionKey) : null;
      const fallbackBucket = tierCatalog.get(GLOBAL_TIER_KEY);
      const catalogEntry = regionBucket || fallbackBucket;
      const usingFallbackCatalog = Boolean(regionKey && !regionBucket && fallbackBucket);
      const tierRow = catalogEntry?.map?.get(profile.tierKey.trim()) || null;
      const tierQuotaGb = resolveTierQuota(tierRow);
      const fallbackUnitPrice = resolveTierUnitPricePerGb(tierRow);
      const overrideValue = Number(profile.unitPriceOverride);
      const hasOverride =
        profile.unitPriceOverride !== "" && Number.isFinite(overrideValue) && overrideValue > 0;
      const unitPrice = hasOverride ? overrideValue : fallbackUnitPrice;
      const safeUnitPrice = Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
      const months = Math.max(1, Number(profile.months) || 0);
      const rawStorageGb = Number(profile.storageGb);
      const storageGb =
        Number.isFinite(rawStorageGb) && rawStorageGb > 0
          ? Math.floor(rawStorageGb)
          : tierQuotaGb > 0
            ? tierQuotaGb
            : 0;
      const quantity = 1;
      const subtotal = quantity * months * storageGb * safeUnitPrice;
      const currency = resolveTierCurrency(tierRow) || selectedCurrency || "USD";
      const tierName = getTierDisplayName(tierRow) || "";

      return {
        ...profile,
        region: regionTrimmed,
        storageGb,
        regionKey,
        regionData,
        tierOptions: catalogEntry?.options ?? [],
        usingFallbackCatalog,
        tierRow,
        tierData: tierRow, // Alias for tierRow
        tierQuotaGb,
        fallbackUnitPrice,
        unitPrice: safeUnitPrice,
        months,
        quantity,
        subtotal,
        currency,
        hasTierData: Boolean(tierRow),
        tierName: tierName || "",
      };
    });
  }, [serviceProfiles, regionMap, tierCatalog, selectedCurrency]);

  // Calculate summary totals
  const summaryCurrency =
    selectedCurrency || resolvedProfiles.find((profile) => profile.currency)?.currency || "USD";

  const taxRateValue = 0; // Tax can be calculated based on country later

  const subtotal = resolvedProfiles.reduce((sum, profile) => sum + profile.subtotal, 0);
  const tax = subtotal * (taxRateValue / 100);
  const total = subtotal + tax;

  const summaryTotals: SummaryTotals = {
    subtotal,
    tax,
    total,
    currency: summaryCurrency,
    taxRate: taxRateValue,
  };

  // ─────────────────────────────────────────────────────────────────
  // Pre-order pricing preview (tax-inclusive total)
  // ─────────────────────────────────────────────────────────────────
  // Quote the configured order via POST object-storage/orders/preview — the
  // same engine the create endpoint bills with — so the wizard shows the
  // tax-inclusive total while the user configures, instead of hardcoding
  // tax = 0. Keyed on the serialized order payload so any price-affecting edit
  // invalidates the snapshot before it can be displayed or price-locked. The
  // snapshot is echoed on the create payload by `useOrderManagement` as
  // `expected_subtotal` + `expected_total` (root CLAUDE.md price-lock).
  const {
    previewOrderFn,
    effectiveCountryCode = "",
    selectedTenantId = "",
    selectedUserId = "",
    context = "",
    isFastTrack = false,
  } = previewOptions;

  const [previewSnapshot, setPreviewSnapshot] = useState<ObjectStoragePreviewSnapshot | null>(null);

  const previewPayloadKey = useMemo(() => {
    const payload = buildObjectStoragePreviewPayload(
      resolvedProfiles,
      effectiveCountryCode,
      selectedTenantId,
      selectedUserId,
      context,
      isFastTrack
    );
    return payload ? JSON.stringify(payload) : "";
  }, [
    resolvedProfiles,
    effectiveCountryCode,
    selectedTenantId,
    selectedUserId,
    context,
    isFastTrack,
  ]);

  useEffect(() => {
    if (!previewOrderFn || !previewPayloadKey) {
      setPreviewSnapshot(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await previewOrderFn(
          JSON.parse(previewPayloadKey) as Record<string, unknown>
        );
        const snapshot = extractObjectStoragePreviewSnapshot(
          response,
          previewPayloadKey,
          summaryCurrency
        );
        if (!cancelled) setPreviewSnapshot(snapshot);
      } catch (error) {
        // Best-effort: a failed preview just falls back to the pre-tax subtotal
        // display ("tax calculated at checkout"); submit then blocks with a
        // clear message because no fresh snapshot exists.
        logger.warn("Object storage order preview failed:", error);
        if (!cancelled) setPreviewSnapshot(null);
      }
    }, OBJECT_STORAGE_PREVIEW_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // summaryCurrency is only a fallback for a missing response currency;
    // excluded from deps so a currency shift doesn't re-fire the priced call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOrderFn, previewPayloadKey]);

  // Only trust the snapshot when it matches the currently priced payload.
  const freshPreviewSnapshot =
    previewSnapshot && previewSnapshot.key === previewPayloadKey ? previewSnapshot : null;

  const previewTotals = useMemo((): SummaryTotals | null => {
    if (!freshPreviewSnapshot) return null;
    return {
      subtotal: freshPreviewSnapshot.preDiscountSubtotal,
      tax: freshPreviewSnapshot.tax,
      total: freshPreviewSnapshot.total,
      currency: freshPreviewSnapshot.currency,
      taxRate: freshPreviewSnapshot.taxRate,
    };
  }, [freshPreviewSnapshot]);

  // Backend pricing data from order summary
  const backendPricingTotals = useMemo((): BackendPricingTotals | null => {
    const raw =
      lastOrderSummary?.transaction?.metadata?.pricing_breakdown ||
      lastOrderSummary?.order?.pricing_breakdown ||
      null;
    if (!raw) return null;
    const rawSubtotal = Number(raw.pre_discount_subtotal ?? raw.subtotal ?? 0);
    const rawTax = Number(raw.tax ?? 0);
    let taxRate = Number(raw.tax_rate ?? raw.applied_tax_rate ?? 0);
    if (!taxRate && rawSubtotal > 0 && rawTax > 0) {
      taxRate = Number(((rawTax / rawSubtotal) * 100).toFixed(2));
    }
    return {
      subtotal: rawSubtotal,
      tax: rawTax,
      total: Number(raw.total ?? raw.pre_discount_subtotal ?? 0),
      currency: raw.currency || summaryTotals.currency,
      taxRate,
    };
  }, [lastOrderSummary, summaryTotals.currency]);

  // Backend pricing lines
  const backendPricingLines = useMemo((): BackendPricingLine[] | null => {
    const raw =
      lastOrderSummary?.transaction?.metadata?.pricing_breakdown ||
      lastOrderSummary?.order?.pricing_breakdown ||
      null;
    const lines = Array.isArray(raw?.lines) ? raw.lines : [];
    if (!lines.length) return null;
    return lines.map((line, index) => {
      const lineRecord = isRecord(line) ? line : {};
      const currency = lineRecord.currency?.toString() || raw?.currency || summaryTotals.currency;
      const meta = isRecord(lineRecord.meta) ? lineRecord.meta : {};
      const metaObjectStorage = isRecord(meta.object_storage) ? meta.object_storage : {};
      const storageGb = Number(
        lineRecord.storage_gb ?? metaObjectStorage.storage_gb ?? meta.storage_gb ?? 0
      );
      const monthsValue = Number(lineRecord.months ?? lineRecord.term);
      const months = Number.isFinite(monthsValue) && monthsValue > 0 ? monthsValue : null;
      return {
        id: String(lineRecord.slug || lineRecord.name || index),
        region: String(lineRecord.region || lineRecord.region_code || ""),
        name: String(lineRecord.name || lineRecord.label || "Object storage tier"),
        months,
        subtotal: Number(lineRecord.total_local ?? lineRecord.total ?? 0),
        unitPrice: Number(lineRecord.unit_price ?? lineRecord.unit_amount ?? lineRecord.price ?? 0),
        storageGb: storageGb > 0 ? storageGb : null,
        currency,
      };
    });
  }, [lastOrderSummary, summaryTotals.currency]);

  // Prefer the authoritative post-order breakdown, then the pre-order preview
  // (tax-inclusive), then the local pre-tax estimate. The preview snapshot is
  // the same one echoed on the create payload, so what the user reviews and
  // what gets price-locked never desync (root CLAUDE.md).
  const displayedTotals = backendPricingTotals || previewTotals || summaryTotals;

  // Check for currency mismatch
  const hasCurrencyMismatch = resolvedProfiles.some(
    (profile) => profile.currency && profile.currency !== summaryTotals.currency
  );

  // Gateway fees
  const selectedGatewayFee = Number(
    selectedPaymentOption?.charge_breakdown?.total_fees ??
      selectedPaymentOption?.total_fees ??
      selectedPaymentOption?.fees ??
      lastOrderSummary?.transaction?.transaction_fee ??
      lastOrderSummary?.transaction?.third_party_fee ??
      0
  );
  const grandTotalWithFees = (displayedTotals.total || 0) + selectedGatewayFee;

  return {
    resolvedProfiles,
    summaryTotals,
    summaryCurrency,
    hasCurrencyMismatch,
    grandTotalWithFees,
    backendPricingTotals,
    backendPricingLines,
    displayedTotals,
    previewPayloadKey,
    previewSnapshot: freshPreviewSnapshot,
  };
};
