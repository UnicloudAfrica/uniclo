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

// ResolvedProfile extends ServiceProfile with computed fields
export interface ResolvedProfile extends Omit<ServiceProfile, "months" | "storageGb"> {
  months: number; // Override as number for calculations
  storageGb: number;
  regionKey: string;
  regionData: any;
  tierOptions: Option[];
  usingFallbackCatalog: boolean;
  tierRow: any | null;
  tierData: any | null; // Alias for tierRow
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
  regionMap: Map<string, any>,
  tierCatalog: Map<string, { options: Option[]; map: Map<string, any> }>,
  selectedCurrency: string = "USD",
  lastOrderSummary: any = null,
  selectedPaymentOption: any = null
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
    return lines.map((line: any, index: number) => {
      const currency = line.currency || raw?.currency || summaryTotals.currency;
      const storageGb = Number(
        line.storage_gb ?? line?.meta?.object_storage?.storage_gb ?? line?.meta?.storage_gb ?? 0
      );
      return {
        id: line.slug || line.name || String(index),
        region: line.region || line.region_code || "",
        name: line.name || line.label || "Object storage tier",
        months: line.months || line.term || null,
        subtotal: Number(line.total_local ?? line.total ?? 0),
        unitPrice: Number(line.unit_price ?? line.unit_amount ?? line.price ?? 0),
        storageGb: storageGb > 0 ? storageGb : null,
        currency,
      };
    });
  }, [lastOrderSummary, summaryTotals.currency]);

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
