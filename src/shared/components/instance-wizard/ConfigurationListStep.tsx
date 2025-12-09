import React, { useMemo } from "react";
import AdminInstanceConfigurationCard from "../../../adminDashboard/components/AdminInstanceConfigurationCard";
import { Configuration, AdditionalVolume, Option } from "../../../types/InstanceConfiguration";
import { InstanceResources } from "../../../hooks/useInstanceResources";

// Type for custom fetch hook that returns { data, isFetching, ... }
type FetchHookResult = { data: any; isFetching?: boolean; isLoading?: boolean };
type FetchHookFn = (...args: any[]) => FetchHookResult;

interface ConfigurationListStepProps {
  configurations: Configuration[];
  resources: InstanceResources;
  generalRegions: any[];
  regionOptions: Option[];
  isLoadingResources: boolean;
  isSubmitting: boolean;
  billingCountry: string;
  onAddConfiguration: () => void;
  onRemoveConfiguration: (id: string) => void;
  onUpdateConfiguration: (id: string, updates: Partial<Configuration>) => void;
  onAddVolume: (configId: string) => void;
  onRemoveVolume: (configId: string, volumeId: string) => void;
  onUpdateVolume: (configId: string, volumeId: string, updates: Partial<AdditionalVolume>) => void;
  onBack: () => void;
  onSubmit: () => void;

  // Optional context-specific hook overrides
  useProjectsHook?: FetchHookFn;
  useSecurityGroupsHook?: FetchHookFn;
  useKeyPairsHook?: FetchHookFn;
  useSubnetsHook?: FetchHookFn;
  useNetworksHook?: FetchHookFn;

  // Skip flags for simplified contexts (e.g., client without project scoping)
  skipProjectFetch?: boolean;
  skipNetworkResourcesFetch?: boolean;
}

const ConfigurationListStep: React.FC<ConfigurationListStepProps> = ({
  configurations,
  resources,
  generalRegions,
  regionOptions,
  isLoadingResources,
  isSubmitting,
  billingCountry,
  onAddConfiguration,
  onRemoveConfiguration,
  onUpdateConfiguration,
  onAddVolume,
  onRemoveVolume,
  onUpdateVolume,
  onBack,
  onSubmit,

  // Hook overrides
  useProjectsHook,
  useSecurityGroupsHook,
  useKeyPairsHook,
  useSubnetsHook,
  useNetworksHook,
  skipProjectFetch = false,
  skipNetworkResourcesFetch = false,
}) => {
  const bandwidthOptions = useMemo(() => {
    return (resources.bandwidths || [])
      .map((bw: any): Option | null => {
        const value = bw.id || bw.identifier;
        if (!value) return null;
        const label =
          bw.name ||
          bw.label ||
          `${bw.capacity || ""} ${bw.unit || ""}`.trim() ||
          `Bandwidth ${value}`;
        return { value: String(value), label };
      })
      .filter((item: Option | null): item is Option => Boolean(item));
  }, [resources.bandwidths]);

  return (
    <div className="space-y-6">
      {configurations.map((cfg, index) => (
        <AdminInstanceConfigurationCard
          key={cfg.id}
          cfg={cfg}
          index={index}
          totalConfigurations={configurations.length}
          updateConfiguration={onUpdateConfiguration}
          removeConfiguration={onRemoveConfiguration}
          addAdditionalVolume={onAddVolume}
          updateAdditionalVolume={onUpdateVolume}
          removeAdditionalVolume={onRemoveVolume}
          regionOptions={regionOptions}
          baseProjectOptions={resources.projects}
          fallbackComputeInstances={resources.instance_types}
          fallbackOsImages={resources.os_images}
          fallbackVolumeTypes={resources.volume_types}
          bandwidthOptions={bandwidthOptions}
          billingCountry={billingCountry}
          isLoadingResources={isLoadingResources}
          showActionRow={index === configurations.length - 1}
          onAddConfiguration={onAddConfiguration}
          onBackToWorkflow={onBack}
          onSubmitConfigurations={onSubmit}
          isSubmitting={isSubmitting}
          // Pass through context-specific options
          useProjectsHook={useProjectsHook}
          useSecurityGroupsHook={useSecurityGroupsHook}
          useKeyPairsHook={useKeyPairsHook}
          useSubnetsHook={useSubnetsHook}
          useNetworksHook={useNetworksHook}
          skipProjectFetch={skipProjectFetch}
          skipNetworkResourcesFetch={skipNetworkResourcesFetch}
        />
      ))}
    </div>
  );
};

export default ConfigurationListStep;
