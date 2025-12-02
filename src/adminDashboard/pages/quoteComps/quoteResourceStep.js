import React from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Server,
  HardDrive,
  Network,
  Layers,
} from "lucide-react";
import ModernCard from "../../components/ModernCard";
import ModernButton from "../../components/ModernButton";
import ModernInput from "../../components/ModernInput";

const selectBaseClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const QuoteResourceStep = ({
  formData,
  errors,
  updateFormData,
  regions,
  isRegionsFetching,
  computerInstances,
  isComputerInstancesFetching,
  ebsVolumes,
  isEbsVolumesFetching,
  osImages,
  isOsImagesFetching,
  bandwidths = [],
  isBandwidthsFetching,
  floatingIps = [],
  isFloatingIpsFetching,
  crossConnects = [],
  isCrossConnectsFetching,
  onAddRequest,
  pricingRequests,
  onRemoveRequest,
  // Object Storage Props
  objectStorageProducts,
  isObjectStorageProductsFetching,
  onAddObjectStorageRequest,
  objectStorageRequests,
  onRemoveObjectStorageRequest,
}) => {
  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const hasQueuedItems = pricingRequests.length > 0 || objectStorageRequests?.length > 0;

  const selectedOsImage = osImages?.find(
    (img) => img.product.productable_id == formData.os_image_id
  );


  return (
    <div className="space-y-6">
      {errors.general && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <ModernCard padding="xl" className="space-y-6">
          <header className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Configure Resources
              </h3>
              <p className="text-sm text-slate-500">
                Select compute, storage, and networking components to build the
                next configuration for this quote.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Region<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.region}
                onChange={(e) => updateFormData("region", e.target.value)}
                className={`${selectBaseClass} ${errors.region ? "border-red-400" : ""
                  }`}
                disabled={isRegionsFetching}
              >
                <option value="">Select a region</option>
                {regions?.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
              {isRegionsFetching && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading available regions…
                </div>
              )}
              {errors.region && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.region}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Compute Instance<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.compute_instance_id || ""}
                onChange={(e) =>
                  updateFormData("compute_instance_id", e.target.value)
                }
                className={`${selectBaseClass} ${errors.compute_instance_id ? "border-red-400" : ""
                  }`}
                disabled={isComputerInstancesFetching || !formData.region}
              >
                <option value="">Select compute profile</option>
                {isComputerInstancesFetching ? (
                  <option disabled>Loading instances…</option>
                ) : computerInstances && computerInstances.length > 0 ? (
                  computerInstances.map(({ product, pricing }) => (
                    <option key={product.id} value={product.productable_id}>
                      {product.name} •{" "}
                      {formatCurrency(
                        pricing.effective.price_local,
                        pricing.effective.currency
                      )}
                    </option>
                  ))
                ) : (
                  <option disabled>No compute instances available</option>
                )}
              </select>
              {errors.compute_instance_id && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.compute_instance_id}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                OS Image<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.os_image_id || ""}
                onChange={(e) => {
                  updateFormData("os_image_id", e.target.value);
                }}
                className={`${selectBaseClass} ${errors.os_image_id ? "border-red-400" : ""
                  }`}
                disabled={isOsImagesFetching || !formData.region}
              >
                <option value="">Select OS image</option>
                {isOsImagesFetching ? (
                  <option disabled>Loading OS images…</option>
                ) : osImages && osImages.length > 0 ? (
                  osImages.map(({ product, pricing }) => (
                    <option key={product.id} value={product.productable_id}>
                      {product.name} •{" "}
                      {formatCurrency(
                        pricing.effective.price_local,
                        pricing.effective.currency
                      )}
                    </option>
                  ))
                ) : (
                  <option disabled>No OS images available</option>
                )}
              </select>
              {errors.os_image_id && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.os_image_id}
                </p>
              )}
            </div>



            <ModernInput
              label="Term (months)"
              type="number"
              min="1"
              value={formData.months}
              onChange={(e) => updateFormData("months", e.target.value)}
              error={errors.months}
            />
            <ModernInput
              label="Number of instances"
              type="number"
              min="1"
              value={formData.number_of_instances}
              onChange={(e) =>
                updateFormData("number_of_instances", e.target.value)
              }
              error={errors.number_of_instances}
            />
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <HardDrive className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  Storage configuration
                </h4>
                <p className="text-xs text-slate-500">
                  Define storage volumes attached to the compute instance.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Volume type<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.volume_type_id || ""}
                      onChange={(e) =>
                        updateFormData("volume_type_id", e.target.value)
                      }
                      className={`${selectBaseClass} ${errors.volume_type_id ? "border-red-400" : ""
                        }`}
                      disabled={isEbsVolumesFetching || !formData.region}
                    >
                      <option value="">Select volume type</option>
                      {isEbsVolumesFetching ? (
                        <option disabled>Loading volume types…</option>
                      ) : ebsVolumes && ebsVolumes.length > 0 ? (
                        ebsVolumes.map(({ product, pricing }) => (
                          <option key={product.id} value={product.productable_id}>
                            {product.name} •{" "}
                            {formatCurrency(
                              pricing.effective.price_local,
                              pricing.effective.currency
                            )}
                          </option>
                        ))
                      ) : (
                        <option disabled>No volume types available</option>
                      )}
                    </select>
                    {errors.volume_type_id && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.volume_type_id}
                      </p>
                    )}
                  </div>
                  <ModernInput
                    label="Storage size (GB)"
                    type="number"
                    min="1"
                    value={formData.storage_size_gb}
                    onChange={(e) =>
                      updateFormData("storage_size_gb", e.target.value)
                    }
                    error={errors.storage_size_gb}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Network className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Networking (optional)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Attach additional bandwidth, floating IPs, or cross
                      connects.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Bandwidth
                    </label>
                    <select
                      value={formData.bandwidth_id || ""}
                      onChange={(e) =>
                        updateFormData("bandwidth_id", e.target.value)
                      }
                      className={selectBaseClass}
                      disabled={isBandwidthsFetching || !formData.region}
                    >
                      <option value="">Add bandwidth</option>
                      {isBandwidthsFetching ? (
                        <option disabled>Loading bandwidth…</option>
                      ) : bandwidths && bandwidths.length > 0 ? (
                        bandwidths.map(({ product, pricing }) => (
                          <option key={product.id} value={product.productable_id}>
                            {product.name} •{" "}
                            {formatCurrency(
                              pricing.effective.price_local,
                              pricing.effective.currency
                            )}
                          </option>
                        ))
                      ) : (
                        <option disabled>No bandwidth options</option>
                      )}
                    </select>
                  </div>
                  <ModernInput
                    label="Bandwidth units"
                    type="number"
                    min="0"
                    value={formData.bandwidth_count}
                    onChange={(e) =>
                      updateFormData("bandwidth_count", e.target.value)
                    }
                    disabled={!formData.bandwidth_id}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Floating IP
                    </label>
                    <select
                      value={formData.floating_ip_id || ""}
                      onChange={(e) =>
                        updateFormData("floating_ip_id", e.target.value)
                      }
                      className={selectBaseClass}
                      disabled={isFloatingIpsFetching || !formData.region}
                    >
                      <option value="">Add floating IPs</option>
                      {isFloatingIpsFetching ? (
                        <option disabled>Loading floating IPs…</option>
                      ) : floatingIps && floatingIps.length > 0 ? (
                        floatingIps.map(({ product, pricing }) => (
                          <option key={product.id} value={product.productable_id}>
                            {product.name} •{" "}
                            {formatCurrency(
                              pricing.effective.price_local,
                              pricing.effective.currency
                            )}
                          </option>
                        ))
                      ) : (
                        <option disabled>No floating IPs available</option>
                      )}
                    </select>
                  </div>
                  <ModernInput
                    label="IP count"
                    type="number"
                    min="0"
                    value={formData.floating_ip_count}
                    onChange={(e) =>
                      updateFormData("floating_ip_count", e.target.value)
                    }
                    disabled={!formData.floating_ip_id}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cross connect
                    </label>
                    <select
                      value={formData.cross_connect_id || ""}
                      onChange={(e) =>
                        updateFormData("cross_connect_id", e.target.value)
                      }
                      className={selectBaseClass}
                      disabled={isCrossConnectsFetching || !formData.region}
                    >
                      <option value="">Attach cross connect</option>
                      {isCrossConnectsFetching ? (
                        <option disabled>Loading cross connects…</option>
                      ) : crossConnects && crossConnects.length > 0 ? (
                        crossConnects.map(({ product, pricing }) => (
                          <option key={product.id} value={product.productable_id}>
                            {product.name} •{" "}
                            {formatCurrency(
                              pricing.effective.price_local,
                              pricing.effective.currency
                            )}
                          </option>
                        ))
                      ) : (
                        <option disabled>No cross connects available</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ModernButton
              variant="primary"
              onClick={onAddRequest}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add configuration
            </ModernButton>
            <p className="text-xs text-slate-500">
              Each configuration becomes a dedicated line item in the quote.
            </p>
          </div>
        </ModernCard>

        <ModernCard padding="xl" className="space-y-6">
          <header className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Object Storage
              </h3>
              <p className="text-sm text-slate-500">
                Add scalable S3-compatible storage.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Region<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.object_storage_region}
                onChange={(e) => updateFormData("object_storage_region", e.target.value)}
                className={`${selectBaseClass} ${errors.object_storage_region ? "border-red-400" : ""
                  }`}
                disabled={isRegionsFetching}
              >
                <option value="">Select a region</option>
                {regions?.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.object_storage_region && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.object_storage_region}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Storage Tier<span className="text-red-500">*</span>
              </label>
              <select
                value={formData.object_storage_product_id || ""}
                onChange={(e) =>
                  updateFormData("object_storage_product_id", e.target.value)
                }
                className={`${selectBaseClass} ${errors.object_storage_product_id ? "border-red-400" : ""
                  }`}
                disabled={isObjectStorageProductsFetching || !formData.object_storage_region}
              >
                <option value="">Select storage tier</option>
                {isObjectStorageProductsFetching ? (
                  <option disabled>Loading tiers…</option>
                ) : objectStorageProducts && objectStorageProducts.length > 0 ? (
                  objectStorageProducts.map(({ product, pricing }) => (
                    <option key={product.id} value={product.productable_id}>
                      {product.name} •{" "}
                      {formatCurrency(
                        pricing.effective.price_local,
                        pricing.effective.currency
                      )}
                    </option>
                  ))
                ) : (
                  <option disabled>No tiers available</option>
                )}
              </select>
              {errors.object_storage_product_id && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {errors.object_storage_product_id}
                </p>
              )}
            </div>

            <ModernInput
              label="Quantity (GB)"
              type="number"
              min="1"
              value={formData.object_storage_quantity}
              onChange={(e) => updateFormData("object_storage_quantity", e.target.value)}
              error={errors.object_storage_quantity}
            />
            <ModernInput
              label="Term (months)"
              type="number"
              min="1"
              value={formData.object_storage_months}
              onChange={(e) => updateFormData("object_storage_months", e.target.value)}
              error={errors.object_storage_months}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ModernButton
              variant="primary"
              onClick={onAddObjectStorageRequest}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Object Storage
            </ModernButton>
          </div>
        </ModernCard>

        <ModernCard padding="xl" className="space-y-6">
          <header className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Quote queue
              </h3>
              <p className="text-sm text-slate-500">
                Manage configurations already added to this quote.
              </p>
            </div>
          </header>

          {!hasQueuedItems && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
              No configurations added yet. Start by defining resources on the left.
            </div>
          )}

          {hasQueuedItems && (
            <div className="space-y-4">
              {pricingRequests.map((item, idx) => (
                <div
                  key={`${item.region}-${idx}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Configuration {idx + 1}
                      </p>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {item._display?.compute || "Compute"} •{" "}
                        {item._display?.os || "OS"}
                      </h4>
                      <div className="text-xs text-slate-500">
                        Region:{" "}
                        <span className="font-medium text-slate-600">
                          {item.region}
                        </span>{" "}
                        · {item.number_of_instances} instance
                        {item.number_of_instances === 1 ? "" : "s"} for{" "}
                        {item.months} month{item.months === 1 ? "" : "s"}
                      </div>
                    </div>
                    <ModernButton
                      size="sm"
                      variant="danger"
                      onClick={() => onRemoveRequest(idx)}
                      className="shrink-0"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Remove
                    </ModernButton>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-medium text-slate-600">
                        Storage
                      </span>
                      <p className="mt-1 text-slate-500">
                        {item._display?.storage || "—"}
                      </p>
                    </div>
                    {(item.bandwidth_count || item.floating_ip_count) && (
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs">
                        <span className="font-medium text-slate-600">
                          Network
                        </span>
                        <p className="mt-1 text-slate-500">
                          {item.bandwidth_count
                            ? `${item.bandwidth_count} bandwidth unit${item.bandwidth_count === 1 ? "" : "s"
                            }`
                            : ""}
                          {item.bandwidth_count && item.floating_ip_count
                            ? " • "
                            : ""}
                          {item.floating_ip_count
                            ? `${item.floating_ip_count} floating IP${item.floating_ip_count === 1 ? "" : "s"
                            }`
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {objectStorageRequests?.map((item, idx) => (
                <div
                  key={`os-${item.region}-${idx}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Object Storage {idx + 1}
                      </p>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {item._display?.name || "Object Storage"}
                      </h4>
                      <div className="text-xs text-slate-500">
                        Region:{" "}
                        <span className="font-medium text-slate-600">
                          {item.region}
                        </span>{" "}
                        · {item.quantity} GB for{" "}
                        {item.months} month{item.months === 1 ? "" : "s"}
                      </div>
                    </div>
                    <ModernButton
                      size="sm"
                      variant="danger"
                      onClick={() => onRemoveObjectStorageRequest(idx)}
                      className="shrink-0"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Remove
                    </ModernButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModernCard>
      </section>
    </div>
  );
};

export default QuoteResourceStep;
