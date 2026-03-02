import React, { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  CircleDollarSign,
  Inbox,
  _Layers,
  Plus,
  Server,
  Trash2,
  _HardDrive,
  Globe,
  CreditCard,
  Lock,
} from "lucide-react";
import {
  formatCountryOptions,
  resolveCountryCodeFromEntity,
} from "../../../../shared/utils/countryUtils";
import { ModernButton, ModernCard, ModernInput, SelectableInput } from "../../ui";
import { useFetchCountries, useFetchProductPricing } from "../../../../hooks/resource";
import { useSharedFetchRegions } from "../../../../hooks/sharedCalculatorHooks";
import { useFormattedRegions } from "../../../../utils/regionUtils";
import { getCurrencySymbol } from "../../../../utils/resource";
import PricingWorkloadCard from "./PricingWorkloadCard";
import PricingLiveSummary from "./PricingLiveSummary";
import { CalculatorData, ObjectStorageRequest, PricingRequest } from "../types";

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

interface PricingCalculatorConfigProps {
  calculatorData: CalculatorData;
  errors: Record<string, string | null>;
  updateCalculatorData: (field: keyof CalculatorData, value: any) => void;
  onAddStorageItem: (item: ObjectStorageRequest) => void;
  onRemoveStorageItem: (index: number) => void;
  onCountryChange: (countryCode: string, currencyCode: string) => void;
  children?: React.ReactNode;
  mode?: "admin" | "tenant" | "client";
  clientProfile?: any;
  tenantSettings?: any;
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
  const [storageItem, setStorageItem] = useState<Partial<ObjectStorageRequest>>({
    region: "",
    tier_id: 0,
    quantity: 1,
    months: 1,
  });
  const [storageErrors, setStorageErrors] = useState<Record<string, string>>({});
  const [searchTerms, setSearchTerms] = useState({
    region: "",
    tier: "",
  });

  const { data: countries = [], isFetching: isCountriesFetching } = useFetchCountries();
  const { data: rawRegions, isFetching: isRegionsFetching } = useSharedFetchRegions(mode);
  const regions = useFormattedRegions(rawRegions as any);

  const countryOptions = useMemo(() => formatCountryOptions(countries as any), [countries]);

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
      if (!code || !Array.isArray(countries)) {
        return calculatorData.currency_code || "USD";
      }

      const country = countries.find((c: any) => c.code === code);

      if (!country) {
        return calculatorData.currency_code || "USD";
      }

