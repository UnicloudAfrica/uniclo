import React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import CheckboxGroup from "./checkboxGroup";

const ResourceAllocationStep = ({
  formData,
  errors,
  updateFormData,
  handleSelectChange,
  handleCheckboxChange,
  isSubmissionPending,
  computerInstances,
  projects,
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
  keyPairs,
  isKeyPairsFetching,
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

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-800">
          Resource Allocation
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl mx-auto">
          Configure the resources for one or more instances. You can add
          multiple configurations to this request before proceeding.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-12">
        {/* Left Column: Form */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Add a Configuration
          </h4>
          <div>
            <label
              htmlFor="instance_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Instance Name<span className="text-red-500">*</span>
            </label>
            <input
              id="instance_name"
              type="text"
              value={formData.instance_name}
              onChange={(e) => updateFormData("instance_name", e.target.value)}
              placeholder="e.g., web-server-prod-01"
              className={`w-full input-field ${
                errors.instance_name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.instance_name && (
              <p className="text-red-500 text-xs mt-1">
                {errors.instance_name}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="project_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Project<span className="text-red-500">*</span>
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.selectedProject ? "border-red-500 border" : ""
              }`}
            >
              {projects && projects.length > 0 ? (
                <select
                  id="project_id"
                  value={formData.selectedProject?.id || ""}
                  onChange={(e) =>
                    handleSelectChange(
                      "selectedProject",
                      e.target.value,
                      projects
                    )
                  }
                  className="w-full bg-transparent outline-none "
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center text-gray-500 text-sm">
                  No projects available.
                </div>
              )}
            </span>
            {errors.selectedProject && (
              <p className="text-red-500 text-xs mt-1">
                {errors.selectedProject}
              </p>
            )}
          </div>
          <label
            htmlFor="region"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Region
          </label>
          <select
            id="region"
            value={formData.selectedProject?.region || ""}
            disabled
            className="w-full bg-gray-100 rounded-md border-gray-300 text-gray-500 py-2 px-3"
          >
            <option value="">
              {formData.selectedProject?.region || "Select a project"}
            </option>
          </select>

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
              onChange={(e) =>
                updateFormData("storage_size_gb", e.target.value)
              }
              placeholder="Min 1 GiB"
              className={`w-full input-field ${
                errors.storage_size_gb ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmissionPending}
              min="1"
            />
            {errors.storage_size_gb && (
              <p className="text-red-500 text-xs mt-1">
                {errors.storage_size_gb}
              </p>
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
            {securityGroups && securityGroups.length > 0 ? (
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
                  errors.selectedBandwidth
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
                    value={formData.selectedBandwidth?.product?.id || ""}
                    onChange={(e) => {
                      handleSelectChange(
                        "selectedBandwidth",
                        e.target.value,
                        bandwidths
                      );
                      updateFormData("bandwidth_count", e.target.value ? 1 : 0);
                    }}
                    className="w-full bg-transparent outline-none "
                    disabled={isSubmissionPending}
                  >
                    <option value="">Select a bandwidth</option>
                    {bandwidths.map(({ product, pricing }) => (
                      <option key={product.id} value={product.id}>
                        {product.name}: {product.productable_name} -{" "}
                        {formatCurrency(
                          pricing.effective.price_local,
                          pricing.effective.currency
                        )}
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
            {formData.selectedBandwidth && (
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
                    errors.bandwidth_count
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
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
                  errors.selectedFloatingIp
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
                    value={formData.selectedFloatingIp?.product?.id || ""}
                    onChange={(e) => {
                      handleSelectChange(
                        "selectedFloatingIp",
                        e.target.value,
                        floatingIps
                      );
                      updateFormData(
                        "floating_ip_count",
                        e.target.value ? 1 : 0
                      );
                    }}
                    className="w-full bg-transparent outline-none "
                    disabled={isSubmissionPending}
                  >
                    <option value="">Select a Floating IP</option>
                    {floatingIps.map(({ product, pricing }) => (
                      <option key={product.id} value={product.id}>
                        {product.name}: {product.productable_name} -{" "}
                        {formatCurrency(
                          pricing.effective.price_local,
                          pricing.effective.currency
                        )}
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
            {formData.selectedFloatingIp && (
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
              </div>
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
                  value={formData.selectedComputeInstance?.product?.id || ""}
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
                  {computerInstances.map(({ product, pricing }) => (
                    <option key={product.id} value={product.id}>
                      {product.name}: {product.productable_name} -{" "}
                      {formatCurrency(
                        pricing.effective.price_local,
                        pricing.effective.currency
                      )}
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
                  value={formData.selectedEbsVolume?.product?.id || ""}
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
                  {ebsVolumes.map(({ product, pricing }) => (
                    <option key={product.id} value={product.id}>
                      {product.name}: {product.productable_name} -{" "}
                      {formatCurrency(
                        pricing.effective.price_local,
                        pricing.effective.currency
                      )}
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
                  value={formData.selectedOsImage?.product?.id || ""}
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
                  {osImages.map(({ product, pricing }) => (
                    <option key={product.id} value={product.id}>
                      {product.name}: {product.productable_name} -{" "}
                      {formatCurrency(
                        pricing.effective.price_local,
                        pricing.effective.currency
                      )}
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
                errors.keypair_name
                  ? "border-red-500 border"
                  : "border-gray-300"
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
                errors.number_of_instances
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
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

        {/* Right Column: Sticky Instance Configurations List */}
        <div className="mt-8 lg:mt-0">
          <div className="sticky top-28">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Instance Configurations
              </h3>
              {pricingRequests.length > 0 ? (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                  {pricingRequests.map((req, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-md text-sm border shadow-sm"
                    >
                      <span className="font-medium text-gray-700">
                        {req.name} ({req.number_of_instances}x{" "}
                        {req._display.compute}, {req._display.storage},{" "}
                        {req._display.os})
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
                  No configurations added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocationStep;
