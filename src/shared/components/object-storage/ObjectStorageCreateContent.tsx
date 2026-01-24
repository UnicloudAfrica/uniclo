import React, { useCallback, useEffect, useMemo } from "react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useObjectStorageLogic,
  ObjectStorageLogicConfig,
} from "../../../hooks/useObjectStorageLogic";
import { ProvisioningWizardLayout } from "../instance-wizard";
import { ModernButton } from "../ui";
import { ObjectStorageWorkflowStep } from "./ObjectStorageWorkflowStep";
import { ObjectStorageServiceStep } from "./ObjectStorageServiceStep";
import { ObjectStoragePaymentStep } from "./ObjectStoragePaymentStep";
import { ObjectStorageReviewStep } from "./ObjectStorageReviewStep";
import { ObjectStorageOrderSummary } from "./ObjectStorageOrderSummary";
import { ObjectStorageOrderSuccessStep } from "./ObjectStorageOrderSuccessStep";

export interface ObjectStorageCreateContentProps {
  /** Dashboard context: 'admin', 'tenant', or 'client' */
  dashboardContext: "admin" | "tenant" | "client";
  /** Configuration for the Silo Storage logic hook */
  config: ObjectStorageLogicConfig;
  /** Show customer context selection (admin only) */
  showCustomerContext?: boolean;
  /** Show price override field (admin only) */
  showPriceOverride?: boolean;
  /** Enable fast-track provisioning */
  enableFastTrack?: boolean;
  /** Tenant options for admin context */
  tenantOptions?: Array<{ value: string; label: string }>;
  /** Additional class name for the container */
  className?: string;
}

/**
 * Shared Silo Storage Create Content Component
 *
 * This component contains the entire wizard UI and logic for creating Silo Storage.
 * It can be used by Admin, Tenant, and Client dashboards - each page just wraps it
 * with their respective navigation/layout.
 *
 * Usage:
 * ```tsx
 * // In TenantObjectStorageCreate.tsx
 * <TenantLayout>
 *   <ObjectStorageCreateContent
 *     dashboardContext="tenant"
 *     config={{ context: "tenant", tenantId, submitOrderFn }}
 *   />
 * </TenantLayout>
 * ```
 */
