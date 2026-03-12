import { useMemo } from "react";
import {
  Option,
  ServiceProfile,
  getRegionCode,
  makeTierKey,
  buildTierLabel,
  formatCountryOptions,
  formatRegionOptions,
  GLOBAL_TIER_KEY,
} from "../objectStorageUtils";
import { useFetchCountries, useFetchProductPricing } from "../resource";
import { useFetchRegions } from "../adminHooks/regionHooks";
import type { UnknownRecord, PricingHookOptions } from "./types";
import { isRecord, resolveString } from "./utils";

export interface UseDataFetchingOptions {
  useRegionsHook?: () => { data: unknown; isFetching: boolean };
  useCountriesHook?: () => { data: unknown; isFetching: boolean };
  usePricingHook?: (
    region: string,
    productType: string,
    options: PricingHookOptions
  ) => { data: unknown; isFetching: boolean };
  serviceProfiles: ServiceProfile[];
  effectiveCountryCode: string;
  selectedCurrency: string;
}

export interface UseDataFetchingReturn {
  regions: unknown[];
  sharedCountries: unknown[];
  regionMap: Map<string, UnknownRecord>;
  regionOptions: Option[];
  countryOptions: Option[];
  tierCatalog: Map<string, { options: Option[]; map: Map<string, UnknownRecord> }>;
  tierPricingPayload: unknown[];
  isRegionsLoading: boolean;
  isCountriesLoading: boolean;
  isPricingLoading: boolean;
  resolveCurrencyForCountry: (code: string) => string;
}

export const useDataFetching = (options: UseDataFetchingOptions): UseDataFetchingReturn => {
  const {
    useRegionsHook,
    useCountriesHook,
    usePricingHook,
    serviceProfiles,
    effectiveCountryCode,
    selectedCurrency: selectedCurrencyInput,
  } = options;

  // API Hooks - use provided hooks or defaults
  const regionsHook = useRegionsHook || useFetchRegions;
  const { data: regionsData = [], isFetching: isRegionsLoading } = regionsHook();
  const regions = useMemo(() => (Array.isArray(regionsData) ? regionsData : []), [regionsData]);

  const countriesHook = useCountriesHook || useFetchCountries;
  const { data: sharedCountriesData = [], isFetching: isCountriesLoading } = countriesHook();
  const sharedCountries = useMemo(
    () => (Array.isArray(sharedCountriesData) ? sharedCountriesData : []),
    [sharedCountriesData]
  );

  const primaryRegion = useMemo(() => (serviceProfiles[0]?.region || "").trim(), [serviceProfiles]);

  const pricingHook = usePricingHook || useFetchProductPricing;
  const { data: tierPricingPayloadData = [], isFetching: isPricingLoading } = pricingHook(
    primaryRegion,
    "object_storage_configuration",
    {
      enabled: Boolean(primaryRegion),
      countryCode: effectiveCountryCode,
    }
  );
  const tierPricingPayload = useMemo(
    () => (Array.isArray(tierPricingPayloadData) ? tierPricingPayloadData : []),
    [tierPricingPayloadData]
  );

  // Currency resolution
  const resolveCurrencyForCountry = useMemo(() => {
    return (code: string) => {
      if (!code || !Array.isArray(sharedCountries)) {
        return "USD";
      }
      const match = sharedCountries.find((country) => {
        if (!isRecord(country)) return false;
        const iso = resolveString(
          country.code ?? country.iso2 ?? country.country_code ?? ""
        ).toUpperCase();
        return iso === code.toUpperCase();
      });
      const matchRecord = isRecord(match) ? match : {};
      return resolveString(
        matchRecord.currency_code ||
          matchRecord.currency ||
          matchRecord.currencyCode ||
          matchRecord.currency_symbol ||
          matchRecord.currencySymbol ||
          "USD"
      ).toUpperCase();
    };
  }, [sharedCountries]);

  // Region Map
  const regionMap = useMemo(() => {
    const map = new Map<string, UnknownRecord>();
    (Array.isArray(regions) ? regions : []).forEach((region) => {
      if (!isRecord(region)) return;
      const code = getRegionCode(region);
      if (code) {
        map.set(code.toLowerCase(), region);
      }
    });
    return map;
  }, [regions]);

  // Region Options
  const regionOptions = useMemo(() => formatRegionOptions(regions), [regions]);

  // Country Options
  const countryOptions = useMemo(() => formatCountryOptions(sharedCountries), [sharedCountries]);

  // Use a stable selectedCurrency reference for the tier catalog
  const selectedCurrency = selectedCurrencyInput;

  // Tier Catalog
  const tierCatalog = useMemo(() => {
    const rawRows = Array.isArray(tierPricingPayload) ? tierPricingPayload : [];
    const catalog = new Map<string, { options: Option[]; map: Map<string, UnknownRecord> }>();

    rawRows.forEach((row) => {
      if (!isRecord(row)) return;
      const rowRecord = row;
      const product = isRecord(rowRecord.product) ? rowRecord.product : {};
      const pricing = isRecord(rowRecord.pricing) ? rowRecord.pricing : {};
      const effectivePricing = isRecord(pricing.effective) ? pricing.effective : {};
      const regionCodeRaw =
        product.region ?? rowRecord.region ?? product.region_code ?? GLOBAL_TIER_KEY;
      const regionKey = resolveString(regionCodeRaw).toLowerCase().trim() || GLOBAL_TIER_KEY;
      const key = makeTierKey(regionKey, {
        productable_type: product.productable_type as string,
        productable_id: product.productable_id as string | number,
      });

      const ensureBucket = (bucketKey: string) => {
        if (!catalog.has(bucketKey)) {
          catalog.set(bucketKey, {
            options: [],
            map: new Map(),
          });
        }
        return catalog.get(bucketKey)!;
      };

      const currency = resolveString(effectivePricing.currency || selectedCurrency || "USD");
      const productObjectStorage = isRecord(product.object_storage) ? product.object_storage : {};
      const composite: UnknownRecord = {
        ...effectivePricing,
        currency,
        product,
        product_name: product.name || rowRecord.product_name,
        productable_id: product.productable_id || rowRecord.productable_id,
        productable_type: product.productable_type || rowRecord.productable_type,
        region: resolveString(regionCodeRaw) || "",
        quota_gb: productObjectStorage.quota_gb || product.quota_gb || product.quota || null,
      };

      const label = buildTierLabel(composite, null, selectedCurrency || "USD");
      const regionBucket = ensureBucket(regionKey);
      regionBucket.options.push({ value: key, label });
      regionBucket.map.set(key, composite);

      const globalBucket = ensureBucket(GLOBAL_TIER_KEY);
      const globalKey = makeTierKey(GLOBAL_TIER_KEY, composite);
      globalBucket.options.push({ value: globalKey, label });
      globalBucket.map.set(globalKey, composite);
    });

    return catalog;
  }, [tierPricingPayload, selectedCurrency]);

  return {
    regions,
    sharedCountries,
    regionMap,
    regionOptions,
    countryOptions,
    tierCatalog,
    tierPricingPayload,
    isRegionsLoading,
    isCountriesLoading,
    isPricingLoading,
    resolveCurrencyForCountry,
  };
};
