import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Server,
  HardDrive,
  Network,
  Layers,
  BadgePercent,
  CircleDollarSign,
  Inbox,
} from "lucide-react";
import ModernCard from "../../components/ModernCard";
import ModernButton from "../../components/ModernButton";
import ModernInput from "../../components/ModernInput";
import SelectableInput from "../../components/SelectableInput";
import { useFetchProductPricing, useFetchCountries } from "../../../hooks/resource";
import { getCurrencySymbol } from "../../../utils/resource";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useFormattedRegions } from "../../../utils/regionUtils";

const createInitialItemState = () => ({
  region: "",
  compute_instance_id: null,
  os_image_id: null,
  months: 1,
  number_of_instances: 1,
  volume_type_id: null,
  storage_size_gb: 1,
  bandwidth_id: null,
  bandwidth_count: "",
  floating_ip_id: null,
  floating_ip_count: "",
  cross_connect_id: null,
});

const createInitialSearchState = () => ({
  region: "",
  compute: "",
  os: "",
  volume: "",
  bandwidth: "",
  floatingIp: "",
  crossConnect: "",
});

const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return null;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch (error) {
    return `${currency || ""} ${amount}`.trim();
  }
};

const CalculatorConfigStep = ({
  calculatorData,
  errors,
  updateCalculatorData,
  onAddRequest,
  onRemoveRequest,
  onAddStorageItem,
  onRemoveStorageItem,
  onCountryChange,
}) => {
  const [currentItem, setCurrentItem] = useState(() => createInitialItemState());
  const [searchTerms, setSearchTerms] = useState(() => createInitialSearchState());
  const [itemErrors, setItemErrors] = useState({});
  const [isNetworkingOpen, setIsNetworkingOpen] = useState(false);
  const [storageItem, setStorageItem] = useState({
    region: "",
    tier_id: null,
    quantity: 1,
    months: 1,
  });
  const [storageErrors, setStorageErrors] = useState({});

  const resolveTierUnitPrice = (tier) => {
    if (!tier) return 0;
    const effective = tier.pricing?.effective ?? {};
    const tenant = tier.pricing?.tenant ?? {};
    const admin = tier.pricing?.admin ?? {};

    const value = Number(
      effective.price_local ??
        effective.price_usd ??
        tenant.price_local ??
        tenant.price_usd ??
        admin.price_local ??
        admin.price_usd ??
        tier.price_local ??
        tier.price_usd ??
        tier.unit_price ??
        0
    );

    return Number.isFinite(value) ? value : 0;
  };

  const resolveTierCurrency = (tier) =>
    tier?.pricing?.effective?.currency ||
    tier?.pricing?.tenant?.currency ||
    tier?.pricing?.admin?.currency ||
    tier?.currency ||
    calculatorData.currency_code ||
    "USD";

  const formatTierLabel = (tier) => {
    const currency = resolveTierCurrency(tier);
    const symbol = getCurrencySymbol(currency);
    const price = resolveTierUnitPrice(tier).toFixed(4);

    return `${tier.product?.name || tier.product_name || "Tier"} • ${symbol}${price}`;
  };

  const { data: rawRegions, isFetching: isRegionsFetching } = useFetchRegions();
  const regions = useFormattedRegions(rawRegions);
  const { data: countries = [], isFetching: isCountriesFetching } = useFetchCountries();

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

  const handleCountrySelect = (value) => {
    if (!onCountryChange) return;
    const upper = value ? value.toUpperCase() : "";
    const currency = resolveCurrencyForCountry(upper);
    onCountryChange(upper, currency);
  };

  useEffect(() => {
    if (!onCountryChange || !selectedCountryCode) return;
    const resolved = resolveCurrencyForCountry(selectedCountryCode);
    if (
      calculatorData.currency_code &&
      calculatorData.currency_code.toUpperCase() === resolved
    ) {
      return;
    }
    handleCountrySelect(selectedCountryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryCode, resolveCurrencyForCountry]);

  useEffect(() => {
    setStorageItem({ region: "", tier_id: null, quantity: 1, months: 1 });
    setStorageErrors({});
    resetCurrentItem();
  }, [selectedCountryCode]);

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(currentItem.region, "compute_instance", {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    });
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(currentItem.region, "os_image", {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    });
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchProductPricing(currentItem.region, "volume_type", {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    });
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchProductPricing(currentItem.region, "bandwidth", {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    });
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchProductPricing(currentItem.region, "ip", {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    });
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchProductPricing(currentItem.region, "cross_connect", {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    });
  const { data: objectStorageTiers, isFetching: isObjectStorageFetching } =
    useFetchProductPricing(storageItem.region, "object_storage_configuration", {
      enabled: !!storageItem.region,
      countryCode: calculatorData.country_code,
    });

  const updateCurrentItem = (field, value) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
    setItemErrors((prev) => ({ ...prev, [field]: null }));
  };

  const storageItems = calculatorData.object_storage_items || [];

  const resetCurrentItem = () => {
    setCurrentItem(() => createInitialItemState());
    setSearchTerms(() => createInitialSearchState());
    setItemErrors({});
    setIsNetworkingOpen(false);
  };

  const updateStorageItem = (field, value) => {
    setStorageItem((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "region") {
        next.tier_id = null;
      }
      return next;
    });
    setStorageErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleRegionSelect = (option) => {
    const regionCode = option?.id || "";

    setCurrentItem((prev) => ({
      ...prev,
      region: regionCode,
      compute_instance_id: null,
      os_image_id: null,
      volume_type_id: null,
      storage_size_gb: 1,
      bandwidth_id: null,
      bandwidth_count: "",
      floating_ip_id: null,
      floating_ip_count: "",
      cross_connect_id: null,
    }));

    setSearchTerms({
      region: option?.name || "",
      compute: "",
      os: "",
      volume: "",
      bandwidth: "",
      floatingIp: "",
      crossConnect: "",
    });

    setItemErrors((prev) => ({
      ...prev,
      region: null,
      compute_instance_id: null,
      os_image_id: null,
      volume_type_id: null,
    }));

    setIsNetworkingOpen(false);
  };

  const handleSelectableChange = (field) => (option) => {
    const value = option ? String(option.id) : null;
    updateCurrentItem(field, value);
    setSearchTerms((prev) => ({
      ...prev,
      [
        field === "compute_instance_id"
          ? "compute"
          : field === "os_image_id"
          ? "os"
          : field === "volume_type_id"
          ? "volume"
          : field === "bandwidth_id"
          ? "bandwidth"
          : field === "floating_ip_id"
          ? "floatingIp"
          : "crossConnect"
      ]: option ? option.name : "",
    }));

    if (field === "bandwidth_id" || field === "floating_ip_id" || field === "cross_connect_id") {
      setIsNetworkingOpen(Boolean(option));
    }
  };

  const handleNumericChange = (field, min = 0) => (event) => {
    const rawValue = event.target.value;
    if (rawValue === "") {
      updateCurrentItem(field, "");
      return;
    }
    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) return;
    updateCurrentItem(field, Math.max(numericValue, min));
  };

  const validateCurrentItem = () => {
    const newErrors = {};

    if (!currentItem.region) newErrors.region = "Region is required.";
    if (!currentItem.compute_instance_id)
      newErrors.compute_instance_id = "Compute instance is required.";
    if (!currentItem.os_image_id) newErrors.os_image_id = "OS image is required.";
    if (!currentItem.months || currentItem.months < 1)
      newErrors.months = "Term must be at least 1 month.";
    if (!currentItem.number_of_instances || currentItem.number_of_instances < 1)
      newErrors.number_of_instances = "At least 1 instance is required.";
    if (!currentItem.volume_type_id)
      newErrors.volume_type_id = "Volume type is required.";
    if (!currentItem.storage_size_gb || currentItem.storage_size_gb < 1)
      newErrors.storage_size_gb = "Storage size must be at least 1 GB.";

    setItemErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStorageItem = () => {
    const newErrors = {};

    if (!storageItem.region) newErrors.region = "Region is required.";
    if (!storageItem.tier_id) newErrors.tier_id = "Select an object storage tier.";
    if (!storageItem.quantity || storageItem.quantity < 1)
      newErrors.quantity = "Quantity must be at least 1.";
    if (!storageItem.months || storageItem.months < 1)
      newErrors.months = "Term must be at least 1 month.";

    setStorageErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addCurrentItem = () => {
    if (!validateCurrentItem()) return;

    const computeMatch = computerInstances?.find(
      ({ product }) =>
        String(product.productable_id) === String(currentItem.compute_instance_id)
    );
    const osMatch = osImages?.find(
      ({ product }) =>
        String(product.productable_id) === String(currentItem.os_image_id)
    );

    const newRequest = {
      ...currentItem,
      compute_instance_id: parseInt(currentItem.compute_instance_id, 10),
      os_image_id: parseInt(currentItem.os_image_id, 10),
      months: parseInt(currentItem.months, 10),
      number_of_instances: parseInt(currentItem.number_of_instances, 10),
      volume_types: [
        {
          volume_type_id: parseInt(currentItem.volume_type_id, 10),
          storage_size_gb: parseInt(currentItem.storage_size_gb, 10),
        },
      ],
      bandwidth_id: currentItem.bandwidth_id
        ? parseInt(currentItem.bandwidth_id, 10)
        : null,
      bandwidth_count: currentItem.bandwidth_count
        ? parseInt(currentItem.bandwidth_count, 10)
        : 0,
      floating_ip_id: currentItem.floating_ip_id
        ? parseInt(currentItem.floating_ip_id, 10)
        : null,
      floating_ip_count: currentItem.floating_ip_count
        ? parseInt(currentItem.floating_ip_count, 10)
        : 0,
      cross_connect_id: currentItem.cross_connect_id
        ? parseInt(currentItem.cross_connect_id, 10)
        : null,
      _display: {
        compute: computeMatch?.product?.name || "Compute",
        os: osMatch?.product?.name || "OS",
        storage: `${currentItem.storage_size_gb} GB`,
      },
    };

    delete newRequest.volume_type_id;
    delete newRequest.storage_size_gb;

    onAddRequest(newRequest);
    resetCurrentItem();
  };

  const addObjectStorageItem = () => {
    if (!validateStorageItem()) return;

    const selectedTier = objectStorageTiers?.find(
      (tier) =>
        String(tier.product?.productable_id) === String(storageItem.tier_id)
    );

    if (!selectedTier) {
      setStorageErrors((prev) => ({
        ...prev,
        tier_id: "Unable to determine pricing for this tier.",
      }));
      return;
    }

    const unitPrice = resolveTierUnitPrice(selectedTier);
    const quantity = Number(storageItem.quantity);
    const months = Number(storageItem.months);
    const totalPrice = Number((unitPrice * quantity * months).toFixed(4));

    const itemPayload = {
      region: storageItem.region,
      pricing_id: selectedTier.id,
      productable_id: selectedTier.product?.productable_id,
      product_name: selectedTier.product?.name,
      provider: selectedTier.provider,
      quantity,
      months,
      unit_price: unitPrice,
      total_price: totalPrice,
      currency: resolveTierCurrency(selectedTier),
      _display: {
        name: selectedTier.product?.name || "Object Storage Tier",
        summary: `${quantity} unit${quantity === 1 ? "" : "s"} • ${months} month${
          months === 1 ? "" : "s"
        }`,
      },
    };

    onAddStorageItem?.(itemPayload);
    setStorageItem({ region: "", tier_id: null, quantity: 1, months: 1 });
    setStorageErrors({});
  };

  const findSelectedItem = (collection, id) =>
    collection?.find(({ product }) => String(product.productable_id) === String(id));

  const selectedCompute = findSelectedItem(
    computerInstances,
    currentItem.compute_instance_id
  );
  const selectedOs = findSelectedItem(osImages, currentItem.os_image_id);
  const selectedVolume = findSelectedItem(ebsVolumes, currentItem.volume_type_id);
  const selectedBandwidth = findSelectedItem(bandwidths, currentItem.bandwidth_id);
  const selectedFloatingIp = findSelectedItem(
    floatingIps,
    currentItem.floating_ip_id
  );
  const selectedCrossConnect = findSelectedItem(
    crossConnects,
    currentItem.cross_connect_id
  );

  const numberOfInstances = Number(currentItem.number_of_instances) || 0;
  const termMonths = Number(currentItem.months) || 0;
  const storageSize = Number(currentItem.storage_size_gb) || 0;
  const bandwidthUnits = Number(currentItem.bandwidth_count) || 0;
  const floatingIpCount = Number(currentItem.floating_ip_count) || 0;

  const computePrice = selectedCompute?.pricing?.effective?.price_local || 0;
  const osPrice = selectedOs?.pricing?.effective?.price_local || 0;
  const storageUnitPrice = selectedVolume?.pricing?.effective?.price_local || 0;
  const bandwidthUnitPrice = selectedBandwidth?.pricing?.effective?.price_local || 0;
  const floatingIpUnitPrice = selectedFloatingIp?.pricing?.effective?.price_local || 0;
  const crossConnectPrice =
    selectedCrossConnect?.pricing?.effective?.price_local || 0;

  const currency =
    selectedCompute?.pricing?.effective?.currency ||
    selectedOs?.pricing?.effective?.currency ||
    selectedVolume?.pricing?.effective?.currency ||
    selectedBandwidth?.pricing?.effective?.currency ||
    selectedFloatingIp?.pricing?.effective?.currency ||
    selectedCrossConnect?.pricing?.effective?.currency ||
    calculatorData.currency_code ||
    "USD";

  const monthlyStorageCost = storageUnitPrice * storageSize;
  const monthlyBandwidthCost = bandwidthUnitPrice * bandwidthUnits;
  const monthlyFloatingIpCost = floatingIpUnitPrice * floatingIpCount;

  const baseInstanceCost = numberOfInstances * (computePrice + osPrice);
  const monthlyCrossConnectCost = selectedCrossConnect ? crossConnectPrice : 0;

  const estimatedMonthlyCost =
    baseInstanceCost +
    monthlyStorageCost +
    monthlyBandwidthCost +
    monthlyFloatingIpCost +
    monthlyCrossConnectCost;

  const hasEstimate =
    selectedCompute &&
    selectedOs &&
    selectedVolume &&
    storageSize > 0 &&
    numberOfInstances > 0 &&
    termMonths > 0;

  const estimatedTermCost = estimatedMonthlyCost * termMonths;
  const instanceMonths = numberOfInstances * termMonths;

  const isPricingLoading =
    isComputerInstancesFetching ||
    isOsImagesFetching ||
    isEbsVolumesFetching ||
    isBandwidthsFetching ||
    isFloatingIpsFetching ||
    isCrossConnectsFetching;

  const pricePillClassName =
    "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm";

  const summaryItems = [
    {
      label: "Instance months",
      value:
        instanceMonths > 0
          ? `${numberOfInstances} × ${termMonths} = ${instanceMonths}`
          : "Set term and instances",
    },
    {
      label: "Monthly est.",
      value: isPricingLoading
        ? "Fetching pricing"
        : hasEstimate
        ? formatCurrency(estimatedMonthlyCost, currency)
        : "Select configuration",
    },
    {
      label: "Term est.",
      value: isPricingLoading
        ? "Fetching pricing"
        : hasEstimate
        ? formatCurrency(estimatedTermCost, currency)
        : "Waiting for estimate",
    },
    {
      label: "Currency",
      value: selectedCurrency,
    },
  ];

  const emptyQueueIllustration = (
    <div className="flex h-full min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary-500 shadow-sm">
        <Inbox className="h-8 w-8" />
      </div>
      <p className="text-base font-semibold text-slate-800">
        No configurations yet
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Add your first configuration to build a pricing request.
      </p>
      <ModernButton
        className="mt-4"
        variant="primary"
        size="sm"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Add configuration
      </ModernButton>
    </div>
  );

  const renderPricePill = (priceLabel) =>
    priceLabel ? <span className={pricePillClassName}>{priceLabel}</span> : null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-6 2xl:grid 2xl:grid-cols-[minmax(0,720px)_minmax(320px,1fr)] 2xl:items-start">
        <ModernCard
          padding="lg"
          className="relative flex h-full flex-col gap-6 bg-gradient-to-br from-white via-slate-50 to-white"
        >
          <header className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Build configuration
              </h3>
              <p className="text-sm text-slate-500">
                Assemble compute, storage, and networking elements to scope a pricing request.
              </p>
            </div>
          </header>

          <div className="sticky top-0 z-20 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CircleDollarSign className="h-4 w-4 text-primary-500" />
              Live summary
            </div>
            <div className="grid w-full grid-cols-1 gap-2 text-xs text-slate-500 sm:w-auto sm:grid-cols-3 sm:gap-3 sm:text-sm">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-0 flex-col rounded-xl bg-slate-50 px-3 py-2 text-left"
                >
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {item.label}
                  </span>
                  <span className="mt-1 font-medium text-slate-700">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <ModernCard padding="sm" variant="ghost" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Billing country</h4>
                  <p className="text-xs text-slate-500">
                    Select the country to align pricing currency and tax calculations.
                  </p>
                </div>
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
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Currency
                  </label>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                    {selectedCurrency}
                  </div>
                </div>
              </div>
            </ModernCard>

            <section className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Core configuration</h4>
                <p className="text-xs text-slate-500">
                  Choose region, compute profile, image, and runtime term to begin your quote.
                </p>
              </div>

              <ModernCard
                padding="sm"
                variant="glass"
                className="space-y-5"
              >
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
                      regions?.map((region) => ({
                        id: region.code,
                        name: region.name,
                      })) || []
                    }
                    value={currentItem.region}
                    searchValue={searchTerms.region}
                    onSearchChange={(value) =>
                      setSearchTerms((prev) => ({ ...prev, region: value }))
                    }
                    onSelect={handleRegionSelect}
                    placeholder="Search regions"
                    isLoading={isRegionsFetching}
                    disabled={isRegionsFetching}
                    hasError={Boolean(itemErrors.region)}
                    emptyMessage="No regions found"
                  />
                  {itemErrors.region && (
                    <p className="text-xs font-medium text-red-600">
                      {itemErrors.region}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        Compute instance<span className="text-red-500">*</span>
                      </label>
                      {renderPricePill(
                        formatCurrency(
                          selectedCompute?.pricing?.effective?.price_local,
                          selectedCompute?.pricing?.effective?.currency
                        ) && `${formatCurrency(
                          selectedCompute?.pricing?.effective?.price_local,
                          selectedCompute?.pricing?.effective?.currency
                        )}/mo`
                      )}
                    </div>
                    <SelectableInput
                      options={
                        computerInstances?.map(({ product, pricing }) => ({
                          id: product.productable_id,
                          name: `${product.name} • ${
                            formatCurrency(
                              pricing?.effective?.price_local,
                              pricing?.effective?.currency
                            ) || "N/A"
                          }`,
                        })) || []
                      }
                      value={currentItem.compute_instance_id}
                      searchValue={searchTerms.compute}
                      onSearchChange={(value) =>
                        setSearchTerms((prev) => ({ ...prev, compute: value }))
                      }
                      onSelect={handleSelectableChange("compute_instance_id")}
                      placeholder="Search compute profiles"
                      disabled={!currentItem.region}
                      isLoading={isComputerInstancesFetching}
                      hasError={Boolean(itemErrors.compute_instance_id)}
                      emptyMessage="No compute options"
                    />
                    {itemErrors.compute_instance_id && (
                      <p className="text-xs font-medium text-red-600">
                        {itemErrors.compute_instance_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        OS image<span className="text-red-500">*</span>
                      </label>
                      {renderPricePill(
                        formatCurrency(
                          selectedOs?.pricing?.effective?.price_local,
                          selectedOs?.pricing?.effective?.currency
                        ) && `${formatCurrency(
                          selectedOs?.pricing?.effective?.price_local,
                          selectedOs?.pricing?.effective?.currency
                        )}/mo`
                      )}
                    </div>
                    <SelectableInput
                      options={
                        osImages?.map(({ product, pricing }) => ({
                          id: product.productable_id,
                          name: `${product.name} • ${
                            formatCurrency(
                              pricing?.effective?.price_local,
                              pricing?.effective?.currency
                            ) || "N/A"
                          }`,
                        })) || []
                      }
                      value={currentItem.os_image_id}
                      searchValue={searchTerms.os}
                      onSearchChange={(value) =>
                        setSearchTerms((prev) => ({ ...prev, os: value }))
                      }
                      onSelect={handleSelectableChange("os_image_id")}
                      placeholder="Search OS images"
                      disabled={!currentItem.region}
                      isLoading={isOsImagesFetching}
                      hasError={Boolean(itemErrors.os_image_id)}
                      emptyMessage="No OS images"
                    />
                    {itemErrors.os_image_id && (
                      <p className="text-xs font-medium text-red-600">
                        {itemErrors.os_image_id}
                      </p>
                    )}
                  </div>

                  <ModernInput
                    label="Term (months)"
                    type="number"
                    min="1"
                    value={currentItem.months}
                    onChange={handleNumericChange("months", 1)}
                    error={itemErrors.months}
                    helper="Min 1 month"
                  />

                  <ModernInput
                    label="Number of instances"
                    type="number"
                    min="1"
                    value={currentItem.number_of_instances}
                    onChange={handleNumericChange("number_of_instances", 1)}
                    error={itemErrors.number_of_instances}
                    helper="Min 1 instance"
                  />
                </div>
              </ModernCard>
            </section>

            <section className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Object storage tiers
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add S3-compatible capacity commitments to include in this quote.
                  </p>
                </div>
              </div>

              <ModernCard padding="sm" variant="glass" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Region<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={storageItem.region || ""}
                      onChange={(event) => updateStorageItem("region", event.target.value)}
                      className={`input-field ${storageErrors.region ? "border-red-500" : ""}`}
                    >
                      <option value="">Select region</option>
                      {regions.map((region) => {
                        const value = region.code || region.region || region.id;
                        const label = region.name || region.label || value;
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    {storageErrors.region && (
                      <p className="mt-1 text-xs font-medium text-red-600">{storageErrors.region}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tier<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={storageItem.tier_id || ""}
                      onChange={(event) => updateStorageItem("tier_id", event.target.value)}
                      className={`input-field ${storageErrors.tier_id ? "border-red-500" : ""}`}
                      disabled={!storageItem.region}
                    >
                      <option value="">Select tier</option>
                      {objectStorageTiers?.map((tier) => (
                        <option
                          key={tier.product?.productable_id ?? tier.id}
                          value={tier.product?.productable_id}
                        >
                          {formatTierLabel(tier)}
                        </option>
                      ))}
                    </select>
                    {storageErrors.tier_id && (
                      <p className="mt-1 text-xs font-medium text-red-600">{storageErrors.tier_id}</p>
                    )}
                  </div>

                  <ModernInput
                    label="Quantity"
                    type="number"
                    min="1"
                    value={storageItem.quantity}
                    onChange={(event) =>
                      updateStorageItem("quantity", Number(event.target.value))
                    }
                    error={storageErrors.quantity}
                    helper="Number of allocations"
                  />

                  <ModernInput
                    label="Term (months)"
                    type="number"
                    min="1"
                    value={storageItem.months}
                    onChange={(event) =>
                      updateStorageItem("months", Number(event.target.value))
                    }
                    error={storageErrors.months}
                    helper="Billing term"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <span>
                    Pricing pulls from admin product tiers. Adjust under Admin → Products to change defaults.
                  </span>
                  <ModernButton size="sm" variant="primary" onClick={addObjectStorageItem}>
                    Add tier
                  </ModernButton>
                </div>
              </ModernCard>

              {storageItems.length > 0 && (
                <ModernCard padding="sm" variant="ghost" className="space-y-3">
                  <header className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700">
                      Added object storage
                    </div>
                    <div className="text-xs text-slate-500">
                      {storageItems.length} item{storageItems.length === 1 ? "" : "s"}
                    </div>
                  </header>
                  <div className="space-y-2">
                    {storageItems.map((item, index) => (
                      <div
                        key={`${item.region}-${item.productable_id}-${index}`}
                        className="flex flex-col rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            {item.product_name || "Object Storage Tier"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Region: {item.region} • {item.quantity} unit{item.quantity === 1 ? "" : "s"} • {item.months} month{item.months === 1 ? "" : "s"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Total: {formatCurrency(item.total_price, item.currency || selectedCurrency)}
                          </div>
                        </div>
                        <ModernButton
                          size="xs"
                          variant="ghost"
                          className="mt-3 text-red-600 sm:mt-0"
                          onClick={() => onRemoveStorageItem?.(index)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                        >
                          Remove
                        </ModernButton>
                      </div>
                    ))}
                  </div>
                </ModernCard>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Storage</h4>
                  <p className="text-xs text-slate-500">
                    Specify storage backing this configuration and track its cost contribution.
                  </p>
                </div>
              </div>

              <ModernCard padding="sm" variant="glass" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        Volume type<span className="text-red-500">*</span>
                      </label>
                      {renderPricePill(
                        formatCurrency(
                          selectedVolume?.pricing?.effective?.price_local,
                          selectedVolume?.pricing?.effective?.currency
                        ) && `${formatCurrency(
                          selectedVolume?.pricing?.effective?.price_local,
                          selectedVolume?.pricing?.effective?.currency
                        )}/GB`
                      )}
                    </div>
                    <SelectableInput
                      options={
                        ebsVolumes?.map(({ product, pricing }) => ({
                          id: product.productable_id,
                          name: `${product.name} • ${
                            formatCurrency(
                              pricing?.effective?.price_local,
                              pricing?.effective?.currency
                            ) || "N/A"
                          }`,
                        })) || []
                      }
                      value={currentItem.volume_type_id}
                      searchValue={searchTerms.volume}
                      onSearchChange={(value) =>
                        setSearchTerms((prev) => ({ ...prev, volume: value }))
                      }
                      onSelect={handleSelectableChange("volume_type_id")}
                      placeholder="Search volume types"
                      disabled={!currentItem.region}
                      isLoading={isEbsVolumesFetching}
                      hasError={Boolean(itemErrors.volume_type_id)}
                      emptyMessage="No volume types"
                    />
                    {itemErrors.volume_type_id && (
                      <p className="text-xs font-medium text-red-600">
                        {itemErrors.volume_type_id}
                      </p>
                    )}
                  </div>

                  <ModernInput
                    label="Storage size (GB)"
                    type="number"
                    min="1"
                    value={currentItem.storage_size_gb}
                    onChange={handleNumericChange("storage_size_gb", 1)}
                    error={itemErrors.storage_size_gb}
                    helper="Min 1 GB"
                  />
                </div>
              </ModernCard>
            </section>

            <section className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-1 items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Network className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Networking (optional)</h4>
                    <p className="text-xs text-slate-500">
                      Attach bandwidth, IPs, and cross connects when needed.
                    </p>
                  </div>
                </div>
                <ModernButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsNetworkingOpen((prev) => !prev)}
                >
                  {isNetworkingOpen ? "Hide" : "Configure"}
                </ModernButton>
              </div>

              <ModernCard padding="sm" variant="glass" className="space-y-4">
                {isNetworkingOpen ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">
                          Bandwidth
                        </label>
                        {renderPricePill(
                          formatCurrency(
                            selectedBandwidth?.pricing?.effective?.price_local,
                            selectedBandwidth?.pricing?.effective?.currency
                          ) && `${formatCurrency(
                            selectedBandwidth?.pricing?.effective?.price_local,
                            selectedBandwidth?.pricing?.effective?.currency
                          )}/unit`
                        )}
                      </div>
                      <SelectableInput
                        options={
                          bandwidths?.map(({ product, pricing }) => ({
                            id: product.productable_id,
                            name: `${product.name} • ${
                              formatCurrency(
                                pricing?.effective?.price_local,
                                pricing?.effective?.currency
                              ) || "N/A"
                            }`,
                          })) || []
                        }
                        value={currentItem.bandwidth_id}
                        searchValue={searchTerms.bandwidth}
                        onSearchChange={(value) =>
                          setSearchTerms((prev) => ({ ...prev, bandwidth: value }))
                        }
                        onSelect={handleSelectableChange("bandwidth_id")}
                        placeholder="Add bandwidth"
                        disabled={!currentItem.region}
                        isLoading={isBandwidthsFetching}
                        emptyMessage="No bandwidth options"
                      />
                    </div>
                    <ModernInput
                      label="Bandwidth units"
                      type="number"
                      min="0"
                      value={currentItem.bandwidth_count}
                      onChange={handleNumericChange("bandwidth_count", 0)}
                      disabled={!currentItem.bandwidth_id}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">
                          Floating IP
                        </label>
                        {renderPricePill(
                          formatCurrency(
                            selectedFloatingIp?.pricing?.effective?.price_local,
                            selectedFloatingIp?.pricing?.effective?.currency
                          ) && `${formatCurrency(
                            selectedFloatingIp?.pricing?.effective?.price_local,
                            selectedFloatingIp?.pricing?.effective?.currency
                          )}/IP`
                        )}
                      </div>
                      <SelectableInput
                        options={
                          floatingIps?.map(({ product, pricing }) => ({
                            id: product.productable_id,
                            name: `${product.name} • ${
                              formatCurrency(
                                pricing?.effective?.price_local,
                                pricing?.effective?.currency
                              ) || "N/A"
                            }`,
                          })) || []
                        }
                        value={currentItem.floating_ip_id}
                        searchValue={searchTerms.floatingIp}
                        onSearchChange={(value) =>
                          setSearchTerms((prev) => ({ ...prev, floatingIp: value }))
                        }
                        onSelect={handleSelectableChange("floating_ip_id")}
                        placeholder="Add floating IP"
                        disabled={!currentItem.region}
                        isLoading={isFloatingIpsFetching}
                        emptyMessage="No floating IPs"
                      />
                    </div>
                    <ModernInput
                      label="IP count"
                      type="number"
                      min="0"
                      value={currentItem.floating_ip_count}
                      onChange={handleNumericChange("floating_ip_count", 0)}
                      disabled={!currentItem.floating_ip_id}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700">
                          Cross connect
                        </label>
                        {renderPricePill(
                          formatCurrency(
                            selectedCrossConnect?.pricing?.effective?.price_local,
                            selectedCrossConnect?.pricing?.effective?.currency
                          ) && `${formatCurrency(
                            selectedCrossConnect?.pricing?.effective?.price_local,
                            selectedCrossConnect?.pricing?.effective?.currency
                          )}/mo`
                        )}
                      </div>
                      <SelectableInput
                        options={
                          crossConnects?.map(({ product, pricing }) => ({
                            id: product.productable_id,
                            name: `${product.name} • ${
                              formatCurrency(
                                pricing?.effective?.price_local,
                                pricing?.effective?.currency
                              ) || "N/A"
                            }`,
                          })) || []
                        }
                        value={currentItem.cross_connect_id}
                        searchValue={searchTerms.crossConnect}
                        onSearchChange={(value) =>
                          setSearchTerms((prev) => ({ ...prev, crossConnect: value }))
                        }
                        onSelect={handleSelectableChange("cross_connect_id")}
                        placeholder="Attach cross connect"
                        disabled={!currentItem.region}
                        isLoading={isCrossConnectsFetching}
                        emptyMessage="No cross connects"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Expand to add bandwidth, floating IPs, or cross connects when needed.
                  </p>
                )}
              </ModernCard>
            </section>
          </div>

          <div className="mt-auto rounded-2xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur 2xl:sticky 2xl:bottom-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Add the configuration to the calculation queue or reset to start over.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <ModernButton
                  variant="ghost"
                  onClick={resetCurrentItem}
                  className="text-slate-600 hover:text-slate-800"
                >
                  Reset configuration
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={addCurrentItem}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add to queue
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        <ModernCard
          padding="lg"
          className="flex min-h-[360px] w-full flex-col gap-6 2xl:sticky 2xl:top-24 2xl:min-w-[320px]"
        >
          <header className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify_center rounded-2xl bg-slate-100 text-slate-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Calculation queue
              </h3>
              <p className="text-sm text-slate-500">
                Manage queued configurations before running the pricing engine.
              </p>
            </div>
          </header>

          <div className="flex-1 min-h-[200px]">
            {calculatorData.pricing_requests.length === 0 ? (
              emptyQueueIllustration
            ) : (
              <div className="space-y-5">
                {calculatorData.pricing_requests.map((item, idx) => {
                  const addOns = [];
                  if (item.bandwidth_count) {
                    addOns.push(
                      `${item.bandwidth_count} bandwidth unit${
                        item.bandwidth_count === 1 ? "" : "s"
                      }`
                    );
                  }
                  if (item.floating_ip_count) {
                    addOns.push(
                      `${item.floating_ip_count} floating IP${
                        item.floating_ip_count === 1 ? "" : "s"
                      }`
                    );
                  }
                  if (item.cross_connect_id) {
                    addOns.push("Cross connect");
                  }

                  return (
                    <div
                      key={`${item.region}-${idx}`}
                      className="flex w-full flex-col gap-4 sm:flex-row sm:items-stretch"
                    >
                      <div className="flex items-center gap-3 sm:w-12 sm:flex-col sm:items-center sm:gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-600">
                          {idx + 1}
                        </span>
                        {idx !== calculatorData.pricing_requests.length - 1 && (
                          <span className="hidden h-full w-px bg-slate-200 sm:block" />
                        )}
                      </div>
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Configuration {idx + 1}
                            </p>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Server className="h-4 w-4 text-primary-500" />
                              {item._display?.compute || "Compute"}
                              <span className="text-slate-400">•</span>
                              {item._display?.os || "OS"}
                            </div>
                            <p className="text-xs text-slate-500">
                              {item.number_of_instances} instance
                              {item.number_of_instances === 1 ? "" : "s"} • {item.months} month
                              {item.months === 1 ? "" : "s"} • Region {item.region}
                            </p>
                          </div>
                          <ModernButton
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => onRemoveRequest(idx)}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                          >
                            Remove
                          </ModernButton>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1">
                            <HardDrive className="h-3 w-3 text-slate-500" />
                            {item._display?.storage || "—"}
                          </span>
                          {addOns.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1">
                              <Network className="h-3 w-3 text-slate-500" />
                              {addOns.join(" • ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ModernCard>
      </section>

      <ModernCard padding="lg" variant="outlined" className="space-y-5">
        <header className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <BadgePercent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">
              Total discount
            </h3>
            <p className="text-sm text-slate-500">
              Apply an optional global discount before calculating totals.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={calculatorData.apply_total_discount}
              onChange={(e) =>
                updateCalculatorData("apply_total_discount", e.target.checked)
              }
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
                onChange={(e) =>
                  updateCalculatorData("total_discount_type", e.target.value)
                }
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
              onChange={(e) =>
                updateCalculatorData("total_discount_value", e.target.value)
              }
              error={errors.total_discount_value}
            />
            <div className="sm:col-span-2">
              <ModernInput
                label="Discount label"
                value={calculatorData.total_discount_label}
                onChange={(e) =>
                  updateCalculatorData("total_discount_label", e.target.value)
                }
                placeholder="Optional note that appears on invoice/quote"
              />
            </div>
          </div>
        )}
      </ModernCard>
    </div>
  );
};

export default CalculatorConfigStep;
