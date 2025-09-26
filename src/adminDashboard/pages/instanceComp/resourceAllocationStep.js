import React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import CheckboxGroup from "./checkGroup";

export const ResourceAllocationStep = ({
  formData,
  errors,
  updateFormData,
  handleSelectChange,
  handleCheckboxChange,
  isSubmissionPending,
  computerInstances,
  projects,
  regions,
  isComputerInstancesFetching,
  ebsVolumes,
  isEbsVolumesFetching,
  bandwidths,
  isBandwidthsFetching,
  osImages,
  isOsImagesFetching,
  floatingIps,
  isFloatingIpsFetching,
  crossConnects,
  isCrossConnectsFetching,
  subnets,
  isSubnetsFetching,
  securityGroups,
  isSecurityGroupsFetching,
  keyPairs,
  isKeyPairsFetching,
  onAddRequest,
  pricingRequests,
  onRemoveRequest,
}) => {
  const formatMemory = (memoryMb) => {
    if (memoryMb >= 1024) {
      const gb = (memoryMb / 1024).toFixed(1);
      return `${gb} GB`;
    }
    return `${memoryMb} MB`;
  };

  const formatIops = (iops) => {
    if (iops >= 1000) {
      return `${(iops / 1000).toFixed(1)}K`;
    }
    return iops.toString();
  };
  return (
    <>
      <div className="space-y-4 w-full">
        <div>
          <label
            htmlFor="region"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Region
          </label>
          <select
            id="region"
            value={formData.topLevel_selectedProject?.default_region || ""}
            disabled
            className="w-full bg-gray-100 rounded-md border-gray-300 text-gray-500 py-2 px-3"
          >
            <option value="">
              {formData.topLevel_selectedProject?.default_region ||
                "Select a project in the previous step"}
            </option>
          </select>
        </div>

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
            <p className="text-red-500 text-xs mt-1">
              {errors.storage_size_gb}
            </p>
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
              <div className="flex items-center ">
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
                className="w-full bg-transparent outline-none "
                disabled={isSubmissionPending}
              >
                <option value="">Select a compute instance</option>
                {computerInstances.map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.name} (CPU: {instance.vcpus}, RAM:{" "}
                    {formatMemory(instance.memory_mb)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center  text-gray-500 text-sm">
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
              <div className="flex items-center ">
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
                className="w-full bg-transparent outline-none "
                disabled={isSubmissionPending}
              >
                <option value="">Select an EBS volume</option>
                {ebsVolumes.map((volume) => (
                  <option key={volume.id} value={volume.id}>
                    {volume.name}
                    GiB, State: {volume.state}, Health: {volume.health}, R:{" "}
                    {formatIops(volume.read_iops_limit)}/W:{" "}
                    {formatIops(volume.write_iops_limit)} IOPS)
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center  text-gray-500 text-sm">
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
            htmlFor="os_image_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            OS Image<span className="text-red-500">*</span>
          </label>
          <span
            className={`w-full input-field block transition-all ${
              errors.selectedOsImage
                ? "border-red-500 border"
                : "border-gray-300"
            }`}
          >
            {isOsImagesFetching ? (
              <div className="flex items-center ">
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
                  handleSelectChange(
                    "selectedOsImage",
                    e.target.value,
                    osImages
                  )
                }
                className="w-full bg-transparent outline-none "
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
              <div className="flex items-center  text-gray-500 text-sm">
                No OS images available.
              </div>
            )}
          </span>
          {errors.selectedOsImage && (
            <p className="text-red-500 text-xs mt-1">
              {errors.selectedOsImage}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="keypair_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Key Pair<span className="text-red-500">*</span>
          </label>
          <span
            className={`w-full input-field block transition-all ${
              errors.keypair_name ? "border-red-500 border" : "border-gray-300"
            }`}
          >
            {isKeyPairsFetching ? (
              <div className="flex items-center ">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">
                  Loading key pairs...
                </span>
              </div>
            ) : keyPairs && keyPairs.length > 0 ? (
              <select
                id="keypair_name"
                value={formData.keypair_name || ""}
                onChange={(e) =>
                  handleSelectChange("keypair_name", e.target.value)
                }
                className="w-full bg-transparent outline-none "
                disabled={isSubmissionPending}
              >
                <option value="">Select a key pair</option>
                {keyPairs.map((kp) => (
                  <option key={kp.name} value={kp.name}>
                    {kp.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center  text-gray-500 text-sm">
                No key pairs available for the selected project.
              </div>
            )}
          </span>
          {errors.keypair_name && (
            <p className="text-red-500 text-xs mt-1">{errors.keypair_name}</p>
          )}
        </div>
        {/* Dummy Network ID */}
        <div>
          <label
            htmlFor="network_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Network
          </label>
          <select
            id="network_id"
            value={formData.network_id}
            onChange={(e) => handleSelectChange("network_id", e.target.value)}
            className="w-full input-field bg-white"
          >
            <option value="">Select a network (dummy)</option>
            <option value="dummy-network-1">Dummy Network 1</option>
            <option value="dummy-network-2">Dummy Network 2</option>
          </select>
        </div>

        {/* Subnet ID */}
        <div>
          <label
            htmlFor="subnet_id"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Subnet
          </label>
          <span
            className={`w-full input-field block transition-all ${
              errors.subnet_id ? "border-red-500 border" : "border-gray-300"
            }`}
          >
            {isSubnetsFetching ? (
              <div className="flex items-center ">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                <span className="text-gray-500 text-sm">
                  Loading subnets...
                </span>
              </div>
            ) : subnets && subnets.length > 0 ? (
              <select
                id="subnet_id"
                value={formData.subnet_id || ""}
                onChange={(e) =>
                  handleSelectChange("subnet_id", e.target.value)
                }
                className="w-full bg-transparent outline-none "
                disabled={isSubmissionPending}
              >
                <option value="">Select a subnet</option>
                {subnets.map((subnet) => (
                  <option key={subnet.id} value={subnet.id}>
                    {subnet.name} ({subnet.cidr_block})
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center text-gray-500 text-sm">
                No subnets available for the selected project.
              </div>
            )}
          </span>
          {errors.subnet_id && (
            <p className="text-red-500 text-xs mt-1">{errors.subnet_id}</p>
          )}
        </div>

        {/* Security Group IDs */}
        <div>
          {isSecurityGroupsFetching ? (
            <div className="flex items-center ">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
              <span className="text-gray-500 text-sm">
                Loading security groups...
              </span>
            </div>
          ) : securityGroups && securityGroups.length > 0 ? (
            <CheckboxGroup
              label="Security Groups"
              options={securityGroups.map((sg) => ({
                label: sg.name,
                value: sg.id,
              }))}
              selectedValues={formData.security_group_ids}
              onChange={(sgId) =>
                handleCheckboxChange("security_group_ids", sgId)
              }
              error={errors.security_group_ids}
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Groups
              </label>
              <p className="text-sm text-gray-500">
                No security groups available for the selected project.
              </p>
            </div>
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
            min="1"
            placeholder="Enter number of instances"
            className={`w-full input-field ${
              errors.number_of_instances ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="bandwidth_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Bandwidth
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.bandwidth_id
                  ? "border-red-500 border"
                  : "border-gray-300"
              }`}
            >
              {isBandwidthsFetching ? (
                <div className="flex items-center ">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                  <span className="text-gray-500 text-sm">
                    Loading bandwidth...
                  </span>
                </div>
              ) : bandwidths && bandwidths.length > 0 ? (
                <select
                  id="bandwidth_id"
                  value={formData.bandwidth_id || ""}
                  onChange={(e) =>
                    updateFormData("bandwidth_id", e.target.value)
                  }
                  className="w-full bg-transparent outline-none "
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
                <div className="flex items-center  text-gray-500 text-sm">
                  No bandwidth options available.
                </div>
              )}
            </span>
          </div>
          {formData.bandwidth_id && (
            <div>
              <label
                htmlFor="bandwidth_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bandwidth Count<span className="text-red-500">*</span>
              </label>
              <input
                id="bandwidth_count"
                type="number"
                value={formData.bandwidth_count}
                onChange={(e) =>
                  updateFormData("bandwidth_count", e.target.value)
                }
                placeholder="Enter count"
                min="1"
                className={`w-full input-field ${
                  errors.bandwidth_count ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.bandwidth_count && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.bandwidth_count}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="floating_ip_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Floating IP
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.floating_ip_id
                  ? "border-red-500 border"
                  : "border-gray-300"
              }`}
            >
              {isFloatingIpsFetching ? (
                <div className="flex items-center ">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                  <span className="text-gray-500 text-sm">
                    Loading floating IPs...
                  </span>
                </div>
              ) : floatingIps && floatingIps.length > 0 ? (
                <select
                  id="floating_ip_id"
                  value={formData.floating_ip_id || ""}
                  onChange={(e) =>
                    updateFormData("floating_ip_id", e.target.value)
                  }
                  className="w-full bg-transparent outline-none "
                  disabled={isSubmissionPending}
                >
                  <option value="">Select a Floating IP</option>
                  {floatingIps.map((ip) => (
                    <option key={ip.id} value={ip.id}>
                      {ip.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center py-2 text-gray-500 text-sm">
                  No floating IPs available.
                </div>
              )}
            </span>
          </div>
          {formData.floating_ip_id && (
            <div>
              <label
                htmlFor="floating_ip_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Floating IP Count<span className="text-red-500">*</span>
              </label>
              <input
                id="floating_ip_count"
                type="number"
                value={formData.floating_ip_count}
                onChange={(e) =>
                  updateFormData("floating_ip_count", e.target.value)
                }
                placeholder="Enter count"
                min="1"
                className={`w-full input-field ${
                  errors.floating_ip_count
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.floating_ip_count && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.floating_ip_count}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="cross_connect_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Cross Connect
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.cross_connect_id
                  ? "border-red-500 border"
                  : "border-gray-300"
              }`}
            >
              {isCrossConnectsFetching ? (
                <div className="flex items-center ">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                  <span className="text-gray-500 text-sm">
                    Loading cross connects...
                  </span>
                </div>
              ) : crossConnects && crossConnects.length > 0 ? (
                <select
                  id="cross_connect_id"
                  value={formData.cross_connect_id || ""}
                  onChange={(e) =>
                    updateFormData("cross_connect_id", e.target.value)
                  }
                  className="w-full bg-transparent outline-none "
                  disabled={isSubmissionPending}
                >
                  <option value="">Select a cross connect</option>
                  {crossConnects.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center py-2 text-gray-500 text-sm">
                  No cross connects available.
                </div>
              )}
            </span>
          </div>
          {formData.cross_connect_id && (
            <div>
              <label
                htmlFor="cross_connect_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Cross Connect Count<span className="text-red-500">*</span>
              </label>
              <input
                id="cross_connect_count"
                type="number"
                value={formData.cross_connect_count}
                onChange={(e) =>
                  updateFormData("cross_connect_count", e.target.value)
                }
                placeholder="Enter count"
                min="1"
                className={`w-full input-field ${
                  errors.cross_connect_count
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors.cross_connect_count && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.cross_connect_count}
                </p>
              )}
            </div>
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
            min="1"
            disabled={isSubmissionPending}
          />
          {errors.months && (
            <p className="text-red-500 text-xs mt-1">{errors.months}</p>
          )}
        </div>
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={onAddRequest}
            className="flex items-center gap-2 px-6 py-2 bg-[#288DD1] text-white font-medium rounded-md hover:bg-[#1976D2] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add to Request
          </button>
        </div>
      </div>
      <div className="w-full border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Instance Configurations
        </h3>
        {pricingRequests.length > 0 ? (
          <ul className="space-y-2">
            {pricingRequests.map((req, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-gray-100 rounded-md text-sm"
              >
                <span>
                  {req.number_of_instances}x {req._display.compute} (
                  {req._display.storage}, {req._display.os})
                </span>
                <button onClick={() => onRemoveRequest(index)} title="Remove">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No configurations added yet.</p>
        )}
      </div>
    </>
  );
};

export default ResourceAllocationStep;
