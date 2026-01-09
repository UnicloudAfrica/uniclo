// @ts-nocheck
import React, { useCallback, useMemo } from "react";
import ConfigurationListStep from "../../shared/components/instance-wizard/ConfigurationListStep";
import PaymentStep from "../../shared/components/instance-wizard/PaymentStep";
import InstanceSummaryCard from "../../shared/components/instance-wizard/InstanceSummaryCard";
import StepIndicator from "../../shared/components/instance-wizard/StepIndicator";
import ReviewSubmitStep from "../../shared/components/instance-wizard/ReviewSubmitStep";
import OrderSuccessStep from "../../shared/components/instance-wizard/OrderSuccessStep";
import { useTenantProvisioningLogic } from "../../hooks/useTenantProvisioningLogic";
import {
  useCreateTenantProject,
  useFetchTenantProjects,
  useTenantProjectStatus,
} from "../../hooks/tenantHooks/projectHooks";
import { useFetchTenantSecurityGroups } from "../../hooks/tenantHooks/securityGroupHooks";
import { useFetchTenantKeyPairs } from "../../hooks/tenantHooks/keyPairsHook";
import { useFetchTenantSubnets } from "../../hooks/tenantHooks/subnetHooks";
import { useFetchTenantNetworks } from "../../hooks/tenantHooks/networkHooks";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import TenantWorkflowStep from "../components/TenantWorkflowStep";
import ToastUtils from "../../utils/toastUtil";
import {
  evaluateConfigurationCompleteness,
  formatComputeLabel,
  formatOsLabel,
  formatVolumeLabel,
  formatKeypairLabel,
  formatSubnetLabel,
  hasProjectNetworkFromStatus,
} from "../../utils/instanceCreationUtils";

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const TenantProvisioningWizard: React.FC = () => {
  const logic = useTenantProvisioningLogic();

  const {
    // Mode
    mode,
    isFastTrack,
    handleModeChange,
    hasFastTrackAccess,
    fastTrackRegions,

    // Customer context
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
    selectedTenantLabel,
    selectedUserLabel,
    clientOptions,

    // Steps
    steps,
    activeStep,
    setActiveStep,

    // Configurations
    configurations,
    addConfiguration,
    resetConfigurationWithPatch,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,

    // Billing
    billingCountry,
    setBillingCountry,
    isCountryLocked,
    countryOptions,
    isCountriesLoading,

    // Resources
    resources,
    generalRegions,
    regionOptions,
    allRegionOptions,
    isLoadingResources,

    // Order
    isSubmitting,
    submissionResult,
    orderReceipt,
    isPaymentSuccessful,
    handleCreateOrder,
    handlePaymentCompleted,

    // Pricing
    pricingSummary,
    configurationSummaries,

    // Auth
    apiBaseUrl,
    profile,
  } = logic;

  const summaryTenantName =
    contextType === "tenant"
      ? selectedTenantLabel || profile?.company_name || profile?.name
      : undefined;
  const summaryUserName = contextType === "user" ? selectedUserLabel : undefined;

  const handleStepClick = useCallback(
    (index: number) => {
      // Only allow clicking on completed steps
      if (index < activeStep) {
        // Prevent going back to payment step after completing it
        const paymentStepIndex = steps.findIndex((s) => s.id === "payment");
        if (paymentStepIndex >= 0 && index === paymentStepIndex && isPaymentSuccessful) {
          return;
        }
        setActiveStep(index);
      }
    },
    [activeStep, steps, isPaymentSuccessful, setActiveStep]
  );

  // Calculate which configurations are fast-track eligible vs paid
  const fastTrackConfigs = useMemo(
    () => configurations.filter((cfg) => fastTrackRegions.includes(cfg.region || "")),
    [configurations, fastTrackRegions]
  );
  const paidConfigs = useMemo(
    () => configurations.filter((cfg) => !fastTrackRegions.includes(cfg.region || "")),
    [configurations, fastTrackRegions]
  );

  const currentStep = steps[activeStep];
  const configureStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "configure"),
    [steps]
  );
  const paymentStepIndex = useMemo(() => steps.findIndex((step) => step.id === "payment"), [steps]);
  const successStepIndex = useMemo(() => steps.findIndex((step) => step.id === "success"), [steps]);
  const selectedProjectId = configurations[0]?.project_id;
  const { data: projectStatus } = useTenantProjectStatus(selectedProjectId, {
    enabled: Boolean(selectedProjectId),
  });
  const projectHasNetwork = useMemo(
    () => hasProjectNetworkFromStatus(projectStatus),
    [projectStatus]
  );
  const { mutateAsync: createTenantProject } = useCreateTenantProject();

  const handleCreateProject = useCallback(
    async (configId: string, projectName: string) => {
      const trimmedName = projectName.trim();
      if (!trimmedName) {
        ToastUtils.error("Project name is required.");
        return;
      }

      const targetConfig = configurations.find((cfg) => cfg.id === configId);
      if (!targetConfig) {
        ToastUtils.error("Configuration not found.");
        return;
      }

      if (!targetConfig.region) {
        ToastUtils.error("Select a region before creating a project.");
        return;
      }

      const isTemplateConfig = Boolean(targetConfig.template_locked || targetConfig.template_id);

      const payload: any = {
        name: trimmedName,
        description: "Project created via instance provisioning.",
        type: "vpc",
        region: targetConfig.region,
      };

      const selectedPreset = targetConfig.network_preset || "standard";
      if (selectedPreset && selectedPreset !== "empty") {
        payload.metadata = { network_preset: selectedPreset };
      }

      if (contextType === "tenant" && selectedTenantId) {
        payload.tenant_id = selectedTenantId;
      } else if (contextType === "user" && selectedUserId) {
        payload.user_id = selectedUserId;
        if (selectedTenantId) {
          payload.tenant_id = selectedTenantId;
        }
      }

      try {
        const createdProject = await createTenantProject(payload);
        const projectIdentifier =
          createdProject?.identifier ||
          createdProject?.data?.identifier ||
          createdProject?.id ||
          createdProject?.data?.id;

        if (!projectIdentifier) {
          ToastUtils.error("Project created, but the identifier was missing.");
          return;
        }

        updateConfiguration(configId, {
          project_id: String(projectIdentifier),
          project_mode: isTemplateConfig ? "new" : "existing",
          project_name: isTemplateConfig ? trimmedName : "",
        });
        ToastUtils.success("Project created successfully.");
      } catch (error: any) {
        ToastUtils.error(error?.message || "Failed to create project.");
      }
    },
    [
      configurations,
      contextType,
      createTenantProject,
      selectedTenantId,
      selectedUserId,
      updateConfiguration,
    ]
  );

  const reviewSummaries = useMemo(() => {
    const instanceTypes = resources.instance_types || [];
    const osImages = resources.os_images || [];
    const volumeTypes = resources.volume_types || [];
    const keyPairs = resources.keypairs || resources.keyPairs || [];

    return configurations.map((cfg) => {
      const status = evaluateConfigurationCompleteness(cfg);
      const computeLabel = formatComputeLabel(cfg.compute_instance_id, instanceTypes);
      const defaultTitle =
        cfg.name?.trim() ||
        (computeLabel && computeLabel !== "Not selected" ? computeLabel : "Instance configuration");

      return {
        id: cfg.id,
        title: defaultTitle,
        regionLabel:
          allRegionOptions.find((opt) => opt.value === cfg.region)?.label ||
          cfg.region ||
          "No region selected",
        computeLabel,
        osLabel: formatOsLabel(cfg.os_image_id, osImages),
        termLabel: cfg.months
          ? `${cfg.months} month${Number(cfg.months) === 1 ? "" : "s"}`
          : "Not selected",
        storageLabel: formatVolumeLabel(cfg.volume_type_id, cfg.storage_size_gb, volumeTypes),
        floatingIpLabel: `${Number(cfg.floating_ip_count || 0)} floating IP${
          Number(cfg.floating_ip_count || 0) === 1 ? "" : "s"
        }`,
        keypairLabel: formatKeypairLabel(cfg.keypair_name, keyPairs, cfg.keypair_label),
        subnetLabel: formatSubnetLabel(cfg),
        statusLabel: status.isComplete ? "Complete" : "Incomplete",
        isComplete: status.isComplete,
      };
    });
  }, [configurations, resources, allRegionOptions]);

  const summaryConfigurationCount = reviewSummaries.length || configurations.length || 0;
  const summaryPlanLabel = useMemo(() => {
    if (!reviewSummaries.length) return "Instance profile";
    if (reviewSummaries.length === 1) return reviewSummaries[0].title || "Instance profile";
    return `${reviewSummaries.length} compute profiles`;
  }, [reviewSummaries]);
  const summaryWorkflowLabel = isFastTrack
    ? "Fast-Track Provisioning"
    : "Standard Request w/ Payment";

  const assignmentSummary = useMemo(() => {
    if (contextType === "tenant") {
      if (!selectedTenantId) return "Select tenant";
      return selectedTenantLabel || "Tenant selected";
    }
    if (contextType === "user") {
      if (!selectedUserId) return "Select user";
      return selectedUserLabel || "User selected";
    }
    return "Unassigned";
  }, [contextType, selectedTenantId, selectedTenantLabel, selectedUserId, selectedUserLabel]);

  const billingCountryLabel = useMemo(() => {
    if (!billingCountry) return "Not selected";
    const match = countryOptions.find((option) => String(option.value) === String(billingCountry));
    return match ? match.label : billingCountry;
  }, [billingCountry, countryOptions]);

  const summarySubtotalValue = pricingSummary.subtotal || 0;
  const summaryTaxValue = pricingSummary.tax || 0;
  const summaryGatewayFeesValue = pricingSummary.gatewayFees || 0;
  const summaryGrandTotalValue = pricingSummary.grandTotal || 0;
  const summaryDisplayCurrency =
    pricingSummary.currency || (billingCountry === "NG" ? "NGN" : "USD");
  const taxLabelSuffix =
    summaryTaxValue > 0 && summarySubtotalValue > 0
      ? ` (${((summaryTaxValue / summarySubtotalValue) * 100).toFixed(2)}%)`
      : "";

  const paymentOptionsList =
    submissionResult?.payment?.payment_gateway_options ||
    orderReceipt?.payment?.payment_gateway_options ||
    [];
  const effectivePaymentOption = paymentOptionsList[0] || null;
  const backendPricingData = useMemo(() => {
    if (submissionResult?.pricing_data) return submissionResult.pricing_data;
    if (orderReceipt?.pricing_data) return orderReceipt.pricing_data;
    return null;
  }, [submissionResult, orderReceipt]);

  const orderId =
    orderReceipt?.order?.identifier ||
    orderReceipt?.order?.id ||
    orderReceipt?.order_id ||
    submissionResult?.order?.identifier ||
    submissionResult?.order?.id ||
    submissionResult?.data?.id;
  const transactionId =
    orderReceipt?.transaction?.identifier ||
    submissionResult?.transaction?.identifier ||
    orderReceipt?.transaction?.reference ||
    submissionResult?.transaction?.reference;

  const isReviewStep = currentStep?.id === "review";
  const isSuccessStep = currentStep?.id === "success";

  return (
    <TenantPageShell title="Create Cube-nstance" description="Provision new cube-nstances">
      <div className="mx-auto max-w-5xl space-y-8 pb-20">
        {/* Step Indicator - Grid variant */}
        <StepIndicator
          steps={steps}
          activeStep={activeStep}
          onStepClick={handleStepClick}
          variant="grid"
        />

        {isSuccessStep ? (
          <OrderSuccessStep
            orderId={orderId}
            transactionId={transactionId}
            isFastTrack={isFastTrack}
            configurationSummaries={configurationSummaries}
            pricingSummary={pricingSummary}
            instancesPageUrl="/dashboard/instances"
            onCreateAnother={() => window.location.reload()}
            resourceLabel="Cube-nstance"
          />
        ) : isReviewStep ? (
          <ReviewSubmitStep
            isFastTrack={isFastTrack}
            summaryConfigurationCount={summaryConfigurationCount}
            configurations={configurations}
            configurationSummaries={reviewSummaries}
            submissionResult={submissionResult}
            orderReceipt={orderReceipt}
            effectivePaymentOption={effectivePaymentOption}
            summaryPlanLabel={summaryPlanLabel}
            summaryWorkflowLabel={summaryWorkflowLabel}
            assignmentSummary={assignmentSummary}
            billingCountryLabel={billingCountryLabel}
            summarySubtotalValue={summarySubtotalValue}
            summaryTaxValue={summaryTaxValue}
            summaryGatewayFeesValue={summaryGatewayFeesValue}
            summaryGrandTotalValue={summaryGrandTotalValue}
            summaryDisplayCurrency={summaryDisplayCurrency}
            taxLabelSuffix={taxLabelSuffix}
            backendPricingData={backendPricingData}
            onBack={() => setActiveStep(isFastTrack ? configureStepIndex : paymentStepIndex)}
            onEditConfiguration={() => setActiveStep(configureStepIndex)}
            onConfirm={() => setActiveStep(successStepIndex)}
            resourceLabel="Cube-nstance"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Step 0: Workflow Selection */}
              {currentStep?.id === "workflow" && (
                <TenantWorkflowStep
                  mode={mode}
                  contextType={contextType}
                  selectedTenantId={selectedTenantId}
                  selectedUserId={selectedUserId}
                  billingCountry={billingCountry}
                  isCountryLocked={isCountryLocked}
                  isCountriesLoading={isCountriesLoading}
                  tenants={tenants}
                  isTenantsFetching={isTenantsFetching}
                  userPool={userPool}
                  isUsersFetching={isUsersFetching}
                  countryOptions={countryOptions}
                  hasFastTrackAccess={hasFastTrackAccess}
                  fastTrackRegions={fastTrackRegions}
                  allRegionOptions={allRegionOptions}
                  onModeChange={handleModeChange}
                  onContextTypeChange={setContextType}
                  onTenantChange={setSelectedTenantId}
                  onUserChange={setSelectedUserId}
                  onCountryChange={setBillingCountry}
                  onContinue={() => setActiveStep(configureStepIndex >= 0 ? configureStepIndex : 1)}
                />
              )}

              {/* Step 1: Configure */}
              {currentStep?.id === "configure" && (
                <ConfigurationListStep
                  configurations={configurations}
                  resources={resources as any}
                  generalRegions={generalRegions}
                  regionOptions={regionOptions}
                  isLoadingResources={isLoadingResources}
                  isSubmitting={isSubmitting}
                  billingCountry={billingCountry}
                  showTemplateSelector
                  onResetConfiguration={resetConfigurationWithPatch}
                  // Network preset props for new projects
                  projectHasNetwork={projectHasNetwork}
                  onAddConfiguration={addConfiguration}
                  onRemoveConfiguration={removeConfiguration}
                  onUpdateConfiguration={updateConfiguration}
                  onAddVolume={addAdditionalVolume}
                  onRemoveVolume={removeAdditionalVolume}
                  onUpdateVolume={updateAdditionalVolume}
                  onBack={() => setActiveStep(0)}
                  onSubmit={handleCreateOrder}
                  useProjectsHook={useFetchTenantProjects}
                  useSecurityGroupsHook={useFetchTenantSecurityGroups}
                  useKeyPairsHook={useFetchTenantKeyPairs}
                  useSubnetsHook={useFetchTenantSubnets}
                  useNetworksHook={useFetchTenantNetworks}
                  skipProjectFetch={false}
                  skipNetworkResourcesFetch={false}
                  onCreateProject={handleCreateProject}
                  formVariant="cube"
                />
              )}

              {/* Step 2: Payment (only for standard mode) */}
              {currentStep?.id === "payment" && (
                <PaymentStep
                  submissionResult={submissionResult}
                  orderReceipt={orderReceipt}
                  isPaymentSuccessful={isPaymentSuccessful}
                  summaryGrandTotalValue={pricingSummary.grandTotal}
                  summaryDisplayCurrency={pricingSummary.currency}
                  contextType={contextType}
                  selectedUserId={String(selectedUserId)}
                  clientOptions={clientOptions}
                  onPaymentComplete={handlePaymentCompleted}
                  apiBaseUrl={apiBaseUrl}
                  paymentTransactionLabel="Instance Order"
                />
              )}
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-1">
              <InstanceSummaryCard
                configurations={configurations}
                contextType={contextType}
                selectedTenantName={summaryTenantName}
                selectedClientName={summaryUserName}
                billingCountry={
                  countryOptions.find((c) => String(c.value) === billingCountry)?.label ||
                  billingCountry
                }
                summaryTitle="Cube-nstance summary"
                summaryDescription="Auto-calculated from the selected cube-nstance configuration."
                resourceLabel="Cube-nstance"
              />

              {/* Fast-track split info */}
              {hasFastTrackAccess && configurations.length > 0 && (
                <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Order Breakdown</h4>
                  {fastTrackConfigs.length > 0 && (
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-green-700">Fast-track (free)</span>
                      <span className="font-medium text-green-700">
                        {fastTrackConfigs.length} instance(s)
                      </span>
                    </div>
                  )}
                  {paidConfigs.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Requires payment</span>
                      <span className="font-medium text-gray-800">
                        {paidConfigs.length} instance(s)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TenantPageShell>
  );
};

export default TenantProvisioningWizard;
