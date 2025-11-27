import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Gauge,
  Server,
  Trash2,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernButton from "../components/ModernButton";
import ModernCard from "../components/ModernCard";
import ModernSelect from "../components/ModernSelect";
import StatusPill from "../components/StatusPill";
import PaymentModal from "../components/PaymentModal";
import adminSilentApi from "../../index/admin/silent";
import adminApi from "../../index/admin/api";
import ToastUtils from "../../utils/toastUtil";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import {
  useFetchCountries,
  useFetchProductPricing,
  useFetchGeneralRegions,
} from "../../hooks/resource";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import { useFetchSecurityGroups } from "../../hooks/adminHooks/securityGroupHooks";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import { useFetchSubnets } from "../../hooks/adminHooks/subnetHooks";
import { useFetchNetworks } from "../../hooks/adminHooks/networkHooks";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";

const COUNTRY_FALLBACK = [{ value: "US", label: "United States (US)" }];

const normalizeCountryCandidate = (value) => {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  return "";
};

const matchCountryFromOptions = (value, options = []) => {
  if (value === null || value === undefined) return "";
  const normalized = normalizeCountryCandidate(value);
  if (normalized) return normalized;

  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();

  const match = options.find((option) => {
    if (!option) return false;
    if (typeof option.value === "string" && option.value.toLowerCase() === lower) {
      return true;
    }
    if (typeof option.label === "string") {
      const labelLower = option.label.toLowerCase();
      if (labelLower === lower) {
        return true;
      }
      const bracketIndex = option.label.indexOf("(");
      if (bracketIndex >= 0) {
        const prefix = option.label.slice(0, bracketIndex).trim().toLowerCase();
        if (prefix === lower) {
          return true;
        }
      }
    }
    return false;
  });

  return match?.value ? String(match.value).toUpperCase() : "";
};

const resolveCountryCodeFromEntity = (entity, options = []) => {
  if (!entity) return "";
  const candidates = [
    entity.country_code,
    entity.countryCode,
    entity.country_iso,
    entity.countryIso,
    entity.country,
    entity.billing_country_code,
    entity.billingCountryCode,
    entity.billing_country,
    entity.billingCountry,
    entity.billing?.country_code,
    entity.billing?.countryCode,
    entity.billing?.country,
    entity.location?.country_code,
    entity.location?.countryCode,
    entity.address?.country_code,
    entity.address?.countryCode,
    entity.profile?.country_code,
    entity.profile?.countryCode,
    entity.metadata?.country_code,
    entity.metadata?.countryCode,
    entity.primary_contact?.country_code,
    entity.primary_contact?.countryCode,
    entity.contact?.country_code,
    entity.contact?.countryCode,
    entity.tenant_country_code,
    entity.tenant_country,
    entity.tenant?.country_code,
    entity.tenant?.country,
    entity.settings?.country_code,
    entity.settings?.country,
  ];

  for (const candidate of candidates) {
    const code = matchCountryFromOptions(candidate, options);
    if (code) {
      return code;
    }
  }
  return "";
};

const genId = () => `cfg_${Math.random().toString(36).slice(2, 10)}`;

const createConfiguration = () => ({
  id: genId(),
  launch_mode: "billable",
  name: "",
  instance_count: 1,
  description: "",
  project_id: "",
  region: "",
  months: 12,
  compute_instance_id: "",
  os_image_id: "",
  volume_type_id: "",
  storage_size_gb: 50,
  bandwidth_id: "",
  bandwidth_count: 1,
  floating_ip_count: 0,
  security_group_ids: [],
  keypair_name: "",
  keypair_label: "",
  additional_volumes: [],
  network_id: "",
  subnet_id: "",
  subnet_label: "",
  tags: "",
});

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== "";

const evaluateConfigurationCompleteness = (cfg) => {
  const missing = [];
  if (!hasValue(cfg.region)) missing.push("Region");
  if (!Number(cfg.instance_count)) missing.push("Instance count");
  if (!Number(cfg.months)) missing.push("Duration");
  if (!hasValue(cfg.compute_instance_id)) missing.push("Instance type");
  if (!hasValue(cfg.os_image_id)) missing.push("OS image");
  if (!hasValue(cfg.volume_type_id)) missing.push("Boot volume type");
  if (!Number(cfg.storage_size_gb)) missing.push("Boot volume size");
  return { isComplete: missing.length === 0, missing };
};

const normalizePaymentOptions = (options) => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  if (typeof options === "string") {
    try {
      const parsed = JSON.parse(options);
      return normalizePaymentOptions(parsed);
    } catch (error) {
      return [];
    }
  }
  if (typeof options === "object") {
    if (Array.isArray(options.payment_gateway_options)) {
      return options.payment_gateway_options;
    }
    if (Array.isArray(options.options)) {
      return options.options;
    }
    return [options];
  }
  return [];
};

const formatCurrencyValue = (amount) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return "0.00";
  }
  return numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


const extractRegionCode = (region) => {
  if (!region) return "";
  if (typeof region === "string") return region;
  return (
    region.code ||
    region.region ||
    region.slug ||
    region.id ||
    region.identifier ||
    ""
  );
};

