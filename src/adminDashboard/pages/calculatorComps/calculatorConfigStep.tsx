// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  CircleDollarSign,
  Inbox,
  Layers,
  Plus,
  Server,
  Trash2,
  HardDrive,
  Loader2,
} from "lucide-react";
import { ModernButton } from "../../../shared/components/ui";
import ModernCard from "../../../shared/components/ui/ModernCard";
import ModernInput from "../../../shared/components/ui/ModernInput";
import SelectableInput from "../../../shared/components/ui/SelectableInput.jsx";
import { useFetchCountries, useFetchProductPricing } from "../../../hooks/resource";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useFormattedRegions } from "../../../utils/regionUtils";
import { getCurrencySymbol } from "../../../utils/resource";
import WorkloadCard from "./WorkloadCard";

const createInitialItemState = () => ({
  region: "",
  compute_instance_id: null,
  os_image_id: null,
  months: 1,
  number_of_instances: 1,
  volume_type_id: null,
  storage_size_gb: 50,
  volumes: [],
  bandwidth_id: null,
  bandwidth_count: "",
  floating_ip_id: null,
  floating_ip_count: "",
  cross_connect_id: null,
});

const formatCurrency = (amount: any, currency: any) => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return null;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${currency || ""} ${amount}`.trim();
  }
};

const CalculatorConfigStep = ({
  calculatorData,
  errors,
  updateCalculatorData,
  onAddStorageItem,
  onRemoveStorageItem,
  onCountryChange,
  children,
}) => {
  const [storageItem, setStorageItem] = useState({
    region: "",
    tier_id: null,
    quantity: 1,
    months: 1,
  });
  const [storageErrors, setStorageErrors] = useState({});
  const [searchTerms, setSearchTerms] = useState({
    region: "",
    tier: "",
  });

  const { data: countries = [], isFetching: isCountriesFetching } = useFetchCountries();
  const { data: rawRegions, isFetching: isRegionsFetching } = useFetchRegions();
  const regions = useFormattedRegions(rawRegions);

  const selectedCountryCode = useMemo(
    () => (calculatorData.country_code || "US").toUpperCase(),
    [calculatorData.country_code]
  );

  const resolveCurrencyForCountry = useMemo(() => {
    return (code) => {
      if (!code || !Array.isArray(countries)) {
        return calculatorData.currency_code || "USD";
      }

      const match = countries.find((country) => {
        const iso2 = (country.iso2 || country.code || "").toUpperCase();
        return iso2 === code.toUpperCase();
      });

      if (!match) {
        return calculatorData.currency_code || "USD";
      }

      return (
        match.currency_code ||
        match.currency ||
        match.currencyCode ||
        match.currency_symbol ||
        match.currencySymbol ||
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
    storageItem.region,
    "object_storage_configuration",
    {
      enabled: !!storageItem.region,
      countryCode: calculatorData.country_code,
    }
  );

  const handleCountrySelect = (value: any) => {
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

  const updateWorkload = (index: any, newData: any) => {
    const newRequests = [...(calculatorData.pricing_requests || [])];
    newRequests[index] = newData;
    updateCalculatorData("pricing_requests", newRequests);
  };

  const addWorkload = () => {
    const newRequests = [...(calculatorData.pricing_requests || []), createInitialItemState()];
    updateCalculatorData("pricing_requests", newRequests);
  };

  const removeWorkload = (index: any) => {
    const newRequests = [...(calculatorData.pricing_requests || [])];
    newRequests.splice(index, 1);
    updateCalculatorData("pricing_requests", newRequests);
  };

  const updateStorageItem = (field: any, value: any) => {
    setStorageItem((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "region") {
        next.tier_id = null;
      }
      return next;
    });
    setStorageErrors((prev) => ({ ...prev, [field]: null }));
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
    const newErrors = {};

    if (!storageItem.region) newErrors.region = "Region is required.";
    if (!storageItem.tier_id) newErrors.tier_id = "Select a tier.";
    if (!storageItem.quantity || storageItem.quantity < 1)
      newErrors.quantity = "Quantity must be at least 1.";
    if (!storageItem.months || storageItem.months < 1)
      newErrors.months = "Term must be at least 1 month.";

    setStorageErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addObjectStorageItem = () => {
    if (!validateStorageItem()) return;

    const tier = objectStorageTiers?.find(
      (item) => String(item.product?.productable_id ?? item.id) === String(storageItem.tier_id)
    );

    const symbol = getCurrencySymbol(
      tier?.pricing?.effective?.currency || storageItem.currency || selectedCurrency
    );

    const formattedTier = {
      ...storageItem,
      tier_id: parseInt(storageItem.tier_id, 10),
      quantity: parseInt(storageItem.quantity, 10),
      months: parseInt(storageItem.months, 10),
      product_name: tier?.product?.name || tier?.product_name || "Object Storage Tier",
      total_price:
        (tier?.pricing?.effective?.price_local || 0) *
        (storageItem.quantity || 0) *
        (storageItem.months || 0),
      currency: tier?.pricing?.effective?.currency || selectedCurrency,
      unit_summary: `${symbol}${(tier?.pricing?.effective?.price_local || 0).toFixed(4)}/unit`,
    };

    onAddStorageItem?.(formattedTier);
    setStorageItem({ region: "", tier_id: null, quantity: 1, months: 1 });
    setStorageErrors({});
    setSearchTerms({ region: "", tier: "" });
  };

  const summaryItems = [
    {
      label: "Currency",
      value: selectedCurrency,
    },
    {
      label: "Workloads",
      value: calculatorData.pricing_requests?.length || 0,
    },
  ];

  const storageItems = calculatorData.object_storage_items || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <ModernCard
            padding="lg"
            className="space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                  <Server className="h-3.5 w-3.5" />
                  Infrastructure builder
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Build a pricing scenario</h2>
                <p className="text-sm text-slate-200/80">
                  Configure multiple workloads, storage, and network components.
                </p>
              </div>
              <div className="grid w-full max-w-xs grid-cols-2 gap-3 md:w-auto">
                {summaryItems.map((item: any) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-slate-300/80">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </ModernCard>

          <ModernCard padding="lg" className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Billing settings</h3>
              <p className="text-sm text-slate-500">
                Align pricing with the customer’s billing country and currency.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Country<span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCountryCode}
                  onChange={(event) => handleCountrySelect(event.target.value)}
                  className="input-field"
                  disabled={isCountriesFetching}
                >
                  <option value="">Select country</option>
                  {Array.isArray(countries) &&
                    countries.map((country: any) => {
                      const value = (country.iso2 || country.code || "").toUpperCase();
                      const label = country.name || country.label || value;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  {selectedCurrency}
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Workload Cards List */}
          <div className="space-y-6">
            {calculatorData.pricing_requests?.map((request, index) => (
              <WorkloadCard
                key={index}
                index={index}
                data={request}
                onChange={(newData) => updateWorkload(index, newData)}
                onRemove={() => removeWorkload(index)}
                countryCode={calculatorData.country_code}
                currencyCode={selectedCurrency}
                errors={errors[`pricing_requests.${index}`]}
              />
            ))}
          </div>

          <div className="flex justify-center py-4">
            <ModernButton
              variant="primary"
              onClick={addWorkload}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add another workload
            </ModernButton>
          </div>

          {/* Object Storage Card */}
          <ModernCard padding="lg" className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Object storage commitments</h3>
              <p className="text-sm text-slate-500">
                Add committed object storage tiers to the estimate.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Region<span className="text-red-500">*</span>
                  </label>
                  {isRegionsFetching && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading
                    </span>
                  )}
                </div>
                <SelectableInput
                  options={
                    regions?.map((region: any) => ({
                      id: region.code,
                      name: region.name,
                    })) || []
                  }
                  value={storageItem.region}
                  searchValue={searchTerms.region}
                  onSearchChange={(value) => setSearchTerms((prev) => ({ ...prev, region: value }))}
                  onSelect={handleStorageRegionSelect}
                  placeholder="Search regions"
                  isLoading={isRegionsFetching}
                  disabled={isRegionsFetching}
                  hasError={Boolean(storageErrors.region)}
                  emptyMessage="No regions found"
                />
                {storageErrors.region && (
                  <p className="text-xs font-medium text-red-600">{storageErrors.region}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Tier<span className="text-red-500">*</span>
                  </label>
                </div>
                <SelectableInput
                  options={
                    objectStorageTiers?.map(({ product, pricing }: any) => ({
                      id: product.productable_id,
                      name: `${product.name} • ${
                        formatCurrency(
                          pricing?.effective?.price_local,
                          pricing?.effective?.currency
                        ) || "N/A"
                      }`,
                    })) || []
                  }
                  value={storageItem.tier_id}
                  searchValue={searchTerms.tier}
                  onSearchChange={(value) => setSearchTerms((prev) => ({ ...prev, tier: value }))}
                  onSelect={handleStorageTierSelect}
                  placeholder="Select tier"
                  disabled={!storageItem.region}
                  isLoading={isObjectStorageFetching}
                  hasError={Boolean(storageErrors.tier_id)}
                  emptyMessage="No tiers available"
                />
                {storageErrors.tier_id && (
                  <p className="text-xs font-medium text-red-600">{storageErrors.tier_id}</p>
                )}
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
                  className="mb-[2px]"
                >
                  Add
                </ModernButton>
              </div>
            </div>

            {storageItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Added storage</h4>
                <div className="space-y-2">
                  {storageItems.map((item, idx) => (
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

          {children ? <div className="space-y-4">{children}</div> : null}
        </div>

        <div className="space-y-6 xl:sticky xl:top-24">
          {/* Total Discount Card */}
          <ModernCard padding="lg" variant="outlined" className="space-y-5">
            <header className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <BadgePercent className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Total discount</h3>
                <p className="text-sm text-slate-500">Apply an optional global discount.</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={calculatorData.apply_total_discount}
                  onChange={(e) => updateCalculatorData("apply_total_discount", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-200"
                />
                Enable
              </label>
            </header>

            {calculatorData.apply_total_discount && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Discount type
                  </label>
                  <select
                    value={calculatorData.total_discount_type}
                    onChange={(e) => updateCalculatorData("total_discount_type", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <ModernInput
                  label="Discount value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={calculatorData.total_discount_value}
                  onChange={(e) => updateCalculatorData("total_discount_value", e.target.value)}
                  error={errors.total_discount_value}
                />
                <div className="sm:col-span-2">
                  <ModernInput
                    label="Discount label"
                    value={calculatorData.total_discount_label}
                    onChange={(e) => updateCalculatorData("total_discount_label", e.target.value)}
                    placeholder="Optional note that appears on invoice/quote"
                  />
                </div>
              </div>
            )}
          </ModernCard>
        </div>
      </div>
    </div>
  );
};

export default CalculatorConfigStep;
