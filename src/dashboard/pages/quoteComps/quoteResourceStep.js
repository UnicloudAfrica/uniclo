import React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

const QuoteResourceStep = ({
  formData,
  errors,
  updateFormData,
  handleSelectChange,
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
}) => {
  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const metaFromEntry = (entry) => {
    const product = entry?.product ?? entry ?? {};
    const pricing = entry?.pricing ?? {};
    const effective = pricing?.effective ?? pricing ?? {};
    return {
      id:
        product?.productable_id ??
        product?.id ??
        entry?.productable_id ??
        entry?.id ??
        "",
      name: product?.name ?? entry?.name ?? "",
      price: effective?.price_local ?? effective?.unit_amount ?? null,
      currency: effective?.currency ?? "USD",
    };
  };

  return (
    <div className="w-full">
      <div className="t mb-8">
        <h3 className="text-xl font-semibold text-gray-800">
          Add Configurations
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl mx-auto">
          Configure and add one or more pricing items to this quote.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
        {/* Left Column: Form */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
            New Configuration
          </h4>

          <div>
            <label
              htmlFor="region"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Region<span className="text-red-500">*</span>
            </label>
            <select
              id="region"
              value={formData.region}
              onChange={(e) => updateFormData("region", e.target.value)}
              className={`w-full input-field ${
                errors.region ? "border-red-500" : ""
              }`}
              disabled={isRegionsFetching}
            >
              <option value="">Select Region</option>
              {regions?.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
            {errors.region && (
              <p className="text-red-500 text-xs mt-1">{errors.region}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="compute_instance_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Compute Instance<span className="text-red-500">*</span>
            </label>
            <select
              id="compute_instance_id"
              value={formData.compute_instance_id || ""}
              onChange={(e) =>
                updateFormData("compute_instance_id", e.target.value)
              }
              className={`w-full input-field ${
                errors.compute_instance_id ? "border-red-500" : ""
              }`}
              disabled={isComputerInstancesFetching || !formData.region}
            >
              <option value="">Select Compute Instance</option>
              {isComputerInstancesFetching ? (
                <option disabled>Loading...</option>
              ) : computerInstances && computerInstances.length > 0 ? (
                computerInstances.map((entry) => {
                  const meta = metaFromEntry(entry);
                  return (
                    <option key={meta.id} value={meta.id}>
                      {meta.name} - {formatCurrency(meta.price, meta.currency)}
                    </option>
                  );
                })
              ) : (
                <option disabled>No compute instances available</option>
              )}
            </select>
            {errors.compute_instance_id && (
              <p className="text-red-500 text-xs mt-1">
                {errors.compute_instance_id}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="os_image_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              OS Image<span className="text-red-500">*</span>
            </label>
            <select
              id="os_image_id"
              value={formData.os_image_id || ""}
              onChange={(e) => updateFormData("os_image_id", e.target.value)}
              className={`w-full input-field ${
                errors.os_image_id ? "border-red-500" : ""
              }`}
              disabled={isOsImagesFetching || !formData.region}
            >
              <option value="">Select OS Image</option>
              {isOsImagesFetching ? (
                <option disabled>Loading...</option>
              ) : osImages && osImages.length > 0 ? (
                osImages.map((entry) => {
                  const meta = metaFromEntry(entry);
                  return (
                    <option key={meta.id} value={meta.id}>
                      {meta.name} - {formatCurrency(meta.price, meta.currency)}
                    </option>
                  );
                })
              ) : (
                <option disabled>No OS images available</option>
              )}
            </select>
            {errors.os_image_id && (
              <p className="text-red-500 text-xs mt-1">{errors.os_image_id}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="months"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Term (Months)<span className="text-red-500">*</span>
              </label>
              <input
                id="months"
                type="number"
                value={formData.months}
                onChange={(e) => updateFormData("months", e.target.value)}
                className={`w-full input-field ${
                  errors.months ? "border-red-500" : ""
                }`}
                min="1"
              />
              {errors.months && (
                <p className="text-red-500 text-xs mt-1">{errors.months}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="number_of_instances"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Number of Instances<span className="text-red-500">*</span>
              </label>
              <input
                id="number_of_instances"
                type="number"
                value={formData.number_of_instances}
                onChange={(e) =>
                  updateFormData("number_of_instances", e.target.value)
                }
                className={`w-full input-field ${
                  errors.number_of_instances ? "border-red-500" : ""
                }`}
                min="1"
              />
              {errors.number_of_instances && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.number_of_instances}
                </p>
              )}
            </div>
          </div>

          <h5 className="text-md font-semibold text-gray-600 pt-4 border-t">
            Storage
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="volume_type_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Volume Type<span className="text-red-500">*</span>
              </label>
              <select
                id="volume_type_id"
                value={formData.volume_type_id || ""}
                onChange={(e) =>
                  updateFormData("volume_type_id", e.target.value)
                }
                className={`w-full input-field ${
                  errors.volume_type_id ? "border-red-500" : ""
                }`}
                disabled={isEbsVolumesFetching || !formData.region}
              >
                <option value="">Select Volume Type</option>
                {isEbsVolumesFetching ? (
                  <option disabled>Loading...</option>
                ) : ebsVolumes && ebsVolumes.length > 0 ? (
                  ebsVolumes.map((entry) => {
                    const meta = metaFromEntry(entry);
                    return (
                      <option key={meta.id} value={meta.id}>
                        {meta.name} - {formatCurrency(meta.price, meta.currency)}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>No volume types available</option>
                )}
              </select>
              {errors.volume_type_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.volume_type_id}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="storage_size_gb"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Storage Size (GB)<span className="text-red-500">*</span>
              </label>
              <input
                id="storage_size_gb"
                type="number"
                value={formData.storage_size_gb}
                onChange={(e) =>
                  updateFormData("storage_size_gb", e.target.value)
                }
                className={`w-full input-field ${
                  errors.storage_size_gb ? "border-red-500" : ""
                }`}
                min="1"
              />
            </div>
          </div>
          <h5 className="text-md font-semibold text-gray-600 pt-4 border-t">
            Networking (Optional)
          </h5>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bandwidth_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bandwidth
              </label>
              <select
                id="bandwidth_id"
                value={formData.bandwidth_id || ""}
                onChange={(e) => updateFormData("bandwidth_id", e.target.value)}
                className="w-full input-field"
                disabled={isBandwidthsFetching || !formData.region}
              >
                <option value="">Select Bandwidth</option>
                {isBandwidthsFetching ? (
                  <option disabled>Loading...</option>
                ) : bandwidths && bandwidths.length > 0 ? (
                  bandwidths.map((entry) => {
                    const meta = metaFromEntry(entry);
                    return (
                      <option key={meta.id} value={meta.id}>
                        {meta.name} - {formatCurrency(meta.price, meta.currency)}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>No bandwidth options available</option>
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor="bandwidth_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bandwidth Count
              </label>
              <input
                id="bandwidth_count"
                type="number"
                value={formData.bandwidth_count}
                onChange={(e) =>
                  updateFormData("bandwidth_count", e.target.value)
                }
                className={`w-full input-field ${
                  errors.bandwidth_count ? "border-red-500" : ""
                }`}
                min="0"
                disabled={!formData.bandwidth_id}
              />
              {errors.bandwidth_count && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.bandwidth_count}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="floating_ip_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Floating IP
              </label>
              <select
                id="floating_ip_id"
                value={formData.floating_ip_id || ""}
                onChange={(e) =>
                  updateFormData("floating_ip_id", e.target.value)
                }
                className="w-full input-field"
                disabled={isFloatingIpsFetching || !formData.region}
              >
                <option value="">Select Floating IP</option>
                {isFloatingIpsFetching ? (
                  <option disabled>Loading...</option>
                ) : floatingIps && floatingIps.length > 0 ? (
                  floatingIps.map((entry) => {
                    const meta = metaFromEntry(entry);
                    return (
                      <option key={meta.id} value={meta.id}>
                        {meta.name} - {formatCurrency(meta.price, meta.currency)}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>No floating IPs available</option>
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor="floating_ip_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Floating IP Count
              </label>
              <input
                id="floating_ip_count"
                type="number"
                value={formData.floating_ip_count}
                onChange={(e) =>
                  updateFormData("floating_ip_count", e.target.value)
                }
                className={`w-full input-field ${
                  errors.floating_ip_count ? "border-red-500" : ""
                }`}
                min="0"
                disabled={!formData.floating_ip_id}
              />
              {errors.floating_ip_count && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.floating_ip_count}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cross_connect_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Cross Connect
              </label>
              <select
                id="cross_connect_id"
                value={formData.cross_connect_id || ""}
                onChange={(e) =>
                  updateFormData("cross_connect_id", e.target.value)
                }
                className="w-full input-field"
                disabled={isCrossConnectsFetching || !formData.region}
              >
                <option value="">Select Cross Connect</option>
                {isCrossConnectsFetching ? (
                  <option disabled>Loading...</option>
                ) : crossConnects && crossConnects.length > 0 ? (
                  crossConnects.map((entry) => {
                    const meta = metaFromEntry(entry);
                    return (
                      <option key={meta.id} value={meta.id}>
                        {meta.name} - {formatCurrency(meta.price, meta.currency)}
                      </option>
                    );
                  })
                ) : (
                  <option disabled>No cross connects available</option>
                )}
              </select>
            </div>
            <div>
              <label
                htmlFor="cross_connect_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Cross Connect Count
              </label>
              <input
                id="cross_connect_count"
                type="number"
                value={formData.cross_connect_count}
                onChange={(e) =>
                  updateFormData("cross_connect_count", e.target.value)
                }
                className={`w-full input-field ${
                  errors.cross_connect_count ? "border-red-500" : ""
                }`}
                min="0"
                disabled={!formData.cross_connect_id}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={onAddRequest}
              className="flex items-center gap-2 px-6 py-2 bg-[#288DD1] text-white font-medium rounded-md hover:bg-[#1976D2] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add to Quote
            </button>
          </div>
        </div>

        {/* Right Column: List of added configurations */}
        <div className="mt-8 lg:mt-0">
          <div className="sticky top-28">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quote Items
              </h3>
              {pricingRequests.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {pricingRequests.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-md text-sm border shadow-sm"
                    >
                      <span className="font-medium text-gray-700">
                        {req.number_of_instances}x {req._display.compute} (
                        {req._display.storage}, {req._display.os})
                      </span>
                      <button
                        onClick={() => onRemoveRequest(index)}
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No items added to the quote yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteResourceStep;
