// @ts-nocheck
import React from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import { useObjectStorageLogic } from "../../hooks/useObjectStorageLogic";
import { ObjectStorageWorkflowStep } from "../../shared/components/object-storage/ObjectStorageWorkflowStep";
import { ObjectStorageServiceStep } from "../../shared/components/object-storage/ObjectStorageServiceStep";
import { ObjectStoragePaymentStep } from "../../shared/components/object-storage/ObjectStoragePaymentStep";
import { ObjectStorageReviewStep } from "../../shared/components/object-storage/ObjectStorageReviewStep";
import { ObjectStorageOrderSummary } from "../../shared/components/object-storage/ObjectStorageOrderSummary";
import objectStorageApi from "../../services/objectStorageApi";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";

// Admin-specific submit function
const createAdminSubmitOrder = (adminToken: string | null) => async (payload: any) => {
  const response = await objectStorageApi.createOrder({
    ...payload,
    token: adminToken,
  });
  return response;
};

const AdminObjectStorageCreateNew: React.FC = () => {
  const adminToken = useAdminAuthStore((state) => state.token);

  const logic = useObjectStorageLogic({
    context: "admin",
    submitOrderFn: createAdminSubmitOrder(adminToken),
    getAuthToken: () => adminToken,
  });

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
    tenantOptions,
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
    summaryTotals,
    displayedTotals,
    grandTotalWithFees,

    // Order State
    paymentOptions,
    selectedPaymentOption,
    setSelectedPaymentOption,
    isPaymentComplete,
    isPaymentFailed,
    transactionStatus,

    // Loading States
    isRegionsLoading,
    isCountriesLoading,
    isPricingLoading,
    isTenantsFetching,
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
            showCustomerContext={true}
            contextType={contextType}
            onContextTypeChange={setContextType}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
            selectedUserId={selectedUserId}
            onUserChange={setSelectedUserId}
            tenantOptions={tenantOptions}
            clientOptions={clientOptions}
            isTenantsFetching={isTenantsFetching}
            isUsersFetching={isUsersFetching}
            countryCode={formData.countryCode}
            onCountryChange={setBillingCountry}
            countryOptions={countryOptions}
            isCountryLocked={isCountryLocked}
            isCountriesLoading={isCountriesLoading}
            dashboardContext="admin"
          />
        );

      case "services":
        return (
          <ObjectStorageServiceStep
            profiles={resolvedProfiles}
            regionOptions={regionOptions}
            isLoadingPricing={isPricingLoading}
            showPriceOverride={true} // Admin can override prices
            dashboardContext="admin"
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
            dashboardContext="admin"
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
            dashboardContext="admin"
            onSubmit={() => submitOrder()}
            onBack={handlePreviousStep}
          />
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Create Object Storage"
        description="Configure and provision object storage for customers"
      >
        <div className="object-storage-create-page">
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
                      className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                      onClick={() => isClickable && goToStep(index)}
                      style={{ cursor: isClickable ? "pointer" : "default" }}
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
      </AdminPageShell>
    </>
  );
};

export default AdminObjectStorageCreateNew;
