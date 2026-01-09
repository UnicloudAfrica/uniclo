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
  fallbackComputeInstances: any[];
  fallbackOsImages: any[];
  fallbackVolumeTypes: any[];
  bandwidthOptions: Option[];
  isLoadingResources: boolean;

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
  onCreateProject?: (configId: string, projectName: string) => void;
  showTemplateSelector?: boolean;
  formVariant?: "classic" | "cube";
}

const extractRegionCode = (region: any) => {
  if (!region) return "";
  if (typeof region === "string") return region;
  return region.code || region.region || region.slug || region.id || region.identifier || "";
};

const AdminInstanceConfigurationCard: React.FC<Props> = ({
  cfg,
  index,
  totalConfigurations,
  billingCountry,
  regionOptions,
  baseProjectOptions,
  fallbackComputeInstances,
  fallbackOsImages,
  fallbackVolumeTypes,
  bandwidthOptions,
  isLoadingResources,
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
  onCreateProject,
  showTemplateSelector = false,
  formVariant = "classic",
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
    return combined
      .map((project: any): Option | null => {
        // If it's already an option
        if (project.value && project.label) return project as Option;

        const identifier =
          project?.identifier || project?.id || project?.project_id || project?.code || "";
        if (!identifier) return null;
        const projectRegion =
          extractRegionCode(project?.region) || project?.region_code || project?.region || "";
        if (selectedRegion && projectRegion && String(projectRegion) !== String(selectedRegion)) {
          return null;
        }
        const value = String(identifier);
        if (seen.has(value)) return null;
        seen.add(value);
        return {
          value,
          label: String(project?.name || project?.identifier || project?.slug || value),
        };
      })
      .filter((item: Option | null): item is Option => Boolean(item));
  }, [projectsResp?.data, baseProjectOptions, selectedRegion]);

  // 2. Fetch Pricing
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

  // 3. Transform Pricing Options
  const computeOptions = useMemo(() => {
    const rows = Array.isArray(computeInstancesByRegion) ? computeInstancesByRegion : [];
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
        .filter((item: Option | null): item is Option => Boolean(item));
    }
    return (fallbackComputeInstances || []).map((it: any) => {
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
        .map((item: any, idx: number): Option | null => {
          const product = item?.product || item;
          const value = product?.productable_id || product?.id || item?.product_id || item?.id;
          if (!value) return null;
          const label = product?.name || item?.name || `OS Image ${idx + 1}`;
          return { value: String(value), label: String(label) };
        })
        .filter((item: Option | null): item is Option => Boolean(item));
    }
    return (fallbackOsImages || []).map((img: any) => ({
      value: String(img.id),
      label: img.name || img.description || `Image ${img.id}`,
    }));
  }, [osImagesByRegion, fallbackOsImages]);

  const volumeTypeOptions = useMemo(() => {
    const rows = Array.isArray(volumeTypesByRegion) ? volumeTypesByRegion : [];
    if (rows.length) {
      return rows
        .map((item: any, idx: number): Option | null => {
          const product = item?.product || item;
          const value = product?.productable_id || product?.id || item?.product_id || item?.id;
          if (!value) return null;
          const label = product?.name || item?.name || `Volume ${idx + 1}`;
          return { value: String(value), label: String(label) };
        })
        .filter((item: Option | null): item is Option => Boolean(item));
    }
    return (fallbackVolumeTypes || []).map((v: any) => ({
      value: String(v.id),
      label: v.name || `Volume ${v.id}`,
    }));
  }, [volumeTypesByRegion, fallbackVolumeTypes]);

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
        // Keep region, validation resets dependent fields
        network_id: "",
        subnet_id: "",
        security_group_ids: [],
        keypair_name: "",
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
      onCreateProject={onCreateProject}
      showTemplateSelector={showTemplateSelector}
      onTemplateSelect={showTemplateSelector ? handleTemplateSelect : undefined}
      variant={formVariant}
    />
  );
};

export default AdminInstanceConfigurationCard;
