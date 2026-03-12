import React from "react";
import AdminInstanceConfigurationCard from "../../../adminDashboard/components/AdminInstanceConfigurationCard";
import { Configuration, AdditionalVolume, Option } from "@/types/InstanceConfiguration";
import { InstanceResources } from "@/hooks/useInstanceResources";

// Type for custom fetch hook that returns { data, isFetching, ... }
type FetchHookResult<T = unknown> = { data: T; isFetching?: boolean; isLoading?: boolean };
type FetchHookFn<T = unknown, Args extends unknown[] = unknown[]> = (
  ...args: Args
) => FetchHookResult<T>;

interface ConfigurationListStepProps {
  configurations: Configuration[];
  resources: InstanceResources;
  generalRegions: unknown;
  regionOptions: Option[];
  isLoadingResources: boolean;
  isSubmitting: boolean;
  submitErrorMessage?: string | null;
  billingCountry: string;
  onAddConfiguration: () => void;
  onRemoveConfiguration: (id: string) => void;
  onUpdateConfiguration: (id: string, updates: Partial<Configuration>) => void;
  onResetConfiguration?: (id: string, updates: Partial<Configuration>) => void;
  onAddVolume: (configId: string) => void;
  onRemoveVolume: (configId: string, volumeId: string) => void;
  onUpdateVolume: (configId: string, volumeId: string, updates: Partial<AdditionalVolume>) => void;
  onBack: () => void;
  onSubmit: () => void;
  projectHasNetwork?: boolean; // If true, project already has VPC/network - show banner

  // Template selection
  showTemplateSelector?: boolean;

  // Optional context-specific hook overrides
  useProjectsHook?: FetchHookFn;
  useSecurityGroupsHook?: FetchHookFn;
  useKeyPairsHook?: FetchHookFn;
  useSubnetsHook?: FetchHookFn;
  useNetworksHook?: FetchHookFn;
  useProjectMembershipSuggestionsHook?: FetchHookFn;

  // Skip flags for simplified contexts (e.g., client without project scoping)
  skipProjectFetch?: boolean;
  skipNetworkResourcesFetch?: boolean;
  onSaveTemplate?: (config: Configuration) => void;
  formVariant?: "classic" | "cube";

  showProjectMembership?: boolean;
  membershipTenantId?: string;
  membershipUserId?: string;
  lockAssignmentScope?: boolean;
  pricingTenantId?: string;
}

const ConfigurationListStep: React.FC<ConfigurationListStepProps> = ({
  configurations,
  resources,
  generalRegions: _generalRegions,
  regionOptions,
  isLoadingResources,
  isSubmitting,
  submitErrorMessage,
  billingCountry,
  onAddConfiguration,
  onRemoveConfiguration,
  onUpdateConfiguration,
  onResetConfiguration,
  onAddVolume,
  onRemoveVolume,
  onUpdateVolume,
  onBack,
  onSubmit,
  projectHasNetwork = false,
  showTemplateSelector = false,

  // Hook overrides
  useProjectsHook,
  useSecurityGroupsHook,
  useKeyPairsHook,
  useSubnetsHook,
  useNetworksHook,
  useProjectMembershipSuggestionsHook,
  skipProjectFetch = false,
  skipNetworkResourcesFetch = false,
  onSaveTemplate,
  formVariant = "classic",
  showProjectMembership = false,
  membershipTenantId,
  membershipUserId,
  lockAssignmentScope = false,
  pricingTenantId,
}) => {
  void _generalRegions;
  const hasSelectedProject = configurations.some((cfg) => Boolean(cfg.project_id));
  const shouldShowNetworkBanner = hasSelectedProject && projectHasNetwork;

  return (
    <div className="space-y-6">
      {/* Info banner if project already has network */}
      {shouldShowNetworkBanner && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            ✓ This project already has network infrastructure configured. Your instance will use the
            existing VPC and subnets.
          </p>
        </div>
      )}

      {/* Configuration Cards */}
      {configurations.map((cfg, index) => (
        <AdminInstanceConfigurationCard
          key={cfg.id}
          cfg={cfg}
          index={index}
          totalConfigurations={configurations.length}
          updateConfiguration={onUpdateConfiguration}
          resetConfigurationWithPatch={onResetConfiguration}
          removeConfiguration={onRemoveConfiguration}
          addAdditionalVolume={onAddVolume}
          updateAdditionalVolume={onUpdateVolume}
          removeAdditionalVolume={onRemoveVolume}
          regionOptions={regionOptions}
          baseProjectOptions={resources.projects as any}
          billingCountry={billingCountry}
          isLoadingResources={isLoadingResources}
          showActionRow={index === configurations.length - 1}
          onAddConfiguration={onAddConfiguration}
          onBackToWorkflow={onBack}
          onSubmitConfigurations={onSubmit}
          isSubmitting={isSubmitting}
          submitErrorMessage={submitErrorMessage}
          showTemplateSelector={showTemplateSelector}
          // Pass through context-specific options
          useProjectsHook={useProjectsHook}
          useSecurityGroupsHook={useSecurityGroupsHook}
          useKeyPairsHook={useKeyPairsHook}
          useSubnetsHook={useSubnetsHook}
          useNetworksHook={useNetworksHook}
          useProjectMembershipSuggestionsHook={useProjectMembershipSuggestionsHook}
          skipProjectFetch={skipProjectFetch}
          skipNetworkResourcesFetch={skipNetworkResourcesFetch}
          onSaveTemplate={onSaveTemplate}
          formVariant={formVariant}
          showProjectMembership={showProjectMembership}
          membershipTenantId={membershipTenantId}
          membershipUserId={membershipUserId}
          lockAssignmentScope={lockAssignmentScope}
          pricingTenantId={pricingTenantId}
        />
      ))}
    </div>
  );
};

export default ConfigurationListStep;
