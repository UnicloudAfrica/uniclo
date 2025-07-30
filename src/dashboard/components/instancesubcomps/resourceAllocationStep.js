import React from "react";
import { Loader2 } from "lucide-react";

const ResourceAllocationStep = ({
  formData,
  errors,
  updateFormData,
  handleSelectChange,
  isSubmissionPending,
  computerInstances,
  isComputerInstancesFetching,
  ebsVolumes,
  isEbsVolumesFetching,
  bandwidths,
  isBandwidthsFetching,
  osImages,
  isOsImagesFetching,
}) => {
  return (
    <div className="space-y-4 w-full">
      <div>
        <label
          htmlFor="storage_size_gb"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Storage Size (GiB)<span className="text-red-500">*</span>
        </label>
        <input
          id="storage_size_gb"
          type="number"
          value={formData.storage_size_gb}
          onChange={(e) => updateFormData("storage_size_gb", e.target.value)}
          placeholder="Min 30 GiB"
          className={`w-full input-field ${
            errors.storage_size_gb ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isSubmissionPending}
        />
        {errors.storage_size_gb && (
          <p className="text-red-500 text-xs mt-1">{errors.storage_size_gb}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="compute_instance_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Compute Instance<span className="text-red-500">*</span>
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.selectedComputeInstance
              ? "border-red-500 border"
              : "border-gray-300"
          }`}
        >
          {isComputerInstancesFetching ? (
            <div className="flex items-center py-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
              <span className="text-gray-500 text-sm">
                Loading compute instances...
              </span>
            </div>
          ) : computerInstances && computerInstances.length > 0 ? (
            <select
              id="compute_instance_id"
              value={formData.selectedComputeInstance?.id || ""}
              onChange={(e) =>
                handleSelectChange(
                  "selectedComputeInstance",
                  e.target.value,
                  computerInstances
                )
              }
              className="w-full bg-transparent outline-none py-2"
              disabled={isSubmissionPending}
            >
              <option value="">Select a compute instance</option>
              {computerInstances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name} (CPU: {instance.vcpus}, RAM:{" "}
                  {instance.memory_gib}GB)
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center py-2 text-gray-500 text-sm">
              No compute instances available.
            </div>
          )}
        </span>
        {errors.selectedComputeInstance && (
          <p className="text-red-500 text-xs mt-1">
            {errors.selectedComputeInstance}
          </p>
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
          min="1" // Added min attribute
          value={formData.number_of_instances}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || parseInt(value) >= 1) {
              // Allow empty string for initial input, and positive integers
              updateFormData("number_of_instances", value);
            }
          }}
          placeholder="Number of instances"
          className={`w-full input-field ${
            errors.number_of_instances ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isSubmissionPending}
        />
        {errors.number_of_instances && (
          <p className="text-red-500 text-xs mt-1">
            {errors.number_of_instances}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="ebs_volume_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          EBS Volume<span className="text-red-500">*</span>
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.selectedEbsVolume
              ? "border-red-500 border"
              : "border-gray-300"
          }`}
        >
          {isEbsVolumesFetching ? (
            <div className="flex items-center py-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
              <span className="text-gray-500 text-sm">
                Loading EBS volumes...
              </span>
            </div>
          ) : ebsVolumes && ebsVolumes.length > 0 ? (
            <select
              id="ebs_volume_id"
              value={formData.selectedEbsVolume?.id || ""}
              onChange={(e) =>
                handleSelectChange(
                  "selectedEbsVolume",
                  e.target.value,
                  ebsVolumes
                )
              }
              className="w-full bg-transparent outline-none py-2"
              disabled={isSubmissionPending}
            >
              <option value="">Select an EBS volume</option>
              {ebsVolumes.map((volume) => (
                <option key={volume.id} value={volume.id}>
                  {volume.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center py-2 text-gray-500 text-sm">
              No EBS volumes available.
            </div>
          )}
        </span>
        {errors.selectedEbsVolume && (
          <p className="text-red-500 text-xs mt-1">
            {errors.selectedEbsVolume}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="bandwidth_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Bandwidth<span className="text-red-500">*</span>
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.bandwidth_id ? "border-red-500 border" : "border-gray-300"
          }`}
        >
          {isBandwidthsFetching ? (
            <div className="flex items-center py-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
              <span className="text-gray-500 text-sm">
                Loading bandwidth options...
              </span>
            </div>
          ) : bandwidths && bandwidths.length > 0 ? (
            <select
              id="bandwidth_id"
              value={formData.bandwidth_id || ""}
              onChange={(e) => updateFormData("bandwidth_id", e.target.value)}
              className="w-full bg-transparent outline-none py-2"
              disabled={isSubmissionPending}
            >
              <option value="">Select a bandwidth</option>
              {bandwidths.map((bandwidth) => (
                <option key={bandwidth.id} value={bandwidth.id}>
                  {bandwidth.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center py-2 text-gray-500 text-sm">
              No bandwidth options available.
            </div>
          )}
        </span>
        {errors.bandwidth_id && (
          <p className="text-red-500 text-xs mt-1">{errors.bandwidth_id}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="os_image_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          OS Image<span className="text-red-500">*</span>
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.selectedOsImage ? "border-red-500 border" : "border-gray-300"
          }`}
        >
          {isOsImagesFetching ? (
            <div className="flex items-center py-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
              <span className="text-gray-500 text-sm">
                Loading OS images...
              </span>
            </div>
          ) : osImages && osImages.length > 0 ? (
            <select
              id="os_image_id"
              value={formData.selectedOsImage?.id || ""}
              onChange={(e) =>
                handleSelectChange("selectedOsImage", e.target.value, osImages)
              }
              className="w-full bg-transparent outline-none py-2"
              disabled={isSubmissionPending}
            >
              <option value="">Select an OS image</option>
              {osImages.map((image) => (
                <option key={image.id} value={image.id}>
                  {image.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center py-2 text-gray-500 text-sm">
              No OS images available.
            </div>
          )}
        </span>
        {errors.selectedOsImage && (
          <p className="text-red-500 text-xs mt-1">{errors.selectedOsImage}</p>
        )}
      </div>
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
          placeholder="Minimum 1 month"
          className={`w-full input-field ${
            errors.months ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isSubmissionPending}
        />
        {errors.months && (
          <p className="text-red-500 text-xs mt-1">{errors.months}</p>
        )}
      </div>
    </div>
  );
};

export default ResourceAllocationStep;
