// @ts-nocheck
import React, { useMemo, useEffect, useRef, useCallback } from "react";
import InstanceConfigurationForm from "../../shared/components/instance-wizard/InstanceConfigurationForm";
import { Configuration, Option, AdditionalVolume } from "../../types/InstanceConfiguration";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import { useFetchProductPricing } from "../../hooks/resource";
import { useFetchSecurityGroups } from "../../hooks/adminHooks/securityGroupHooks";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import { useFetchSubnets } from "../../hooks/adminHooks/subnetHooks";
import { useFetchNetworks } from "../../hooks/adminHooks/networkHooks";
import ToastUtils from "../../utils/toastUtil";
import { buildConfigurationFromTemplate } from "../../utils/instanceCreationUtils";

// Type for custom fetch hook that returns { data, isFetching, ... }
type FetchHookResult = { data: any; isFetching?: boolean; isLoading?: boolean };
type FetchHookFn = (...args: any[]) => FetchHookResult;

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

  // Optional Context-specific hook overrides for multi-tenant support
  // When not provided, defaults to admin hooks
  useProjectsHook?: FetchHookFn;
  useSecurityGroupsHook?: FetchHookFn;
  useKeyPairsHook?: FetchHookFn;
  useSubnetsHook?: FetchHookFn;
  useNetworksHook?: FetchHookFn;

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
}

const extractRegionCode = (region: any) => {
  if (!region) return "";
  if (typeof region === "string") return region;
  return region.code || region.region || region.slug || region.id || region.identifier || "";
};

const hasEffectivePricing = (item: any) => {
  const raw = item?.pricing?.effective?.price_usd;
  if (raw === null || raw === undefined) return false;
  const priceUsd = Number(raw);
  return Number.isFinite(priceUsd) && priceUsd >= 0;
};

const formatPriceSuffix = (item: any) => {
  const effective = item?.pricing?.effective || {};
  const amount = effective.price_local ?? effective.price_usd;
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

  // Optional hook overrides
  useProjectsHook,
  useSecurityGroupsHook,
  useKeyPairsHook,
  useSubnetsHook,
  useNetworksHook,
  skipProjectFetch = false,
  skipNetworkResourcesFetch = false,
  onSaveTemplate,
  showTemplateSelector = false,
  formVariant = "classic",
  showProjectMembership = false,
  membershipTenantId,
  membershipUserId,
  lockAssignmentScope = false,
}) => {
  const selectedRegion = cfg.region || "";
  const projectIdentifier = cfg.project_id || "";

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
    // So I should treat them as any[] if I want to re-use logic, or pre-process them.

    // Re-implementing logic
    const seen = new Set();
    return combined.reduce((acc: Option[], project: any) => {
      const candidate =
        project?.value && project?.label
          ? ({ ...project, raw: project.raw ?? project } as Option)
          : (() => {
              const identifier =
                project?.identifier || project?.id || project?.project_id || project?.code || "";
              if (!identifier) return null;
              const projectRegion =
                extractRegionCode(project?.region) || project?.region_code || project?.region || "";
              if (selectedRegion && projectRegion && String(projectRegion) !== String(selectedRegion)) {
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

  // 2. Fetch Pricing
  const sharedPricingOptions = {
    enabled: Boolean(selectedRegion),
    keepPreviousData: true,
    countryCode: billingCountry || "US",
    tenantId: pricingTenantId || "",
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
        .map((item: any, idx: number): Option | null => {
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
        .map((item: any, idx: number): Option | null => {
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
        .map((item: any, idx: number): Option | null => {
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
        .map((item: any, idx: number): Option | null => {
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
      ? networksResponse
      : Array.isArray((networksResponse as any)?.data)
        ? (networksResponse as any).data
        : [];
    return list
      .map((network: any): Option | null => {
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
    return (Array.isArray(subnets) ? subnets : []).map((subnet: any) => ({
      value: String(subnet.id || subnet.subnet_id || subnet.identifier || ""),
      label: subnet.name || subnet.cidr || `Subnet ${subnet.id || ""}`,
    }));
  }, [subnets]);

  const keyPairOptions = useMemo(() => {
    return (Array.isArray(keyPairs) ? keyPairs : [])
      .map((kp: any): Option | null => {
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
    (template: any) => {
      if (!resetConfigurationWithPatch) return;
      const patch = buildConfigurationFromTemplate(template);
      resetConfigurationWithPatch(cfg.id, patch);
      ToastUtils.success(`Template applied: ${template.name}. New project required.`);
    },
    [cfg.id, resetConfigurationWithPatch]
  );

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
      showActionRow={showActionRow}
      onAddConfiguration={onAddConfiguration}
      onBackToWorkflow={onBackToWorkflow}
      onSubmitConfigurations={onSubmitConfigurations}
      isSubmitting={isSubmitting}
      onSaveTemplate={onSaveTemplate}
      showTemplateSelector={showTemplateSelector}
      onTemplateSelect={showTemplateSelector ? handleTemplateSelect : undefined}
      variant={formVariant}
      showProjectMembership={showProjectMembership}
      membershipTenantId={membershipTenantId}
      membershipUserId={membershipUserId}
      lockAssignmentScope={lockAssignmentScope}
    />
  );
};

export default AdminInstanceConfigurationCard;
