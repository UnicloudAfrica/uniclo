import React, { useMemo, useEffect, useRef, useCallback } from "react";
import InstanceConfigurationForm from "@/shared/components/instance-wizard/InstanceConfigurationForm";
import { Configuration, Option, AdditionalVolume } from "@/types/InstanceConfiguration";
import { useFetchProjects } from "@/hooks/adminHooks/projectHooks";
import { useFetchProductPricing } from "@/hooks/resource";
import { useFetchSecurityGroups as _useFetchSG } from "@/shared/hooks/resources/securityGroupHooks";
import { useFetchKeyPairs } from "@/shared/hooks/keyPairsHooks";
import { useFetchSubnets as _useFetchSN } from "@/shared/hooks/resources/subnetHooks";


interface RegionResource {
  id?: string | number;
  code?: string;
  region?: string;
  slug?: string;
  identifier?: string;
  az_selection_mode?: "auto" | "user_selectable" | "disabled";
  availability_zones?: AvailabilityZoneResource[];
}

interface AvailabilityZoneResource {
  id?: string | number;
  code?: string;
  name?: string;
  status?: string;
  provider?: string;
}

interface PricingEffect {
  price_local?: number | string | null;
  price_usd?: number | string | null;
  amount?: number | string | null;
  currency?: string;
}

interface PricingResource {
  productable_id?: string | number;
  id?: string | number;
  product_id?: string | number;
  name?: string;
  price_local?: number | string | null;
  price_usd?: number | string | null;
  amount?: number | string | null;
  vcpus?: number | string;
  memory_mb?: number | string;
  memoryGb?: number | string;
  memory_gb?: number | string;
  config?: { vcpus?: number | string; memory_mb?: number | string; };
  configuration?: { vcpus?: number | string; };
  product?: PricingResource;
  pricing?: { effective?: PricingEffect };
}

interface ProjectResource {
  id?: string | number;
  identifier?: string;
  project_id?: string | number;
  code?: string;
  name?: string;
  slug?: string;
  region?: string | RegionResource;
  region_code?: string;
  value?: string | number;
  label?: string;
  raw?: unknown;
}

interface NetworkResource {
  id?: string | number;
  network_id?: string | number;
  uuid?: string;
  identifier?: string;
  name?: string;
  display_name?: string;
  network_name?: string;
  label?: string;
}

interface SubnetResource {
  id?: string | number;
  subnet_id?: string | number;
  identifier?: string;
  name?: string;
  cidr?: string;
}

interface KeyPairResource {
  id?: string | number;
  name?: string;
}

// Local positional-arg wrappers for dynamic hook fallbacks
const useFetchSecurityGroups = (projectId: string, region: string, opts: Record<string, unknown> = {}) =>
  _useFetchSG({ projectId, region }, opts);
const useFetchSubnets = (projectId: string, region: string, opts: Record<string, unknown> = {}) =>
  _useFetchSN({ projectId, region }, opts);
import { useFetchNetworks } from "@/hooks/adminHooks/networkHooks";
import ToastUtils from "@/utils/toastUtil";
import { buildConfigurationFromTemplate } from "@/utils/instanceCreationUtils";

// Type for custom fetch hook that returns { data, isFetching, ... }
type FetchHookResult = { data: unknown; isFetching?: boolean; isLoading?: boolean };
type FetchHookFn = (...args: unknown[]) => FetchHookResult;

interface Props {
  cfg: Configuration;
  index: number;
  totalConfigurations: number;
  billingCountry: string;
  regionOptions: Option[];
  baseProjectOptions: Option[];
  isLoadingResources: boolean;
  pricingTenantId?: string;

  // Actions
  updateConfiguration: (id: string, patch: Partial<Configuration>) => void;
  resetConfigurationWithPatch?: (id: string, patch: Partial<Configuration>) => void;
  removeConfiguration: (id: string) => void;
  addAdditionalVolume: (configId: string) => void;
  updateAdditionalVolume: (
    configId: string,
    volumeId: string,
    patch: Partial<AdditionalVolume>
  ) => void;
  removeAdditionalVolume: (configId: string, volumeId: string) => void;

