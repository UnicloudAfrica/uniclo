import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  Copy,
  Info,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import ToastUtils from "../../utils/toastUtil";
import {
  useFetchGeneralRegions,
  useFetchProductPricing,
} from "../../hooks/resource";
import { useFetchProjects } from "../../hooks/projectHooks";
import { useFetchTenantSubnets } from "../../hooks/subnetHooks";
import { useFetchTenantSecurityGroups } from "../../hooks/securityGroupHooks";
import { useFetchTenantKeyPairs } from "../../hooks/keyPairsHook";
import config from "../../config";
import useAuthStore from "../../stores/userAuthStore";
import useClientAuthStore from "../../stores/clientAuthStore";

const resolveRegionCode = (region) => {
  if (!region) {
    return "";
  }
  if (typeof region === "string") {
    return region;
  }
  return (
    region.code ||
    region.region ||
    region.slug ||
    region.id ||
    region.identifier ||
    ""
  );
};

const resolveRegionLabel = (region) => {
  if (!region) {
    return "";
  }
  if (typeof region === "string") {
    return region;
  }
  const code = resolveRegionCode(region);
  const name = region.name || region.display_name || code;
  const provider = region.provider || region.cloud || region.owner;
  return provider ? `${name} • ${provider}` : name;
};

const formatError = (value) => {
  if (!value) {
    return "";
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return String(value);
};

const formatCurrency = (amount, currency = "USD") => {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return "";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${amount}`;
  }
};

const createEmptyConfiguration = (region = "") => ({
  uid: `cfg-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`,
  name: "",
  description: "",
  region,
  project_id: "",
  number_of_instances: 1,
  months: 1,
  compute_option_id: "",
  compute_instance_id: "",
  os_option_id: "",
  os_image_id: "",
  volume_types: [
    {
      option_id: "",
      volume_type_id: "",
      storage_size_gb: 50,
    },
  ],
  bandwidth_option_id: "",
  bandwidth_id: "",
  bandwidth_count: 1,
  floating_ip_count: 0,
  cross_connect_option_id: "",
  cross_connect_id: "",
  cross_connect_count: 1,
  subnet_id: "",
  network_id: "",
  security_group_ids: [],
  key_pair_id: "",
  keypair_name: "",
});

const PricingSummary = ({ pricing }) => {
  if (!pricing) {
    return null;
  }

  const {
    currency = "USD",
    grand_total,
    previews = [],
    total_instances,
    total_configurations,
  } = pricing;

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-wide text-gray-900">
            Pricing preview
          </h3>
          <p className="text-sm text-gray-500">
            {total_instances ?? 0} instance
            {total_instances === 1 ? "" : "s"} across{" "}
            {total_configurations ?? previews.length} configuration
            {total_configurations === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Estimated total
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {currency} {grand_total}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {previews.map((preview) => (
          <div
            key={preview.index}
            className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
          >
            <div>
              <p className="font-medium text-gray-800">
                Configuration #{(preview.index ?? 0) + 1}:{" "}
                {preview.product_name || "Untitled"}
              </p>
              <p className="text-sm text-gray-500">
                {preview.count} instance
                {preview.count === 1 ? "" : "s"} • {currency}{" "}
                {preview.unit_price} per instance
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {currency} {preview.total_price}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConfigurationCard = ({
  index,
  config,
  regions,
  projects,
  onUpdate,
  onDelete,
  onDuplicate,
  canDelete,
  errors,
}) => {
  const [expanded, setExpanded] = useState(index === 0);

  const regionOptions = useMemo(
    () =>
      (regions || []).map((region) => ({
        value: resolveRegionCode(region),
        label: resolveRegionLabel(region),
      })),
    [regions]
  );

  const projectOptions = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    if (!config.region) {
      return list;
    }
    return list.filter((project) => {
      const projectRegion =
        project.default_region || project.region || project.provider_region;
      if (!projectRegion) {
        return true;
      }
      return projectRegion === config.region;
    });
  }, [projects, config.region]);

  const selectedRegion = config.region;

  const { data: computeOptions = [], isFetching: computeLoading } =
    useFetchProductPricing(selectedRegion, "compute_instance", {
      enabled: !!selectedRegion,
    });
  const { data: osOptions = [], isFetching: osLoading } =
    useFetchProductPricing(selectedRegion, "os_image", {
      enabled: !!selectedRegion,
    });
  const { data: volumeOptions = [], isFetching: volumeLoading } =
    useFetchProductPricing(selectedRegion, "volume_type", {
      enabled: !!selectedRegion,
    });
  const { data: bandwidthOptions = [], isFetching: bandwidthLoading } =
    useFetchProductPricing(selectedRegion, "bandwidth", {
      enabled: !!selectedRegion,
    });
  const { data: crossConnectOptions = [], isFetching: crossConnectLoading } =
    useFetchProductPricing(selectedRegion, "cross_connect", {
      enabled: !!selectedRegion,
    });

  const projectIdentifier = config.project_id;

  const { data: subnetOptions = [], isFetching: subnetLoading } =
    useFetchTenantSubnets(projectIdentifier, selectedRegion, {
      enabled: Boolean(projectIdentifier && selectedRegion),
    });

  const {
    data: securityGroupOptions = [],
    isFetching: securityGroupLoading,
  } = useFetchTenantSecurityGroups(projectIdentifier, selectedRegion, {
    enabled: Boolean(projectIdentifier && selectedRegion),
  });

  const { data: keyPairOptions = [], isFetching: keyPairLoading } =
    useFetchTenantKeyPairs(projectIdentifier, selectedRegion, {
      enabled: Boolean(projectIdentifier && selectedRegion),
    });

  const fieldError = (field) =>
    formatError(
      errors?.[`pricing_requests.${index}.${field}`] || errors?.[field]
    );

  const hasAnyError = useMemo(
    () =>
      Object.keys(errors || {}).some((key) =>
        key.startsWith(`pricing_requests.${index}.`)
      ),
    [errors, index]
  );

  const handleFieldChange = (field, value) => {
    let next = { ...config, [field]: value };
    if (field === "region") {
      next = {
        ...next,
        project_id: "",
        compute_option_id: "",
        compute_instance_id: "",
        os_option_id: "",
        os_image_id: "",
        volume_types: [
          {
            option_id: "",
            volume_type_id: "",
            storage_size_gb: 50,
          },
        ],
        bandwidth_option_id: "",
        bandwidth_id: "",
        subnet_id: "",
        network_id: "",
        security_group_ids: [],
        key_pair_id: "",
        keypair_name: "",
      };
    }
    if (field === "project_id") {
      next = {
        ...next,
        subnet_id: "",
        network_id: "",
        security_group_ids: [],
        key_pair_id: "",
        keypair_name: "",
      };
    }
    onUpdate(index, next);
  };

  const handleComputeSelect = (optionId) => {
    if (!optionId) {
      onUpdate(index, {
        ...config,
        compute_option_id: "",
        compute_instance_id: "",
      });
      return;
    }
    const option = computeOptions.find(
      (item) => String(item.product.id) === String(optionId)
    );
    onUpdate(index, {
      ...config,
      compute_option_id: optionId,
      compute_instance_id: option
        ? option.product.productable_id
        : config.compute_instance_id,
    });
  };

  const handleOsSelect = (optionId) => {
    if (!optionId) {
      onUpdate(index, {
        ...config,
        os_option_id: "",
        os_image_id: "",
      });
      return;
    }
    const option = osOptions.find(
      (item) => String(item.product.id) === String(optionId)
    );
    onUpdate(index, {
      ...config,
      os_option_id: optionId,
      os_image_id: option
        ? option.product.productable_id
        : config.os_image_id,
    });
  };

  const handleVolumeTypeChange = (volumeIndex, field, value) => {
    const volumes = (config.volume_types || []).map((volume) => ({
      ...volume,
    }));
    const target = volumes[volumeIndex] || {
      option_id: "",
      volume_type_id: "",
      storage_size_gb: 50,
    };

    if (field === "option_id") {
      if (!value) {
        target.option_id = "";
        target.volume_type_id = "";
      } else {
        const option = volumeOptions.find(
          (item) => String(item.product.id) === String(value)
        );
        target.option_id = value;
        target.volume_type_id = option
          ? option.product.productable_id
          : target.volume_type_id;
      }
    } else if (field === "storage_size_gb") {
      const parsed = Number(value);
      target.storage_size_gb = Number.isFinite(parsed) ? parsed : "";
    }

    volumes[volumeIndex] = target;
    onUpdate(index, {
      ...config,
      volume_types: volumes,
    });
  };

  const handleAddVolume = () => {
    const volumes = (config.volume_types || []).map((volume) => ({
      ...volume,
    }));
    volumes.push({
      option_id: "",
      volume_type_id: "",
      storage_size_gb: 50,
    });
    onUpdate(index, {
      ...config,
      volume_types: volumes,
    });
  };

  const handleRemoveVolume = (volumeIndex) => {
    const volumes = (config.volume_types || []).map((volume) => ({
      ...volume,
    }));
    if (volumeIndex === 0) {
      ToastUtils.info("Primary volume cannot be removed.");
      return;
    }
    volumes.splice(volumeIndex, 1);
    onUpdate(index, {
      ...config,
      volume_types: volumes.length
        ? volumes
        : [
            {
              option_id: "",
              volume_type_id: "",
              storage_size_gb: 50,
            },
          ],
    });
  };

  const toggleSecurityGroup = (id) => {
    const idStr = String(id);
    const current = config.security_group_ids || [];
    const next = current.includes(idStr)
      ? current.filter((value) => value !== idStr)
      : [...current, idStr];
    onUpdate(index, {
      ...config,
      security_group_ids: next,
    });
  };

  const handleKeyPairSelect = (keyPairId) => {
    if (!keyPairId) {
      onUpdate(index, {
        ...config,
        key_pair_id: "",
        keypair_name: "",
      });
      return;
    }
    const keyPair = keyPairOptions.find(
      (item) => String(item.id) === String(keyPairId)
    );
    onUpdate(index, {
      ...config,
      key_pair_id: keyPairId,
      keypair_name: keyPair ? keyPair.name : config.keypair_name,
    });
  };

  const handleBandwidthSelect = (optionId) => {
    if (!optionId) {
      onUpdate(index, {
        ...config,
        bandwidth_option_id: "",
        bandwidth_id: "",
      });
      return;
    }
    const option = bandwidthOptions.find(
      (item) => String(item.product.id) === String(optionId)
    );
    onUpdate(index, {
      ...config,
      bandwidth_option_id: optionId,
      bandwidth_id: option ? option.product.productable_id : "",
    });
  };

  const handleCrossConnectSelect = (optionId) => {
    if (!optionId) {
      onUpdate(index, {
        ...config,
        cross_connect_option_id: "",
        cross_connect_id: "",
      });
      return;
    }
    const option = crossConnectOptions.find(
      (item) => String(item.product.id) === String(optionId)
    );
    onUpdate(index, {
      ...config,
      cross_connect_option_id: optionId,
      cross_connect_id: option ? option.product.productable_id : "",
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-gray-200 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-3 text-left"
        >
          <span className="rounded-full bg-blue-50 p-2 text-blue-600">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Configuration #{index + 1}
            </p>
            <p className="text-base font-semibold text-gray-900">
              {config.name || "Untitled configuration"}
            </p>
            {hasAnyError && (
              <p className="mt-1 text-xs font-medium text-red-500">
                Needs attention
              </p>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(index)}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-blue-200 hover:text-blue-600"
            title="Duplicate configuration"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(index)}
            disabled={!canDelete}
            className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            title="Remove configuration"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-6 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Instance name (optional)
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(event) =>
                  onUpdate(index, { ...config, name: event.target.value })
                }
                placeholder="e.g. web-app-prod"
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Region<span className="text-red-500">*</span>
              </label>
              <select
                value={config.region}
                onChange={(event) =>
                  handleFieldChange("region", event.target.value)
                }
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldError("region")
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                }`}
              >
                <option value="">Select a region</option>
                {regionOptions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
              {fieldError("region") && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldError("region")}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Project<span className="text-red-500">*</span>
              </label>
              <select
                value={config.project_id}
                onChange={(event) =>
                  handleFieldChange("project_id", event.target.value)
                }
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  fieldError("project_id")
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                }`}
              >
                <option value="">Select a project</option>
                {projectOptions.map((project) => (
                  <option
                    key={project.identifier || project.id}
                    value={project.identifier || project.id}
                  >
                    {project.name || project.identifier || project.id}
                  </option>
                ))}
              </select>
              {fieldError("project_id") && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldError("project_id")}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instances<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.number_of_instances}
                  onChange={(event) =>
                    onUpdate(index, {
                      ...config,
                      number_of_instances:
                        Number(event.target.value) > 0
                          ? Number(event.target.value)
                          : 1,
                    })
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    fieldError("number_of_instances")
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                  }`}
                />
                {fieldError("number_of_instances") && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldError("number_of_instances")}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Term (months)<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={config.months}
                  onChange={(event) =>
                    onUpdate(index, {
                      ...config,
                      months:
                        Number(event.target.value) > 0
                          ? Number(event.target.value)
                          : 1,
                    })
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    fieldError("months")
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                  }`}
                />
                {fieldError("months") && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldError("months")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Compute instance<span className="text-red-500">*</span>
              </label>
              <div
                className={`mt-1 flex w-full items-center rounded-lg border px-3 py-2 ${
                  fieldError("compute_instance_id")
                    ? "border-red-400"
                    : "border-gray-300 bg-white"
                }`}
              >
                {computeLoading ? (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading compute options...
                  </div>
                ) : (
                  <select
                    value={config.compute_option_id}
                    onChange={(event) =>
                      handleComputeSelect(event.target.value)
                    }
                    className="w-full bg-transparent text-sm focus:outline-none"
                  >
                    <option value="">Select a compute instance</option>
                    {computeOptions.map(({ product, pricing }) => (
                      <option key={product.id} value={product.id}>
                        {product.productable_name || product.name} •{" "}
                        {formatCurrency(
                          pricing?.effective?.price_local,
                          pricing?.effective?.currency
                        )}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {fieldError("compute_instance_id") && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldError("compute_instance_id")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Operating system<span className="text-red-500">*</span>
              </label>
              <div
                className={`mt-1 flex w-full items-center rounded-lg border px-3 py-2 ${
                  fieldError("os_image_id")
                    ? "border-red-400"
                    : "border-gray-300 bg-white"
                }`}
              >
                {osLoading ? (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading OS images...
                  </div>
                ) : (
                  <select
                    value={config.os_option_id}
                    onChange={(event) => handleOsSelect(event.target.value)}
                    className="w-full bg-transparent text-sm focus:outline-none"
                  >
                    <option value="">Select an OS image</option>
                    {osOptions.map(({ product }) => (
                      <option key={product.id} value={product.id}>
                        {product.productable_name || product.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {fieldError("os_image_id") && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldError("os_image_id")}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Storage volumes<span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddVolume}
                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add volume
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {(config.volume_types || []).map((volume, volumeIndex) => (
                <div
                  key={`volume-${volumeIndex}`}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">
                      Volume #{volumeIndex + 1}
                      {volumeIndex === 0 && " (primary)"}
                    </p>
                    {volumeIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVolume(volumeIndex)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <select
                        value={volume.option_id}
                        onChange={(event) =>
                          handleVolumeTypeChange(
                            volumeIndex,
                            "option_id",
                            event.target.value
                          )
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                          volumeLoading
                            ? "border-gray-300 text-gray-500"
                            : fieldError(
                                `volume_types.${volumeIndex}.volume_type_id`
                              )
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                        }`}
                      >
                        <option value="">Select volume type</option>
                        {volumeOptions.map(({ product }) => (
                          <option key={product.id} value={product.id}>
                            {product.productable_name || product.name}
                          </option>
                        ))}
                      </select>
                      {fieldError(`volume_types.${volumeIndex}.volume_type_id`) && (
                        <p className="mt-1 text-xs text-red-500">
                          {fieldError(
                            `volume_types.${volumeIndex}.volume_type_id`
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        value={volume.storage_size_gb}
                        onChange={(event) =>
                          handleVolumeTypeChange(
                            volumeIndex,
                            "storage_size_gb",
                            event.target.value
                          )
                        }
                        placeholder="Size (GiB)"
                        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                          fieldError(
                            `volume_types.${volumeIndex}.storage_size_gb`
                          )
                            ? "border-red-400 focus:ring-red-200"
                            : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200"
                        }`}
                      />
                      {fieldError(
                        `volume_types.${volumeIndex}.storage_size_gb`
                      ) && (
                        <p className="mt-1 text-xs text-red-500">
                          {fieldError(
                            `volume_types.${volumeIndex}.storage_size_gb`
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bandwidth (optional)
              </label>
              <div className="mt-1 flex items-center gap-3">
                <select
                  value={config.bandwidth_option_id}
                  onChange={(event) =>
                    handleBandwidthSelect(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">No additional bandwidth</option>
                  {bandwidthOptions.map(({ product, pricing }) => (
                    <option key={product.id} value={product.id}>
                      {product.productable_name || product.name} •{" "}
                      {formatCurrency(
                        pricing?.effective?.price_local,
                        pricing?.effective?.currency
                      )}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={config.bandwidth_count}
                  disabled={!config.bandwidth_option_id}
                  onChange={(event) =>
                    onUpdate(index, {
                      ...config,
                      bandwidth_count:
                        Number(event.target.value) > 0
                          ? Number(event.target.value)
                          : 1,
                    })
                  }
                  className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                  placeholder="Qty"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Floating IPs (optional)
              </label>
              <input
                type="number"
                min={0}
                value={config.floating_ip_count}
                onChange={(event) =>
                  onUpdate(index, {
                    ...config,
                    floating_ip_count:
                      Number(event.target.value) >= 0
                        ? Number(event.target.value)
                        : 0,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cross connect (optional)
              </label>
              <div className="mt-1 flex items-center gap-3">
                <select
                  value={config.cross_connect_option_id}
                  onChange={(event) =>
                    handleCrossConnectSelect(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">No cross connect</option>
                  {crossConnectOptions.map(({ product, pricing }) => (
                    <option key={product.id} value={product.id}>
                      {product.productable_name || product.name} •{" "}
                      {formatCurrency(
                        pricing?.effective?.price_local,
                        pricing?.effective?.currency
                      )}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={config.cross_connect_count}
                  disabled={!config.cross_connect_option_id}
                  onChange={(event) =>
                    onUpdate(index, {
                      ...config,
                      cross_connect_count:
                        Number(event.target.value) > 0
                          ? Number(event.target.value)
                          : 1,
                    })
                  }
                  className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                  placeholder="Qty"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subnet (optional)
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {subnetLoading ? (
                  <div className="flex items-center text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading subnets...
                  </div>
                ) : (
                  <select
                    value={config.subnet_id}
                    onChange={(event) =>
                      onUpdate(index, {
                        ...config,
                        subnet_id: event.target.value,
                      })
                    }
                    className="w-full bg-transparent focus:outline-none"
                  >
                    <option value="">Select a subnet</option>
                    {(subnetOptions || []).map((subnet) => (
                      <option key={subnet.id} value={subnet.id}>
                        {subnet.name || subnet.identifier || subnet.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Security groups (optional)
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {securityGroupLoading && (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading security groups...
                </div>
              )}
              {!securityGroupLoading &&
                (securityGroupOptions || []).map((group) => {
                  const idStr = String(group.id);
                  const checked = (config.security_group_ids || []).includes(
                    idStr
                  );
                  return (
                    <label
                      key={idStr}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                        checked
                          ? "border-blue-200 bg-blue-50 text-blue-600"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSecurityGroup(idStr)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {group.name || group.identifier || `Group ${group.id}`}
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Key pair (optional)
              </label>
              <div className="mt-1 flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                {keyPairLoading ? (
                  <div className="flex items-center text-gray-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading key pairs...
                  </div>
                ) : (
                  <select
                    value={config.key_pair_id}
                    onChange={(event) =>
                      handleKeyPairSelect(event.target.value)
                    }
                    className="w-full bg-transparent focus:outline-none"
                  >
                    <option value="">Use existing credentials</option>
                    {(keyPairOptions || []).map((keyPair) => (
                      <option key={keyPair.id} value={keyPair.id}>
                        {keyPair.name || keyPair.identifier || keyPair.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <input
                type="text"
                value={config.description}
                onChange={(event) =>
                  onUpdate(index, {
                    ...config,
                    description: event.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Purpose of this configuration"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AddInstancePage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [configurations, setConfigurations] = useState([
    createEmptyConfiguration(""),
  ]);
  const [globalTagsInput, setGlobalTagsInput] = useState("");
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  const {
    data: regions = [],
    isFetching: isRegionsFetching,
  } = useFetchGeneralRegions();
  const {
    data: projects = [],
    isFetching: isProjectsFetching,
  } = useFetchProjects();

  const projectsList = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );

  const derivedTags = useMemo(
    () =>
      globalTagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    [globalTagsInput]
  );

  const defaultRegionCode = useMemo(
    () => resolveRegionCode(regions[0]),
    [regions]
  );

  useEffect(() => {
    if (!defaultRegionCode) {
      return;
    }
    setConfigurations((prev) => {
      if (prev.length === 0) {
        return [createEmptyConfiguration(defaultRegionCode)];
      }
      if (prev[0].region) {
        return prev;
      }
      const updatedFirst = { ...prev[0], region: defaultRegionCode };
      return [updatedFirst, ...prev.slice(1)];
    });
  }, [defaultRegionCode]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const callJson = async (path, payload, headers = {}) => {
    const token =
      useAuthStore.getState().token || useClientAuthStore.getState().token;

    const response = await fetch(`${config.baseURL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      if (data?.errors) {
        setErrors(data.errors);
      }
      throw new Error(
        data?.message ||
          data?.error ||
          data?.data?.error ||
          "Request failed. Please try again."
      );
    }

    return data;
  };

  const updateConfiguration = (index, updatedConfig) => {
    setConfigurations((prev) =>
      prev.map((cfg, idx) => (idx === index ? { ...updatedConfig } : cfg))
    );
    setErrors((prev) => {
      if (!prev || Object.keys(prev).length === 0) {
        return prev;
      }
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.startsWith(`pricing_requests.${index}.`)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const addConfiguration = () => {
    const newConfig = createEmptyConfiguration(defaultRegionCode);
    setConfigurations((prev) => [...prev, newConfig]);
  };

  const duplicateConfiguration = (index) => {
    setConfigurations((prev) => {
      const source = prev[index];
      if (!source) {
        return prev;
      }
      const clone = {
        ...source,
        uid: `cfg-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        name: source.name ? `${source.name}-copy` : "",
        volume_types: (source.volume_types || []).map((volume) => ({
          ...volume,
        })),
        security_group_ids: [...(source.security_group_ids || [])],
      };
      return [...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)];
    });
  };

  const deleteConfiguration = (index) => {
    setConfigurations((prev) => {
      if (prev.length <= 1) {
        ToastUtils.info("At least one configuration is required.");
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const validateConfigurations = () => {
    const validationErrors = {};

    configurations.forEach((cfg, idx) => {
      if (!cfg.region) {
        validationErrors[`pricing_requests.${idx}.region`] =
          "Region is required.";
      }
      if (!cfg.project_id) {
        validationErrors[`pricing_requests.${idx}.project_id`] =
          "Project is required.";
      }
      if (!cfg.compute_instance_id) {
        validationErrors[`pricing_requests.${idx}.compute_instance_id`] =
          "Compute instance is required.";
      }
      if (!cfg.os_image_id) {
        validationErrors[`pricing_requests.${idx}.os_image_id`] =
          "Operating system is required.";
      }
      if (!cfg.months || Number(cfg.months) < 1) {
        validationErrors[`pricing_requests.${idx}.months`] =
          "Months must be at least 1.";
      }
      if (
        !cfg.number_of_instances ||
        Number(cfg.number_of_instances) < 1
      ) {
        validationErrors[`pricing_requests.${idx}.number_of_instances`] =
          "Instances must be at least 1.";
      }
      const volumes = cfg.volume_types || [];
      const primaryVolume = volumes[0];
      if (!primaryVolume || !primaryVolume.volume_type_id) {
        validationErrors[
          `pricing_requests.${idx}.volume_types.0.volume_type_id`
        ] = "Select a volume type for the primary volume.";
      }
      if (
        primaryVolume &&
        (!primaryVolume.storage_size_gb ||
          Number(primaryVolume.storage_size_gb) <= 0)
      ) {
        validationErrors[
          `pricing_requests.${idx}.volume_types.0.storage_size_gb`
        ] = "Provide a positive size for the primary volume.";
      }
    });

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setGeneralError("Please fix the highlighted fields before continuing.");
      return false;
    }
    setGeneralError("");
    return true;
  };

  const buildPayload = () => {
    const pricingRequests = configurations.map((cfg) => {
      const volumes = (cfg.volume_types || [])
        .filter((volume) => volume.volume_type_id)
        .map((volume) => ({
          volume_type_id: Number(volume.volume_type_id),
          storage_size_gb: Number(volume.storage_size_gb) || 0,
        }));

      const securityGroups = (cfg.security_group_ids || [])
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id));

      const request = {
        region: cfg.region,
        project_id: cfg.project_id || undefined,
        compute_instance_id: cfg.compute_instance_id
          ? Number(cfg.compute_instance_id)
          : undefined,
        os_image_id: cfg.os_image_id ? Number(cfg.os_image_id) : undefined,
        months: Number(cfg.months) || 1,
        number_of_instances: Number(cfg.number_of_instances) || 1,
        volume_types: volumes,
      };

      if (cfg.name) {
        request.name = cfg.name;
      }
      if (cfg.description) {
        request.description = cfg.description;
      }
      if (cfg.bandwidth_id) {
        request.bandwidth_id = Number(cfg.bandwidth_id);
        request.bandwidth_count =
          Number(cfg.bandwidth_count) > 0
            ? Number(cfg.bandwidth_count)
            : 1;
      }
      if (cfg.floating_ip_count) {
        request.floating_ip_count = Number(cfg.floating_ip_count);
      }
      if (cfg.cross_connect_id) {
        request.cross_connect_id = Number(cfg.cross_connect_id);
        request.cross_connect_count =
          Number(cfg.cross_connect_count) > 0
            ? Number(cfg.cross_connect_count)
            : 1;
      }
      if (cfg.network_id) {
        request.network_id = cfg.network_id;
      }
      if (cfg.subnet_id) {
        request.subnet_id = Number(cfg.subnet_id);
      }
      if (securityGroups.length) {
        request.security_group_ids = securityGroups;
      }
      if (cfg.key_pair_id) {
        request.key_pair_id = Number(cfg.key_pair_id);
      }
      if (cfg.keypair_name) {
        request.keypair_name = cfg.keypair_name;
      }

      return request;
    });

    const payload = { pricing_requests };
    if (derivedTags.length) {
      payload.tags = derivedTags;
    }

    return payload;
  };

  const handleCalculatePricing = async () => {
    setPricing(null);
    setErrors({});
    setGeneralError("");

    if (!validateConfigurations()) {
      ToastUtils.error(
        "Please resolve the highlighted issues before calculating pricing."
      );
      return;
    }

    setPricingLoading(true);
    try {
      const payload = buildPayload();
      const response = await callJson(
        "/business/multi-initiation-previews",
        payload
      );
      if (response?.success === false) {
        throw new Error(
          response?.message || "Unable to calculate pricing right now."
        );
      }
      setPricing(response?.data || null);
    } catch (error) {
      setGeneralError(error.message);
      ToastUtils.error(error.message);
    } finally {
      setPricingLoading(false);
    }
  };

  const handleCreateInstances = async () => {
    setErrors({});
    setGeneralError("");

    if (!validateConfigurations()) {
      ToastUtils.error(
        "Please resolve the highlighted issues before submitting."
      );
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = buildPayload();
      await callJson("/business/multi-initiations", payload, {
        "Idempotency-Key": `multi-${Date.now().toString(
          36
        )}-${Math.random().toString(36).slice(2, 10)}`,
      });

      ToastUtils.success("Instance request submitted successfully.");
      setPricing(null);
      setConfigurations([createEmptyConfiguration(defaultRegionCode)]);
      navigate("/dashboard/instances");
    } catch (error) {
      setGeneralError(error.message);
      ToastUtils.error(error.message);
    } finally {
      setSubmitLoading(false);
    }

  const totalInstances = configurations.reduce(
    (acc, cfg) => acc + (Number(cfg.number_of_instances) || 0),
    0
  );

  const loadingInitial =
    (isRegionsFetching && (regions?.length ?? 0) === 0) ||
    (isProjectsFetching && projectsList.length === 0);

  if (loadingInitial) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] flex min-h-full w-full items-center justify-center bg-[#FAFAFA] p-6 md:w-[calc(100%-5rem)] lg:w-[80%] md:p-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#288DD1]" />
            <p className="mt-3 text-sm text-gray-600">
              Loading resources…
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] min-h-full w-full bg-[#FAFAFA] p-6 md:w-[calc(100%-5rem)] lg:w-[80%] md:p-8">
        <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Multi-instance creation
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure several environments in one flow, preview pricing, and
              submit a single request for provisioning.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
            <p className="text-sm font-medium text-blue-700">
              {totalInstances} total instance{totalInstances === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-blue-600">
              {configurations.length} configuration
              {configurations.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700">
            Tags (optional)
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Separate values with commas to tag the resulting instances.
            Example: production, web, v1
          </p>
          <input
            type="text"
            value={globalTagsInput}
            onChange={(event) => setGlobalTagsInput(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="production, staging, analytics"
          />
          {derivedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {derivedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {generalError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {generalError}
          </div>
        )}

        {pricing && <PricingSummary pricing={pricing} />}

        <div className="space-y-5">
          {configurations.map((configuration, index) => (
            <ConfigurationCard
              key={configuration.uid || index}
              index={index}
              config={configuration}
              regions={regions}
              projects={projectsList}
              onUpdate={updateConfiguration}
              onDelete={deleteConfiguration}
              onDuplicate={duplicateConfiguration}
              canDelete={configurations.length > 1}
              errors={errors}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={addConfiguration}
            className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add configuration
          </button>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center text-sm text-gray-500">
              <Info className="mr-2 h-4 w-4 text-gray-400" />
              {totalInstances > 0
                ? `Ready to create ${totalInstances} instance${
                    totalInstances === 1 ? "" : "s"
                  }`
                : "Add at least one configuration to continue"}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCalculatePricing}
                disabled={
                  pricingLoading || submitLoading || configurations.length === 0
                }
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pricingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating…
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate pricing
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCreateInstances}
                disabled={submitLoading || configurations.length === 0}
                className="inline-flex items-center justify-center rounded-lg bg-[#288DD1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f7ab5] disabled:cursor-not-allowed disabled:bg-[#7cbde3]"
              >
                {submitLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Create instances"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AddInstancePage;
