// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  useFetchProductPricing,
  useFetchGeneralRegions,
  useFetchCountries,
} from "../../../hooks/resource";
import { formatRegionName } from "../../../utils/regionUtils";
import { getCurrencySymbol } from "../../../utils/resource";
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
  const [currentItem, setCurrentItem] = useState({
    region: "",
    compute_instance_id: null,
    os_image_id: null,
    months: 1,
    number_of_instances: 1,
    volume_type_id: null,
    storage_size_gb: "",
    bandwidth_id: null,
    bandwidth_count: 0,
    floating_ip_id: null,
    floating_ip_count: 0,
    cross_connect_id: null,
  });

  const [itemErrors, setItemErrors] = useState({});
  const [storageItem, setStorageItem] = useState({
    region: "",
    tier_id: null,
    quantity: 1,
    months: 1,
  });
  const [storageErrors, setStorageErrors] = useState({});

  const resolveTierUnitPrice = (tier: any) => {
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

  const resolveTierCurrency = (tier: any) =>
    tier?.pricing?.effective?.currency ||
    tier?.pricing?.tenant?.currency ||
    tier?.pricing?.admin?.currency ||
    tier?.currency ||
    calculatorData.currency_code ||
    "USD";

  const formatTierLabel = (tier: any) => {
    const currency = resolveTierCurrency(tier);
    const symbol = getCurrencySymbol(currency);
    const price = resolveTierUnitPrice(tier).toFixed(4);

    return `${tier.product?.name || tier.product_name || "Tier"} • ${symbol}${price}`;
  };

  // Hooks
  const { data: regions, isFetching: isRegionsFetching } = useFetchGeneralRegions();
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

  const handleCountrySelect = (value: any) => {
    const upper = value ? value.toUpperCase() : "";
    const currency = resolveCurrencyForCountry(upper);
    onCountryChange?.(upper, currency);
  };

  useEffect(() => {
    setStorageItem({ region: "", tier_id: null, quantity: 1, months: 1 });
    setStorageErrors({});
    setCurrentItem({
      region: "",
      compute_instance_id: null,
      os_image_id: null,
      months: 1,
      number_of_instances: 1,
      volume_type_id: null,
      storage_size_gb: "",
      bandwidth_id: null,
      bandwidth_count: 0,
      floating_ip_id: null,
      floating_ip_count: 0,
      cross_connect_id: null,
    });
    setItemErrors({});
  }, [selectedCountryCode]);

  useEffect(() => {
    if (!selectedCountryCode) return;
    const resolved = resolveCurrencyForCountry(selectedCountryCode);
    if (calculatorData.currency_code && calculatorData.currency_code.toUpperCase() === resolved) {
      return;
    }
    handleCountrySelect(selectedCountryCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryCode, resolveCurrencyForCountry]);

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(currentItem.region, "compute_instance", {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    });
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchProductPricing(
    currentItem.region,
    "os_image",
    {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    }
  );
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } = useFetchProductPricing(
    currentItem.region,
    "volume_type",
    {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    }
  );
  const { data: bandwidths, isFetching: isBandwidthsFetching } = useFetchProductPricing(
    currentItem.region,
    "bandwidth",
    {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    }
  );
  const { data: floatingIps, isFetching: isFloatingIpsFetching } = useFetchProductPricing(
    currentItem.region,
    "ip",
    {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    }
  );
  const { data: crossConnects, isFetching: isCrossConnectsFetching } = useFetchProductPricing(
    currentItem.region,
    "cross_connect",
    {
      enabled: !!currentItem.region,
      countryCode: calculatorData.country_code,
    }
  );
  const { data: objectStorageTiers, isFetching: isObjectStorageFetching } = useFetchProductPricing(
    storageItem.region,
    "object_storage_configuration",
    {
      enabled: !!storageItem.region,
      countryCode: calculatorData.country_code,
    }
  );

  const inputClass =
    "block w-full rounded-md border-gray-300 focus:border-[--theme-color] focus:ring-[--theme-color] sm:text-sm input-field";

  const storageItems = calculatorData.object_storage_items || [];

  const updateCurrentItem = (field: any, value: any) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
    setItemErrors((prev) => ({ ...prev, [field]: null }));
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
    if (!currentItem.volume_type_id) newErrors.volume_type_id = "Volume type is required.";
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
    if (validateCurrentItem()) {
      const computeName =
        computerInstances?.find(
          (c) => c.product.productable_id === parseInt(currentItem.compute_instance_id)
        )?.product.name || "N/A";

      const osName =
        osImages?.find((o) => o.product.productable_id === parseInt(currentItem.os_image_id))
          ?.product.name || "N/A";

      const newRequest = {
        ...currentItem,
        compute_instance_id: parseInt(currentItem.compute_instance_id),
        os_image_id: parseInt(currentItem.os_image_id),
        months: parseInt(currentItem.months),
        number_of_instances: parseInt(currentItem.number_of_instances),
        volume_types: [
          {
            volume_type_id: parseInt(currentItem.volume_type_id),
            storage_size_gb: parseInt(currentItem.storage_size_gb),
          },
        ],
        bandwidth_id: currentItem.bandwidth_id ? parseInt(currentItem.bandwidth_id) : null,
        floating_ip_id: currentItem.floating_ip_id ? parseInt(currentItem.floating_ip_id) : null,
        cross_connect_id: currentItem.cross_connect_id
          ? parseInt(currentItem.cross_connect_id)
          : null,
        _display: {
          compute: computeName,
          os: osName,
          storage: `${currentItem.storage_size_gb} GB`,
        },
      };

      // Remove the individual fields that are now in volume_types
      delete newRequest.volume_type_id;
      delete newRequest.storage_size_gb;

      onAddRequest(newRequest);

      // Reset form
      setCurrentItem({
        region: "",
        compute_instance_id: null,
        os_image_id: null,
        months: 1,
        number_of_instances: 1,
        volume_type_id: null,
        storage_size_gb: "",
        bandwidth_id: null,
        bandwidth_count: 0,
        floating_ip_id: null,
        floating_ip_count: 0,
        cross_connect_id: null,
      });
      setItemErrors({});
    }
  };

  const addObjectStorageItem = () => {
    if (!validateStorageItem()) return;

    const selectedTier = objectStorageTiers?.find(
      (tier) => String(tier.product?.productable_id) === String(storageItem.tier_id)
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
        region: storageItem.region,
        summary: `${quantity} x ${months} month${months === 1 ? "" : "s"}`,
      },
    };

    onAddStorageItem?.(itemPayload);
    setStorageItem({
      region: "",
      tier_id: null,
      quantity: 1,
      months: 1,
    });
    setStorageErrors({});
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">Billing Country</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country<span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCountryCode}
              onChange={(event) => handleCountrySelect(event.target.value)}
              className={`${inputClass}`}
              disabled={isCountriesFetching}
            >
              <option value="">Select Country</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {selectedCurrency}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Infrastructure Configuration</h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure your infrastructure components and add them to the calculation.
        </p>
      </div>

      {/* Object Storage Section */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-4">Object Storage Add-on</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
            {isRegionsFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={storageItem.region || ""}
                onChange={(e) => updateStorageItem("region", e.target.value)}
                className={`${inputClass} ${storageErrors.region ? "border-red-500" : ""}`}
              >
                <option value="">Select Region</option>
                {regions?.map((region: any) => {
                  const value = region.region || region.code;
                  return (
                    <option key={value} value={value}>
                      {formatRegionName(region.label || value)}
                    </option>
                  );
                })}
              </select>
            )}
            {storageErrors.region && (
              <p className="text-red-500 text-xs mt-1">{storageErrors.region}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier *</label>
            {isObjectStorageFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={storageItem.tier_id || ""}
                onChange={(e) => updateStorageItem("tier_id", e.target.value)}
                className={`${inputClass} ${storageErrors.tier_id ? "border-red-500" : ""}`}
                disabled={!storageItem.region}
              >
                <option value="">Select Tier</option>
                {objectStorageTiers?.map((tier: any) => (
                  <option
                    key={tier.product?.productable_id ?? tier.id}
                    value={tier.product?.productable_id}
                  >
                    {formatTierLabel(tier)}
                  </option>
                ))}
              </select>
            )}
            {storageErrors.tier_id && (
              <p className="text-red-500 text-xs mt-1">{storageErrors.tier_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              value={storageItem.quantity}
              onChange={(e) => updateStorageItem("quantity", Number(e.target.value))}
              className={`${inputClass} ${storageErrors.quantity ? "border-red-500" : ""}`}
            />
            {storageErrors.quantity && (
              <p className="text-red-500 text-xs mt-1">{storageErrors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months) *</label>
            <input
              type="number"
              min="1"
              value={storageItem.months}
              onChange={(e) => updateStorageItem("months", Number(e.target.value))}
              className={`${inputClass} ${storageErrors.months ? "border-red-500" : ""}`}
            />
            {storageErrors.months && (
              <p className="text-red-500 text-xs mt-1">{storageErrors.months}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={addObjectStorageItem}
            className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Object Storage
          </button>
        </div>

        {storageItems.length > 0 && (
          <div className="mt-4 space-y-3">
            {storageItems.map((item, index) => (
              <div
                key={`${item.region}-${item.productable_id}-${index}`}
                className="bg-gray-50 border border-gray-200 rounded-md px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {item.product_name || "Object Storage Tier"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Region: {item.region} • {item.quantity} unit
                    {item.quantity === 1 ? "" : "s"} • {item.months} month
                    {item.months === 1 ? "" : "s"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total: {getCurrencySymbol(item.currency || selectedCurrency)}
                    {Number(item.total_price || 0).toFixed(4)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveStorageItem?.(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Item Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Add Infrastructure Item</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
            {isRegionsFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={currentItem.region || ""}
                onChange={(e) => updateCurrentItem("region", e.target.value)}
                className={`${inputClass} ${itemErrors.region ? "border-red-500" : ""}`}
              >
                <option value="">Select Region</option>
                {regions?.map((region: any) => (
                  <option key={region.region} value={region.region}>
                    {formatRegionName(region.label)}
                  </option>
                ))}
              </select>
            )}
            {itemErrors.region && <p className="text-red-500 text-xs mt-1">{itemErrors.region}</p>}
          </div>

          {/* Compute Instance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compute Instance *
            </label>
            {isComputerInstancesFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={currentItem.compute_instance_id || ""}
                onChange={(e) => updateCurrentItem("compute_instance_id", e.target.value)}
                className={`${inputClass} ${
                  itemErrors.compute_instance_id ? "border-red-500" : ""
                }`}
                disabled={!currentItem.region}
              >
                <option value="">Select Instance Type</option>
                {computerInstances?.map((instance: any) => (
                  <option
                    key={instance.product.productable_id}
                    value={instance.product.productable_id}
                  >
                    {instance.product.name}
                  </option>
                ))}
              </select>
            )}
            {itemErrors.compute_instance_id && (
              <p className="text-red-500 text-xs mt-1">{itemErrors.compute_instance_id}</p>
            )}
          </div>

          {/* OS Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OS Image *</label>
            {isOsImagesFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={currentItem.os_image_id || ""}
                onChange={(e) => updateCurrentItem("os_image_id", e.target.value)}
                className={`${inputClass} ${itemErrors.os_image_id ? "border-red-500" : ""}`}
                disabled={!currentItem.region}
              >
                <option value="">Select OS</option>
                {osImages?.map((os: any) => (
                  <option key={os.product.productable_id} value={os.product.productable_id}>
                    {os.product.name}
                  </option>
                ))}
              </select>
            )}
            {itemErrors.os_image_id && (
              <p className="text-red-500 text-xs mt-1">{itemErrors.os_image_id}</p>
            )}
          </div>

          {/* Months */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months) *</label>
            <input
              type="number"
              min="1"
              value={currentItem.months}
              onChange={(e) => updateCurrentItem("months", e.target.value)}
              className={`${inputClass} ${itemErrors.months ? "border-red-500" : ""}`}
            />
            {itemErrors.months && <p className="text-red-500 text-xs mt-1">{itemErrors.months}</p>}
          </div>

          {/* Number of Instances */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instances *</label>
            <input
              type="number"
              min="1"
              value={currentItem.number_of_instances}
              onChange={(e) => updateCurrentItem("number_of_instances", e.target.value)}
              className={`${inputClass} ${itemErrors.number_of_instances ? "border-red-500" : ""}`}
            />
            {itemErrors.number_of_instances && (
              <p className="text-red-500 text-xs mt-1">{itemErrors.number_of_instances}</p>
            )}
          </div>

          {/* Volume Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Storage Type *</label>
            {isEbsVolumesFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={currentItem.volume_type_id || ""}
                onChange={(e) => updateCurrentItem("volume_type_id", e.target.value)}
                className={`${inputClass} ${itemErrors.volume_type_id ? "border-red-500" : ""}`}
                disabled={!currentItem.region}
              >
                <option value="">Select Storage Type</option>
                {ebsVolumes?.map((volume: any) => (
                  <option key={volume.product.productable_id} value={volume.product.productable_id}>
                    {volume.product.name}
                  </option>
                ))}
              </select>
            )}
            {itemErrors.volume_type_id && (
              <p className="text-red-500 text-xs mt-1">{itemErrors.volume_type_id}</p>
            )}
          </div>

          {/* Storage Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Size (GB) *
            </label>
            <input
              type="number"
              min="1"
              value={currentItem.storage_size_gb}
              onChange={(e) => updateCurrentItem("storage_size_gb", e.target.value)}
              className={`${inputClass} ${itemErrors.storage_size_gb ? "border-red-500" : ""}`}
              placeholder="100"
            />
            {itemErrors.storage_size_gb && (
              <p className="text-red-500 text-xs mt-1">{itemErrors.storage_size_gb}</p>
            )}
          </div>

          {/* Bandwidth (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bandwidth (Optional)
            </label>
            <select
              value={currentItem.bandwidth_id || ""}
              onChange={(e) => updateCurrentItem("bandwidth_id", e.target.value)}
              className={inputClass}
              disabled={!currentItem.region}
            >
              <option value="">No Bandwidth</option>
              {bandwidths?.map((bandwidth: any) => (
                <option
                  key={bandwidth.product.productable_id}
                  value={bandwidth.product.productable_id}
                >
                  {bandwidth.product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bandwidth Count */}
          {currentItem.bandwidth_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bandwidth Count
              </label>
              <input
                type="number"
                min="0"
                value={currentItem.bandwidth_count}
                onChange={(e) => updateCurrentItem("bandwidth_count", e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {/* Floating IP (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Floating IP (Optional)
            </label>
            <select
              value={currentItem.floating_ip_id || ""}
              onChange={(e) => updateCurrentItem("floating_ip_id", e.target.value)}
              className={inputClass}
              disabled={!currentItem.region}
            >
              <option value="">No Floating IP</option>
              {floatingIps?.map((ip: any) => (
                <option key={ip.product.productable_id} value={ip.product.productable_id}>
                  {ip.product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Floating IP Count */}
          {currentItem.floating_ip_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floating IP Count
              </label>
              <input
                type="number"
                min="0"
                value={currentItem.floating_ip_count}
                onChange={(e) => updateCurrentItem("floating_ip_count", e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={addCurrentItem}
            className="px-4 py-2 bg-[--theme-color] text-white rounded-md hover:bg-[--secondary-color] transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Calculation
          </button>
        </div>
      </div>

      {/* Current Items List */}
      {calculatorData.pricing_requests.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-4">
            Items to Calculate ({calculatorData.pricing_requests.length})
          </h4>
          <div className="space-y-3">
            {calculatorData.pricing_requests.map((request, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {request.number_of_instances}x {request._display?.compute || "Compute"}(
                    {request._display?.storage || "Storage"})
                  </div>
                  <div className="text-sm text-gray-600">
                    OS: {request._display?.os || "N/A"} • Region: {request.region} • Term:{" "}
                    {request.months} month(s)
                  </div>
                </div>
                <button
                  onClick={() => onRemoveRequest(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{errors.general}</p>
        </div>
      )}
    </div>
  );
};

export default CalculatorConfigStep;
