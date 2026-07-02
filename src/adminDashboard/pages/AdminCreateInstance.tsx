import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { useProjectStatus } from "@/hooks/adminHooks/projectHooks";
import { Configuration, Option } from "@/types/InstanceConfiguration";
import { useInstanceTemplates } from "@/hooks/useInstanceTemplates";
import InstanceSummaryCard from "@/shared/components/instance-wizard/InstanceSummaryCard";
import WorkflowSelectionStep from "@/shared/components/instance-wizard/WorkflowSelectionStep";
import ReviewSubmitStep from "@/shared/components/instance-wizard/ReviewSubmitStep";
import PaymentStep from "@/shared/components/instance-wizard/PaymentStep";
import ConfigurationListStep from "@/shared/components/instance-wizard/ConfigurationListStep";
import OrderSuccessStep from "@/shared/components/instance-wizard/OrderSuccessStep";
import ProtectionPlanStep from "@/shared/components/instance-wizard/ProtectionPlanStep";
import type {
  ProtectionPlan,
  RedundancyPattern,
} from "@/shared/components/instance-wizard/ProtectionPlanStep";
import { ProvisioningWizardLayout } from "@/shared/components/instance-wizard";
import { useAdminCreateInstanceLogic } from "@/hooks/useAdminCreateInstanceLogic";
import {
  evaluateConfigurationCompleteness,
  hasProjectNetworkFromStatus,
} from "@/utils/instanceCreationUtils";
import type { DrCustomSpec } from "@/shared/components/instance-wizard/ProtectionPlanStep";

