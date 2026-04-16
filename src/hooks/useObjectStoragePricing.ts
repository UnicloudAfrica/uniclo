import { useMemo } from "react";
import {
  Option,
  ServiceProfile,
  resolveTierUnitPricePerGb,
  resolveTierQuota,
  resolveTierCurrency,
  getTierDisplayName,
  GLOBAL_TIER_KEY,
} from "./objectStorageUtils";

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

export interface UseObjectStoragePricingReturn {
  resolvedProfiles: ResolvedProfile[];
  summaryTotals: SummaryTotals;
  summaryCurrency: string;
  hasCurrencyMismatch: boolean;
  grandTotalWithFees: number;
  backendPricingTotals: BackendPricingTotals | null;
  backendPricingLines: BackendPricingLine[] | null;
  displayedTotals: SummaryTotals;
}

export const useObjectStoragePricing = (
  serviceProfiles: ServiceProfile[],
  regionMap: Map<string, RegionLike>,
  tierCatalog: Map<string, { options: Option[]; map: Map<string, TierRow> }>,
  selectedCurrency: string = "USD",
  lastOrderSummary: ObjectStorageOrderSummary | null = null,
  selectedPaymentOption: PaymentOptionLike | null = null
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

  // Prefer backend pricing when available so the user sees the
  // authoritative totals (including tax/discounts).  Mark the frontend
  // estimate with a zero tax rate so the UI can flag it as "excl. tax".
  const displayedTotals = backendPricingTotals || summaryTotals;

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
  };
};