  // Optional Workflow Props
  showActionRow?: boolean;
  onAddConfiguration?: () => void;
  onBackToWorkflow?: () => void;
  onSubmitConfigurations?: () => void;
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;

  // Optional Context-specific hook overrides for multi-tenant support
  // When not provided, defaults to admin hooks
  useProjectsHook?: FetchHookFn;
  useSecurityGroupsHook?: FetchHookFn;
  useKeyPairsHook?: FetchHookFn;
  useSubnetsHook?: FetchHookFn;
  useNetworksHook?: FetchHookFn;
  useProjectMembershipSuggestionsHook?: FetchHookFn;

  // Whether to skip fetching projects/networks (for simplified client context)
  skipProjectFetch?: boolean;
  skipNetworkResourcesFetch?: boolean;
  onSaveTemplate?: (config: Configuration) => void;
  showTemplateSelector?: boolean;
  formVariant?: "classic" | "cube";
  showProjectMembership?: boolean;
  membershipTenantId?: string;
  membershipUserId?: string;
  lockAssignmentScope?: boolean;
  regions?: RegionResource[];
}

const extractRegionCode = (region: RegionResource | string | null | undefined) => {
  if (!region) return "";
  if (typeof region === "string") return region;
  return region.code || region.region || region.slug || region.id || region.identifier || "";
};