const AdminCreateInstance = () => {
  const navigate = useNavigate();

  // Protection plan state — lifted here so it's available to both the wizard step and the order hook
  const [selectedProtectionPlan, setSelectedProtectionPlan] =
    useState<ProtectionPlan>("backup_only");
  // FE-computed monthly cost of the currently-selected protection plan,
  // bubbled up from ProtectionPlanStep.onMonthlyCostChange. Surfaced in
  // the right-rail summary card so operators see the protection fee
  // alongside compute + storage before the order POST returns a backend
  // breakdown. Without this, the summary names the plan but hides its
  // cost — a "Backup Only" line at zero ₦ that hides a ₦240K/mo commit.
  const [selectedProtectionPlanMonthlyCost, setSelectedProtectionPlanMonthlyCost] =
    useState<number>(0);
  const [selectedRedundancy, setSelectedRedundancy] = useState<RedundancyPattern>("n_plus_1");
  const [drSpec, setDrSpec] = useState<DrCustomSpec>({ mode: "match" });

  const logic = useAdminCreateInstanceLogic({
    protectionPlan: {
      plan: selectedProtectionPlan,
      redundancyPattern: selectedRedundancy,
      drSpec,
      // FE-computed monthly cost for the active plan (₦/mo). Bubbled
      // up from ProtectionPlanStep so the order payload can carry the
      // protection fee for *every* plan type — not just DR. Without
      // this, the backend's grand-total math silently drops the
      // Backup Only ₦240K/mo line item and the operator sees a
      // payment total missing the protection fee they just picked.
      // See InitiateMultiInstancesAction.php (handles `monthly_cost`).
      monthlyCost: selectedProtectionPlanMonthlyCost,
    },
  });

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
    assignmentSummary,
    isSubmitting,
    submissionErrorMessage,
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
    isPriceEstimate,
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
    setSelectedPaymentOption,
    apiBaseUrl,
  } = logic;

  // Protection state is declared above the logic hook

  // Derive per-VM compute price from the subtotal
  const totalInstanceCount = configurations.reduce(
    (sum, c) => sum + (Number(c.instance_count) || 1),
    0
  );
  const computePricePerVm = totalInstanceCount > 0 ? summarySubtotalValue / totalInstanceCount : 0;

  const { createTemplate } = useInstanceTemplates();

  const resolveProviderForRegion = (regionCode: string): string => {
    const candidate = (Array.isArray(resources.regions) ? resources.regions : []).find(
      (region: Record<string, unknown>) =>
        String(region?.code || region?.region || region?.slug || region?.id || "") ===
        String(regionCode)
    ) as Record<string, unknown> | undefined;
    return String(candidate?.provider || candidate?.provider_code || candidate?.provider_id || "");
  };

  const handleSaveTemplate = (config: Configuration) => {
    const name = globalThis.window.prompt("Enter a name for this template:");
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
  const resolvedClientName =
    clientOptions.find((c) => c.value === String(selectedUserId))?.label ?? "";
  const resolvedTenantName =
    tenantOptions.find((t) => t.value === String(selectedTenantId))?.label ?? "";
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
  }, [activeStep, reviewStepIndex, hasLockedPaymentStep, setHasLockedPaymentStep]);

  const selectedProjectId = configurations[0]?.project_id;
  const { data: projectStatus } = useProjectStatus(selectedProjectId || "", {
    enabled: Boolean(selectedProjectId),
  });
  const selectedProject = useMemo(() => {
    if (!selectedProjectId || !Array.isArray(resources.projects)) return null;
    return (
      (resources.projects as Array<{ id?: string | number; identifier?: string }>).find(
        (project) =>
          String(project.id) === String(selectedProjectId) ||
          String(project.identifier) === String(selectedProjectId)
      ) || null
    );
  }, [resources.projects, selectedProjectId]);
  const projectHasNetwork = useMemo(
    () => hasProjectNetworkFromStatus(projectStatus, selectedProject),
    [projectStatus, selectedProject]
  );
  const protectionStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "protection"),
    [steps]
  );
  const isReviewStep = currentStepId === "review";
  const isSuccessStep = currentStepId === "success";
  const isWorkflowStep = currentStepId === "workflow";
  const isServicesStep = currentStepId === "services";
  const isProtectionStep = currentStepId === "protection";
  const isPaymentStep = currentStepId === "payment";

  type OrderShape = { identifier?: string; id?: string | number };
  type TxShape = { identifier?: string; reference?: string };
  const orderReceiptOrder = orderReceipt?.order as OrderShape | undefined;
  const orderReceiptTx = orderReceipt?.transaction as TxShape | undefined;
  const submissionOrder = submissionResult?.order as OrderShape | undefined;
  const submissionTx = submissionResult?.transaction as TxShape | undefined;
  const submissionData = submissionResult?.data as { id?: string | number } | undefined;

  const orderId =
    orderReceiptOrder?.identifier ||
    orderReceiptOrder?.id ||
    orderReceipt?.order_id ||
    submissionOrder?.identifier ||
    submissionOrder?.id ||
    submissionData?.id;
  const transactionId =
    orderReceiptTx?.identifier ||
    submissionTx?.identifier ||
    orderReceiptTx?.reference ||
    submissionTx?.reference;
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
  const resolvedServicesStepIndex = Math.max(servicesStepIndex, 1);
  const resolvedPaymentStepIndex = paymentStepIndex >= 0 ? paymentStepIndex : reviewStepIndex - 1;
  const resolvedSuccessStepIndex = successStepIndex >= 0 ? successStepIndex : steps.length - 1;
  const resolvedProtectionStepIndex =
    protectionStepIndex >= 0 ? protectionStepIndex : resolvedServicesStepIndex + 1;
  const resolvedReviewBackIndex = isFastTrack
    ? resolvedProtectionStepIndex
    : resolvedPaymentStepIndex;

  /**
   * Validate every configuration row before letting the user leave the
   * "Cube-Instance setup" step. Without this guard the wizard happily
   * advanced to Protection Plan with a half-filled config, then
   * `useInstanceOrderCreation.handleCreateOrder` threw
   * `Complete Configuration #N before pricing.` on the *next* step —
   * confusing operators who couldn't see why and had to manually
   * navigate back. Better: surface the exact missing fields right where
   * they can be fixed.
   *
   * Returns `true` if the user can proceed; otherwise toasts the
   * specific missing fields and returns `false`. Used by both the
   * Continue button (`onSubmit`) and the wizard's step-strip
   * (`handleStepChange`), so jumping forward via the stepper also
   * blocks on incomplete data.
   */
  const validateConfigurationsBeforeAdvancing = useCallback((): boolean => {
    const incompleteIndex = configurations.findIndex(
      (cfg) => !evaluateConfigurationCompleteness(cfg).isComplete
    );
    if (incompleteIndex === -1) return true;

    const incompleteCfg = configurations[incompleteIndex];
    const status = evaluateConfigurationCompleteness(incompleteCfg);
    const fields = status.missing.join(", ");
    ToastUtils.error(`Complete Configuration #${incompleteIndex + 1} before continuing.`, {
      description: fields ? `Missing: ${fields}.` : undefined,
    });
    return false;
  }, [configurations]);

  const handleStepChange = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentStepIndex) return;
      // Forward jumps past the services step must still respect
      // configuration completeness — without this guard the wizard
      // step-strip would let operators click "Protection Plan" or
      // beyond from "Cube-Instance setup" with empty fields. The
      // backward direction is intentionally unconstrained so users
      // can correct mistakes.
      if (
        targetIndex > resolvedServicesStepIndex &&
        currentStepIndex <= resolvedServicesStepIndex &&
        !validateConfigurationsBeforeAdvancing()
      ) {
        return;
      }
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
    [
      currentStepIndex,
      resolvedServicesStepIndex,
      validateConfigurationsBeforeAdvancing,
      isFastTrack,
      reviewStepIndex,
      isPaymentSuccessful,
      hasLockedPaymentStep,
      setActiveStep,
    ]
  );

  return (
    <AdminPageShell
      title="Create Cube-Instance"
      description="Create and provision cloud compute instances for your business."
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
        currentStepId={currentStepId ?? ""}
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
              instancesPageUrl="/admin-dashboard/cube-instances"
              instanceDetailsUrl="/admin-dashboard/cube-instances/details"
              onCreateAnother={() => globalThis.window.location.reload()}
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
                isSubmitting={isSubmitting}
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
                onContextTypeChange={(type: string) => setContextType(type as "tenant" | "user")}
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
                onSubmit={() => {
                  // Guard the step transition right where the user
                  // clicks. The previous behaviour silently advanced
                  // them to Protection Plan; the order POST on the
                  // *following* step would then throw "Complete
                  // Configuration #N before pricing." far from where
                  // the operator could see the input that needed
                  // fixing. validateConfigurationsBeforeAdvancing
                  // toasts the exact missing fields right here.
                  if (!validateConfigurationsBeforeAdvancing()) return;
                  setActiveStep(resolvedProtectionStepIndex);
                }}
                submitErrorMessage={submissionErrorMessage}
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

            {isProtectionStep && (
              <ProtectionPlanStep
                selectedPlan={selectedProtectionPlan}
                onPlanChange={setSelectedProtectionPlan}
                onBack={() => setActiveStep(resolvedServicesStepIndex)}
                onContinue={handleCreateOrder}
                isSubmitting={isSubmitting}
                onMonthlyCostChange={setSelectedProtectionPlanMonthlyCost}
                instanceCount={totalInstanceCount}
                storageGb={
                  configurations.reduce((sum, c) => sum + (Number(c.storage_size_gb) || 50), 0) /
                  Math.max(configurations.length, 1)
                }
                computePricePerVm={computePricePerVm}
                currency={summaryDisplayCurrency || "NGN"}
                selectedRedundancy={selectedRedundancy}
                onRedundancyChange={setSelectedRedundancy}
                drSpec={drSpec}
                onDrSpecChange={setDrSpec}
                resourceLabel="Cube-Instance"
                configurations={configurations}
                billingCountry={billingCountry}
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
                onPaymentOptionChange={setSelectedPaymentOption}
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
            selectedClientName={resolvedClientName}
            selectedTenantName={resolvedTenantName}
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
            isPriceEstimate={isPriceEstimate}
            protectionPlan={selectedProtectionPlan}
            protectionPlanMonthlyCost={selectedProtectionPlanMonthlyCost}
            redundancyPattern={selectedRedundancy}
          />
        }
      />
    </AdminPageShell>
  );
};

export default AdminCreateInstance;
