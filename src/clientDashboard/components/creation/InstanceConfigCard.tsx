// @ts-nocheck
import React, { useMemo, useEffect } from "react";
import {
  Trash2,
  Copy,
  Server,
  HardDrive,
  Network,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import ModernCard from "../../../components/modern/ModernCard";
import ModernInput from "../../../components/modern/ModernInput";
import ModernSelect from "../../../components/modern/ModernSelect";
import { designTokens } from "../../../styles/designTokens";
import { useFetchProductPricing } from "../../../hooks/resource";
import { useFetchClientSecurityGroups } from "../../../hooks/clientHooks/securityGroupHooks";
import { useFetchClientKeyPairs } from "../../../hooks/clientHooks/keyPairsHook";
import { useFetchClientSubnets } from "../../../hooks/clientHooks/subnetHooks";
import { useFetchClientVpcs } from "../../../hooks/clientHooks/vpcHooks";

const extractRegionCode = (region: any) => {
  if (!region) return "";
  if (typeof region === "string") return region;
  return region.code || region.region || region.slug || region.id || region.identifier || "";
};

const InstanceConfigCard = ({
  config,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  resources,
  errors = {},
  isExpanded,
  onToggleExpand,
}) => {
  const isEqualValue = (a: any, b: any) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, idx) => item === b[idx]);
    }
    if (typeof a === "object" && typeof b === "object" && a && b) {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch (err) {
        return false;
      }
    }
    return a === b;
  };

  const updateConfig = (field: any, value: any) => {
    if (isEqualValue(config[field], value)) {
      return;
    }

    const updated = { ...config, [field]: value };
    onUpdate(index, updated);
  };

  const updateVolumeType = (volumeIndex, field, value) => {
    const volumeTypes = [...(config.volume_types || [])];
    volumeTypes[volumeIndex] = { ...volumeTypes[volumeIndex], [field]: value };
    updateConfig("volume_types", volumeTypes);
  };

  const addVolumeType = () => {
    const volumeTypes = [...(config.volume_types || [])];
    volumeTypes.push({ volume_type_id: "", storage_size_gb: 50 });
    updateConfig("volume_types", volumeTypes);
  };

  const removeVolumeType = (volumeIndex: any) => {
    const volumeTypes = [...(config.volume_types || [])];
    volumeTypes.splice(volumeIndex, 1);
    updateConfig("volume_types", volumeTypes);
  };

  const getErrorForField = (field: any) => {
    return errors[`instances.${index}.${field}`]?.[0] || errors[field]?.[0];
  };

  const selectedProduct = resources?.compute_instances?.find((p) => p.id === config.product_id);

  // Use the project identifier string directly (stored in project_id)
  const projectIdentifier = config.project_id || "";
  const selectedRegion = config.region;
  const { data: securityGroups } = useFetchClientSecurityGroups(projectIdentifier, selectedRegion, {
    enabled: !!projectIdentifier && !!selectedRegion,
  });
  const { data: keyPairs } = useFetchClientKeyPairs(projectIdentifier, selectedRegion, {
    enabled: !!projectIdentifier && !!selectedRegion,
  });
  const { data: subnets } = useFetchClientSubnets(projectIdentifier, selectedRegion, {
    enabled: !!projectIdentifier && !!selectedRegion,
  });
  const { data: vpcs } = useFetchClientVpcs(projectIdentifier, selectedRegion, {
    enabled: !!projectIdentifier && !!selectedRegion,
  });
  const networkOptions = useMemo(() => {
    if (!vpcs) return [];
    if (Array.isArray(vpcs)) return vpcs;
    if (Array.isArray(vpcs?.data)) return vpcs.data;
    return [];
  }, [vpcs]);

  // Fetch region-scoped products for this specific configuration
  const { data: computeInstancesByRegion } = useFetchProductPricing(
    selectedRegion,
    "compute_instance",
    { enabled: !!selectedRegion, keepPreviousData: true }
  );
  const { data: osImagesByRegion } = useFetchProductPricing(selectedRegion, "os_image", {
    enabled: !!selectedRegion,
    keepPreviousData: true,
  });
  const { data: volumeTypesByRegion } = useFetchProductPricing(selectedRegion, "volume_type", {
    enabled: !!selectedRegion,
    keepPreviousData: true,
  });

  // Fetch projects filtered by selected region
  const unfilteredProjects = resources?.projects || [];
  const projectsForRegion = (unfilteredProjects || []).filter((project: any) => {
    if (!selectedRegion) return true;
    const projectRegion =
      extractRegionCode(project?.region) || project?.region_code || project?.region || "";
    return !projectRegion || String(projectRegion) === String(selectedRegion);
  });

  return (
    <ModernCard className="transition-all duration-200 hover:shadow-md">
      <div className="p-6 border-b" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onToggleExpand(index)}
              className="modern-button btn-icon transition-colors"
              style={{
                "--btn-bg": "transparent",
                "--btn-color": designTokens.colors.neutral[500],
                "--btn-border": "1px solid transparent",
                "--btn-shadow": "none",
                "--btn-hover-bg": designTokens.colors.neutral[100],
                "--btn-hover-color": designTokens.colors.primary[600],
                "--btn-hover-border": "1px solid transparent",
                "--btn-active-bg": designTokens.colors.neutral[200],
              }}
            >
              {isExpanded ? (
                <ChevronDown
                  className="w-4 h-4"
                  style={{ color: designTokens.colors.neutral[600] }}
                />
              ) : (
                <ChevronRight
                  className="w-4 h-4"
                  style={{ color: designTokens.colors.neutral[600] }}
                />
              )}
            </button>
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Configuration #{index + 1}: {config.name || "Untitled"}
              </h3>
              <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
                {config.count || 1} instance(s) • {selectedProduct?.name || "No product selected"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onDuplicate(index)}
              className="modern-button btn-icon transition-colors"
              style={{
                "--btn-bg": "transparent",
                "--btn-color": designTokens.colors.neutral[400],
                "--btn-border": "1px solid transparent",
                "--btn-shadow": "none",
                "--btn-hover-bg": designTokens.colors.primary[50],
                "--btn-hover-color": designTokens.colors.primary[600],
                "--btn-hover-border": "1px solid transparent",
                "--btn-active-bg": designTokens.colors.primary[100],
              }}
              title="Duplicate Configuration"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="modern-button btn-icon transition-colors"
              style={{
                "--btn-bg": "transparent",
                "--btn-color": designTokens.colors.neutral[400],
                "--btn-border": "1px solid transparent",
                "--btn-shadow": "none",
                "--btn-hover-bg": designTokens.colors.error[50],
                "--btn-hover-color": designTokens.colors.error[600],
                "--btn-hover-border": "1px solid transparent",
                "--btn-active-bg": designTokens.colors.error[100],
              }}
              title="Delete Configuration"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <ModernInput
                label="Instance Name *"
                value={config.name || ""}
                onChange={(e) => updateConfig("name", e.target.value)}
                placeholder="Enter instance name"
                error={getErrorForField("name")}
              />
            </div>

            <div>
              <ModernInput
                label="Number of Instances *"
                type="number"
                min="1"
                max="10"
                value={config.count || 1}
                onChange={(e) => updateConfig("count", parseInt(e.target.value))}
                error={getErrorForField("count")}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={config.description || ""}
              onChange={(e) => updateConfig("description", e.target.value)}
              placeholder="Enter instance description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Infrastructure Configuration */}
          <div className="space-y-4">
            <h4
              className="text-md font-semibold flex items-center"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              <Server
                className="w-5 h-5 mr-2"
                style={{ color: designTokens.colors.primary[500] }}
              />
              Infrastructure Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region *</label>
                <select
                  value={config.region || ""}
                  onChange={(e) => {
                    const newRegion = e.target.value;
                    const updated = {
                      ...config,
                      region: newRegion,
                      project_id: "",
                      network_id: "",
                      subnet_id: "",
                      security_group_ids: [],
                      keypair_name: "",
                    };
                    onUpdate(index, updated);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField("region") ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Region</option>
                  {(resources?.regions || []).map((region: any) => {
                    const code =
                      typeof region === "string"
                        ? region
                        : region.code || region.region || region.slug || region.id || "";
                    const name =
                      typeof region === "string"
                        ? region
                        : region.name || region.display_name || code || "Region";
                    if (!code) return null;
                    return (
                      <option key={code} value={code}>
                        {name} ({code})
                      </option>
                    );
                  })}
                </select>
                {getErrorForField("region") && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField("region")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project (Optional)
                </label>
                <select
                  value={config.project_id || ""}
                  onChange={(e) => {
                    const newProject = e.target.value;
                    const updated = {
                      ...config,
                      project_id: newProject,
                      network_id: "",
                      subnet_id: "",
                      security_group_ids: [],
                      keypair_name: "",
                    };
                    onUpdate(index, updated);
                  }}
                  disabled={!selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField("project_id") ? "border-red-300" : "border-gray-300"
                  } ${!selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">
                    {selectedRegion ? "Select Project" : "Select region first"}
                  </option>
                  {projectsForRegion?.map((project) => (
                    <option key={project.identifier} value={project.identifier}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {getErrorForField("project_id") && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField("project_id")}</p>
                )}
              </div>

              <div>
                <ModernInput
                  label="Duration (Months) *"
                  type="number"
                  min="1"
                  max="36"
                  value={config.months || 1}
                  onChange={(e) => updateConfig("months", parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instance Type *
                </label>
                <select
                  value={config.compute_instance_id || ""}
                  onChange={(e) => updateConfig("compute_instance_id", e.target.value)}
                  disabled={!selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField("compute_instance_id") ? "border-red-300" : "border-gray-300"
                  } ${!selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Instance Type</option>
                  {(computeInstancesByRegion || []).map((item, optionIdx) => {
                    const value = item?.product?.productable_id || "";
                    const label = item?.product?.name || "Compute";
                    return (
                      <option key={`${value}-${optionIdx}`} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {getErrorForField("product_id") && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField("product_id")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OS Image *</label>
                <select
                  value={config.os_image_id || ""}
                  onChange={(e) => updateConfig("os_image_id", e.target.value)}
                  disabled={!selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField("os_image_id") ? "border-red-300" : "border-gray-300"
                  } ${!selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select OS Image</option>
                  {(osImagesByRegion || []).map((item, optionIdx) => {
                    const value = item?.product?.productable_id || "";
                    const label = item?.product?.name || "OS Image";
                    return (
                      <option key={`${value}-${optionIdx}`} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {getErrorForField("os_image_id") && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField("os_image_id")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Storage Configuration */}
          <div className="space-y-4">
            <h4
              className="text-md font-semibold flex items-center"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              <HardDrive
                className="w-5 h-5 mr-2"
                style={{ color: designTokens.colors.primary[500] }}
              />
              Storage Configuration
            </h4>

            {(config.volume_types || []).map((volume, volumeIndex) => (
              <div key={volumeIndex} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">
                    Volume {volumeIndex + 1} {volumeIndex === 0 ? "(Boot Volume)" : ""}
                  </h5>
                  {volumeIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => removeVolumeType(volumeIndex)}
                      className="modern-button btn-icon"
                      style={{
                        "--btn-bg": "transparent",
                        "--btn-color": designTokens.colors.error[600],
                        "--btn-border": "1px solid transparent",
                        "--btn-shadow": "none",
                        "--btn-hover-bg": designTokens.colors.error[50],
                        "--btn-hover-color": designTokens.colors.error[600],
                        "--btn-hover-border": "1px solid transparent",
                        "--btn-active-bg": designTokens.colors.error[100],
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume Type *
                    </label>
                    <select
                      value={volume.volume_type_id || ""}
                      onChange={(e) =>
                        updateVolumeType(volumeIndex, "volume_type_id", e.target.value)
                      }
                      disabled={!selectedRegion}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">Select Volume Type</option>
                      {(volumeTypesByRegion || []).map((item, optionIdx) => {
                        const value = item?.product?.productable_id || "";
                        const label = item?.product?.name || "Volume Type";
                        return (
                          <option key={`${value}-${optionIdx}`} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <ModernInput
                      label="Size (GB) *"
                      type="number"
                      min="10"
                      max="2000"
                      value={volume.storage_size_gb || 50}
                      onChange={(e) =>
                        updateVolumeType(volumeIndex, "storage_size_gb", parseInt(e.target.value))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addVolumeType}
              className="modern-button btn-compact inline-flex items-center px-3 py-2"
              style={{
                "--btn-bg": "#f3f4f6",
                "--btn-color": "#ffffff",
                "--btn-border": "1px solid transparent",
                "--btn-shadow": "none",
                "--btn-hover-bg": "#e5e7eb",
                "--btn-hover-color": "#111827",
                "--btn-active-bg": "#d1d5db",
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Additional Volume
            </button>
          </div>

          {/* Network Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              <Network className="w-5 h-5 mr-2" />
              Network Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network (Optional)
                </label>
                <select
                  value={config.network_id || ""}
                  onChange={(e) => updateConfig("network_id", e.target.value)}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField("network_id") ? "border-red-300" : "border-gray-300"
                  } ${!projectIdentifier || !selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">None (use default)</option>
                  {networkOptions.map((network: any) => {
                    const value =
                      network?.id ??
                      network?.network_id ??
                      network?.uuid ??
                      network?.identifier ??
                      "";
                    if (!value) return null;
                    const label =
                      network?.name ??
                      network?.display_name ??
                      network?.network_name ??
                      network?.label ??
                      value;
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subnet (Optional)
                </label>
                <select
                  value={config.subnet_id || ""}
                  onChange={(e) => updateConfig("subnet_id", e.target.value)}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField("subnet_id") ? "border-red-300" : "border-gray-300"
                  } ${!projectIdentifier || !selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">None (use default)</option>
                  {(subnets || []).map((subnet) => (
                    <option key={subnet.id} value={subnet.id}>
                      {subnet.name || subnet.cidr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <ModernInput
                  label="Floating IPs"
                  type="number"
                  min="0"
                  max="5"
                  value={config.floating_ip_count || 0}
                  onChange={(e) => updateConfig("floating_ip_count", parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Groups (Optional)
                </label>
                <select
                  multiple
                  value={config.security_group_ids || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, (option) => option.value);
                    updateConfig("security_group_ids", values);
                  }}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 ${
                    getErrorForField("security_group_ids") ? "border-red-300" : "border-gray-300"
                  } ${!projectIdentifier || !selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                >
                  {(securityGroups || []).map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Pair</label>
                <select
                  value={config.keypair_name || ""}
                  onChange={(e) => updateConfig("keypair_name", e.target.value)}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!projectIdentifier || !selectedRegion ? "bg-gray-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">Select Key Pair</option>
                  {(keyPairs || []).map((kp) => (
                    <option key={kp.id} value={kp.name}>
                      {kp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <ModernInput
              label="Tags (Optional)"
              value={(config.tags || []).join(", ")}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag);
                updateConfig("tags", tags);
              }}
              placeholder="Enter tags separated by commas"
              helper="Separate multiple tags with commas"
            />
          </div>
        </div>
      )}
    </ModernCard>
  );
};

export default React.memo(InstanceConfigCard);