const InstanceConfigurationCard = ({
  cfg,
  index,
  totalConfigurations,
  updateConfiguration,
  removeConfiguration,
  addAdditionalVolume,
  updateAdditionalVolume,
  removeAdditionalVolume,
  regionOptions,
  baseProjectOptions,
  fallbackComputeInstances,
  fallbackOsImages,
  fallbackVolumeTypes,
  bandwidthOptions,
  billingCountry,
  isLoadingResources,
  showActionRow = false,
  onAddConfiguration = () => {},
  onBackToWorkflow = () => {},
  onSubmitConfigurations = () => {},
  isSubmitting = false,
}) => {
  const selectedRegion = cfg.region || "";
  const projectIdentifier = cfg.project_id || "";

  const { data: projectsResp } = useFetchProjects(
    { per_page: 100, region: selectedRegion },
    { enabled: Boolean(selectedRegion), keepPreviousData: true }
  );
  const regionAwareProjects = useMemo(() => {
    const combined = [
      ...((projectsResp?.data && Array.isArray(projectsResp.data)) ? projectsResp.data : []),
      ...(Array.isArray(baseProjectOptions) ? baseProjectOptions : []),
    ];
    const seen = new Set();
    return combined
      .map((project) => {
        const identifier =
          project?.identifier ||
          project?.id ||
          project?.project_id ||
          project?.code ||
          "";
        if (!identifier) return null;
        const projectRegion =
          extractRegionCode(project?.region) ||
          project?.region_code ||
          project?.region ||
          "";
        if (selectedRegion && projectRegion && String(projectRegion) !== String(selectedRegion)) {
          return null;
        }
        const value = String(identifier);
        if (seen.has(value)) return null;
        seen.add(value);
        return {
          value,
          label: project?.name || project?.identifier || project?.slug || value,
        };
      })
      .filter(Boolean);
  }, [projectsResp?.data, baseProjectOptions, selectedRegion]);

  const sharedPricingOptions = {
    enabled: Boolean(selectedRegion),
    keepPreviousData: true,
    countryCode: billingCountry || "US",
  };
  const { data: computeInstancesByRegion } = useFetchProductPricing(
    selectedRegion,
    "compute_instance",
    sharedPricingOptions
  );
  const { data: osImagesByRegion } = useFetchProductPricing(
    selectedRegion,
    "os_image",
    sharedPricingOptions
  );
  const { data: volumeTypesByRegion } = useFetchProductPricing(
    selectedRegion,
    "volume_type",
    sharedPricingOptions
  );

  const computeOptions = useMemo(() => {
    const rows = Array.isArray(computeInstancesByRegion) ? computeInstancesByRegion : [];
    if (rows.length) {
      return rows
        .map((item, idx) => {
          const product = item?.product || {};
          const value =
            product?.productable_id ||
            product?.id ||
            item?.product_id ||
            item?.id;
          if (!value) return null;
          const vcpus =
            product?.vcpus ||
            product?.config?.vcpus ||
            item?.vcpus ||
            item?.configuration?.vcpus;
          const memoryMb =
            product?.memory_mb ||
            product?.memoryMb ||
            product?.config?.memory_mb ||
            item?.memory_mb;
          const memoryGb = memoryMb ? Math.round(Number(memoryMb) / 1024) : product?.memory_gb;
          const baseLabel =
            product?.name ||
            item?.name ||
            `Instance ${idx + 1}`;
          const labelParts = [baseLabel];
          if (vcpus || memoryGb) {
            const meta = [];
            if (vcpus) meta.push(`${vcpus} vCPU`);
            if (memoryGb) meta.push(`${memoryGb} GB RAM`);
            if (meta.length) {
              labelParts.push(`• ${meta.join(" • ")}`);
            }
          }
          return { value: String(value), label: labelParts.join(" ") };
        })
        .filter(Boolean);
    }
    return (fallbackComputeInstances || []).map((it) => {
      const memoryGb = it.memory_mb ? Math.round(Number(it.memory_mb) / 1024) : it.memory_gb;
      const meta = [];
      if (it.vcpus) meta.push(`${it.vcpus} vCPU`);
      if (memoryGb) meta.push(`${memoryGb} GB RAM`);
      const label = meta.length
        ? `${it.name || `Instance ${it.id}`} • ${meta.join(" • ")}`
        : it.name || `Instance ${it.id}`;
      return {
        value: String(it.id),
        label,
      };
    });
  }, [computeInstancesByRegion, fallbackComputeInstances]);

  const osImageOptions = useMemo(() => {
    const rows = Array.isArray(osImagesByRegion) ? osImagesByRegion : [];
    if (rows.length) {
      return rows
        .map((item, idx) => {
          const product = item?.product || {};
          const value =
            product?.productable_id ||
            product?.id ||
            item?.product_id ||
            item?.id;
          if (!value) return null;
          const label = product?.name || item?.name || `OS Image ${idx + 1}`;
          return { value: String(value), label };
        })
        .filter(Boolean);
    }
    return (fallbackOsImages || []).map((img) => ({
      value: String(img.id),
      label: img.name || img.description || `Image ${img.id}`,
    }));
  }, [osImagesByRegion, fallbackOsImages]);

  const volumeTypeOptions = useMemo(() => {
    const rows = Array.isArray(volumeTypesByRegion) ? volumeTypesByRegion : [];
    if (rows.length) {
      return rows
        .map((item, idx) => {
          const product = item?.product || {};
          const value =
            product?.productable_id ||
            product?.id ||
            item?.product_id ||
            item?.id;
          if (!value) return null;
          const label = product?.name || item?.name || `Volume ${idx + 1}`;
          return { value: String(value), label };
        })
        .filter(Boolean);
    }
    return (fallbackVolumeTypes || []).map((v) => ({
      value: String(v.id),
      label: v.name || `Volume ${v.id}`,
    }));
  }, [volumeTypesByRegion, fallbackVolumeTypes]);

  const { data: securityGroups } = useFetchSecurityGroups(
    projectIdentifier,
    selectedRegion,
    { enabled: Boolean(projectIdentifier && selectedRegion) }
  );
  const { data: keyPairs } = useFetchKeyPairs(
    projectIdentifier,
    selectedRegion,
    { enabled: Boolean(projectIdentifier && selectedRegion) }
  );
  const { data: subnets } = useFetchSubnets(
    projectIdentifier,
    selectedRegion,
    { enabled: Boolean(projectIdentifier && selectedRegion) }
  );
  const { data: networksResponse } = useFetchNetworks(
    projectIdentifier,
    selectedRegion,
    { enabled: Boolean(projectIdentifier && selectedRegion) }
  );

  const networkOptions = useMemo(() => {
    const list = Array.isArray(networksResponse)
      ? networksResponse
      : Array.isArray(networksResponse?.data)
      ? networksResponse.data
      : [];
    return list
      .map((network) => {
        const value =
          network?.id ||
          network?.network_id ||
          network?.uuid ||
          network?.identifier ||
          "";
        if (!value) return null;
        const label =
          network?.name ||
          network?.display_name ||
          network?.network_name ||
          network?.label ||
          `Network ${value}`;
        return { value: String(value), label };
      })
      .filter(Boolean);
  }, [networksResponse]);

  const prevRegionRef = useRef(selectedRegion);
  useEffect(() => {
    if (prevRegionRef.current && prevRegionRef.current !== selectedRegion) {
      updateConfiguration(cfg.id, {
        project_id: "",
        compute_instance_id: "",
        os_image_id: "",
        volume_type_id: "",
        additional_volumes: [],
        network_id: "",
        subnet_id: "",
        security_group_ids: [],
        keypair_name: "",
      });
    }
    prevRegionRef.current = selectedRegion;
  }, [selectedRegion, cfg.id, updateConfiguration]);

  const prevProjectRef = useRef(projectIdentifier);
  useEffect(() => {
    if (prevProjectRef.current && prevProjectRef.current !== projectIdentifier) {
      updateConfiguration(cfg.id, {
        network_id: "",
        subnet_id: "",
        security_group_ids: [],
        keypair_name: "",
      });
    }
    prevProjectRef.current = projectIdentifier;
  }, [projectIdentifier, cfg.id, updateConfiguration]);

  const handleSecurityGroupToggle = (value, checked) => {
    const current = Array.isArray(cfg.security_group_ids) ? cfg.security_group_ids : [];
    const next = new Set(current.map((v) => String(v)));
    if (checked) {
      next.add(String(value));
    } else {
      next.delete(String(value));
    }
    updateConfiguration(cfg.id, { security_group_ids: Array.from(next) });
  };

  const isProjectScoped = Boolean(projectIdentifier && selectedRegion);

  return (
    <ModernCard variant="outlined" padding="lg" className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-slate-900">
            Configuration #{index + 1}: {cfg.name || "Untitled"}
          </p>
          <p className="text-sm text-slate-600">
            Define instances, storage, and networking for this configuration.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {totalConfigurations > 1 && (
            <button
              type="button"
              onClick={() => removeConfiguration(cfg.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Instance name
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.name}
            onChange={(e) => updateConfiguration(cfg.id, { name: e.target.value })}
            placeholder="Optional friendly name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Number of instances *
          </label>
          <input
            type="number"
            min="1"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.instance_count}
            onChange={(e) =>
              updateConfiguration(cfg.id, { instance_count: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          rows={2}
          value={cfg.description}
          onChange={(e) => updateConfiguration(cfg.id, { description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-sm font-semibold">Infrastructure Configuration</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Region *"
            value={cfg.region}
            onChange={(e) => updateConfiguration(cfg.id, { region: e.target.value })}
            options={[
              { value: "", label: "Select region" },
              ...regionOptions,
            ]}
            helper="Region code used for pricing and provisioning."
            disabled={isLoadingResources}
          />
          <ModernSelect
            label="Project (Optional)"
            value={cfg.project_id}
            onChange={(e) => updateConfiguration(cfg.id, { project_id: e.target.value })}
            options={[
              { value: "", label: selectedRegion ? "Select project (optional)" : "Select region first" },
              ...regionAwareProjects,
            ]}
            helper="Choose a project or leave blank and rely on region."
            disabled={!selectedRegion}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Duration (Months) *
            </label>
            <input
              type="number"
              min="1"
              max="36"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.months}
              onChange={(e) => updateConfiguration(cfg.id, { months: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Instance Type *"
            value={cfg.compute_instance_id}
            onChange={(e) =>
              updateConfiguration(cfg.id, { compute_instance_id: e.target.value })
            }
            options={[
              { value: "", label: selectedRegion ? "Select instance type" : "Select region first" },
              ...computeOptions,
            ]}
            helper="Select the compute flavor."
            disabled={!selectedRegion}
          />
          <ModernSelect
            label="OS Image *"
            value={cfg.os_image_id}
            onChange={(e) =>
              updateConfiguration(cfg.id, { os_image_id: e.target.value })
            }
            options={[
              { value: "", label: selectedRegion ? "Select OS image" : "Select region first" },
              ...osImageOptions,
            ]}
            helper="Choose the base image."
            disabled={!selectedRegion}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Floating IPs
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.floating_ip_count}
              onChange={(e) =>
                updateConfiguration(cfg.id, { floating_ip_count: e.target.value })
              }
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional count of floating IPs to reserve.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-sm font-semibold">Storage Configuration</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Volume 1 (Boot Volume) Type *"
            value={cfg.volume_type_id}
            onChange={(e) =>
              updateConfiguration(cfg.id, { volume_type_id: e.target.value })
            }
            options={[
              { value: "", label: selectedRegion ? "Select volume type" : "Select region first" },
              ...volumeTypeOptions,
            ]}
            helper="Choose the primary volume class."
            disabled={!selectedRegion}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Size (GB) *
            </label>
            <input
              type="number"
              min="10"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.storage_size_gb}
              onChange={(e) =>
                updateConfiguration(cfg.id, { storage_size_gb: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="text-sm font-semibold">Network Configuration</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModernSelect
            label="Network (Optional)"
            value={cfg.network_id}
            onChange={(e) => updateConfiguration(cfg.id, { network_id: e.target.value })}
            options={[{ value: "", label: "None (use default)" }, ...networkOptions]}
            helper="Select a network when targeting a project."
            disabled={!isProjectScoped}
          />
          <ModernSelect
            label="Subnet (Optional)"
            value={cfg.subnet_id}
            onChange={(e) => {
              const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
              updateConfiguration(cfg.id, {
                subnet_id: e.target.value,
                subnet_label: e.target.value ? selectedLabel : "",
              });
            }}
            options={[
              { value: "", label: "None (use default)" },
              ...((Array.isArray(subnets) ? subnets : []).map((subnet) => ({
                value: String(subnet.id || subnet.subnet_id || subnet.identifier || ""),
                label: subnet.name || subnet.cidr || `Subnet ${subnet.id || ""}`,
              })) || []),
            ]}
            helper="Select a subnet from the chosen network."
            disabled={!isProjectScoped}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Bandwidth
            </label>
            <ModernSelect
              label=""
              value={cfg.bandwidth_id}
              onChange={(e) =>
                updateConfiguration(cfg.id, { bandwidth_id: e.target.value })
              }
              options={[{ value: "", label: "Select bandwidth (optional)" }, ...bandwidthOptions]}
              helper="Optional. Leave blank if not required."
              disabled={isLoadingResources}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Bandwidth count
            </label>
            <input
              type="number"
              min="1"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.bandwidth_count}
              onChange={(e) =>
                updateConfiguration(cfg.id, { bandwidth_count: e.target.value })
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Security Groups (Optional)
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {isProjectScoped ? (
                (Array.isArray(securityGroups) && securityGroups.length > 0 ? securityGroups : []).map((sg) => {
                  const id = sg.id || sg.identifier || sg.name;
                  if (!id) return null;
                  const label = sg.name || sg.label || `SG ${id}`;
                  const checked = Array.isArray(cfg.security_group_ids)
                    ? cfg.security_group_ids.includes(String(id))
                    : false;
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        checked={checked}
                        onChange={(e) => handleSecurityGroupToggle(id, e.target.checked)}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500">
                  Select a region and project to view available security groups.
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Key pair
            </label>
            <ModernSelect
              label=""
              value={cfg.keypair_name}
              onChange={(e) => {
                const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                updateConfiguration(cfg.id, {
                  keypair_name: e.target.value,
                  keypair_label: e.target.value ? selectedLabel : "",
                });
              }}
              options={[
                { value: "", label: "Select key pair (optional)" },
                ...((Array.isArray(keyPairs) ? keyPairs : []).map((kp) => {
                  const value = kp.name || kp.id;
                  if (!value) return null;
                  return { value: String(value), label: kp.name || kp.id };
                }).filter(Boolean) || []),
              ]}
              helper="Select SSH key pair to authorize access."
              disabled={!isProjectScoped}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tags (Optional)
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Tag1, Tag2 (optional)"
            value={cfg.tags}
            onChange={(e) => updateConfiguration(cfg.id, { tags: e.target.value })}
          />
          <p className="mt-1 text-xs text-slate-500">
            Separate multiple tags with commas.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">
            Additional data volumes
          </span>
          <ModernButton variant="outline" onClick={() => addAdditionalVolume(cfg.id)} size="sm">
            Add data volume
          </ModernButton>
        </div>
        {(cfg.additional_volumes || []).length === 0 && (
          <p className="text-xs text-slate-500">
            No extra data volumes. Click “Add data volume” to attach more storage.
          </p>
        )}
        {(cfg.additional_volumes || []).map((vol) => (
          <div
            key={vol.id}
            className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-3"
          >
            <ModernSelect
              label="Volume type"
              value={vol.volume_type_id}
              onChange={(e) =>
                updateAdditionalVolume(cfg.id, vol.id, { volume_type_id: e.target.value })
              }
              options={[
                { value: "", label: selectedRegion ? "Select volume type" : "Select region first" },
                ...volumeTypeOptions,
              ]}
              helper="Data volume class."
              disabled={!selectedRegion}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Size (GB)
              </label>
              <input
                type="number"
                min="10"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={vol.storage_size_gb}
                onChange={(e) =>
                  updateAdditionalVolume(cfg.id, vol.id, { storage_size_gb: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-slate-500">Capacity for this data volume.</p>
            </div>
            <div className="flex items-end justify-end">
              <ModernButton variant="ghost" onClick={() => removeAdditionalVolume(cfg.id, vol.id)}>
                Remove
              </ModernButton>
            </div>
          </div>
        ))}
      </div>

      {showActionRow && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <ModernButton
            variant="outline"
            onClick={onAddConfiguration}
            style={{
              borderRadius: "999px",
              padding: "12px 22px",
              fontSize: "15px",
              lineHeight: "22px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #8CC5F5",
              color: "#1877D4",
              boxShadow: "0 1px 2px rgba(24, 119, 212, 0.15)",
            }}
          >
            <span className="mr-2 text-lg leading-none text-blue-500">+</span>
            Add configuration
          </ModernButton>
          <div className="flex flex-wrap items-center gap-3">
            <ModernButton
              variant="ghost"
              onClick={onBackToWorkflow}
              style={{
                borderRadius: "999px",
                padding: "12px 26px",
                fontSize: "15px",
                lineHeight: "22px",
                border: "1px solid #DFE6F0",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
              }}
            >
              Back to workflow
            </ModernButton>
            <ModernButton
              variant="primary"
              onClick={onSubmitConfigurations}
              isDisabled={isSubmitting}
              style={{
                borderRadius: "999px",
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: 600,
                minWidth: "230px",
                backgroundColor: "#1D7EDF",
                color: "#FFFFFF",
                border: "1px solid #1D7EDF",
                boxShadow: "0 10px 20px rgba(29, 126, 223, 0.2)",
              }}
              className="shadow-md shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
            >
              {isSubmitting ? "Creating..." : "Create and price"}
            </ModernButton>
          </div>
        </div>
      )}
    </ModernCard>
  );
};

const AdminCreateInstance = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "fast-track" ? "fast-track" : "standard";
  const [mode, setMode] = useState(initialMode);
  const [activeStep, setActiveStep] = useState(0);
  const [assignmentType, setAssignmentType] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [billingCountry, setBillingCountry] = useState("US");
  const [isCountryLocked, setIsCountryLocked] = useState(false);
  const [resources, setResources] = useState({
    projects: [],
    regions: [],
    instance_types: [],
    os_images: [],
    volume_types: [],
    bandwidths: [],
    security_groups: [],
    keypairs: [],
  });
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [orderReceipt, setOrderReceipt] = useState(null);
  const [configurations, setConfigurations] = useState([createConfiguration()]);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [hasLockedPaymentStep, setHasLockedPaymentStep] = useState(false);
  const adminToken = useAdminAuthStore.getState()?.token || null;

  const isFastTrack = mode === "fast-track";
  const { data: tenants = [], isFetching: isTenantsLoading } = useFetchTenants();
  const { data: clients = [], isFetching: isClientsLoading } = useFetchClients();
  const { data: sharedCountries = [], isFetching: isCountriesLoading } = useFetchCountries();
  const { data: generalRegions = [], isFetching: isGeneralRegionsLoading } = useFetchGeneralRegions();

  const steps = useMemo(() => {
    if (isFastTrack) {
      return [
        { id: "workflow", title: "Workflow & assignment", desc: "Choose billing path and who owns this request." },
        { id: "services", title: "Compute profiles", desc: "Select projects, regions, sizes, and volumes." },
        { id: "review", title: "Review & submit", desc: "Validate totals and confirm provisioning." },
      ];
    }
    return [
      { id: "workflow", title: "Workflow & assignment", desc: "Choose billing path and who owns this request." },
      { id: "services", title: "Compute profiles", desc: "Select projects, regions, sizes, and volumes." },
      { id: "payment", title: "Payment", desc: "Generate payment options and share with finance." },
      { id: "review", title: "Review & submit", desc: "Validate totals and confirm provisioning." },
    ];
  }, [isFastTrack]);

  useEffect(() => {
    setActiveStep((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  useEffect(() => {
    const loadResources = async () => {
      setIsLoadingResources(true);
      try {
        const res = await adminSilentApi("GET", "/instances/resources");
        const data = res?.data || {};
        setResources({
          projects: data.projects || [],
          regions: data.regions || [],
          instance_types: data.instance_types || [],
          os_images: data.os_images || [],
          volume_types: data.volume_types || [],
          bandwidths: data.bandwidths || data.bandwidth || [],
          security_groups: data.security_groups || data.securityGroups || [],
          keypairs: data.keypairs || data.key_pairs || [],
        });
      } catch (error) {
        console.error("Failed to load resources", error);
        ToastUtils.error("Could not load instance resources.");
      } finally {
        setIsLoadingResources(false);
      }
    };

    loadResources();
  }, []);

  const tenantOptions = useMemo(() => {
    if (!Array.isArray(tenants)) return [];
    return tenants
      .map((tenant) => {
        const value = tenant.id ?? tenant.identifier ?? tenant.code ?? tenant.slug ?? "";
        if (!value) return null;
        const label =
          tenant.name ||
          tenant.company_name ||
          tenant.identifier ||
          tenant.code ||
          `Tenant ${value}`;
        return { value: String(value), label, raw: tenant };
      })
      .filter(Boolean);
  }, [tenants]);

  const clientOptions = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    const scoped = selectedTenant
      ? clients.filter((client) => {
          const tId = client.tenant_id || client.tenantId || client.tenant?.id;
          return !tId || String(tId) === String(selectedTenant);
        })
      : clients;
    return scoped
      .map((client) => {
        const value = client.id ?? client.identifier ?? client.code ?? client.slug ?? "";
        if (!value) return null;
        const label =
          client.name ||
          client.full_name ||
          client.email ||
          client.identifier ||
          `User ${value}`;
        return { value: String(value), label, raw: client };
      })
      .filter(Boolean);
  }, [clients, selectedTenant]);

  const selectedTenantLabel = useMemo(() => {
    const match = tenantOptions.find((t) => t.value === String(selectedTenant));
    return match?.label || "";
  }, [tenantOptions, selectedTenant]);

  const selectedUserLabel = useMemo(() => {
    const match = clientOptions.find((c) => c.value === String(selectedUser));
    return match?.label || "";
  }, [clientOptions, selectedUser]);

  const countryOptions = useMemo(() => {
    const apiCountries = Array.isArray(sharedCountries) ? sharedCountries : [];
    if (apiCountries.length > 0) {
      const mapped = apiCountries
        .map((item) => {
          const code =
            normalizeCountryCandidate(
              item?.code ||
                item?.iso2 ||
                item?.country_code ||
                item?.iso_code ||
                item?.iso ||
                item?.id ||
                item?.country ||
                ""
            ) || "";
          if (!code) return null;
          const upper = code.toUpperCase();
          const name =
            item?.name ||
            item?.country_name ||
            item?.country ||
            upper;
          return {
            value: upper,
            label:
              name && name.toLowerCase() !== upper.toLowerCase()
                ? `${name} (${upper})`
                : upper,
            currency:
              item?.currency_code ||
              item?.currency ||
              item?.currencyCode ||
              item?.currency_symbol ||
              item?.currencySymbol ||
              "USD",
          };
        })
        .filter(Boolean);

      const hasUS = mapped.some(
        (option) => option?.value && String(option.value).toUpperCase() === "US"
      );
      return hasUS ? mapped : [{ value: "US", label: "United States (US)" }, ...mapped];
    }

    return [...COUNTRY_FALLBACK];
  }, [sharedCountries]);

  const billingCountryLabel = useMemo(() => {
    if (!billingCountry) {
      return "United States (US)";
    }
    const match =
      countryOptions.find(
        (option) => String(option.value).toUpperCase() === billingCountry.toUpperCase()
      ) || null;
    return match?.label || billingCountry.toUpperCase();
  }, [billingCountry, countryOptions]);

  const summaryCurrency = useMemo(() => {
    const match = countryOptions.find(
      (option) => String(option.value).toUpperCase() === (billingCountry || "US").toUpperCase()
    );
    return match?.currency || "USD";
  }, [countryOptions, billingCountry]);

  const assignmentSummary = useMemo(() => {
    if (assignmentType === "tenant") {
      if (!selectedTenant) return "Select tenant";
      return selectedTenantLabel || "Tenant selected";
    }
    if (assignmentType === "user") {
      if (!selectedUser) return "Select user";
      return selectedUserLabel || "User selected";
    }
    return "Unassigned";
  }, [assignmentType, selectedTenantLabel, selectedUserLabel]);

  const regionSelectOptions = useMemo(() => {
    const primary = Array.isArray(generalRegions) && generalRegions.length > 0 ? generalRegions : resources.regions || [];
    return primary.map((region) => {
      const value = region.code || region.region || region.slug || region.id || region.identifier || "";
      if (!value) return null;
      const label =
        region.name ||
        region.display_name ||
        region.label ||
        `${value}`;
      return {
        value: String(value),
        label: region.name && region.name.toLowerCase() !== value.toLowerCase() ? `${region.name} (${value})` : label,
      };
    }).filter(Boolean);
  }, [generalRegions, resources.regions]);

  const bandwidthOptions = useMemo(() => {
    return (resources.bandwidths || []).map((bw) => {
      const value = bw.id || bw.identifier;
      if (!value) return null;
      const label =
        bw.name ||
        bw.label ||
        `${bw.capacity || ""} ${bw.unit || ""}`.trim() ||
        `Bandwidth ${value}`;
      return { value: String(value), label };
    }).filter(Boolean);
  }, [resources.bandwidths]);

  const configurationSummaries = useMemo(() => {
    const instanceTypes = resources.instance_types || [];
    const osImages = resources.os_images || [];
    const volumeTypes = resources.volume_types || [];
    const keyPairs = resources.keypairs || [];
    const findLabel = (collection, id, fallbackPrefix) => {
      if (!id) return "Not selected";
      const match = collection.find(
        (item) => String(item.id || item.identifier || item.name) === String(id)
      );
      if (!match) return fallbackPrefix ? `${fallbackPrefix} ${id}` : String(id);
      return match.name || match.label || `${fallbackPrefix || "Item"} ${id}`;
    };
    const formatComputeLabel = (id) => {
      const match = instanceTypes.find((item) => String(item.id) === String(id));
      if (!match) return id ? `Instance ${id}` : "Not selected";
      const memoryGb = match.memory_mb ? Math.round(Number(match.memory_mb) / 1024) : match.memory_gb;
      const meta = [];
      if (match.vcpus) meta.push(`${match.vcpus} vCPU`);
      if (memoryGb) meta.push(`${memoryGb} GB RAM`);
      return meta.length ? `${match.name} • ${meta.join(" • ")}` : match.name;
    };
    const formatOsLabel = (id) => findLabel(osImages, id, "OS");
    const formatVolumeLabel = (id, size) => {
      if (!id) return "Volume not selected";
      const match = volumeTypes.find((item) => String(item.id) === String(id));
      const label = match?.name || `Volume ${id}`;
      return size ? `${label} • ${size} GB` : label;
    };
    const formatKeypairLabel = (value, explicitLabel = "") => {
      if (explicitLabel) return explicitLabel;
      if (!value) return "No key pair";
      const match = keyPairs.find((kp) => {
        const candidate = kp.name || kp.id;
        return candidate && String(candidate) === String(value);
      });
      return match?.name || match?.label || value || "No key pair";
    };
    const formatSubnetLabel = (cfg) => {
      if (cfg.subnet_label) return cfg.subnet_label;
      if (!cfg.subnet_id) return "Default subnet";
      return "Subnet selected";
    };

    return configurations.map((cfg) => {
      const status = evaluateConfigurationCompleteness(cfg);
      const computeLabel = formatComputeLabel(cfg.compute_instance_id);
      const defaultTitle =
        cfg.name?.trim() ||
        (computeLabel && computeLabel !== "Not selected" ? computeLabel : "Instance configuration");
      return {
        id: cfg.id,
        title: defaultTitle,
        regionLabel:
          regionSelectOptions.find((opt) => opt.value === cfg.region)?.label ||
          cfg.region ||
          "No region selected",
        computeLabel,
        osLabel: formatOsLabel(cfg.os_image_id),
        termLabel: cfg.months ? `${cfg.months} month${Number(cfg.months) === 1 ? "" : "s"}` : "Not selected",
        storageLabel: formatVolumeLabel(cfg.volume_type_id, cfg.storage_size_gb),
        floatingIpLabel: `${Number(cfg.floating_ip_count || 0)} floating IP${Number(cfg.floating_ip_count || 0) === 1 ? "" : "s"}`,
        keypairLabel: formatKeypairLabel(cfg.keypair_name, cfg.keypair_label),
        subnetLabel: formatSubnetLabel(cfg),
        statusLabel: status.isComplete ? "Complete" : "Incomplete",
        isComplete: status.isComplete,
      };
    });
  }, [
    configurations,
    regionSelectOptions,
    resources.instance_types,
    resources.os_images,
    resources.volume_types,
    resources.keypairs,
  ]);

  const paymentOptionsList =
    submissionResult?.payment?.payment_gateway_options ||
    orderReceipt?.payment?.payment_gateway_options ||
    [];
  const effectivePaymentOption = selectedPaymentOption || paymentOptionsList[0] || null;
  const paymentBreakdown =
    effectivePaymentOption?.charge_breakdown ||
    effectivePaymentOption?.chargeBreakdown ||
    submissionResult?.payment?.charge_breakdown ||
    orderReceipt?.payment?.charge_breakdown ||
    null;

  const backendPricingData = useMemo(() => {
    const rawSource =
      submissionResult?.pricing_breakdown ||
      submissionResult?.transaction?.metadata?.pricing_breakdown ||
      orderReceipt?.pricing_breakdown ||
      orderReceipt?.transaction?.metadata?.pricing_breakdown ||
      orderReceipt?.order?.pricing_breakdown ||
      null;
    if (!rawSource) return null;
    const bucket = Array.isArray(rawSource) ? rawSource[0] : rawSource;
    if (!bucket) return null;
    const subtotal = Number(bucket.subtotal ?? bucket.pre_discount_subtotal ?? 0);
    const taxValue = Number(bucket.tax ?? bucket.tax_total ?? 0);
    const total = Number(bucket.total ?? bucket.grand_total ?? 0);
    let taxRate = Number(bucket.tax_rate ?? bucket.taxRate ?? 0);
    if ((!taxRate || Number.isNaN(taxRate)) && subtotal > 0 && taxValue > 0) {
      taxRate = Number(((taxValue / subtotal) * 100).toFixed(4));
    }
    return {
      subtotal,
      tax: taxValue,
      total,
      currency: bucket.currency || summaryCurrency,
      taxRate,
      lines: Array.isArray(bucket.lines) ? bucket.lines : [],
    };
  }, [submissionResult, orderReceipt, summaryCurrency]);

  const summaryDisplayCurrency =
    backendPricingData?.currency ||
    paymentBreakdown?.currency ||
    paymentBreakdown?.base_currency ||
    effectivePaymentOption?.currency ||
    orderReceipt?.order?.currency ||
    orderReceipt?.transaction?.currency ||
    summaryCurrency;
  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  let summaryGrandTotalValue = toNumber(
    paymentBreakdown?.total ??
      paymentBreakdown?.grand_total ??
      paymentBreakdown?.amount_due ??
      effectivePaymentOption?.charge_breakdown?.total ??
      effectivePaymentOption?.charge_breakdown?.amount_due ??
      effectivePaymentOption?.total ??
      effectivePaymentOption?.amount ??
      effectivePaymentOption?.payable_amount ??
      orderReceipt?.order?.total ??
      submissionResult?.order?.total ??
      orderReceipt?.transaction?.amount ??
      submissionResult?.transaction?.amount ??
      0
  );
  let summarySubtotalValue = toNumber(
    paymentBreakdown?.subtotal ??
      paymentBreakdown?.base_amount ??
      paymentBreakdown?.amount_before_fees ??
      effectivePaymentOption?.charge_breakdown?.subtotal ??
      effectivePaymentOption?.charge_breakdown?.base_amount ??
      effectivePaymentOption?.subtotal ??
      effectivePaymentOption?.base_amount ??
      orderReceipt?.order?.subtotal ??
      submissionResult?.order?.subtotal ??
      0
  );
  let summaryTaxValue = toNumber(
    paymentBreakdown?.tax ??
      paymentBreakdown?.taxes ??
      paymentBreakdown?.tax_amount ??
      paymentBreakdown?.vat ??
      effectivePaymentOption?.charge_breakdown?.tax ??
      effectivePaymentOption?.charge_breakdown?.tax_amount ??
      effectivePaymentOption?.tax ??
      effectivePaymentOption?.taxes ??
      orderReceipt?.order?.tax_total ??
      submissionResult?.order?.tax_total ??
      0
  );
  let summaryGatewayFeesValue = toNumber(
    paymentBreakdown?.gateway_fees ??
      paymentBreakdown?.fees ??
      paymentBreakdown?.gatewayFees ??
      paymentBreakdown?.processing_fee ??
      effectivePaymentOption?.charge_breakdown?.total_fees ??
      effectivePaymentOption?.total_fees ??
      effectivePaymentOption?.fees ??
      orderReceipt?.order?.gateway_fees ??
      submissionResult?.order?.gateway_fees ??
      0
  );

  const taxRateCandidates = [
    paymentBreakdown?.tax_rate,
    paymentBreakdown?.taxRate,
    paymentBreakdown?.vat_rate,
    paymentBreakdown?.tax_percentage,
    effectivePaymentOption?.tax_rate,
    effectivePaymentOption?.taxRate,
    effectivePaymentOption?.vat_rate,
    effectivePaymentOption?.tax_percentage,
    orderReceipt?.order?.tax_rate,
    orderReceipt?.order?.taxRate,
    submissionResult?.order?.tax_rate,
    submissionResult?.order?.taxRate,
  ];
  let summaryTaxRateValue = 0;
  if (backendPricingData) {
    if (backendPricingData.subtotal > 0) {
      summarySubtotalValue = backendPricingData.subtotal;
    }
    if (backendPricingData.tax >= 0) {
      summaryTaxValue = backendPricingData.tax;
    }
    if (backendPricingData.total > 0) {
      summaryGrandTotalValue = backendPricingData.total;
    }
    if (backendPricingData.taxRate > 0) {
      summaryTaxRateValue = backendPricingData.taxRate;
    }
  }

  for (const candidate of taxRateCandidates) {
    const num = Number(candidate);
    if (Number.isFinite(num) && num > 0) {
      summaryTaxRateValue = num;
      break;
    }
  }
  if (!summaryTaxValue && summaryTaxRateValue > 0 && summarySubtotalValue > 0) {
    const recalculatedTax = summarySubtotalValue * (summaryTaxRateValue / 100);
    if (recalculatedTax > 0) {
      summaryTaxValue = recalculatedTax;
    }
  }
  if ((!summaryTaxRateValue || Number.isNaN(summaryTaxRateValue)) && summarySubtotalValue > 0 && summaryTaxValue > 0) {
    summaryTaxRateValue = (summaryTaxValue / summarySubtotalValue) * 100;
  }
  if (summarySubtotalValue === 0 && summaryGrandTotalValue > 0) {
    const recalculated = summaryGrandTotalValue - summaryTaxValue - summaryGatewayFeesValue;
    summarySubtotalValue = recalculated > 0 ? recalculated : summaryGrandTotalValue;
  }
  const computedGrandTotal =
    summarySubtotalValue + summaryTaxValue + summaryGatewayFeesValue;
  if (computedGrandTotal > 0) {
    summaryGrandTotalValue = computedGrandTotal;
  }
  const taxLabelSuffix =
    summaryTaxRateValue && Number.isFinite(summaryTaxRateValue) && summaryTaxRateValue > 0
      ? ` (${Number(summaryTaxRateValue).toFixed(2)}%)`
      : "";
  const summaryConfigurationCount = configurationSummaries.length || configurations.length || 0;
  const summaryPlanLabel = useMemo(() => {
    if (!configurationSummaries.length) return "Instance profile";
    if (configurationSummaries.length === 1) {
      const summary = configurationSummaries[0];
      return summary.computeLabel || "Instance profile";
    }
    return `${configurationSummaries.length} compute profiles`;
  }, [configurationSummaries]);
  const summaryWorkflowLabel = isFastTrack
    ? "Fast-track provisioning"
    : "Standard payment workflow";

  const renderOrderOverviewCard = () => {
    const overviewStatus = submissionResult
      ? submissionResult.payment?.required
        ? { label: "Payment", tone: "warning" }
        : { label: "Ready", tone: "info" }
      : { label: "Manual review", tone: "warning" };

    const transactionIdentifier =
      submissionResult?.transaction?.identifier ||
      submissionResult?.transaction?.reference ||
      submissionResult?.transaction?.id ||
      orderReceipt?.transaction?.identifier ||
      orderReceipt?.transaction?.id ||
      effectivePaymentOption?.transaction_reference ||
      "";
    const estimatedTaxLabel = `Estimated tax${taxLabelSuffix}`;

    return (
      <ModernCard variant="elevated" padding="lg" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">
              Order overview
            </p>
            <p className="text-xs text-slate-500">
              Auto-calculated from the captured configuration and provisioning response.
            </p>
          </div>
          <StatusPill label={overviewStatus.label} tone={overviewStatus.tone} />
        </div>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-700">
              Instance configurations ({configurationSummaries.length || configurations.length || 0})
            </p>
            <div className="mt-2 space-y-2">
              {configurationSummaries.length === 0 && (
                <p className="text-xs text-slate-500">
                  Add at least one compute profile to populate the order overview.
                </p>
              )}
              {configurationSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {summary.title || "Instance configuration"}
                      </p>
                      <p className="text-xs text-slate-500">{summary.regionLabel}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        summary.isComplete
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {summary.statusLabel}
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-3 text-xs text-slate-600 lg:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <dt>Compute</dt>
                      <dd className="font-medium text-slate-800 text-right break-words">
                        {summary.computeLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>OS image</dt>
                      <dd className="font-medium text-slate-800 text-right break-words">
                        {summary.osLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Term</dt>
                      <dd className="font-medium text-slate-800 text-right break-words">
                        {summary.termLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Storage</dt>
                      <dd className="font-medium text-slate-800 text-right break-words">
                        {summary.storageLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Floating IPs</dt>
                      <dd className="font-medium text-slate-800 text-right break-words">
                        {summary.floatingIpLabel}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Key pair</dt>
                      <dd className="font-medium text-slate-800 text-right break-words">
                        {summary.keypairLabel || "No key pair"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Subnet</dt>
                      <dd className="font-medium text-slate-800 text-right break-words">
                        {summary.subnetLabel || "Default subnet"}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Plan label</dt>
            <dd className="font-medium text-slate-900">
              {summaryPlanLabel}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Workflow</dt>
            <dd className="font-medium text-slate-900 text-right">
              {summaryWorkflowLabel}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Assignment</dt>
            <dd className="font-medium text-slate-900 text-right">
              {assignmentSummary}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Billing country</dt>
            <dd className="font-medium text-slate-900 text-right">
              {billingCountryLabel}
            </dd>
          </div>
          {transactionIdentifier && (
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Transaction</dt>
              <dd className="font-medium text-slate-900 text-right">
                {transactionIdentifier}
              </dd>
            </div>
          )}
          {!configurationSummaries.length && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-sm font-semibold text-slate-800">Pending service profile</p>
              <p className="text-xs text-slate-500">
                Compute profile will populate after you continue.
              </p>
            </div>
          )}
          <div className="space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">
                {summaryDisplayCurrency} {formatCurrencyValue(summarySubtotalValue)}
              </span>
            </div>
          <div className="flex items-center justify-between">
            <span>{estimatedTaxLabel}</span>
            <span className="font-semibold text-slate-900">
              {summaryDisplayCurrency} {formatCurrencyValue(summaryTaxValue)}
            </span>
          </div>
            <div className="flex items-center justify-between">
              <span>Gateway fees</span>
              <span className="font-semibold text-slate-900">
                {summaryDisplayCurrency} {formatCurrencyValue(summaryGatewayFeesValue)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-sm font-semibold text-slate-900">
              Grand total
            </span>
            <span className="text-lg font-bold text-slate-900">
              {summaryDisplayCurrency} {formatCurrencyValue(summaryGrandTotalValue)}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {summaryConfigurationCount} service profile
            {summaryConfigurationCount === 1 ? "" : "s"} captured. Taxes are estimated and may change
            after finance review.
          </div>
          {backendPricingData?.lines?.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Pricing breakdown
              </p>
              <p className="text-xs text-slate-500">
                Pulled directly from the backend pricing response.
              </p>
              <div className="mt-3 space-y-2">
                {backendPricingData.lines.map((line, index) => {
                  const lineCurrency =
                    line.currency || backendPricingData.currency || summaryDisplayCurrency;
                  const lineRegion =
                    line.meta?.region ||
                    line.meta?.region_code ||
                    line.meta?.regionCode ||
                    "Region";
                  const frequencyLabel = line.frequency
                    ? line.frequency.charAt(0).toUpperCase() + line.frequency.slice(1)
                    : null;
                  const quantityLabel = line.quantity
                    ? `${line.quantity} ${line.meta?.unit || "units"}`
                    : null;
                  return (
                    <div
                      key={line.name || index}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {line.name || `Line ${index + 1}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {lineRegion}
                            {frequencyLabel ? ` • ${frequencyLabel}` : ""}
                            {line.months ? ` • ${line.months} mo` : ""}
                          </p>
                          {quantityLabel && (
                            <p className="text-[11px] text-slate-500">{quantityLabel}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {Number(line.unit_amount) > 0 && (
                            <p className="text-xs text-slate-500">
                              Unit: {lineCurrency} {formatCurrencyValue(line.unit_amount)}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-slate-900">
                            {lineCurrency} {formatCurrencyValue(line.total ?? 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ModernCard>
    );
  };

  const paymentStatusRaw = (
    submissionResult?.payment?.status ||
    submissionResult?.transaction?.status ||
    orderReceipt?.payment?.status ||
    orderReceipt?.transaction?.status ||
    ""
  ).toLowerCase();
  const paymentStatusLabel = paymentStatusRaw
    ? paymentStatusRaw.charAt(0).toUpperCase() + paymentStatusRaw.slice(1)
    : "Pending";
  const paymentStatusTone = ["paid", "successful", "completed"].includes(paymentStatusRaw)
    ? "success"
    : "warning";
  const isPaymentSuccessful = ["paid", "successful", "completed"].includes(paymentStatusRaw);
  const isPaymentPending = !isPaymentSuccessful;
  const paymentCurrencyLabel =
    effectivePaymentOption?.currency ||
    orderReceipt?.order?.currency ||
    orderReceipt?.transaction?.currency ||
    summaryDisplayCurrency;
  const paymentAmountLabel = formatCurrencyValue(
    effectivePaymentOption?.charge_breakdown?.total ??
      effectivePaymentOption?.total ??
      effectivePaymentOption?.amount ??
      summaryGrandTotalValue
  );
  const paymentTransactionLabel =
    effectivePaymentOption?.transaction_reference ||
    orderReceipt?.transaction?.identifier ||
    orderReceipt?.transaction?.id ||
    "—";
  const paymentGatewayLabel =
    effectivePaymentOption?.name ||
    effectivePaymentOption?.label ||
    submissionResult?.payment?.gateway ||
    orderReceipt?.payment?.gateway ||
    "Pending gateway";
  const paymentMethodLabel =
    effectivePaymentOption?.method ||
    effectivePaymentOption?.payment_type ||
    submissionResult?.payment?.method ||
    orderReceipt?.payment?.method ||
    "—";

  useEffect(() => {
    if (assignmentType === "tenant") {
      if (!selectedTenant) {
        setIsCountryLocked(false);
        return;
      }
      const tenantEntry = tenantOptions.find((option) => option.value === String(selectedTenant));
      const tenantCountry = resolveCountryCodeFromEntity(tenantEntry?.raw, countryOptions);
      if (tenantCountry) {
        setIsCountryLocked(true);
        setBillingCountry((prev) =>
          prev === tenantCountry ? prev : tenantCountry
        );
      } else {
        setIsCountryLocked(false);
      }
      return;
    }

    if (assignmentType === "user") {
      if (!selectedTenant && !selectedUser) {
        setIsCountryLocked(false);
        return;
      }

      const userEntry = clientOptions.find((client) => client.value === String(selectedUser));
      let detectedCountry = resolveCountryCodeFromEntity(userEntry?.raw, countryOptions);

      if (!detectedCountry && selectedTenant) {
        const tenantEntry = tenantOptions.find((option) => option.value === String(selectedTenant));
        detectedCountry = resolveCountryCodeFromEntity(tenantEntry?.raw, countryOptions);
      }

      if (detectedCountry) {
        setIsCountryLocked(true);
        setBillingCountry((prev) =>
          prev === detectedCountry ? prev : detectedCountry
        );
      } else {
        setIsCountryLocked(false);
      }
      return;
    }

    setIsCountryLocked(false);
  }, [assignmentType, selectedTenant, selectedUser, tenantOptions, clientOptions, countryOptions]);

  const handleModeChange = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setSearchParams((prevParams) => {
      const params = new URLSearchParams(prevParams);
      if (nextMode === "fast-track") {
        params.set("mode", "fast-track");
      } else {
        params.delete("mode");
      }
      return params;
    });
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const currentStep = Math.min(activeStep, steps.length - 1);
  const reviewStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "review"),
    [steps]
  );
  useEffect(() => {
    if (!hasLockedPaymentStep && reviewStepIndex >= 0 && activeStep >= reviewStepIndex) {
      setHasLockedPaymentStep(true);
    }
  }, [activeStep, reviewStepIndex, hasLockedPaymentStep]);
  const stepCounterLabel = `Step ${currentStep + 1} of ${steps.length}`;
  const updateConfiguration = useCallback((id, patch) => {
    setConfigurations((prev) =>
      prev.map((cfg) => (cfg.id === id ? { ...cfg, ...patch } : cfg))
    );
  }, []);

  const addConfiguration = useCallback(() => {
    const incompleteIndex = configurations.findIndex(
      (cfg) => !evaluateConfigurationCompleteness(cfg).isComplete
    );
    if (incompleteIndex !== -1) {
      ToastUtils.error(
        `Complete Configuration #${incompleteIndex + 1} before adding another one.`
      );
      return;
    }
    setConfigurations((prev) => [...prev, createConfiguration()]);
  }, [configurations]);

  const removeConfiguration = useCallback((id) => {
    setConfigurations((prev) => (prev.length <= 1 ? prev : prev.filter((cfg) => cfg.id !== id)));
  }, []);

  const addAdditionalVolume = useCallback((configId) => {
    setConfigurations((prev) =>
      prev.map((cfg) => {
        if (cfg.id !== configId) return cfg;
        return {
          ...cfg,
          additional_volumes: [
            ...(cfg.additional_volumes || []),
            {
              id: genId(),
              volume_type_id: "",
              storage_size_gb: 50,
            },
          ],
        };
      })
    );
  }, []);

  const updateAdditionalVolume = useCallback((configId, volumeId, patch) => {
    setConfigurations((prev) =>
      prev.map((cfg) => {
        if (cfg.id !== configId) return cfg;
        return {
          ...cfg,
          additional_volumes: (cfg.additional_volumes || []).map((vol) =>
            vol.id === volumeId ? { ...vol, ...patch } : vol
          ),
        };
      })
    );
  }, []);

  const removeAdditionalVolume = useCallback((configId, volumeId) => {
    setConfigurations((prev) =>
      prev.map((cfg) => {
        if (cfg.id !== configId) return cfg;
        return {
          ...cfg,
          additional_volumes: (cfg.additional_volumes || []).filter((vol) => vol.id !== volumeId),
        };
      })
    );
  }, []);

  const handleStepChange = useCallback(
    (targetIndex) => {
      if (targetIndex === currentStep) return;
      if (!isFastTrack && reviewStepIndex >= 0) {
        if (!isPaymentSuccessful && targetIndex >= reviewStepIndex) {
          ToastUtils.error("Please complete payment to continue to review.");
          return;
        }
        const paymentStepIndex = reviewStepIndex - 1;
        if (hasLockedPaymentStep && targetIndex === paymentStepIndex) {
          ToastUtils.error("You cannot return to the payment step after reviewing.");
          return;
        }
      }
      setActiveStep(targetIndex);
    },
    [currentStep, isFastTrack, reviewStepIndex, isPaymentSuccessful, hasLockedPaymentStep]
  );

  const buildPayload = () => {
    const pricing_requests = configurations.map((cfg, index) => {
      const requiredFields = [
        { key: "region", label: `Region (config ${index + 1})` },
        { key: "compute_instance_id", label: `Instance type (config ${index + 1})` },
        { key: "os_image_id", label: `OS image (config ${index + 1})` },
        { key: "volume_type_id", label: `Volume type (config ${index + 1})` },
      ];
      const missing = requiredFields.filter(
        ({ key }) => !cfg[key] || cfg[key] === ""
      );
      if (missing.length) {
        throw new Error(
          `Select: ${missing.map((f) => f.label).join(", ")} before submitting.`
        );
      }

      const parsedBandwidthCount = Number(cfg.bandwidth_count) || 1;
      const parsedFloatingIpCount = Number(cfg.floating_ip_count) || 0;
      const parsedMonths = Number(cfg.months) || 1;
      const parsedInstances = Number(cfg.instance_count || cfg.number_of_instances) || 1;
      const parsedStorage = Number(cfg.storage_size_gb) || 50;
      const instanceName = (cfg.name || "").trim() || null;
      const instanceDescription = (cfg.description || "").trim() || null;
      const networkId = cfg.network_id || null;
      const subnetId = cfg.subnet_id || null;
      const tags = (cfg.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const sanitizedSgIds = (Array.isArray(cfg.security_group_ids)
        ? cfg.security_group_ids
        : (cfg.security_group_ids || "").split(",")
      )
        .map((v) => (v && v.value ? v.value : v))
        .map((v) => (v || "").toString().trim())
        .filter(Boolean);

      const extraVolumes = (cfg.additional_volumes || [])
        .map((vol) => ({
          volume_type_id: vol.volume_type_id,
          storage_size_gb: Number(vol.storage_size_gb) || 0,
        }))
        .filter((vol) => vol.volume_type_id && vol.storage_size_gb > 0);

      const fastTrackLine = isFastTrack || cfg.launch_mode === "fast-track";

      return {
        project_id: cfg.project_id || undefined,
        region: cfg.region || undefined,
        compute_instance_id: cfg.compute_instance_id,
        os_image_id: cfg.os_image_id,
        months: parsedMonths,
        number_of_instances: parsedInstances,
        volume_types: [
          {
            volume_type_id: cfg.volume_type_id,
            storage_size_gb: parsedStorage,
          },
          ...extraVolumes,
        ],
        bandwidth_id: cfg.bandwidth_id || null,
        bandwidth_count: parsedBandwidthCount,
        floating_ip_count: parsedFloatingIpCount,
        cross_connect_id: undefined,
        security_group_ids: sanitizedSgIds,
        keypair_name: cfg.keypair_name || null,
        network_id: networkId,
        subnet_id: subnetId,
        name: instanceName,
        description: instanceDescription,
        tags,
        fast_track: fastTrackLine,
      };
    });

    const anyFastTrack = isFastTrack || pricing_requests.some((req) => req.fast_track);

    return {
      customer_tenant_id: assignmentType === "tenant" ? selectedTenant : null,
      customer_user_id: assignmentType === "user" ? selectedUser : null,
      fast_track: anyFastTrack,
      country_iso: billingCountry || undefined,
      pricing_requests,
    };
  };

  const handlePaymentCompleted = useCallback(
    (payload) => {
      const normalizedStatus = (payload?.status || "successful").toLowerCase();
      setSubmissionResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          transaction: {
            ...prev.transaction,
            status: normalizedStatus,
            payment_reference: payload?.reference || prev.transaction?.payment_reference,
          },
          payment: {
            ...(prev.payment || {}),
            status: normalizedStatus,
          },
        };
      });
      setOrderReceipt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          transaction: {
            ...prev.transaction,
            status: normalizedStatus,
            payment_reference: payload?.reference || prev.transaction?.payment_reference,
          },
          payment: {
            ...(prev.payment || {}),
            status: normalizedStatus,
          },
        };
      });
      ToastUtils.success("Payment completed.");
    },
    []
  );

  const handleVerifyPayment = useCallback(async () => {
    const identifier =
      submissionResult?.transaction?.identifier ||
      submissionResult?.transaction?.id ||
      orderReceipt?.transaction?.identifier ||
      orderReceipt?.transaction?.id;
    if (!identifier) {
      ToastUtils.error("No transaction reference available to verify.");
      return;
    }
    const rawGateway =
      submissionResult?.payment?.gateway ||
      orderReceipt?.payment?.gateway ||
      selectedPaymentOption?.name ||
      "";
    const normalizedGateway = (() => {
      const lower = rawGateway.toString().toLowerCase();
      if (lower.includes("paystack") && lower.includes("card")) {
        return "Paystack_Card";
      }
      if (lower.includes("paystack")) return "Paystack";
      if (lower.includes("flutter")) return "Flutterwave";
      if (lower.includes("wallet")) return "Wallet";
      if (lower.includes("fincra")) return "Fincra";
      if (lower.includes("virtual")) return "Virtual_Account";
      return rawGateway || "Paystack";
    })();
    setIsVerifyingPayment(true);
    try {
      const payload = {
        payment_gateway: normalizedGateway,
      };
      if (normalizedGateway.toLowerCase().includes("paystack")) {
        payload.save_card_details = false;
      }
      const res = await adminApi("PUT", `/transactions/${identifier}`, payload);
      const responseData = res?.data || res;
      const normalizedStatus = (
        responseData?.status ||
        responseData?.transaction?.status ||
        "pending"
      ).toLowerCase();
      setSubmissionResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          transaction: {
            ...prev.transaction,
            status: normalizedStatus,
            payment_reference:
              responseData?.payment_reference ||
              responseData?.transaction?.payment_reference ||
              prev.transaction?.payment_reference,
          },
          payment: {
            ...(prev.payment || {}),
            status: normalizedStatus,
            gateway: normalizedGateway,
          },
        };
      });
      setOrderReceipt((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          transaction: {
            ...prev.transaction,
            status: normalizedStatus,
            payment_reference:
              responseData?.payment_reference ||
              responseData?.transaction?.payment_reference ||
              prev.transaction?.payment_reference,
          },
          payment: {
            ...(prev.payment || {}),
            status: normalizedStatus,
            gateway: normalizedGateway,
          },
        };
      });
      ToastUtils.success(`Payment status: ${responseData?.status || "pending"}`);
    } catch (error) {
      ToastUtils.error(error?.message || "Could not verify payment.");
    } finally {
      setIsVerifyingPayment(false);
    }
  }, [submissionResult, orderReceipt, selectedPaymentOption]);

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    setSubmissionResult(null);
    setOrderReceipt(null);
    try {
      const incompleteIndex = configurations.findIndex(
        (cfg) => !evaluateConfigurationCompleteness(cfg).isComplete
      );
      if (incompleteIndex !== -1) {
        throw new Error(`Complete Configuration #${incompleteIndex + 1} before pricing.`);
      }
      const payload = buildPayload();
      const res = await adminApi("POST", "/instances/create", payload);
      const data = res?.data || res;
      const normalizedGatewayOptions = normalizePaymentOptions(
        data?.payment?.payment_gateway_options ||
          data?.payment?.options ||
          data?.payment_options
      );
      const pricingBreakdownPayload =
        data?.pricing_breakdown ||
        data?.transaction?.metadata?.pricing_breakdown ||
        data?.order?.pricing_breakdown ||
        null;
      const mergedTransaction = data?.transaction
        ? {
            ...data.transaction,
            metadata: {
              ...(data.transaction.metadata || {}),
              ...(pricingBreakdownPayload ? { pricing_breakdown: pricingBreakdownPayload } : {}),
            },
          }
        : null;
      const mergedResult = {
        ...data,
        transaction: mergedTransaction,
        payment: data?.payment
          ? { ...data.payment, payment_gateway_options: normalizedGatewayOptions }
          : normalizedGatewayOptions.length
            ? { payment_gateway_options: normalizedGatewayOptions }
            : data?.payment,
        pricing_breakdown: pricingBreakdownPayload || data?.pricing_breakdown || null,
      };
      setSubmissionResult(mergedResult);
      setOrderReceipt({
        transaction: mergedResult?.transaction || null,
        order: mergedResult?.order || null,
        payment: mergedResult?.payment || null,
        pricing_breakdown: mergedResult?.pricing_breakdown || null,
      });
      setSelectedPaymentOption(normalizedGatewayOptions[0] || null);
      ToastUtils.success(
        mergedResult?.message ||
          (mergedResult?.payment?.required
            ? "Order created. Complete payment to proceed."
            : "Instances initiated.")
      );
      if (payload.fast_track) {
        setActiveStep(steps.length - 1);
      } else {
        setActiveStep(2);
      }
    } catch (error) {
      console.error("Failed to create instances", error);
      ToastUtils.error(error?.message || "Could not create instances.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Create instance plan"
        description="Capture workflow selection and keep compute provisioning aligned."
        actions={
          <ModernButton variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to overview
          </ModernButton>
        }
        contentClassName="space-y-8"
      >
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Select workflow
              </p>
              <p className="text-sm text-slate-600">
                Choose between a guided plan creation or a fast-track provisioning shortcut.
              </p>
            </div>
            <ModernButton variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </ModernButton>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleModeChange("standard")}
              className={[
                "flex h-full flex-col rounded-2xl border p-5 text-left transition",
                isFastTrack
                  ? "border-slate-200 hover:border-slate-300"
                  : "border-blue-200 bg-blue-50 ring-2 ring-blue-200",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    Process Instance Payment
                  </p>
                  <p className="text-sm text-slate-600">
                    Process payment and capture billing details.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>• Works for approved sales or finance-led activations.</li>
                <li>• Lets you flag invoices as pending or paid.</li>
                <li>• Keeps provisioning status in manual control.</li>
              </ul>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("fast-track")}
              className={[
                "flex h-full flex-col rounded-2xl border p-5 text-left transition",
                isFastTrack
                  ? "border-emerald-200 bg-emerald-50 ring-2 ring-emerald-200"
                  : "border-emerald-200 hover:border-emerald-300",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <Gauge className="mt-0.5 h-6 w-6 text-emerald-600" />
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    Fast-track Provisioning
                  </p>
                  <p className="text-sm text-slate-600">
                    Skip payment collection and start provisioning immediately.
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>• Marks payment as admin approved automatically.</li>
                <li>• Moves the order into provisioning immediately.</li>
                <li>• Best for exceptions with pre-approval.</li>
              </ul>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-sky-600" />
              <div>
                <p className="text-base font-semibold text-slate-900">Steps</p>
                <p className="text-sm text-slate-600">
                  Follow the steps below; click to jump back if needed.
                </p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm font-medium text-sky-700">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              {stepCounterLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepChange(index)}
                  className={[
                    "flex h-full flex-col rounded-2xl border p-5 text-left transition",
                    isActive
                      ? "border-sky-200 bg-sky-50"
                      : "border-slate-200 hover:border-slate-300",
                  ].join(" ")}
                  >
                  <div className="flex items-center gap-2 text-slate-900">
                    <span className="text-sm font-semibold">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold">{step.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    {isActive ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                        In progress
                      </>
                    ) : isComplete ? (
                      <>
                        <Server className="h-4 w-4 text-emerald-600" />
                        Complete
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                        Pending
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {currentStep === 0 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <ModernCard variant="outlined" padding="lg" className="space-y-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    Customer context
                  </p>
                  <p className="text-sm text-slate-600">
                    Route the request to a tenant or user for visibility, or leave it unassigned for internal tracking.
                  </p>
                </div>
                <StatusPill
                  label={
                    assignmentType === "tenant"
                      ? "Tenant"
                      : assignmentType === "user"
                      ? "User"
                      : "Unassigned"
                  }
                  tone={assignmentType ? "info" : "neutral"}
                />
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { value: "", label: "Unassigned" },
                    { value: "tenant", label: "Tenant" },
                    { value: "user", label: "User" },
                  ].map((option) => (
                    <button
                      key={option.value || "none"}
                      type="button"
                      onClick={() => {
                        setAssignmentType(option.value);
                        setSelectedTenant("");
                        setSelectedUser("");
                      }}
                      className={[
                        "rounded-2xl border px-3 py-2 text-sm font-medium transition",
                        assignmentType === option.value
                          ? "border-primary-400 bg-primary-50 text-primary-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-primary-200",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <ModernSelect
                    label="Assignment"
                    value={assignmentType}
                  onChange={(event) => {
                    setAssignmentType(event.target.value);
                    setSelectedTenant("");
                    setSelectedUser("");
                  }}
                  options={[
                    { value: "", label: "Unassigned" },
                    { value: "tenant", label: "Tenant" },
                    { value: "user", label: "User" },
                  ]}
                  helper="Route this order to a tenant or user when you need visibility."
                />
                <ModernSelect
                  label="Tenant"
                  value={selectedTenant}
                  onChange={(event) => {
                    setSelectedTenant(event.target.value);
                    setSelectedUser("");
                  }}
                  options={[
                    { value: "", label: assignmentType ? "Select tenant" : "Choose assignment" },
                    ...tenantOptions,
                  ]}
                  disabled={!assignmentType || isTenantsLoading}
                  helper={
                    assignmentType
                      ? "Tenant workspace to receive this order."
                      : "Choose assignment type first."
                  }
                />
                <ModernSelect
                  label="User"
                  value={selectedUser}
                  onChange={(event) => setSelectedUser(event.target.value)}
                  options={[
                    { value: "", label: assignmentType === "user" ? "Select user" : "Choose assignment" },
                    ...clientOptions,
                  ]}
                  disabled={assignmentType !== "user" || isClientsLoading}
                  helper={
                    assignmentType === "user"
                      ? "Only required for user assignments."
                      : "Select assignment type first."
                  }
                  />
                </div>

                <p className="text-xs text-slate-600">
                  Current assignment:{" "}
                  <span className="font-semibold text-slate-800">
                    {assignmentType || "Unassigned"}
                  </span>
                </p>

                <ModernSelect
                  label="Billing country"
                  value={billingCountry}
                  onChange={(event) => setBillingCountry(event.target.value)}
                  options={[
                    { value: "", label: "Select an option" },
                    ...countryOptions,
                  ]}
                  disabled={isCountryLocked || isCountriesLoading}
                  helper={
                    isCountryLocked
                      ? "Synced from the selected tenant or user profile."
                      : "Optional. Leave empty to bill in USD by default."
                  }
                />

                <div className="flex justify-end pt-1">
                  <ModernButton
                    variant="primary"
                    onClick={() => handleStepChange(1)}
                    style={{
                      fontFamily: 'Outfit, Inter, "SF Pro Display", system-ui, sans-serif',
                      fontWeight: 400,
                      borderRadius: "30px",
                      padding: "10px 16px",
                      fontSize: "16px",
                      lineHeight: "24px",
                      minHeight: "40px",
                      backgroundColor: "#288DD1",
                      color: "#ffffff",
                      border: "1px solid transparent",
                      minWidth: "240px",
                    }}
                    className="shadow-md shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
                  >
                    Continue to service profiles
                  </ModernButton>
                </div>
              </div>
            </ModernCard>

            {renderOrderOverviewCard()}
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              {configurations.map((cfg, idx) => (
                <InstanceConfigurationCard
                  key={cfg.id}
                  cfg={cfg}
                  index={idx}
                  totalConfigurations={configurations.length}
                  updateConfiguration={updateConfiguration}
                  removeConfiguration={removeConfiguration}
                  addAdditionalVolume={addAdditionalVolume}
                  updateAdditionalVolume={updateAdditionalVolume}
                  removeAdditionalVolume={removeAdditionalVolume}
                  regionOptions={regionSelectOptions}
                  baseProjectOptions={resources.projects}
                  fallbackComputeInstances={resources.instance_types}
                  fallbackOsImages={resources.os_images}
                  fallbackVolumeTypes={resources.volume_types}
                  bandwidthOptions={bandwidthOptions}
                  billingCountry={billingCountry}
                  isLoadingResources={isLoadingResources || isGeneralRegionsLoading}
                  showActionRow={idx === configurations.length - 1}
                  onAddConfiguration={addConfiguration}
                  onBackToWorkflow={() => handleStepChange(0)}
                  onSubmitConfigurations={handleCreateOrder}
                  isSubmitting={isSubmitting}
                />
              ))}

            </div>

            <div className="space-y-4">{renderOrderOverviewCard()}</div>
          </div>
        )}

        {currentStep === 2 && !isFastTrack && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <ModernCard variant="outlined" padding="lg" className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Payment</p>
                    <p className="text-sm text-slate-500">
                      Complete payment to proceed with instance provisioning.
                    </p>
                  </div>
                  <StatusPill label={paymentStatusLabel} tone={paymentStatusTone} />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {paymentCurrencyLabel} {paymentAmountLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Gateway</p>
                      <p className="text-sm font-semibold text-slate-900">{paymentGatewayLabel}</p>
                      <p className="text-xs text-slate-500">{paymentMethodLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Transaction</p>
                      <p className="text-sm font-semibold text-slate-900">{paymentTransactionLabel}</p>
                      <p className="text-xs text-slate-600">
                        Status:{" "}
                        <span className={`font-semibold ${isPaymentSuccessful ? "text-emerald-600" : "text-amber-600"}`}>
                          {paymentStatusLabel}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                {submissionResult?.transaction ? (
                  <PaymentModal
                    isOpen
                    mode="inline"
                    transactionData={{ data: submissionResult }}
                    authToken={adminToken}
                    className="border border-slate-200"
                    apiBaseUrl={config.adminURL}
                    onPaymentComplete={handlePaymentCompleted}
                    onPaymentOptionChange={(option) => setSelectedPaymentOption(option || null)}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Generate pricing in step 2 to retrieve payment instructions.
                  </div>
                )}
                {isPaymentSuccessful && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-semibold">Payment verified</p>
                    <p className="text-xs text-emerald-700">
                      This transaction is confirmed. You can proceed to review without making additional payments.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <ModernButton
                    variant="ghost"
                    onClick={() => handleStepChange(1)}
                    style={{
                      borderRadius: "999px",
                      padding: "10px 24px",
                      border: "1px solid #DFE6F0",
                      backgroundColor: "#FFFFFF",
                      color: "#0F172A",
                    }}
                  >
                    Back to compute profiles
                  </ModernButton>
                  {isPaymentPending && submissionResult?.transaction && (
                    <ModernButton
                      variant="outline"
                      onClick={handleVerifyPayment}
                      isDisabled={isVerifyingPayment}
                    >
                      {isVerifyingPayment ? "Verifying..." : "Verify payment"}
                    </ModernButton>
                  )}
                  <ModernButton
                    variant="primary"
                    onClick={() =>
                      handleStepChange(Math.min(currentStep + 1, steps.length - 1))
                    }
                    isDisabled={!isPaymentSuccessful}
                    style={{
                      borderRadius: "999px",
                      padding: "12px 28px",
                      minWidth: "220px",
                      backgroundColor: "#1D7EDF",
                      color: "#FFFFFF",
                      border: "1px solid transparent",
                    }}
                    className="shadow-md shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
                  >
                    Continue to review
                  </ModernButton>
                </div>
              </ModernCard>
            </div>

            <div className="space-y-4">{renderOrderOverviewCard()}</div>
          </div>
        )}

      </AdminPageShell>
    </>
  );
};

export default AdminCreateInstance;