      return (
        country.currency_code ||
        country.currency ||
        country.currencyCode ||
        country.currency_symbol ||
        country.currencySymbol ||
        calculatorData.currency_code ||
        "USD"
      ).toUpperCase();
    };
  }, [countries, calculatorData.currency_code]);

  const selectedCurrency = useMemo(
    () => resolveCurrencyForCountry(selectedCountryCode),
    [resolveCurrencyForCountry, selectedCountryCode]
  );

  const { data: objectStorageTiers, isFetching: isObjectStorageFetching } = useFetchProductPricing(
    storageItem.region as any,
    "object_storage_configuration",
    {
      enabled: !!storageItem.region,
      countryCode: calculatorData.country_code,
    }
  );

  const _handlePricingChange = (index: number, value: any) => {
    if (!onCountryChange) return;
    const upper = value ? value.toUpperCase() : "";
    onCountryChange(upper, resolveCurrencyForCountry(upper));
  };

  const handleCountrySelect = (value: string | null) => {
    if (!onCountryChange) return;
    const upper = value ? value.toUpperCase() : "";
    onCountryChange(upper, resolveCurrencyForCountry(upper));
  };

  useEffect(() => {
    if (!onCountryChange || !selectedCountryCode) return;
    const resolved = resolveCurrencyForCountry(selectedCountryCode);
    if (calculatorData.currency_code && calculatorData.currency_code.toUpperCase() === resolved) {
      return;
    }
    handleCountrySelect(selectedCountryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryCode, resolveCurrencyForCountry]);

  // Enforce locked country
  useEffect(() => {
    if (isCountryLocked && lockedCountry && selectedCountryCode !== lockedCountry) {
      handleCountrySelect(lockedCountry);
    }
  }, [isCountryLocked, lockedCountry, selectedCountryCode]);

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
      compute_instance_id: null as any,
      os_image_id: null as any,
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

  const updateStorageItem = (field: keyof ObjectStorageRequest, value: any) => {
    setStorageItem((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "region") {
        next.tier_id = 0;
      }
      return next;
    });
    setStorageErrors((prev: any) => ({ ...prev, [field]: "" }));
  };

  const handleStorageRegionSelect = (option: any) => {
    const value = option ? option.id : "";
    updateStorageItem("region", value);
    setSearchTerms((prev) => ({ ...prev, region: option ? option.name : "" }));
  };

  const handleStorageTierSelect = (option: any) => {
    const value = option ? String(option.id) : null;
    updateStorageItem("tier_id", value);
    setSearchTerms((prev) => ({ ...prev, tier: option ? option.name : "" }));
  };

  const validateStorageItem = () => {
    const newErrors: any = {};

    if (!storageItem.region) newErrors.region = "Required";
    if (!storageItem.tier_id) newErrors.tier_id = "Required";
    if (!storageItem.quantity || Number(storageItem.quantity) < 1) newErrors.quantity = "Min 1";
    if (!storageItem.months || Number(storageItem.months) < 1) newErrors.months = "Min 1";

    setStorageErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addObjectStorageItem = () => {
    if (!validateStorageItem()) return;

    const tier = (objectStorageTiers as any)?.find(
      (item: any) => String(item.product?.productable_id ?? item.id) === String(storageItem.tier_id)
    );

    const symbol = getCurrencySymbol(
      tier?.pricing?.effective?.currency || storageItem.currency || selectedCurrency
    );

    const formattedTier: ObjectStorageRequest = {
      region: storageItem.region || "",
      productable_id: Number(tier?.product?.productable_id ?? storageItem.tier_id),
      tier_id: Number(storageItem.tier_id),
      quantity: Number(storageItem.quantity),
      months: Number(storageItem.months),
      product_name: tier?.product?.name || tier?.product_name || "Silo Storage Tier",
      total_price:
        (tier?.pricing?.effective?.price_local || 0) *
        (Number(storageItem.quantity) || 0) *
        (Number(storageItem.months) || 0),
      currency: tier?.pricing?.effective?.currency || selectedCurrency,
      unit_summary: `${symbol}${(tier?.pricing?.effective?.price_local || 0).toFixed(4)}/unit`,
    };

    onAddStorageItem?.(formattedTier);
    setStorageItem({ region: "", tier_id: 0, quantity: 1, months: 1 });
    setStorageErrors({});
    setSearchTerms({ region: "", tier: "" });
  };

  const storageItems = calculatorData.object_storage_items || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Hero Card */}
          <ModernCard
            padding="lg"
            className="brand-hero space-y-6 text-white"
            style={{
              border: "1px solid color-mix(in srgb, var(--theme-card-bg) 12%, transparent)",
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                    <Server className="h-3.5 w-3.5" />
                    Infrastructure builder
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Build a pricing scenario
                  </h2>
                  <p className="text-sm text-white/70">
                    Configure multiple workloads, storage tiers, and network components.
                  </p>
                </div>

                {/* Hero Stats / Controls */}
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm min-w-[120px]">
                    <p className="text-[11px] uppercase tracking-wide text-white/60">Workloads</p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {calculatorData.pricing_requests?.length || 0}
                    </p>
                  </div>

                  {/* Currency Selector in Hero */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm min-w-[120px]">
                    <p className="text-[11px] uppercase tracking-wide text-white/60 mb-1">
                      Currency
                    </p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <CircleDollarSign className="h-4 w-4 text-emerald-400" />
                      {selectedCurrency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Discount Toggle in Hero */}
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <BadgePercent className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Global Discount</p>
                    <p className="text-xs text-slate-400">Apply to total estimate</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={calculatorData.apply_total_discount}
                    onChange={(e) => updateCalculatorData("apply_total_discount", e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-500 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/50"></div>
                </label>
              </div>

              {/* Discount Inputs (Visible if enabled) */}
              {calculatorData.apply_total_discount && (
                <div className="grid grid-cols-1 gap-4 rounded-xl bg-white/5 p-4 border border-white/10 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">Type</label>
                      <select
                        value={calculatorData.total_discount_type}
                        onChange={(e) =>
                          updateCalculatorData("total_discount_type", e.target.value)
                        }
                        className="w-full rounded-lg border border-white/20 bg-slate-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">Value</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={calculatorData.total_discount_value}
                        onChange={(e) =>
                          updateCalculatorData("total_discount_value", e.target.value)
                        }
                        className="w-full rounded-lg border border-white/20 bg-slate-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModernCard>

          {children ? <div className="space-y-4">{children}</div> : null}

          {/* Billing Settings */}
          <ModernCard padding="lg" className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Billing settings</h3>
                <p className="text-sm text-slate-500">
                  Align pricing with the customer’s billing country.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Country<span className="text-red-500">*</span>
                </label>
                {isCountryLocked ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium h-[42px] flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {(countries as any).find(
                        (c: any) => (c.iso2 || c.code || "").toUpperCase() === selectedCountryCode
                      )?.name || selectedCountryCode}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      <Lock className="h-3 w-3" /> Default
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedCountryCode}
                    onSelect={(c: any) => handleCountrySelect(c?.id)}
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
                <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 h-[42px]">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  {selectedCurrency}
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Workloads Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-lg font-semibold text-slate-900">Virtual machine workloads</h3>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {calculatorData.pricing_requests?.length} Configured
              </span>
            </div>

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
                  errors={(errors?.[`pricing_requests.${index}`] as any) || {}}
                  isLastItem={calculatorData.pricing_requests.length === (1 as any)}
                  regions={regions as any}
                  isRegionsFetching={isRegionsFetching}
                />
              ))}
            </div>

            <div className="flex justify-center py-2">
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

          {/* Silo Storage Card */}
          <ModernCard padding="lg" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Object storage commitments</h3>
                <p className="text-sm text-slate-500">
                  Add committed object storage tiers to the estimate.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Region<span className="text-red-500">*</span>
                </label>
                <SelectableInput
                  options={
                    regions?.map((region) => ({ id: region.code, name: region.name as any })) || []
                  }
                  value={storageItem.region}
                  searchValue={searchTerms.region}
                  onSearchChange={(value) => setSearchTerms((prev) => ({ ...prev, region: value }))}
                  onSelect={handleStorageRegionSelect}
                  placeholder="Search regions"
                  isLoading={isRegionsFetching}
                  disabled={isRegionsFetching}
                  hasError={Boolean(storageErrors.region)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Tier<span className="text-red-500">*</span>
                </label>
                <SelectableInput
                  options={
                    (objectStorageTiers as any)?.map(({ product, pricing }: any) => ({
                      id: product.productable_id,
                      name: `${product.name} • ${formatCurrency(pricing?.effective?.price_local, pricing?.effective?.currency) || "N/A"}`,
                    })) || []
                  }
                  value={storageItem.tier_id ?? undefined}
                  searchValue={searchTerms.tier}
                  onSearchChange={(value) => setSearchTerms((prev) => ({ ...prev, tier: value }))}
                  onSelect={handleStorageTierSelect}
                  placeholder="Select tier"
                  disabled={!storageItem.region}
                  isLoading={isObjectStorageFetching}
                  hasError={Boolean(storageErrors.tier_id)}
                />
              </div>

              <ModernInput
                label="Quantity (GB)"
                type="number"
                min="1"
                value={storageItem.quantity}
                onChange={(e) => updateStorageItem("quantity", parseInt(e.target.value) || 0)}
                error={storageErrors.quantity}
              />

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <ModernInput
                    label="Term (months)"
                    type="number"
                    min="1"
                    value={storageItem.months}
                    onChange={(e) => updateStorageItem("months", parseInt(e.target.value) || 0)}
                    error={storageErrors.months}
                  />
                </div>
                <ModernButton
                  variant="secondary"
                  onClick={addObjectStorageItem}
                  leftIcon={<Plus className="h-4 w-4" />}
                  className="mb-[2px] h-[44px]"
                >
                  Add
                </ModernButton>
              </div>
            </div>

            {storageItems.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700">Added storage</h4>
                <div className="space-y-2">
                  {storageItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                          <Inbox className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.product_name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} GB • {item.months} months • {item.unit_summary}
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