const resolveEffectivePrice = (item: PricingResource | null | undefined) => {
  const effective = item?.pricing?.effective || {};
  const candidates = [
    effective.price_local,
    effective.price_usd,
    effective.amount,
    item?.price_local,
    item?.price_usd,
    item?.amount,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  return null;
};

const hasEffectivePricing = (item: PricingResource | null | undefined) => {
  return resolveEffectivePrice(item) !== null;
};

const formatPriceSuffix = (item: PricingResource | null | undefined) => {
  const effective = item?.pricing?.effective || {};
  const amount = resolveEffectivePrice(item);
  const currency = effective.currency || "USD";
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "";
  const formatted = numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${String(currency).toUpperCase()} ${formatted}`;
};

const AdminInstanceConfigurationCard: React.FC<Props> = ({
  cfg,
  index,
  totalConfigurations,
  billingCountry,
  regionOptions,
  baseProjectOptions,
  isLoadingResources,
  pricingTenantId,
  updateConfiguration,
  resetConfigurationWithPatch,
  removeConfiguration,
  addAdditionalVolume,
  updateAdditionalVolume,
  removeAdditionalVolume,

  showActionRow,
  onAddConfiguration,
  onBackToWorkflow,
  onSubmitConfigurations,
  isSubmitting,
  submitErrorMessage,

  // Optional hook overrides
  useProjectsHook,
  useSecurityGroupsHook,
  useKeyPairsHook,
  useSubnetsHook,
  useNetworksHook,
  useProjectMembershipSuggestionsHook,
  skipProjectFetch = false,
  skipNetworkResourcesFetch = false,
  onSaveTemplate,
  showTemplateSelector = false,
  formVariant = "classic",
  showProjectMembership = false,
  membershipTenantId,
  membershipUserId,
  lockAssignmentScope = false,
  regions = [],
}) => {
  const selectedRegion = cfg.region || "";
  const projectIdentifier = cfg.project_id || "";

  // Derive availability zone props from the selected region's data
  const selectedRegionData = useMemo(() => {
    if (!selectedRegion || !Array.isArray(regions)) return null;
    return regions.find(
      (r: RegionResource) =>
        String(r?.code || r?.region || r?.slug || r?.id || "") === String(selectedRegion)
    ) || null;
  }, [regions, selectedRegion]);

  const azSelectionMode = useMemo(() => {
    if (!selectedRegionData) return undefined;
    return (selectedRegionData as RegionResource)?.az_selection_mode as
      | "auto"
      | "user_selectable"
      | "disabled"
      | undefined;
  }, [selectedRegionData]);

  const availabilityZoneOptions = useMemo(() => {
    if (!selectedRegionData) return [];
    const azs = (selectedRegionData as RegionResource)?.availability_zones;
    if (!Array.isArray(azs)) return [];
    return azs
      .filter((az: AvailabilityZoneResource) => az?.status === "active" || !az?.status)
      .map((az: AvailabilityZoneResource) => ({
        value: String(az.code || az.id || ""),
        label: `${az.name || az.code || ""}${az.provider ? ` (${az.provider})` : ""}`,
      }));
  }, [selectedRegionData]);

  // Derive provider from the selected availability zone
  const selectedAzProvider = useMemo(() => {
    const azCode = cfg.availability_zone;
    if (!azCode || !selectedRegionData) return "";
    const azs = (selectedRegionData as RegionResource)?.availability_zones;
    if (!Array.isArray(azs)) return "";
    const match = azs.find(
      (az: AvailabilityZoneResource) => String(az.code || az.id || "") === String(azCode)
    );
    return match?.provider || "";
  }, [cfg.availability_zone, selectedRegionData]);

  // Check if the region has multiple providers (requires AZ selection for pricing)
  const regionHasMultipleProviders = useMemo(() => {
    if (!selectedRegionData) return false;
    const azs = (selectedRegionData as RegionResource)?.availability_zones;
    if (!Array.isArray(azs)) return false;
    const providers = new Set(
      azs
        .filter((az: AvailabilityZoneResource) => az?.status === "active" || !az?.status)
        .map((az: AvailabilityZoneResource) => az?.provider)
        .filter(Boolean)
    );
    return providers.size > 1;
  }, [selectedRegionData]);

  // 1. Fetch Projects (Region-Aware) - uses hook override if provided
  const projectsHook = useProjectsHook || useFetchProjects;
  const { data: projectsResp } = skipProjectFetch
    ? { data: null }
    : projectsHook(
        { per_page: 100, region: selectedRegion },
        { enabled: Boolean(selectedRegion), keepPreviousData: true }
      );

  const projectOptions = useMemo(() => {
    const combined = [
      ...(projectsResp?.data && Array.isArray(projectsResp.data) ? projectsResp.data : []),
      ...(Array.isArray(baseProjectOptions) ? baseProjectOptions : []), // Usually baseProjectOptions are transformed Options, wait, in original it was "regionAwareProjects"
    ];

    // In original: baseProjectOptions was "any[]". But here I typed it as Option[].
    // Let's assume passed in projectOptions are raw? No, in AdminCreateInstance baseProjectOptions was not passed?
    // Ah, checked lines 311: baseProjectOptions: any[].
    // So I should treat them as unknown[] if I want to re-use logic, or pre-process them.

    // Re-implementing logic
    const seen = new Set();
    return combined.reduce((acc: Option[], project: ProjectResource) => {
      const candidate =
        project?.value && project?.label
          ? ({ ...project, raw: project.raw ?? project } as Option)
          : (() => {
              const identifier =
                project?.identifier || project?.id || project?.project_id || project?.code || "";
              if (!identifier) return null;
              const projectRegion =
                extractRegionCode(project?.region) || project?.region_code || project?.region || "";
              if (
                selectedRegion &&
                projectRegion &&
                String(projectRegion) !== String(selectedRegion)
              ) {
                return null;
              }
              const value = String(identifier);
              return {
                value,
                label: String(project?.name || project?.identifier || project?.slug || value),
                raw: project,
              };
            })();

      if (!candidate) return acc;
      const key = String(candidate.value);
      if (seen.has(key)) return acc;
      seen.add(key);
      acc.push(candidate);
      return acc;
    }, []);
  }, [projectsResp?.data, baseProjectOptions, selectedRegion]);

  // 2. Fetch Pricing (filtered by provider when an AZ is selected)
  // When a region has multiple providers, require AZ selection before fetching pricing
  // to ensure only the correct provider's products are shown.
  const pricingEnabled = Boolean(selectedRegion) &&
    (!regionHasMultipleProviders || Boolean(cfg.availability_zone));
  const sharedPricingOptions = {
    enabled: pricingEnabled,
    keepPreviousData: true,
    countryCode: billingCountry || "US",
    tenantId: pricingTenantId || "",
    provider: selectedAzProvider || "",
    availabilityZone: cfg.availability_zone || "",
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
  const { data: bandwidthsByRegion } = useFetchProductPricing(
    selectedRegion,
    "bandwidth",
    sharedPricingOptions
  );

  // 3. Transform Pricing Options
  const computeOptions = useMemo(() => {
    const rows = Array.isArray(computeInstancesByRegion)
      ? computeInstancesByRegion.filter(hasEffectivePricing)
      : [];
    if (rows.length) {
      return rows
        .map((item: PricingResource, idx: number): Option | null => {
          const product = item?.product || item; // Items from pricing API usually have .product
          const value = product?.productable_id || product?.id || item?.product_id || item?.id;
          if (!value) return null;
          const vcpus =
            product?.vcpus || product?.config?.vcpus || item?.vcpus || item?.configuration?.vcpus;
          const memoryMb =
            product?.memory_mb ||
            product?.memoryMb ||
            product?.config?.memory_mb ||
            item?.memory_mb;
          const memoryGb = memoryMb ? Math.round(Number(memoryMb) / 1024) : product?.memory_gb;
          const baseLabel = product?.name || item?.name || `Instance ${idx + 1}`;
          const labelParts = [baseLabel];
          if (vcpus) labelParts.push(`${vcpus} vCPU`);
          if (memoryGb) labelParts.push(`${memoryGb} GB RAM`);
          const priceSuffix = formatPriceSuffix(item);
          if (priceSuffix) labelParts.push(priceSuffix);
          return { value: String(value), label: labelParts.join(" • ") };
        })
        .filter((item: Option | null): item is Option => Boolean(item));
    }
    return [];
  }, [computeInstancesByRegion]);

  const osImageOptions = useMemo(() => {
    const rows = Array.isArray(osImagesByRegion)
      ? osImagesByRegion.filter(hasEffectivePricing)
      : [];
    if (rows.length) {
      return rows
        .map((item: PricingResource, idx: number): Option | null => {
          const product = item?.product || item;
          const value = product?.productable_id || product?.id || item?.product_id || item?.id;
          if (!value) return null;
          const labelParts = [product?.name || item?.name || `OS Image ${idx + 1}`];
          const priceSuffix = formatPriceSuffix(item);
          if (priceSuffix) labelParts.push(priceSuffix);
          const label = labelParts.join(" • ");
          return { value: String(value), label: String(label) };
        })
        .filter((item: Option | null): item is Option => Boolean(item));
    }
    return [];
  }, [osImagesByRegion]);

  const volumeTypeOptions = useMemo(() => {
    const rows = Array.isArray(volumeTypesByRegion)
      ? volumeTypesByRegion.filter(hasEffectivePricing)
      : [];
    if (rows.length) {
      return rows
        .map((item: PricingResource, idx: number): Option | null => {
          const product = item?.product || item;
          const value = product?.productable_id || product?.id || item?.product_id || item?.id;
          if (!value) return null;
          const labelParts = [product?.name || item?.name || `Volume ${idx + 1}`];
          const priceSuffix = formatPriceSuffix(item);
          if (priceSuffix) labelParts.push(priceSuffix);
          const label = labelParts.join(" • ");
          return { value: String(value), label: String(label) };
        })
        .filter((item: Option | null): item is Option => Boolean(item));
    }
    return [];
  }, [volumeTypesByRegion]);

  const bandwidthOptions = useMemo(() => {
    const rows = Array.isArray(bandwidthsByRegion)
      ? bandwidthsByRegion.filter(hasEffectivePricing)
      : [];
    if (rows.length) {
      return rows
        .map((item: PricingResource, idx: number): Option | null => {
          const product = item?.product || item;
          const value = product?.productable_id || product?.id || item?.product_id || item?.id;
          if (!value) return null;
          const labelParts = [product?.name || item?.name || `Bandwidth ${idx + 1}`];
          const priceSuffix = formatPriceSuffix(item);
          if (priceSuffix) labelParts.push(priceSuffix);
          const label = labelParts.join(" • ");
          return { value: String(value), label: String(label) };
        })
        .filter((item: Option | null): item is Option => Boolean(item));
    }
    return [];
  }, [bandwidthsByRegion]);

  // 4. Fetch Network Resources - uses hook overrides if provided
  const securityGroupsHook = useSecurityGroupsHook || useFetchSecurityGroups;
  const keyPairsHook = useKeyPairsHook || useFetchKeyPairs;
  const subnetsHook = useSubnetsHook || useFetchSubnets;
  const networksHook = useNetworksHook || useFetchNetworks;

  const { data: securityGroups } = skipNetworkResourcesFetch
    ? { data: [] }
    : securityGroupsHook(projectIdentifier, selectedRegion, {
        enabled: Boolean(projectIdentifier && selectedRegion),
      });
  const { data: keyPairs } = skipNetworkResourcesFetch
    ? { data: [] }
    : keyPairsHook(projectIdentifier, selectedRegion, {
        enabled: Boolean(projectIdentifier && selectedRegion),
      });
  const { data: subnets } = skipNetworkResourcesFetch
    ? { data: [] }
    : subnetsHook(projectIdentifier, selectedRegion, {
        enabled: Boolean(projectIdentifier && selectedRegion),
      });
  const { data: networksResponse } = skipNetworkResourcesFetch
    ? { data: [] }
    : networksHook(projectIdentifier, selectedRegion, {
        enabled: Boolean(projectIdentifier && selectedRegion),
      });

  // 5. Transform Network Options
  const networkOptions = useMemo(() => {
    const list = Array.isArray(networksResponse)
      ? (networksResponse as NetworkResource[])
      : Array.isArray((networksResponse as { data?: NetworkResource[] })?.data)
        ? (networksResponse as { data?: NetworkResource[] }).data || []
        : [];
    return list
      .map((network: NetworkResource): Option | null => {
        const value =
          network?.id || network?.network_id || network?.uuid || network?.identifier || "";
        if (!value) return null;
        const label =
          network?.name ||
          network?.display_name ||
          network?.network_name ||
          network?.label ||
          `Network ${value}`;
        return { value: String(value), label: String(label) };
      })
      .filter((item: Option | null): item is Option => Boolean(item));
  }, [networksResponse]);

  const subnetOptions = useMemo(() => {
    return (Array.isArray(subnets) ? subnets : []).map((subnet: SubnetResource) => ({
      value: String(subnet.id || subnet.subnet_id || subnet.identifier || ""),
      label: subnet.name || subnet.cidr || `Subnet ${subnet.id || ""}`,
    }));
  }, [subnets]);

  const keyPairOptions = useMemo(() => {
    return (Array.isArray(keyPairs) ? keyPairs : [])
      .map((kp: KeyPairResource): Option | null => {
        const value = kp.name || kp.id;
        if (!value) return null;
        return { value: String(value), label: String(kp.name || kp.id) };
      })
      .filter((item: Option | null): item is Option => Boolean(item));
  }, [keyPairs]);

  // 6. Reset logic
  const prevRegionRef = useRef(selectedRegion);
  useEffect(() => {
    if (prevRegionRef.current && prevRegionRef.current !== selectedRegion) {
      updateConfiguration(cfg.id, {
        project_id: "",
        compute_instance_id: "",
        compute_label: "",
        os_image_id: "",
        os_image_label: "",
        volume_type_id: "",
        volume_type_label: "",
        additional_volumes: [],
        network_id: "",
        subnet_id: "",
        subnet_label: "",
        security_group_ids: [],
        keypair_name: "",
        keypair_label: "",
      });
    }
    prevRegionRef.current = selectedRegion;
  }, [selectedRegion, cfg.id, updateConfiguration]);

  const selectedAz = cfg.availability_zone || "";
  const prevAzRef = useRef(selectedAz);
  useEffect(() => {
    if (prevAzRef.current && prevAzRef.current !== selectedAz) {
      // Reset pricing-dependent selections when AZ changes (provider may differ)
      updateConfiguration(cfg.id, {
        compute_instance_id: "",
        compute_label: "",
        os_image_id: "",
        os_image_label: "",
        volume_type_id: "",
        volume_type_label: "",
        additional_volumes: [],
      });
    }
    prevAzRef.current = selectedAz;
  }, [selectedAz, cfg.id, updateConfiguration]);

  const prevProjectRef = useRef(projectIdentifier);
  useEffect(() => {
    if (prevProjectRef.current && prevProjectRef.current !== projectIdentifier) {
      updateConfiguration(cfg.id, {
        // Keep region, validation resets dependent fields
        network_id: "",
        subnet_id: "",
        subnet_label: "",
        security_group_ids: [],
        keypair_name: "",
        keypair_label: "",
      });
    }
    prevProjectRef.current = projectIdentifier;
  }, [projectIdentifier, cfg.id, updateConfiguration]);

  const isProjectScoped = Boolean(projectIdentifier && selectedRegion);

  const handleTemplateSelect = useCallback(
    (template: Configuration & { name?: string }) => {
      if (!resetConfigurationWithPatch) return;
      const patch = buildConfigurationFromTemplate(template);
      resetConfigurationWithPatch(cfg.id, patch);
      ToastUtils.success(`Template applied: ${template.name}. New project required.`);
    },
    [cfg.id, resetConfigurationWithPatch]
  );

  const optionalFormProps = {
    ...(onAddConfiguration ? { onAddConfiguration } : {}),
    ...(onBackToWorkflow ? { onBackToWorkflow } : {}),
    ...(onSubmitConfigurations ? { onSubmitConfigurations } : {}),
    ...(isSubmitting === undefined ? {} : { isSubmitting }),
    ...(submitErrorMessage === undefined ? {} : { submitErrorMessage }),
    ...(onSaveTemplate ? { onSaveTemplate } : {}),
    ...(showTemplateSelector ? { onTemplateSelect: handleTemplateSelect } : {}),
    ...(membershipTenantId === undefined ? {} : { membershipTenantId }),
    ...(membershipUserId === undefined ? {} : { membershipUserId }),
    ...(useProjectMembershipSuggestionsHook ? { useProjectMembershipSuggestionsHook } : {}),
  };

  return (
    <InstanceConfigurationForm
      cfg={cfg}
      index={index}
      totalConfigurations={totalConfigurations}
      updateConfiguration={updateConfiguration}
      removeConfiguration={removeConfiguration}
      addAdditionalVolume={addAdditionalVolume}
      updateAdditionalVolume={updateAdditionalVolume}
      removeAdditionalVolume={removeAdditionalVolume}
      regionOptions={regionOptions}
      projectOptions={projectOptions}
      computeOptions={computeOptions}
      osImageOptions={osImageOptions}
      volumeTypeOptions={volumeTypeOptions}
      networkOptions={networkOptions}
      subnetOptions={subnetOptions}
      bandwidthOptions={bandwidthOptions}
      keyPairOptions={keyPairOptions}
      securityGroups={securityGroups || []}
      isProjectScoped={isProjectScoped}
      isLoadingResources={isLoadingResources}
      showActionRow={showActionRow ?? false}
      showTemplateSelector={showTemplateSelector}
      variant={formVariant}
      showProjectMembership={showProjectMembership}
      lockAssignmentScope={lockAssignmentScope}
      azSelectionMode={azSelectionMode}
      availabilityZoneOptions={availabilityZoneOptions}
      {...optionalFormProps}
    />
  );
};

export default AdminInstanceConfigurationCard;
