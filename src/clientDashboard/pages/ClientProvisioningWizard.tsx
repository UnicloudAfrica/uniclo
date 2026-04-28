import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ConfigurationListStep from "@/shared/components/instance-wizard/ConfigurationListStep";
import PaymentStep from "@/shared/components/instance-wizard/PaymentStep";
import InstanceSummaryCard from "@/shared/components/instance-wizard/InstanceSummaryCard";
import ReviewSubmitStep from "@/shared/components/instance-wizard/ReviewSubmitStep";
import OrderSuccessStep from "@/shared/components/instance-wizard/OrderSuccessStep";
import ProtectionPlanStep from "@/shared/components/instance-wizard/ProtectionPlanStep";
import type { ProtectionPlan, RedundancyPattern } from "@/shared/components/instance-wizard/ProtectionPlanStep";
import {
  ProvisioningWizardLayout,
  WorkflowSelectionStep,
} from "@/shared/components/instance-wizard";
import { useClientProvisioningLogic } from "@/hooks/useClientProvisioningLogic";
import {
  useFetchClientProjects,
  useClientProjectStatus,
  useClientProjectMembershipSuggestions,
} from "@/hooks/clientHooks/projectHooks";
import { useFetchSecurityGroups } from "@/shared/hooks/resources/securityGroupHooks";
import { useFetchClientKeyPairs } from "@/shared/hooks/keyPairsHooks";
import { useFetchSubnets } from "@/shared/hooks/resources/subnetHooks";
import { useFetchClientNetworks } from "@/hooks/clientHooks/networkHooks";

