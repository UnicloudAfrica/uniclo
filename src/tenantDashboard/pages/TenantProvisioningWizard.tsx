// @ts-nocheck
import React, { useCallback, useMemo } from "react";
import ConfigurationListStep from "../../shared/components/instance-wizard/ConfigurationListStep";
import PaymentStep from "../../shared/components/instance-wizard/PaymentStep";
import InstanceSummaryCard from "../../shared/components/instance-wizard/InstanceSummaryCard";
import ReviewSubmitStep from "../../shared/components/instance-wizard/ReviewSubmitStep";
import OrderSuccessStep from "../../shared/components/instance-wizard/OrderSuccessStep";
import { useTenantProvisioningLogic } from "../../hooks/useTenantProvisioningLogic";
import {
  useFetchTenantProjects,
  useTenantProjectStatus,
} from "../../hooks/tenantHooks/projectHooks";
import { useFetchTenantSecurityGroups } from "../../hooks/tenantHooks/securityGroupHooks";
import { useFetchTenantKeyPairs } from "../../hooks/tenantHooks/keyPairsHook";
import { useFetchTenantSubnets } from "../../hooks/tenantHooks/subnetHooks";
import { useFetchTenantNetworks } from "../../hooks/tenantHooks/networkHooks";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import {
  ProvisioningWizardLayout,
  WorkflowSelectionStep,
} from "../../shared/components/instance-wizard";
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
  const servicesStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "services"),
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
  const reviewSummaries = useMemo(() => {
    const instanceTypes = resources.instance_types || [];
    const osImages = resources.os_images || [];
    const volumeTypes = resources.volume_types || [];
    const keyPairs = resources.keypairs || resources.keyPairs || [];

    return configurations.map((cfg) => {
      const status = evaluateConfigurationCompleteness(cfg);
      const computeLabel =
        cfg.compute_label || formatComputeLabel(cfg.compute_instance_id, instanceTypes);
      const resolvedComputeLabel =
        computeLabel && !["Not selected", "Instance selected"].includes(computeLabel)
          ? computeLabel
          : "";
      const defaultTitle =
        cfg.name?.trim() ||
        (resolvedComputeLabel ? resolvedComputeLabel : "Instance configuration");
      const osLabel = cfg.os_image_label || formatOsLabel(cfg.os_image_id, osImages);
      const storageLabel = cfg.volume_type_label
        ? `${cfg.volume_type_label}${cfg.storage_size_gb ? ` • ${cfg.storage_size_gb} GB` : ""}`
        : formatVolumeLabel(cfg.volume_type_id, cfg.storage_size_gb, volumeTypes);

      return {
        id: cfg.id,
        title: defaultTitle,
        regionLabel:
          cfg.region_label ||
          allRegionOptions.find((opt) => opt.value === cfg.region)?.label ||
          cfg.region ||
          "No region selected",
        computeLabel,
        osLabel,
        termLabel: cfg.months
          ? `${cfg.months} month${Number(cfg.months) === 1 ? "" : "s"}`
          : "Not selected",
        storageLabel,
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
  const successInstances =
    submissionResult?.instances ||
    orderReceipt?.instances ||
    submissionResult?.data?.instances ||
    [];
  const keypairDownloads =
    submissionResult?.keypair_materials ||
    submissionResult?.transaction?.keypair_materials ||
    orderReceipt?.keypair_materials ||
    orderReceipt?.transaction?.keypair_materials ||
    [];

  const isReviewStep = currentStep?.id === "review";
  const isSuccessStep = currentStep?.id === "success";

  return (
    <TenantPageShell title="Create Cube-Instance" description="Provision new cube-instances">
      <ProvisioningWizardLayout
        steps={steps}
        activeStep={activeStep}
        onStepChange={handleStepClick}
        currentStepId={currentStep?.id}
        successContent={
          isSuccessStep ? (
            <OrderSuccessStep
              orderId={orderId}
              transactionId={transactionId}
              isFastTrack={isFastTrack}
              configurationSummaries={configurationSummaries}
              pricingSummary={pricingSummary}
              keypairDownloads={keypairDownloads}
              instances={successInstances}
              instancesPageUrl="/dashboard/instances"
              onCreateAnother={() => window.location.reload()}
              resourceLabel="Cube-Instance"
            />
          ) : null
        }
        reviewContent={
          isReviewStep ? (
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
              onBack={() => setActiveStep(isFastTrack ? servicesStepIndex : paymentStepIndex)}
              onEditConfiguration={() => setActiveStep(servicesStepIndex)}
              onConfirm={() => setActiveStep(successStepIndex)}
              resourceLabel="Cube-Instance"
            />
          ) : null
        }
        mainContent={
          <>
            {currentStep?.id === "workflow" && (
              <WorkflowSelectionStep
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
                showFastTrackInfo
                hasFastTrackAccess={hasFastTrackAccess}
                fastTrackRegions={fastTrackRegions}
                allRegionOptions={allRegionOptions}
                onModeChange={handleModeChange}
                onContextTypeChange={setContextType}
                onTenantChange={setSelectedTenantId}
                onUserChange={setSelectedUserId}
                onCountryChange={setBillingCountry}
                onContinue={() => setActiveStep(servicesStepIndex >= 0 ? servicesStepIndex : 1)}
              />
            )}

            {currentStep?.id === "services" && (
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
                formVariant="cube"
              />
            )}

            {currentStep?.id === "payment" && (
              <PaymentStep
                submissionResult={submissionResult}
                orderReceipt={orderReceipt}
                isPaymentSuccessful={isPaymentSuccessful}
                summarySubtotalValue={summarySubtotalValue}
                summaryTaxValue={summaryTaxValue}
                summaryGatewayFeesValue={summaryGatewayFeesValue}
                summaryGrandTotalValue={summaryGrandTotalValue}
                summaryDisplayCurrency={summaryDisplayCurrency}
                contextType={contextType}
                selectedUserId={String(selectedUserId)}
                clientOptions={clientOptions}
                onPaymentComplete={handlePaymentCompleted}
                apiBaseUrl={apiBaseUrl}
                paymentTransactionLabel="Instance Order"
              />
            )}
          </>
        }
        sidebarContent={
          <>
            <InstanceSummaryCard
              configurations={configurations}
              configurationSummaries={reviewSummaries}
              contextType={contextType}
              selectedTenantName={summaryTenantName}
              selectedClientName={summaryUserName}
              billingCountry={
                countryOptions.find((c) => String(c.value) === billingCountry)?.label ||
                billingCountry
              }
              summaryTitle="Cube-Instance summary"
              summaryDescription="Auto-calculated from the selected cube-instance configuration."
              resourceLabel="Cube-Instance"
              summarySubtotalValue={summarySubtotalValue}
              summaryTaxValue={summaryTaxValue}
              summaryGatewayFeesValue={summaryGatewayFeesValue}
              summaryGrandTotalValue={summaryGrandTotalValue}
              summaryDisplayCurrency={summaryDisplayCurrency}
            />

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
          </>
        }
      />
    </TenantPageShell>
  );
};

export default TenantProvisioningWizard;
