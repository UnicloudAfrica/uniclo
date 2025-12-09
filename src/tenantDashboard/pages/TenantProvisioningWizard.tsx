// @ts-nocheck
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { ModernButton } from "../../shared/components/ui";
import ConfigurationListStep from "../../shared/components/instance-wizard/ConfigurationListStep";
import PaymentStep from "../../shared/components/instance-wizard/PaymentStep";
import InstanceSummaryCard from "../../shared/components/instance-wizard/InstanceSummaryCard";
import StepIndicator from "../../shared/components/instance-wizard/StepIndicator";
import OrderSuccessStep from "../../shared/components/instance-wizard/OrderSuccessStep";
import { useTenantProvisioningLogic } from "../../hooks/useTenantProvisioningLogic";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import TenantWorkflowStep from "../components/TenantWorkflowStep";

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const TenantProvisioningWizard: React.FC = () => {
  const navigate = useNavigate();
  const logic = useTenantProvisioningLogic();

  const {
    // Mode
    mode,
    isFastTrack,
    handleModeChange,
    hasFastTrackAccess,
    fastTrackRegions,

    // Steps
    steps,
    activeStep,
    setActiveStep,

    // Configurations
    configurations,
    addConfiguration,
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
    authToken,
    apiBaseUrl,
    profile,
  } = logic;

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

  // Get tenant options for payment
  const tenantOptions = useMemo(() => {
    if (!profile) return [];
    return [
      {
        value: String(profile.id),
        label: profile.company_name || profile.name || `${profile.first_name} ${profile.last_name}`,
      },
    ];
  }, [profile]);

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

  return (
    <TenantPageShell title="Create Instance" description="Provision new compute resources">
      <div className="mx-auto max-w-5xl space-y-8 pb-20">
        {/* Step Indicator - Grid variant */}
        <StepIndicator
          steps={steps}
          activeStep={activeStep}
          onStepClick={handleStepClick}
          variant="grid"
        />

        {/* Main Content Grid */}
        {activeStep < steps.length - 1 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Step 0: Workflow Selection */}
              {currentStep?.id === "workflow" && (
                <TenantWorkflowStep
                  mode={mode}
                  billingCountry={billingCountry}
                  isCountryLocked={isCountryLocked}
                  isCountriesLoading={isCountriesLoading}
                  countryOptions={countryOptions}
                  hasFastTrackAccess={hasFastTrackAccess}
                  fastTrackRegions={fastTrackRegions}
                  allRegionOptions={allRegionOptions}
                  onModeChange={handleModeChange}
                  onCountryChange={setBillingCountry}
                  onContinue={() => setActiveStep(1)}
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
                  onAddConfiguration={addConfiguration}
                  onRemoveConfiguration={removeConfiguration}
                  onUpdateConfiguration={updateConfiguration}
                  onAddVolume={addAdditionalVolume}
                  onRemoveVolume={removeAdditionalVolume}
                  onUpdateVolume={updateAdditionalVolume}
                  onBack={() => setActiveStep(0)}
                  onSubmit={handleCreateOrder}
                  // Skip admin API calls - tenant context handles data differently
                  skipProjectFetch={true}
                  skipNetworkResourcesFetch={true}
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
                  contextType="tenant"
                  selectedUserId={String(profile?.id)}
                  clientOptions={tenantOptions}
                  onPaymentComplete={handlePaymentCompleted}
                  authToken={authToken}
                  apiBaseUrl={apiBaseUrl}
                  paymentTransactionLabel="Instance Order"
                />
              )}
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-1">
              <InstanceSummaryCard
                configurations={configurations}
                contextType="tenant"
                selectedTenantName={profile?.company_name || profile?.name}
                billingCountry={
                  countryOptions.find((c) => String(c.value) === billingCountry)?.label ||
                  billingCountry
                }
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
        ) : (
          /* Review step - full width */
          <OrderSuccessStep
            orderId={orderReceipt?.order_id || submissionResult?.data?.id}
            isFastTrack={isFastTrack}
            configurationSummaries={configurationSummaries}
            pricingSummary={pricingSummary}
            instancesPageUrl="/dashboard/instances"
            onCreateAnother={() => window.location.reload()}
          />
        )}
      </div>
    </TenantPageShell>
  );
};

export default TenantProvisioningWizard;
