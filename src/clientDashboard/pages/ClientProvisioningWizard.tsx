// @ts-nocheck
import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import ConfigurationListStep from "../../shared/components/instance-wizard/ConfigurationListStep";
import PaymentStep from "../../shared/components/instance-wizard/PaymentStep";
import InstanceSummaryCard from "../../shared/components/instance-wizard/InstanceSummaryCard";
import StepIndicator from "../../shared/components/instance-wizard/StepIndicator";
import OrderSuccessStep from "../../shared/components/instance-wizard/OrderSuccessStep";
import { useClientProvisioningLogic } from "../../hooks/useClientProvisioningLogic";
import ClientPageShell from "../components/ClientPageShell";

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const ClientProvisioningWizard: React.FC = () => {
  const navigate = useNavigate();
  const logic = useClientProvisioningLogic();

  const {
    steps,
    activeStep,
    setActiveStep,
    configurations,
    addConfiguration,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
    billingCountry,
    countryOptions,
    resources,
    generalRegions,
    regionOptions,
    isLoadingResources,
    isSubmitting,
    submissionResult,
    orderReceipt,
    isPaymentSuccessful,
    handleCreateOrder,
    handlePaymentCompleted,
    pricingSummary,
    configurationSummaries,
    authToken,
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

  // Get client options for payment
  const clientOptions = useMemo(() => {
    if (!profile) return [];
    return [{ value: String(profile.id), label: `${profile.first_name} ${profile.last_name}` }];
  }, [profile]);

  const currentStep = steps[activeStep];

  return (
    <ClientPageShell title="Create Instance" description="Provision new compute resources">
      <div className="mx-auto max-w-5xl space-y-8 pb-20">
        {/* Step Indicator - Grid variant (matching Admin/Tenant) */}
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
              {/* Step 0: Configure */}
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
                  onBack={() => navigate(-1)}
                  onSubmit={handleCreateOrder}
                  // Skip admin API calls - client context handles data differently
                  skipProjectFetch={true}
                  skipNetworkResourcesFetch={true}
                />
              )}

              {/* Step 1: Payment */}
              {currentStep?.id === "payment" && (
                <PaymentStep
                  submissionResult={submissionResult}
                  orderReceipt={orderReceipt}
                  isPaymentSuccessful={isPaymentSuccessful}
                  summaryGrandTotalValue={pricingSummary.grandTotal}
                  summaryDisplayCurrency={pricingSummary.currency}
                  contextType="client"
                  selectedUserId={String(profile?.id)}
                  clientOptions={clientOptions}
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
                contextType="client"
                selectedClientName={profile?.first_name}
                billingCountry={
                  countryOptions.find((c) => String(c.value) === billingCountry)?.label ||
                  billingCountry
                }
              />
            </div>
          </div>
        ) : (
          /* Review step - full width */
          <OrderSuccessStep
            orderId={orderReceipt?.order_id || submissionResult?.data?.id}
            isFastTrack={false}
            configurationSummaries={configurationSummaries}
            pricingSummary={pricingSummary}
            instancesPageUrl="/client-dashboard/instances"
            onCreateAnother={() => setActiveStep(0)}
          />
        )}
      </div>
    </ClientPageShell>
  );
};

export default ClientProvisioningWizard;