export const ObjectStorageCreateContent: React.FC<ObjectStorageCreateContentProps> = ({
  dashboardContext,
  config,
  showCustomerContext = false,
  showPriceOverride = false,
  enableFastTrack = true,
  tenantOptions = [],
  className = "",
}) => {
  const logic = useObjectStorageLogic({ ...config, allowFastTrack: enableFastTrack });

  const {
    // Mode & Steps
    mode,
    isFastTrack,
    activeStep,
    steps,
    handleModeChange,
    goToStep,
    validateWorkflowStep,
    validateServiceStep,

    // Profiles
    resolvedProfiles,
    addProfile,
    removeProfile,
    handleRegionChange,
    handleTierChange,
    handleMonthsChange,
    handleStorageGbChange,
    handleNameChange,
    handleUnitPriceChange,

    // Options
    regionOptions,
    countryOptions,
    tenantOptions: logicTenantOptions,
    clientOptions,

    // Form Data
    formData,
    selectedCountryCode,
    isCountryLocked,
    setBillingCountry,

    // Customer Context
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    assignmentLabel,

    // Pricing
    displayedTotals,
    grandTotalWithFees,

    // Order State
    lastOrderSummary,
    orderId,
    transactionId,
    accountIds,
    paymentTransactionData,
    paymentOptions,
    selectedPaymentOption,
    setSelectedPaymentOption,
    paymentRequired,
    isPaymentComplete,
    isPaymentFailed,

    // Loading States
    isCountriesLoading,
    isPricingLoading,
    isTenantsFetching,
    isUsersFetching,
    isSubmitting,
    isGeneratingPayment,

    // Handlers
    createOrder,
    handlePaymentCompleted,
    resetOrderState,
    submitOrder,
    resetForm,
  } = logic;

  const resolvedTenantOptions = tenantOptions.length > 0 ? tenantOptions : logicTenantOptions;
  const countryLabel =
    countryOptions.find((c) => c.value === selectedCountryCode)?.label ||
    selectedCountryCode ||
    "Not selected";

  const stepIndicatorSteps = useMemo(
    () =>
      steps.map((step) => ({
        id: step.id,
        title: step.label,
        desc: step.description,
      })),
    [steps]
  );

  const currentStepIndex = Math.min(activeStep, steps.length - 1);
  const currentStepId = steps[currentStepIndex]?.id || "";
  const workflowStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "workflow"),
    [steps]
  );
  const servicesStepIndex = useMemo(
    () => steps.findIndex((step) => step.id === "services"),
    [steps]
  );
  const paymentStepIndex = useMemo(() => steps.findIndex((step) => step.id === "payment"), [steps]);
  const reviewStepIndex = useMemo(() => steps.findIndex((step) => step.id === "review"), [steps]);
  const successStepIndex = useMemo(() => steps.findIndex((step) => step.id === "success"), [steps]);

  const resolvedWorkflowStepIndex = workflowStepIndex >= 0 ? workflowStepIndex : 0;
  const resolvedServicesStepIndex = servicesStepIndex >= 0 ? servicesStepIndex : 1;
  const resolvedPaymentStepIndex = paymentStepIndex >= 0 ? paymentStepIndex : reviewStepIndex - 1;
  const resolvedReviewStepIndex = reviewStepIndex >= 0 ? reviewStepIndex : steps.length - 2;
  const resolvedSuccessStepIndex = successStepIndex >= 0 ? successStepIndex : steps.length - 1;
  const resolvedReviewBackIndex = isFastTrack
    ? resolvedServicesStepIndex
    : paymentRequired === false
      ? resolvedServicesStepIndex
      : resolvedPaymentStepIndex >= 0
        ? resolvedPaymentStepIndex
        : resolvedServicesStepIndex;

  const gatewayFees = useMemo(() => {
    return (
      selectedPaymentOption?.charge_breakdown?.total_fees ??
      selectedPaymentOption?.total_fees ??
      selectedPaymentOption?.fees ??
      lastOrderSummary?.transaction?.transaction_fee ??
      lastOrderSummary?.transaction?.third_party_fee ??
      0
    );
  }, [lastOrderSummary, selectedPaymentOption]);

  const handleStepChange = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentStepIndex) return;
      if (targetIndex > currentStepIndex) return;

      const targetStepId = steps[targetIndex]?.id || "";
      if (lastOrderSummary && (targetStepId === "workflow" || targetStepId === "services")) {
        resetOrderState();
      }

      goToStep(targetIndex);
    },
    [currentStepIndex, goToStep, lastOrderSummary, resetOrderState, steps]
  );

  const handleWorkflowContinue = useCallback(() => {
    if (!validateWorkflowStep()) return;
    goToStep(resolvedServicesStepIndex);
  }, [goToStep, resolvedServicesStepIndex, validateWorkflowStep]);

  const handleServicesContinue = useCallback(async () => {
    if (!validateServiceStep()) return;

    if (isFastTrack) {
      goToStep(resolvedReviewStepIndex);
      return;
    }

    const orderSummary = await createOrder();
    if (!orderSummary) {
      ToastUtils.error("Unable to create the order. Please try again.");
      return;
    }

    const requiresPayment = orderSummary?.payment?.required !== false;
    const nextIndex =
      requiresPayment && resolvedPaymentStepIndex >= 0
        ? resolvedPaymentStepIndex
        : resolvedReviewStepIndex;
    goToStep(nextIndex);
  }, [
    createOrder,
    goToStep,
    isFastTrack,
    resolvedPaymentStepIndex,
    resolvedReviewStepIndex,
    validateServiceStep,
  ]);

  const handlePaymentContinue = useCallback(() => {
    if (!isPaymentComplete) {
      ToastUtils.error("Please complete payment before continuing.");
      return;
    }

    goToStep(resolvedReviewStepIndex);
  }, [goToStep, isPaymentComplete, resolvedReviewStepIndex]);

  const handleReviewSubmit = useCallback(async () => {
    if (isFastTrack) {
      const orderSummary = await submitOrder(undefined, true);
      if (!orderSummary) {
        ToastUtils.error("Unable to submit the fast-track order. Please try again.");
        return;
      }
      goToStep(resolvedSuccessStepIndex);
      return;
    }

    if (!lastOrderSummary) {
      ToastUtils.error("Generate the order before provisioning.");
      return;
    }

    if (!isPaymentComplete) {
      ToastUtils.error("Payment is required before provisioning.");
      return;
    }

    goToStep(resolvedSuccessStepIndex);
  }, [
    isFastTrack,
    isPaymentComplete,
    lastOrderSummary,
    goToStep,
    resolvedSuccessStepIndex,
    submitOrder,
  ]);

  useEffect(() => {
    if (currentStepId !== "payment") return;
    if (!isPaymentComplete) return;
    if (activeStep === resolvedReviewStepIndex) return;
    goToStep(resolvedReviewStepIndex);
  }, [activeStep, currentStepId, goToStep, isPaymentComplete, resolvedReviewStepIndex]);

  const mainContent = () => {
    if (currentStepId === "workflow") {
      return (
        <div className="space-y-6">
          <ObjectStorageWorkflowStep
            mode={mode}
            onModeChange={handleModeChange}
            enableFastTrack={enableFastTrack}
            showCustomerContext={showCustomerContext}
            contextType={contextType}
            onContextTypeChange={setContextType}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
            tenantOptions={resolvedTenantOptions}
            clientOptions={clientOptions}
            isTenantsFetching={isTenantsFetching}
            isUsersFetching={isUsersFetching}
            countryCode={formData.countryCode}
            onCountryChange={setBillingCountry}
            countryOptions={countryOptions}
            isCountryLocked={isCountryLocked}
            isCountriesLoading={isCountriesLoading}
            dashboardContext={dashboardContext}
          />
          <div className="flex justify-end gap-3">
            <ModernButton onClick={handleWorkflowContinue} isDisabled={isSubmitting}>
              Continue to {steps[resolvedServicesStepIndex]?.label || "services"}
            </ModernButton>
          </div>
        </div>
      );
    }

    if (currentStepId === "services") {
      return (
        <div className="space-y-6">
          <ObjectStorageServiceStep
            profiles={resolvedProfiles}
            regionOptions={regionOptions}
            isLoadingPricing={isPricingLoading}
            showPriceOverride={showPriceOverride}
            dashboardContext={dashboardContext}
            onAddProfile={addProfile}
            onRemoveProfile={removeProfile}
            onRegionChange={handleRegionChange}
            onTierChange={handleTierChange}
            onMonthsChange={handleMonthsChange}
            onStorageGbChange={handleStorageGbChange}
            onNameChange={handleNameChange}
            onUnitPriceChange={handleUnitPriceChange}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ModernButton
              variant="outline"
              onClick={() => goToStep(resolvedWorkflowStepIndex)}
              isDisabled={isSubmitting}
            >
              Back
            </ModernButton>
            <ModernButton
              onClick={handleServicesContinue}
              isLoading={isGeneratingPayment}
              isDisabled={isSubmitting || isGeneratingPayment}
            >
              {isFastTrack ? "Continue to review" : "Generate payment options"}
            </ModernButton>
          </div>
        </div>
      );
    }

    if (currentStepId === "payment") {
      return (
        <div className="space-y-6">
          <ObjectStoragePaymentStep
            paymentOptions={paymentOptions}
            onPaymentComplete={handlePaymentCompleted}
            onPaymentOptionChange={setSelectedPaymentOption}
            totals={displayedTotals}
            isPaymentComplete={isPaymentComplete}
            isPaymentFailed={isPaymentFailed}
            isProcessing={isSubmitting}
            transactionId={transactionId || undefined}
            transactionData={paymentTransactionData}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ModernButton
              variant="outline"
              onClick={() => {
                resetOrderState();
                goToStep(resolvedServicesStepIndex);
              }}
              isDisabled={isSubmitting}
            >
              Back
            </ModernButton>
            <ModernButton
              onClick={handlePaymentContinue}
              isDisabled={isSubmitting || !isPaymentComplete}
            >
              Continue to review
            </ModernButton>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <ProvisioningWizardLayout
      steps={stepIndicatorSteps}
      activeStep={activeStep}
      onStepChange={handleStepChange}
      currentStepId={currentStepId}
      reviewContent={
        <ObjectStorageReviewStep
          profiles={resolvedProfiles}
          totals={displayedTotals}
          assignmentLabel={assignmentLabel}
          countryLabel={countryLabel}
          workflowLabel={isFastTrack ? "Fast-Track" : "Standard"}
          transactionId={transactionId || undefined}
          isPaymentComplete={isPaymentComplete}
          isFastTrack={isFastTrack}
          isSubmitting={isSubmitting}
          gatewayFees={gatewayFees}
          grandTotalWithFees={grandTotalWithFees}
          dashboardContext={dashboardContext}
          onSubmit={handleReviewSubmit}
          onBack={() => goToStep(resolvedReviewBackIndex)}
        />
      }
      successContent={
        <ObjectStorageOrderSuccessStep
          accountIds={accountIds}
          orderId={orderId}
          transactionId={transactionId}
          isFastTrack={isFastTrack}
          dashboardContext={dashboardContext}
          onCreateAnother={() => resetForm()}
        />
      }
      mainContent={mainContent()}
      sidebarContent={
        <div className="lg:sticky lg:top-4">
          <ObjectStorageOrderSummary
            profiles={resolvedProfiles}
            totals={displayedTotals}
            assignmentLabel={assignmentLabel}
            countryLabel={countryLabel}
            workflowLabel={isFastTrack ? "Fast-Track" : "Standard"}
            transactionId={transactionId || undefined}
            isPaymentComplete={isPaymentComplete}
            isPaymentFailed={isPaymentFailed}
            gatewayFees={gatewayFees}
            grandTotalWithFees={grandTotalWithFees}
          />
        </div>
      }
      containerClassName={`mx-auto max-w-6xl space-y-8 pb-20 ${className}`}
    />
  );
};

export default ObjectStorageCreateContent;