// Local positional-arg wrappers for provisioning wizard hook-passing pattern
const useFetchClientSecurityGroups = (
  projectId: string | undefined,
  region: string | undefined,
  opts: Record<string, unknown> = {}
) => useFetchSecurityGroups({ projectId, region }, opts);
const useFetchClientSubnets = (
  projectId: string | undefined,
  region: string | undefined,
  opts: Record<string, unknown> = {}
) => useFetchSubnets({ projectId, region }, opts);
import ClientPageShell from "../components/ClientPageShell";
import ToastUtils from "@/utils/toastUtil";
import {
  buildConfigurationFromTemplate,
  evaluateConfigurationCompleteness,
  formatComputeLabel,
  formatOsLabel,
  formatVolumeLabel,
  formatKeypairLabel,
  formatSubnetLabel,
  hasProjectNetworkFromStatus,
} from "@/utils/instanceCreationUtils";

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const ClientProvisioningWizard: React.FC = () => {
  const [selectedProtectionPlan, setSelectedProtectionPlan] = useState<ProtectionPlan>("backup_only");
  const [selectedRedundancy, setSelectedRedundancy] = useState<RedundancyPattern>("n_plus_1");
  const navigate = useNavigate();
  const location = useLocation();
  const logic = useClientProvisioningLogic();

  const {
    steps,
    activeStep,
    setActiveStep,
    configurations,
    addConfiguration,
    addConfigurationWithPatch,
    resetConfigurationWithPatch,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
    billingCountry,
    setBillingCountry,
    isCountryLocked,
    countryOptions,
    isCountriesLoading,
    resources,
    generalRegions,
    regionOptions,
    isLoadingResources,
    isSubmitting,
    submissionErrorMessage,
    submissionResult,
    orderReceipt,
    isPaymentSuccessful,
    handleCreateOrder,
    handlePaymentCompleted,
    pricingSummary,
    configurationSummaries,
    apiBaseUrl,
    profile,
  } = logic;

  const handleStepClick = useCallback(
    (index: number) => {
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

  const applyTemplate = useCallback(
    (template: unknown) => {
      const patch = buildConfigurationFromTemplate(template);
      const firstConfig = configurations[0];
      const canOverwrite =
        configurations.length === 1 &&
        firstConfig &&
        !firstConfig.region &&
        !firstConfig.compute_instance_id &&
        !firstConfig.os_image_id &&
        !firstConfig.volume_type_id;

      if (canOverwrite) {
        updateConfiguration(firstConfig.id, patch);
      } else {
        addConfigurationWithPatch(patch);
      }
    },
    [configurations, updateConfiguration, addConfigurationWithPatch]
  );

  const reviewSummaries = useMemo(() => {
    const instanceTypes = resources.instance_types || [];
    const osImages = resources.os_images || [];
    const volumeTypes = resources.volume_types || [];
    const keyPairs = resources.keyPairs || [];

    return configurations.map((cfg) => {
      const status = evaluateConfigurationCompleteness(cfg);
      const computeLabel =
        (cfg.compute_label as string) ||
        formatComputeLabel(cfg.compute_instance_id as string, instanceTypes);
      const resolvedComputeLabel =
        computeLabel && !["Not selected", "Instance selected"].includes(computeLabel)
          ? computeLabel
          : "";
      const defaultTitle =
        (cfg.name as string)?.trim() ||
        (resolvedComputeLabel ? resolvedComputeLabel : "Instance configuration");
      const osLabel =
        (cfg.os_image_label as string) || formatOsLabel(cfg.os_image_id as string, osImages);
      const storageLabel = cfg.volume_type_label
        ? `${cfg.volume_type_label}${cfg.storage_size_gb ? ` • ${cfg.storage_size_gb} GB` : ""}`
        : formatVolumeLabel(
            cfg.volume_type_id as string,
            cfg.storage_size_gb as number,
            volumeTypes
          );

      return {
        id: cfg.id as string,
        title: defaultTitle,
        regionLabel:
          (cfg.region_label as string) ||
          regionOptions.find((opt) => opt.value === cfg.region)?.label ||
          (cfg.region as string) ||
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
        keypairLabel: formatKeypairLabel(
          cfg.keypair_name as string,
          keyPairs,
          cfg.keypair_label as string
        ),
        subnetLabel: formatSubnetLabel(cfg),
        statusLabel: status.isComplete ? "Complete" : "Incomplete",
        isComplete: status.isComplete,
      };
    });
  }, [configurations, resources, regionOptions]);

  const summaryConfigurationCount = reviewSummaries.length || configurations.length || 0;
  const summaryPlanLabel = useMemo(() => {
    if (!reviewSummaries.length) return "Instance profile";
    if (reviewSummaries.length === 1) return reviewSummaries[0]!.title || "Instance profile";
    return `${reviewSummaries.length} compute profiles`;
  }, [reviewSummaries]);
  const summaryWorkflowLabel = "Standard Request w/ Payment";
  const clientDisplayName = useMemo<string>(
    () =>
      profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || String(profile.email || "")
        : "",
    [profile]
  );
  const clientOptions = useMemo(() => {
    if (!profile) return [];
    return [{ value: String(profile.id), label: clientDisplayName || String(profile.email || "") }];
  }, [profile, clientDisplayName]);
  const assignmentSummary: string = clientDisplayName || "Self";

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

  const workflowStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "workflow"),
    [steps]
  );
  const servicesStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "services"),
    [steps]
  );
  const protectionStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "protection"),
    [steps]
  );
  const paymentStepIndex = useMemo(() => steps.findIndex((step) => step.id === "payment"), [steps]);
  const successStepIndex = useMemo(() => steps.findIndex((step) => step.id === "success"), [steps]);
  const selectedProjectId = configurations[0]?.project_id;
  const { data: projectStatus } = useClientProjectStatus(selectedProjectId as string, {
    enabled: Boolean(selectedProjectId),
  });
  const projectHasNetwork = useMemo(
    () => hasProjectNetworkFromStatus(projectStatus),
    [projectStatus]
  );

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

  // Template pre-fill: Auto-populate configuration when template is passed via route state
  useEffect(() => {
    const template = location.state?.template;
    if (!template) return;

    applyTemplate(template);
    ToastUtils.success(`Loaded template: ${template.name}. New project required.`);

    // Clear location state to prevent re-adding on refresh
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, applyTemplate, navigate, location.pathname]);

  const currentStep = steps[activeStep];
  const isWorkflowStep = currentStep?.id === "workflow";
  const isReviewStep = currentStep?.id === "review";
  const isSuccessStep = currentStep?.id === "success";
  const clientWorkflowMode = "standard";

  return (
    <ClientPageShell title="Create Cube-Instance" description="Provision new cube-instances">
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
              isFastTrack={false}
              configurationSummaries={configurationSummaries}
              pricingSummary={pricingSummary}
              keypairDownloads={keypairDownloads}
              instances={successInstances}
              instancesPageUrl="/client-dashboard/cube-instances"
              onCreateAnother={() => setActiveStep(0)}
              resourceLabel="Cube-Instance"
            />
          ) : null
        }
        reviewContent={
          isReviewStep ? (
            <ReviewSubmitStep
              isFastTrack={false}
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
              onBack={() => setActiveStep(paymentStepIndex >= 0 ? paymentStepIndex : (protectionStepIndex >= 0 ? protectionStepIndex : servicesStepIndex))}
              onEditConfiguration={() => setActiveStep(servicesStepIndex)}
              onConfirm={() => setActiveStep(successStepIndex)}
              isSubmitting={isSubmitting}
              resourceLabel="Cube-Instance"
            />
          ) : null
        }
        mainContent={
          <>
            {isWorkflowStep && (
              <WorkflowSelectionStep
                mode={clientWorkflowMode}
                modeOptions={["standard"]}
                showContextSelector={false}
                subtitle="Confirm provisioning workflow and billing preferences."
                contextType="unassigned"
                selectedTenantId=""
                selectedUserId=""
                billingCountry={billingCountry}
                isCountryLocked={isCountryLocked}
                isCountriesLoading={isCountriesLoading}
                tenants={[]}
                isTenantsFetching={false}
                userPool={[]}
                isUsersFetching={false}
                countryOptions={countryOptions}
                onModeChange={() => {}}
                onContextTypeChange={() => {}}
                onTenantChange={() => {}}
                onUserChange={() => {}}
                onCountryChange={setBillingCountry}
                onContinue={() =>
                  setActiveStep(servicesStepIndex >= 0 ? servicesStepIndex : activeStep + 1)
                }
              />
            )}

            {currentStep?.id === "services" && (
              <ConfigurationListStep
                configurations={configurations}
                resources={resources as unknown as import("@/hooks/useInstanceResources").InstanceResources}
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
                onBack={() => setActiveStep(workflowStepIndex >= 0 ? workflowStepIndex : 0)}
                onSubmit={handleCreateOrder}
                submitErrorMessage={submissionErrorMessage}
                useProjectsHook={useFetchClientProjects as unknown as (...args: unknown[]) => { data: unknown; isFetching?: boolean; isLoading?: boolean }}
                useSecurityGroupsHook={
                  useFetchClientSecurityGroups as unknown as (...args: unknown[]) => { data: unknown; isFetching?: boolean; isLoading?: boolean }
                }
                useKeyPairsHook={useFetchClientKeyPairs as unknown as (...args: unknown[]) => { data: unknown; isFetching?: boolean; isLoading?: boolean }}
                useSubnetsHook={useFetchClientSubnets as unknown as (...args: unknown[]) => { data: unknown; isFetching?: boolean; isLoading?: boolean }}
                useNetworksHook={useFetchClientNetworks as unknown as (...args: unknown[]) => { data: unknown; isFetching?: boolean; isLoading?: boolean }}
                useProjectMembershipSuggestionsHook={
                  useClientProjectMembershipSuggestions as unknown as (...args: unknown[]) => { data: unknown; isFetching?: boolean; isLoading?: boolean }
                }
                skipProjectFetch={false}
                skipNetworkResourcesFetch={false}
                formVariant="cube"
                showProjectMembership
                lockAssignmentScope
                membershipUserId={String(profile?.id || "")}
              />
            )}

            {currentStep?.id === "protection" && (
              <ProtectionPlanStep
                selectedPlan={selectedProtectionPlan}
                onPlanChange={setSelectedProtectionPlan}
                onBack={() => setActiveStep(servicesStepIndex)}
                onContinue={() => setActiveStep(paymentStepIndex >= 0 ? paymentStepIndex : activeStep + 1)}
                instanceCount={configurations.reduce((sum: number, c) => sum + (Number(c.instance_count) || 1), 0)}
                storageGb={configurations.reduce((sum: number, c) => sum + (Number(c.storage_size_gb) || 50), 0) / Math.max(configurations.length, 1)}
                computePricePerVm={(() => { const n = configurations.reduce((s: number, c) => s + (Number(c.instance_count) || 1), 0); return n > 0 ? summarySubtotalValue / n : 0; })()}
                currency={summaryDisplayCurrency || "NGN"}
                selectedRedundancy={selectedRedundancy}
                onRedundancyChange={setSelectedRedundancy}
                resourceLabel="Cube-Instance"
                configurations={configurations as { compute_label?: string; os_image_label?: string; storage_size_gb?: number | string; compute_instance_id?: string; region?: string }[]}
                billingCountry={billingCountry}
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
                contextType="client"
                selectedUserId={String(profile?.id)}
                clientOptions={clientOptions}
                onPaymentComplete={handlePaymentCompleted}
                apiBaseUrl={apiBaseUrl}
                paymentTransactionLabel="Instance Order"
              />
            )}
          </>
        }
        sidebarContent={
          <InstanceSummaryCard
            configurations={configurations}
            configurationSummaries={reviewSummaries}
            contextType="client"
            selectedClientName={clientDisplayName}
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
            protectionPlan={selectedProtectionPlan}
            redundancyPattern={selectedRedundancy}
          />
        }
      />
    </ClientPageShell>
  );
};

export default ClientProvisioningWizard;
