import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgePercent,
  CircleDollarSign,
  Cpu,
  Database,
  Inbox,
  Plus,
  Trash2,
  Globe,
  CreditCard,
  Lock,
} from "lucide-react";
import CalculatorAddOnsCard from "./CalculatorAddOnsCard";
import {
  formatCountryOptions,
  resolveCountryCodeFromEntity,
} from "../../../../shared/utils/countryUtils";
import { ModernButton, ModernCard, ModernInput, SelectableInput } from "../../ui";
import { useFetchCountries, useFetchProductPricing } from "@/hooks/resource";
import { useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import { useSharedFetchRegions } from "@/hooks/sharedCalculatorHooks";
import { useFormattedRegions, type RegionLike } from "@/utils/regionUtils";
import { getCurrencySymbol } from "@/utils/resource";
import PricingWorkloadCard from "./PricingWorkloadCard";
import PricingLiveSummary from "./PricingLiveSummary";
import { CalculatorData, ObjectStorageRequest, PricingRequest } from "../types";

interface CountryRecord {
  code?: string;
  iso2?: string;
  name?: string;
  label?: string;
  currency_code?: string;
  currency?: string;
  currencyCode?: string;
  currency_symbol?: string;
  currencySymbol?: string;
  [key: string]: unknown;
}

interface ObjectStorageTier {
  id?: number | string;
  product?: {
    productable_id?: number | string;
    name?: string;
    [key: string]: unknown;
  };
  product_name?: string;
  pricing?: {
    effective?: {
      price_local?: number;
      currency?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const createInitialItemState = (): PricingRequest => ({
  region: "",
  compute_instance_id: 0,
  os_image_id: 0,
  months: 1,
  number_of_instances: 1,
  volume_types: [],
  bandwidth_id: null,
  bandwidth_count: "",
  floating_ip_id: null,
  floating_ip_count: "",
  cross_connect_id: null,
});

const formatCurrency = (amount: number | null | undefined, currency: string = "USD") => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (_error) {
    return `${currency || ""} ${amount}`.trim();
  }
};

interface SelectableOption {
  id: string | number;
  name: string;
}

interface AvailabilityZone {
  code: string;
  name?: string;
  is_active?: boolean;
}

interface PricingCalculatorConfigProps {
  calculatorData: CalculatorData;
  errors: Record<string, string | null>;
  updateCalculatorData: (field: keyof CalculatorData, value: unknown) => void;
  onAddStorageItem: (item: ObjectStorageRequest) => void;
  onRemoveStorageItem: (index: number) => void;
  onCountryChange: (countryCode: string, currencyCode: string) => void;
  children?: React.ReactNode;
  mode?: "admin" | "tenant" | "client";
  clientProfile?: Record<string, unknown>;
  tenantSettings?: Record<string, unknown>;
}

const PricingCalculatorConfig: React.FC<PricingCalculatorConfigProps> = ({
  calculatorData,
  errors,
  updateCalculatorData,
  onAddStorageItem,
  onRemoveStorageItem,
  onCountryChange,
  children,
  mode = "admin",
  clientProfile,
  tenantSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"compute" | "storage" | "addons">("compute");
  const [storageItem, setStorageItem] = useState<Partial<ObjectStorageRequest>>({
    region: "",
    tier_id: 0,
    quantity: 1,
    months: 1,
  });
  const [storageErrors, setStorageErrors] = useState<Record<string, string>>({});
  const [searchTerms, setSearchTerms] = useState({
    region: "",
    az: "",
    tier: "",
  });

  const { data: countries = [], isFetching: isCountriesFetching } = useFetchCountries();
  const { data: rawRegions, isFetching: isRegionsFetching } = useSharedFetchRegions(mode);
  const regions = useFormattedRegions(
    (Array.isArray(rawRegions) ? rawRegions : []) as RegionLike[]
  );

  // Fetch availability zones for the storage item's selected region
  const { data: storageAzData = [], isFetching: isStorageAzFetching } = useFetchAvailabilityZones(
    String(storageItem.region ?? "") || null
  );

  const storageAzOptions = useMemo(() => {
    if (!Array.isArray(storageAzData)) return [];
    return (storageAzData as AvailabilityZone[])
      .filter((az) => az.is_active !== false)
      .map((az) => ({
        id: az.code,
        name: az.name || az.code,
      }));
  }, [storageAzData]);

  const countryOptions = useMemo(
    () => formatCountryOptions(Array.isArray(countries) ? countries : []),
    [countries]
  );
  const countryList = useMemo(
    () => (Array.isArray(countries) ? (countries as CountryRecord[]) : []),
    [countries]
  );

  const { isCountryLocked, lockedCountry } = useMemo(() => {
    let resolved = "";
    if (mode === "client" && clientProfile) {
      resolved = resolveCountryCodeFromEntity(clientProfile, countryOptions);
    } else if (mode === "tenant" && tenantSettings) {
      resolved = resolveCountryCodeFromEntity(tenantSettings, countryOptions);
    }
    return { isCountryLocked: !!resolved, lockedCountry: resolved };
  }, [mode, clientProfile, tenantSettings, countryOptions]);

  const selectedCountryCode = useMemo(
    () => (calculatorData.country_code || "US").toUpperCase(),
    [calculatorData.country_code]
  );

  const resolveCurrencyForCountry = useMemo(() => {
    return (code: string) => {
      if (!code) {
        return (calculatorData.currency_code || "USD").toUpperCase();
      }

      const upperCode = code.toUpperCase();
      const country = countryList.find(
        (countryEntry) => (countryEntry.iso2 || countryEntry.code || "").toUpperCase() === upperCode
      );

      if (country) {
        return (
          country.currency_code ||
          country.currency ||
          country.currencyCode ||
          country.currency_symbol ||
          country.currencySymbol ||
          calculatorData.currency_code ||
          "USD"
        ).toUpperCase();
      }

      const fallbackMatch = countryOptions.find(
        (option) => String(option.value || "").toUpperCase() === upperCode
      );

      return String(fallbackMatch?.currency || calculatorData.currency_code || "USD").toUpperCase();
    };
  }, [calculatorData.currency_code, countryList, countryOptions]);

  const selectedCurrency = useMemo(
    () => resolveCurrencyForCountry(selectedCountryCode),
    [resolveCurrencyForCountry, selectedCountryCode]
  );

  // Storage products are seeded per-AZ — the `region` column on each row
  // is the AZ code. Pass the AZ as the region argument so the lookup
  // matches what was seeded. The geographic region is only used to
  // narrow the AZ dropdown.
  const storageAzCode = String(
    (storageItem as Partial<ObjectStorageRequest> & { availability_zone?: string })
      .availability_zone ?? "",
  );
  const { data: objectStorageTiers, isFetching: isObjectStorageFetching } = useFetchProductPricing(
    storageAzCode,
    "object_storage_configuration",
    {
      enabled: !!storageItem.region && !!storageAzCode,
      countryCode: calculatorData.country_code,
      availabilityZone: storageAzCode,
    },
  );

  // Single per-GiB tier per AZ — auto-select the (one) product so the
  // user doesn't have to pick a tier. If the seed ever grows back to
  // multiple tiers we still grab the first valid row.
  const resolvedStorageTier = useMemo(() => {
    const list = (objectStorageTiers as ObjectStorageTier[] | undefined) ?? [];
    return list.find((tier) => !!tier?.product?.productable_id);
  }, [objectStorageTiers]);

  useEffect(() => {
    if (!resolvedStorageTier?.product?.productable_id) return;
    const candidateId = String(resolvedStorageTier.product.productable_id);
    if (String(storageItem.tier_id ?? "") === candidateId) return;
    setStorageItem((prev) => ({ ...prev, tier_id: candidateId as unknown as number }));
  }, [resolvedStorageTier, storageItem.tier_id]);

  const _handlePricingChange = (index: number, value: string | null | undefined) => {
    if (!onCountryChange) return;
    const upper = value ? value.toUpperCase() : "";
    onCountryChange(upper, resolveCurrencyForCountry(upper));
  };

  const handleCountrySelect = useCallback(
    (value: string | null) => {
      if (!onCountryChange) return;
      const upper = value ? value.toUpperCase() : "";
      onCountryChange(upper, resolveCurrencyForCountry(upper));
    },
    [onCountryChange, resolveCurrencyForCountry]
  );

  useEffect(() => {
    if (!onCountryChange || !selectedCountryCode) return;
    const resolved = resolveCurrencyForCountry(selectedCountryCode);
    if (calculatorData.currency_code && calculatorData.currency_code.toUpperCase() === resolved) {
      return;
    }
    handleCountrySelect(selectedCountryCode);
  }, [
    selectedCountryCode,
    resolveCurrencyForCountry,
    onCountryChange,
    calculatorData.currency_code,
    handleCountrySelect,
  ]);

  // Enforce locked country
  useEffect(() => {
    if (isCountryLocked && lockedCountry && selectedCountryCode !== lockedCountry) {
      handleCountrySelect(lockedCountry);
    }
  }, [isCountryLocked, lockedCountry, selectedCountryCode, handleCountrySelect]);

  // Ensure at least one workload exists
  useEffect(() => {
    if (!calculatorData.pricing_requests || calculatorData.pricing_requests.length === 0) {
      updateCalculatorData("pricing_requests", [createInitialItemState()]);
    }
  }, [calculatorData.pricing_requests, updateCalculatorData]);

  useEffect(() => {
    setStorageItem({ region: "", tier_id: null, quantity: 1, months: 1 });
    setStorageErrors({});
  }, [selectedCountryCode]);

  const updateWorkload = (index: number, newData: PricingRequest) => {
    const updated = [...calculatorData.pricing_requests];
    updated[index] = newData;
    updateCalculatorData("pricing_requests", updated);
  };

  const addWorkload = () => {
    const newWorkload: PricingRequest = {
      region: "",
      compute_instance_id: null,
      os_image_id: null,
      months: 1,
      number_of_instances: 1,
      volume_types: [],
      volumes: [],
    };
    updateCalculatorData("pricing_requests", [...calculatorData.pricing_requests, newWorkload]);
  };

  const removeWorkload = (index: number) => {
    updateCalculatorData(
      "pricing_requests",
      calculatorData.pricing_requests.filter((_, i) => i !== index)
    );
  };

  const updateStorageItem = (field: keyof ObjectStorageRequest, value: unknown) => {
    setStorageItem((prev) => {
      const next = { ...prev, [field]: value } as Partial<ObjectStorageRequest>;
      if (field === "region") {
        next.tier_id = 0;
      }
      return next;
    });
    setStorageErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleStorageRegionSelect = (option?: SelectableOption | null) => {
    const value = option ? option.id : "";
    updateStorageItem("region", value);
    setStorageItem((prev) => ({ ...prev, availability_zone: "" }));
    setSearchTerms((prev) => ({ ...prev, region: option ? option.name : "", az: "" }));
  };

  const handleStorageAzSelect = (option?: SelectableOption | null) => {
    const value = option ? option.id : "";
    setStorageItem((prev) => ({ ...prev, availability_zone: String(value) }));
    setSearchTerms((prev) => ({ ...prev, az: option ? option.name : "" }));
  };

  const handleStorageTierSelect = (option?: SelectableOption | null) => {
    const value = option ? String(option.id) : null;
    updateStorageItem("tier_id", value);
    setSearchTerms((prev) => ({ ...prev, tier: option ? option.name : "" }));
  };

  const validateStorageItem = () => {
    const newErrors: Record<string, string> = {};

    if (!storageItem.region) newErrors.region = "Required";
    if (
      !(storageItem as Partial<ObjectStorageRequest> & { availability_zone?: string })
        .availability_zone
    ) {
      newErrors.availability_zone = "Required";
    }
    // Tier is auto-resolved from the single seeded product per AZ. The
    // only failure mode is "no product published for this AZ" — surface
    // that on the same field so the user knows to pick a different AZ.
    if (!resolvedStorageTier?.product?.productable_id) {
      newErrors.tier_id = "No pricing published for this zone";
    }
    if (!storageItem.quantity || Number(storageItem.quantity) < 1) newErrors.quantity = "Min 1";
    if (!storageItem.months || Number(storageItem.months) < 1) newErrors.months = "Min 1";

    setStorageErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addObjectStorageItem = () => {
    if (!validateStorageItem()) return;

    const tier = resolvedStorageTier;

    const symbol = getCurrencySymbol(
      tier?.pricing?.effective?.currency || storageItem.currency || selectedCurrency
    );

    const az = (storageItem as Partial<ObjectStorageRequest> & { availability_zone?: string })
      .availability_zone;

    const formattedTier: ObjectStorageRequest = {
      // Send the AZ code as the canonical region — that's what the
      // backend joins by for object storage products.
      region: az || storageItem.region || "",
      availability_zone: az,
      productable_id: Number(tier?.product?.productable_id ?? storageItem.tier_id),
      tier_id: Number(tier?.product?.productable_id ?? storageItem.tier_id),
      quantity: Number(storageItem.quantity),
      months: Number(storageItem.months),
      product_name: tier?.product?.name || tier?.product_name || "Object Storage",
      total_price:
        (tier?.pricing?.effective?.price_local || 0) *
        (Number(storageItem.quantity) || 0) *
        (Number(storageItem.months) || 0),
      currency: tier?.pricing?.effective?.currency || selectedCurrency,
      unit_summary: `${symbol}${(tier?.pricing?.effective?.price_local || 0).toFixed(4)}/GiB`,
    };

    onAddStorageItem?.(formattedTier);
    setStorageItem({ region: "", tier_id: 0, quantity: 1, months: 1 });
    setStorageErrors({});
    setSearchTerms({ region: "", az: "", tier: "" });
  };

  const storageItems = calculatorData.object_storage_items || [];

  const storageUnitPriceLabel = useMemo(() => {
    const pricing = resolvedStorageTier?.pricing?.effective;
    if (!pricing) return null;
    const amount = Number(pricing.price_local ?? 0);
    if (!amount) return null;
    const currency = pricing.currency || selectedCurrency || "USD";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }, [resolvedStorageTier, selectedCurrency]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {/* Compact header strip */}
          <ModernCard padding="default" className="border-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Build a pricing scenario</h2>
                <p className="text-xs text-slate-500">
                  Configure workloads, storage commitments, and network components.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" />
                  {calculatorData.pricing_requests?.length || 0} workloads
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  <Database className="h-3.5 w-3.5 text-slate-500" />
                  {storageItems.length} storage items
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  {selectedCurrency}
                </span>

                {/* Inline discount control */}
                <button
                  type="button"
                  onClick={() =>
                    updateCalculatorData(
                      "apply_total_discount",
                      !calculatorData.apply_total_discount,
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                    calculatorData.apply_total_discount
                      ? "border border-amber-300 bg-amber-50 text-amber-800"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:text-amber-700"
                  }`}
                  title="Toggle global discount"
                >
                  <BadgePercent className="h-3.5 w-3.5" />
                  {calculatorData.apply_total_discount ? "Discount on" : "Add discount"}
                </button>
              </div>
            </div>

            {/* Inline discount inputs only when toggled */}
            {calculatorData.apply_total_discount && (
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                  <select
                    value={calculatorData.total_discount_type}
                    onChange={(e) => updateCalculatorData("total_discount_type", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Value</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={calculatorData.total_discount_value}
                    onChange={(e) => updateCalculatorData("total_discount_value", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </ModernCard>

          {/* Customer & billing — combined card */}
          <ModernCard padding="default" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Globe className="h-4 w-4 text-slate-500" />
                  Customer & billing
                </div>
                {children ? <div className="space-y-3">{children}</div> : null}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Country<span className="text-red-500">*</span>
                  </label>
                  {isCountryLocked ? (
                    <div className="flex h-[42px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                      <span>
                        {(countries as CountryRecord[]).find(
                          (c) => (c.iso2 || c.code || "").toUpperCase() === selectedCountryCode,
                        )?.name || selectedCountryCode}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        <Lock className="h-3 w-3" /> Default
                      </span>
                    </div>
                  ) : (
                    <select
                      value={selectedCountryCode}
                      onChange={(event) => handleCountrySelect(event.target.value)}
                      className="input-field w-full"
                      disabled={isCountriesFetching}
                    >
                      <option value="">Select country</option>
                      {Array.isArray(countries) &&
                        countries.map((country) => {
                          const value = (country.iso2 || country.code || "").toUpperCase();
                          const label = country.name || country.label || value;
                          return (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          );
                        })}
                    </select>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Currency</label>
                  <div className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    {selectedCurrency}
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Tabbed builder — Compute, Object Storage, and the Add-on
              services bundle (SimpleDeploy / AnyCloudFlow / Shield /
              Pay-as-you-go). The add-on bundle has its own internal
              sub-tabs inside CalculatorAddOnsCard so quoting any of
              the four tracks lives behind a single top-level tab. */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {(
                [
                  {
                    id: "compute" as const,
                    label: "Compute workloads",
                    icon: Cpu,
                    count: calculatorData.pricing_requests?.length || 0,
                  },
                  {
                    id: "storage" as const,
                    label: "Object storage",
                    icon: Database,
                    count: storageItems.length,
                  },
                  {
                    id: "addons" as const,
                    label: "Add-on services",
                    icon: Activity,
                    count:
                      (calculatorData.flow_plan_items?.length || 0) +
                      (calculatorData.shield_items?.length || 0) +
                      (calculatorData.metered_items?.length || 0),
                  },
                ]
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-1 min-w-[160px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span
                      className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                        isActive
                          ? "bg-primary-100 text-primary-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTab === "compute" ? (
              <div className="space-y-4">
                {calculatorData.pricing_requests?.map((request, index) => (
                  <PricingWorkloadCard
                    key={index}
                    index={index}
                    data={request}
                    onChange={(newData) => updateWorkload(index, newData)}
                    onRemove={() => removeWorkload(index)}
                    countryCode={calculatorData.country_code}
                    currencyCode={selectedCurrency}
                    errors={
                      (errors?.[`pricing_requests.${index}`] ?? {}) as Record<string, string | null>
                    }
                    isLastItem={calculatorData.pricing_requests.length === 1}
                    regions={regions as unknown as import("../types").BillingRegion[]}
                    isRegionsFetching={isRegionsFetching}
                  />
                ))}

                <div className="flex justify-center pt-1">
                  <ModernButton
                    variant="outline"
                    onClick={addWorkload}
                    leftIcon={<Plus className="h-4 w-4" />}
                    className="w-full sm:w-auto border-primary-200 text-primary-700 hover:bg-primary-50"
                  >
                    Add another workload
                  </ModernButton>
                </div>
              </div>
            ) : null}

            {activeTab === "storage" ? (
              <ModernCard padding="default" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Region<span className="text-red-500">*</span>
                    </label>
                    <SelectableInput
                      options={
                        regions?.map((region) => ({
                          id: region.code,
                          name: region.displayName ?? region.name ?? "",
                        })) || []
                      }
                      value={storageItem.region}
                      searchValue={searchTerms.region}
                      onSearchChange={(value) =>
                        setSearchTerms((prev) => ({ ...prev, region: value }))
                      }
                      onSelect={handleStorageRegionSelect}
                      placeholder="Search regions"
                      isLoading={isRegionsFetching}
                      disabled={isRegionsFetching}
                      hasError={Boolean(storageErrors.region)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      Availability Zone<span className="text-red-500">*</span>
                    </label>
                    <SelectableInput
                      options={storageAzOptions}
                      value={
                        (
                          storageItem as Partial<ObjectStorageRequest> & {
                            availability_zone?: string;
                          }
                        ).availability_zone ?? ""
                      }
                      searchValue={searchTerms.az}
                      onSearchChange={(value) =>
                        setSearchTerms((prev) => ({ ...prev, az: value }))
                      }
                      onSelect={handleStorageAzSelect}
                      placeholder={
                        !storageItem.region ? "Select a region first" : "Select availability zone"
                      }
                      disabled={!storageItem.region}
                      isLoading={isStorageAzFetching}
                      hasError={Boolean(storageErrors.availability_zone)}
                    />
                  </div>
                </div>

                {/* Per-GiB price preview — no tier picker, single seeded SKU per AZ */}
                {(
                  storageItem as Partial<ObjectStorageRequest> & { availability_zone?: string }
                ).availability_zone && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    {isObjectStorageFetching ? (
                      <p className="text-sm text-slate-500">Loading pricing for this zone…</p>
                    ) : resolvedStorageTier ? (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {resolvedStorageTier.product?.name ?? "Object Storage"}
                          </p>
                          <p className="text-xs text-slate-500">Billed per GiB · monthly</p>
                        </div>
                        {storageUnitPriceLabel && (
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-900 shadow-sm">
                            {storageUnitPriceLabel}{" "}
                            <span className="text-xs font-normal text-slate-500">/ GiB</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700">
                        No object storage pricing is published for this availability zone yet.
                      </p>
                    )}
                    {storageErrors.tier_id && (
                      <p className="mt-2 text-xs text-red-600">{storageErrors.tier_id}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ModernInput
                    label="Quantity (GB)"
                    type="number"
                    min="1"
                    value={storageItem.quantity}
                    onChange={(e) =>
                      updateStorageItem("quantity", parseInt(e.target.value) || 0)
                    }
                    error={storageErrors.quantity}
                  />
                  <ModernInput
                    label="Term (months)"
                    type="number"
                    min="1"
                    value={storageItem.months}
                    onChange={(e) => updateStorageItem("months", parseInt(e.target.value) || 0)}
                    error={storageErrors.months}
                  />
                  <div className="flex items-end">
                    <ModernButton
                      variant="primary"
                      onClick={addObjectStorageItem}
                      disabled={
                        !storageItem.region ||
                        !(
                          storageItem as Partial<ObjectStorageRequest> & {
                            availability_zone?: string;
                          }
                        ).availability_zone ||
                        !resolvedStorageTier ||
                        isObjectStorageFetching
                      }
                      leftIcon={<Plus className="h-4 w-4" />}
                      className="h-[42px] w-full"
                    >
                      Add storage
                    </ModernButton>
                  </div>
                </div>

                {storageItems.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Added storage
                    </h4>
                    <div className="space-y-2">
                      {storageItems.map((item: ObjectStorageRequest, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <Inbox className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{item.product_name}</p>
                              <p className="text-xs text-slate-500">
                                {item.quantity} GB · {item.months} months · {item.unit_summary}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveStorageItem(idx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ModernCard>
            ) : null}

            {activeTab === "addons" ? (
              <CalculatorAddOnsCard
                calculatorData={calculatorData}
                updateCalculatorData={
                  updateCalculatorData as (field: keyof typeof calculatorData, value: unknown) => void
                }
              />
            ) : null}
          </div>
        </div>

        {/* Right Column (Sticky on Desktop) */}
        <div className="hidden xl:block">
          <PricingLiveSummary calculatorData={calculatorData} currency={selectedCurrency} />
        </div>
      </div>
    </div>
  );
};

export default PricingCalculatorConfig;
