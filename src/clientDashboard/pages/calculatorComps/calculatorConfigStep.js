import React, { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { 
  useFetchProductPricing,
  useFetchGeneralRegions 
} from "../../../hooks/resource";
import { formatRegionName } from "../../../utils/regionUtils";
const CalculatorConfigStep = ({
  calculatorData,
  errors,
  updateCalculatorData,
  onAddRequest,
  onRemoveRequest,
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

  // Hooks
  const { data: regions, isFetching: isRegionsFetching } =
    useFetchGeneralRegions();

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(currentItem.region, "compute_instance", {
      enabled: !!currentItem.region,
    });
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(currentItem.region, "os_image", {
      enabled: !!currentItem.region,
    });
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchProductPricing(currentItem.region, "volume_type", {
      enabled: !!currentItem.region,
    });
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchProductPricing(currentItem.region, "bandwidth", {
      enabled: !!currentItem.region,
    });
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchProductPricing(currentItem.region, "ip", {
      enabled: !!currentItem.region,
    });
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchProductPricing(currentItem.region, "cross_connect", {
      enabled: !!currentItem.region,
    });

  const inputClass =
    "block w-full rounded-md border-gray-300 focus:border-[--theme-color] focus:ring-[--theme-color] sm:text-sm input-field";

  const updateCurrentItem = (field, value) => {
    setCurrentItem((prev) => ({ ...prev, [field]: value }));
    setItemErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateCurrentItem = () => {
    const newErrors = {};
    if (!currentItem.region) newErrors.region = "Region is required.";
    if (!currentItem.compute_instance_id)
      newErrors.compute_instance_id = "Compute instance is required.";
    if (!currentItem.os_image_id)
      newErrors.os_image_id = "OS image is required.";
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

  const addCurrentItem = () => {
    if (validateCurrentItem()) {
      const computeName =
        computerInstances?.find(
          (c) =>
            c.product.productable_id ===
            parseInt(currentItem.compute_instance_id)
        )?.product.name || "N/A";

      const osName =
        osImages?.find(
          (o) => o.product.productable_id === parseInt(currentItem.os_image_id)
        )?.product.name || "N/A";

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
        bandwidth_id: currentItem.bandwidth_id
          ? parseInt(currentItem.bandwidth_id)
          : null,
        floating_ip_id: currentItem.floating_ip_id
          ? parseInt(currentItem.floating_ip_id)
          : null,
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

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Infrastructure Configuration
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Configure your infrastructure components and add them to the
          calculation.
        </p>
      </div>

      {/* Add New Item Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">
          Add Infrastructure Item
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region *
            </label>
            {isRegionsFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={currentItem.region || ""}
                onChange={(e) => updateCurrentItem("region", e.target.value)}
                className={`${inputClass} ${
                  itemErrors.region ? "border-red-500" : ""
                }`}
              >
                <option value="">Select Region</option>
                {regions?.map((region) => (
                  <option key={region.region} value={region.region}>
                    {formatRegionName(region.label)}
                  </option>
                ))}
              </select>
            )}
            {itemErrors.region && (
              <p className="text-red-500 text-xs mt-1">{itemErrors.region}</p>
            )}
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
                onChange={(e) =>
                  updateCurrentItem("compute_instance_id", e.target.value)
                }
                className={`${inputClass} ${
                  itemErrors.compute_instance_id ? "border-red-500" : ""
                }`}
                disabled={!currentItem.region}
              >
                <option value="">Select Instance Type</option>
                {computerInstances?.map((instance) => (
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
              <p className="text-red-500 text-xs mt-1">
                {itemErrors.compute_instance_id}
              </p>
            )}
          </div>

          {/* OS Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OS Image *
            </label>
            {isOsImagesFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={currentItem.os_image_id || ""}
                onChange={(e) =>
                  updateCurrentItem("os_image_id", e.target.value)
                }
                className={`${inputClass} ${
                  itemErrors.os_image_id ? "border-red-500" : ""
                }`}
                disabled={!currentItem.region}
              >
                <option value="">Select OS</option>
                {osImages?.map((os) => (
                  <option
                    key={os.product.productable_id}
                    value={os.product.productable_id}
                  >
                    {os.product.name}
                  </option>
                ))}
              </select>
            )}
            {itemErrors.os_image_id && (
              <p className="text-red-500 text-xs mt-1">
                {itemErrors.os_image_id}
              </p>
            )}
          </div>

          {/* Months */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term (Months) *
            </label>
            <input
              type="number"
              min="1"
              value={currentItem.months}
              onChange={(e) => updateCurrentItem("months", e.target.value)}
              className={`${inputClass} ${
                itemErrors.months ? "border-red-500" : ""
              }`}
            />
            {itemErrors.months && (
              <p className="text-red-500 text-xs mt-1">{itemErrors.months}</p>
            )}
          </div>

          {/* Number of Instances */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instances *
            </label>
            <input
              type="number"
              min="1"
              value={currentItem.number_of_instances}
              onChange={(e) =>
                updateCurrentItem("number_of_instances", e.target.value)
              }
              className={`${inputClass} ${
                itemErrors.number_of_instances ? "border-red-500" : ""
              }`}
            />
            {itemErrors.number_of_instances && (
              <p className="text-red-500 text-xs mt-1">
                {itemErrors.number_of_instances}
              </p>
            )}
          </div>

          {/* Volume Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Type *
            </label>
            {isEbsVolumesFetching ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            ) : (
              <select
                value={currentItem.volume_type_id || ""}
                onChange={(e) =>
                  updateCurrentItem("volume_type_id", e.target.value)
                }
                className={`${inputClass} ${
                  itemErrors.volume_type_id ? "border-red-500" : ""
                }`}
                disabled={!currentItem.region}
              >
                <option value="">Select Storage Type</option>
                {ebsVolumes?.map((volume) => (
                  <option
                    key={volume.product.productable_id}
                    value={volume.product.productable_id}
                  >
                    {volume.product.name}
                  </option>
                ))}
              </select>
            )}
            {itemErrors.volume_type_id && (
              <p className="text-red-500 text-xs mt-1">
                {itemErrors.volume_type_id}
              </p>
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
              onChange={(e) =>
                updateCurrentItem("storage_size_gb", e.target.value)
              }
              className={`${inputClass} ${
                itemErrors.storage_size_gb ? "border-red-500" : ""
              }`}
              placeholder="100"
            />
            {itemErrors.storage_size_gb && (
              <p className="text-red-500 text-xs mt-1">
                {itemErrors.storage_size_gb}
              </p>
            )}
          </div>

          {/* Bandwidth (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bandwidth (Optional)
            </label>
            <select
              value={currentItem.bandwidth_id || ""}
              onChange={(e) =>
                updateCurrentItem("bandwidth_id", e.target.value)
              }
              className={inputClass}
              disabled={!currentItem.region}
            >
              <option value="">No Bandwidth</option>
              {bandwidths?.map((bandwidth) => (
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
                onChange={(e) =>
                  updateCurrentItem("bandwidth_count", e.target.value)
                }
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
              onChange={(e) =>
                updateCurrentItem("floating_ip_id", e.target.value)
              }
              className={inputClass}
              disabled={!currentItem.region}
            >
              <option value="">No Floating IP</option>
              {floatingIps?.map((ip) => (
                <option
                  key={ip.product.productable_id}
                  value={ip.product.productable_id}
                >
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
                onChange={(e) =>
                  updateCurrentItem("floating_ip_count", e.target.value)
                }
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
                    {request.number_of_instances}x{" "}
                    {request._display?.compute || "Compute"}(
                    {request._display?.storage || "Storage"})
                  </div>
                  <div className="text-sm text-gray-600">
                    OS: {request._display?.os || "N/A"} • Region:{" "}
                    {request.region} • Term: {request.months} month(s)
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
