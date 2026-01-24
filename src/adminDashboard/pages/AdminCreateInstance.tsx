// @ts-nocheck
import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "../../shared/components/ui";
import ToastUtils from "../../utils/toastUtil";
import { useProjectStatus } from "../../hooks/adminHooks/projectHooks";
import { Configuration, Option } from "../../types/InstanceConfiguration";
import { useInstanceTemplates } from "../../hooks/useInstanceTemplates";
import InstanceSummaryCard from "../../shared/components/instance-wizard/InstanceSummaryCard";
import WorkflowSelectionStep from "../../shared/components/instance-wizard/WorkflowSelectionStep";
import ReviewSubmitStep from "../../shared/components/instance-wizard/ReviewSubmitStep";
import PaymentStep from "../../shared/components/instance-wizard/PaymentStep";
import ConfigurationListStep from "../../shared/components/instance-wizard/ConfigurationListStep";
import OrderSuccessStep from "../../shared/components/instance-wizard/OrderSuccessStep";
import { ProvisioningWizardLayout } from "../../shared/components/instance-wizard";
import { useAdminCreateInstanceLogic } from "../../hooks/useAdminCreateInstanceLogic";
import { hasProjectNetworkFromStatus } from "../../utils/instanceCreationUtils";

const AdminCreateInstance = () => {
  const navigate = useNavigate();
  const logic = useAdminCreateInstanceLogic();

  // Destructure all state and handlers from the logic hook
  const {
    mode,
    activeStep,
    steps,
    isFastTrack,
    resources,
    isLoadingResources,
    configurations,
    billingCountry,
    isCountryLocked,
    isCountriesLoading,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
    countryOptions,
    tenantOptions,
    clientOptions,
    generalRegions,
    regionSelectOptions,
    configurationSummaries,
    contextType,
    selectedTenantId,
    selectedUserId,
    selectedTenantLabel,
    selectedUserLabel,
    assignmentSummary,
    isSubmitting,
    submissionResult,
    orderReceipt,
    isPaymentSuccessful,
    paymentTransactionLabel,
    hasLockedPaymentStep,
    summaryGrandTotalValue,
    summarySubtotalValue,
    summaryTaxValue,
    summaryGatewayFeesValue,
    summaryDisplayCurrency,
    summaryPlanLabel,
    summaryWorkflowLabel,
    backendPricingData,
    effectivePaymentOption,
    billingCountryLabel,
    handleModeChange,
    setActiveStep,
    setContextType,
    setSelectedTenantId,
    setSelectedUserId,
    setBillingCountry,
    setIsCountryLocked,
    setHasLockedPaymentStep,
    addConfiguration,
    resetConfigurationWithPatch,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
    handleCreateOrder,
    handlePaymentCompleted,
    apiBaseUrl,
  } = logic;

  const { createTemplate } = useInstanceTemplates();

  const resolveProviderForRegion = (regionCode: string) => {
    const candidate = (Array.isArray(resources.regions) ? resources.regions : []).find(
      (region: any) =>
        String(region?.code || region?.region || region?.slug || region?.id || "") ===
        String(regionCode)
    );
    return candidate?.provider || candidate?.provider_code || candidate?.provider_id || "";
  };

  const handleSaveTemplate = (config: Configuration) => {
    const name = window.prompt("Enter a name for this template:");
    if (!name) return;

    // Minimal validation
    if (!config.region) {
      ToastUtils.error("Please select a region first.");
      return;
    }

    const provider = resolveProviderForRegion(config.region);
    if (!provider) {
      ToastUtils.error("Provider not found for the selected region.");
      return;
    }

    createTemplate({
      name,
      description: `Template created from ${config.region}`,
      configuration: { ...config, provider },
      is_public: false, // Default to private
    });
  };

  // Derived values for display
  const summaryConfigurationCount = configurationSummaries.length || configurations.length || 0;
  const taxLabelSuffix =
    summaryTaxValue > 0 && summarySubtotalValue > 0
      ? ` (${((summaryTaxValue / summarySubtotalValue) * 100).toFixed(2)}%)`
      : "";
  const currentStepIndex = Math.min(activeStep, steps.length - 1);
  const currentStep = steps[currentStepIndex];
  const currentStepId = currentStep?.id;
  const reviewStepIndex = useMemo(() => steps.findIndex((step) => step.id === "review"), [steps]);
  const workflowStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "workflow"),
    [steps]
  );
  const servicesStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "services"),
    [steps]
  );
  const paymentStepIndex = useMemo(() => steps.findIndex((step) => step.id === "payment"), [steps]);
  const successStepIndex = useMemo(() => steps.findIndex((step) => step.id === "success"), [steps]);
  useEffect(() => {
    if (!hasLockedPaymentStep && reviewStepIndex >= 0 && activeStep >= reviewStepIndex) {
      setHasLockedPaymentStep(true);
    }
  }, [activeStep, reviewStepIndex, hasLockedPaymentStep]);

  const selectedProjectId = configurations[0]?.project_id;
  const { data: projectStatus } = useProjectStatus(selectedProjectId, {
    enabled: Boolean(selectedProjectId),
  });
  const selectedProject = useMemo(() => {
    if (!selectedProjectId || !Array.isArray(resources.projects)) return null;
    return (
      resources.projects.find(
        (project: any) =>
          String(project.id) === String(selectedProjectId) ||
          String(project.identifier) === String(selectedProjectId)
      ) || null
    );
  }, [resources.projects, selectedProjectId]);
  const projectHasNetwork = useMemo(
    () => hasProjectNetworkFromStatus(projectStatus, selectedProject),
    [projectStatus, selectedProject]
  );
  const isReviewStep = currentStepId === "review";
  const isSuccessStep = currentStepId === "success";
  const isWorkflowStep = currentStepId === "workflow";
  const isServicesStep = currentStepId === "services";
  const isPaymentStep = currentStepId === "payment";

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
  const successPricingSummary = useMemo(
    () => ({
      currency: summaryDisplayCurrency || "USD",
      grandTotal: summaryGrandTotalValue || 0,
    }),
    [summaryDisplayCurrency, summaryGrandTotalValue]
  );
  const successSummaries = useMemo(
    () =>
      configurations.map((cfg, index) => ({
        id: cfg.id,
        name: configurationSummaries[index]?.title || cfg.name || `Configuration ${index + 1}`,
        region: configurationSummaries[index]?.regionLabel || cfg.region || "—",
        count: cfg.instance_count || 1,
        months: cfg.months || 1,
        canFastTrack: isFastTrack,
      })),
    [configurations, configurationSummaries, isFastTrack]
  );
  const resolvedWorkflowStepIndex = workflowStepIndex >= 0 ? workflowStepIndex : 0;
  const resolvedServicesStepIndex = servicesStepIndex >= 0 ? servicesStepIndex : 1;
  const resolvedPaymentStepIndex = paymentStepIndex >= 0 ? paymentStepIndex : reviewStepIndex - 1;
  const resolvedSuccessStepIndex = successStepIndex >= 0 ? successStepIndex : steps.length - 1;
  const resolvedReviewBackIndex = isFastTrack
    ? resolvedServicesStepIndex
    : resolvedPaymentStepIndex;

  const handleStepChange = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentStepIndex) return;
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
    [currentStepIndex, isFastTrack, reviewStepIndex, isPaymentSuccessful, hasLockedPaymentStep]
  );

  return (
    <>
      <AdminPageShell
        title="Create Cube-Instance"
        description="Provision Zadara-backed cube-instances for a tenant or user."
        actions={
          <div className="flex items-center gap-3">
            <ModernButton
              variant="ghost"
              onClick={() => navigate(-1)}
              leftIcon={<ArrowLeft size={18} />}
            >
              Back
            </ModernButton>
          </div>
        }
      >
        <ProvisioningWizardLayout
          steps={steps}
          activeStep={activeStep}
          onStepChange={handleStepChange}
          currentStepId={currentStepId}
          successContent={
            isSuccessStep ? (
              <OrderSuccessStep
                orderId={orderId}
                transactionId={transactionId}
                isFastTrack={isFastTrack}
                configurationSummaries={successSummaries}
                pricingSummary={successPricingSummary}
                keypairDownloads={keypairDownloads}
                instances={successInstances}
                instancesPageUrl="/admin-dashboard/instances"
                onCreateAnother={() => window.location.reload()}
                resourceLabel="Cube-Instance"
              />
            ) : null
          }
          reviewContent={
            isReviewStep ? (
              <div className="space-y-6">
                <ReviewSubmitStep
                  isFastTrack={isFastTrack}
                  summaryConfigurationCount={summaryConfigurationCount}
                  configurations={configurations}
                  configurationSummaries={configurationSummaries}
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
                  onBack={() => setActiveStep(resolvedReviewBackIndex)}
                  onEditConfiguration={() => setActiveStep(resolvedServicesStepIndex)}
                  onConfirm={() => setActiveStep(resolvedSuccessStepIndex)}
                  resourceLabel="Cube-Instance"
                />
              </div>
            ) : null
          }
          mainContent={
            <>
              {isWorkflowStep && (
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
                  onContinue={() => setActiveStep(resolvedServicesStepIndex)}
                  userPool={userPool}
                  isUsersFetching={isUsersFetching}
                  countryOptions={countryOptions}
                  onModeChange={handleModeChange}
                  onContextTypeChange={setContextType}
                  onTenantChange={setSelectedTenantId}
                  onUserChange={setSelectedUserId}
                  onCountryChange={setBillingCountry}
                />
              )}

              {isServicesStep && (
                <ConfigurationListStep
                  configurations={configurations}
                  resources={resources}
                  generalRegions={generalRegions}
                  regionOptions={regionSelectOptions}
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
                  onBack={() => setActiveStep(resolvedWorkflowStepIndex)}
                  onSubmit={handleCreateOrder}
                  onSaveTemplate={handleSaveTemplate}
                  formVariant="cube"
                  showProjectMembership
                  lockAssignmentScope
                  membershipTenantId={selectedTenantId}
                  membershipUserId={selectedUserId}
                  pricingTenantId={
                    contextType === "tenant" || contextType === "user" ? selectedTenantId : ""
                  }
                />
              )}

              {isPaymentStep && (
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
                  paymentTransactionLabel={paymentTransactionLabel}
                />
              )}
            </>
          }
          sidebarContent={
            <InstanceSummaryCard
              configurations={configurations}
              configurationSummaries={configurationSummaries}
              contextType={contextType}
              selectedClientName={
                clientOptions.find((c) => c.value === String(selectedUserId))?.label
              }
              selectedTenantName={
                tenantOptions.find((t) => t.value === String(selectedTenantId))?.label
              }
              billingCountry={
                countryOptions.find((c: Option) => c.value === billingCountry)?.label ||
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
              effectivePaymentOption={effectivePaymentOption}
              backendPricingData={backendPricingData}
            />
          }
        />
      </AdminPageShell>
    </>
  );
};

export default AdminCreateInstance;
