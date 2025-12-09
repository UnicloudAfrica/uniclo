import React from "react";
import {
  useObjectStorageLogic,
  ObjectStorageLogicConfig,
} from "../../../hooks/useObjectStorageLogic";
import { ObjectStorageWorkflowStep } from "./ObjectStorageWorkflowStep";
import { ObjectStorageServiceStep } from "./ObjectStorageServiceStep";
import { ObjectStoragePaymentStep } from "./ObjectStoragePaymentStep";
import { ObjectStorageReviewStep } from "./ObjectStorageReviewStep";
import { ObjectStorageOrderSummary } from "./ObjectStorageOrderSummary";

// Define step interface
interface WizardStep {
  id: string;
  label: string;
  description?: string;
}

export interface ObjectStorageCreateContentProps {
  /** Dashboard context: 'admin', 'tenant', or 'client' */
  dashboardContext: "admin" | "tenant" | "client";
  /** Configuration for the object storage logic hook */
  config: ObjectStorageLogicConfig;
  /** Show customer context selection (admin only) */
  showCustomerContext?: boolean;
  /** Show price override field (admin only) */
  showPriceOverride?: boolean;
  /** Tenant options for admin context */
  tenantOptions?: Array<{ value: string; label: string }>;
  /** Additional class name for the container */
  className?: string;
}

/**
 * Shared Object Storage Create Content Component
 *
 * This component contains the entire wizard UI and logic for creating object storage.
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
  tenantOptions = [],
  className = "",
}) => {
  const logic = useObjectStorageLogic(config);

  const {
    // Mode & Steps
    mode,
    isFastTrack,
    activeStep,
    steps,
    isFirstStep,
    isLastStep,
    handleModeChange,
    goToStep,
    handleNextStep,
    handlePreviousStep,

    // Profiles
    resolvedProfiles,
    addProfile,
    removeProfile,
    handleRegionChange,
    handleTierChange,
    handleMonthsChange,
    handleNameChange,
    handleUnitPriceChange,

    // Options
    regionOptions,
    countryOptions,
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
    paymentOptions,
    selectedPaymentOption,
    setSelectedPaymentOption,
    isPaymentComplete,
    isPaymentFailed,

    // Loading States
    isCountriesLoading,
    isPricingLoading,
    isUsersFetching,
    isSubmitting,

    // Handlers
    submitOrder,
  } = logic;

  // Get country label for display
  const countryLabel =
    countryOptions.find((c) => c.value === selectedCountryCode)?.label ||
    selectedCountryCode ||
    "Not selected";

  // Render current step content
  const renderStepContent = () => {
    const currentStepId = steps[activeStep]?.id;

    switch (currentStepId) {
      case "workflow":
        return (
          <ObjectStorageWorkflowStep
            mode={mode}
            onModeChange={handleModeChange}
            showCustomerContext={showCustomerContext}
            contextType={contextType}
            onContextTypeChange={setContextType}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
            tenantOptions={tenantOptions}
            clientOptions={clientOptions}
            isUsersFetching={isUsersFetching}
            countryCode={formData.countryCode}
            onCountryChange={setBillingCountry}
            countryOptions={countryOptions}
            isCountryLocked={isCountryLocked}
            isCountriesLoading={isCountriesLoading}
            dashboardContext={dashboardContext}
          />
        );

      case "services":
        return (
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
            onNameChange={handleNameChange}
            onUnitPriceChange={handleUnitPriceChange}
          />
        );

      case "payment":
        return (
          <ObjectStoragePaymentStep
            paymentOptions={paymentOptions}
            selectedOption={selectedPaymentOption}
            onSelectOption={setSelectedPaymentOption}
            totals={displayedTotals}
            isPaymentComplete={isPaymentComplete}
            isPaymentFailed={isPaymentFailed}
            dashboardContext={dashboardContext}
          />
        );

      case "review":
        return (
          <ObjectStorageReviewStep
            profiles={resolvedProfiles}
            totals={displayedTotals}
            assignmentLabel={assignmentLabel}
            countryLabel={countryLabel}
            workflowLabel={isFastTrack ? "Fast-Track" : "Standard"}
            isPaymentComplete={isPaymentComplete}
            isFastTrack={isFastTrack}
            isSubmitting={isSubmitting}
            grandTotalWithFees={grandTotalWithFees}
            dashboardContext={dashboardContext}
            onSubmit={() => submitOrder()}
            onBack={handlePreviousStep}
          />
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className={`object-storage-create-page ${className}`}>
      <div className="wizard-layout">
        {/* Step Guide */}
        <div className="wizard-step-guide card">
          <div className="step-list">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;
              const isClickable = index <= activeStep;

              return (
                <div
                  key={step.id}
                  className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isClickable ? "clickable" : ""}`}
                  onClick={() => isClickable && goToStep(index)}
                >
                  <div className={`step-number ${isCompleted ? "completed" : ""}`}>
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <div className="step-content">
                    <div className="step-label">{step.label}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="wizard-main-content">
          <div className="card">{renderStepContent()}</div>

          {/* Navigation Actions */}
          {steps[activeStep]?.id !== "review" && (
            <div className="wizard-actions">
              {!isFirstStep && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                >
                  Previous
                </button>
              )}
              <div style={{ flex: 1 }} />
              {!isLastStep && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNextStep}
                  disabled={isSubmitting}
                >
                  Continue to {steps[activeStep + 1]?.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="wizard-sidebar">
          <div className="card">
            <ObjectStorageOrderSummary
              profiles={resolvedProfiles}
              totals={displayedTotals}
              assignmentLabel={assignmentLabel}
              countryLabel={countryLabel}
              workflowLabel={isFastTrack ? "Fast-Track" : "Standard"}
              isPaymentComplete={isPaymentComplete}
              grandTotalWithFees={grandTotalWithFees}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectStorageCreateContent;
