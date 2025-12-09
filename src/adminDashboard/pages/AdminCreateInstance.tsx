// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  CreditCard,
  Gauge,
  Server,
  Trash2,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "../../shared/components/ui";
import { ModernCard } from "../../shared/components/ui";
import ModernSelect from "../../shared/components/ui/ModernSelect";
import StatusPill from "../../shared/components/ui/StatusPill";
import PaymentModal from "../../shared/components/ui/PaymentModal";
import adminSilentApi from "../../index/admin/silent";
import adminApi from "../../index/admin/api";
import ToastUtils from "../../utils/toastUtil";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import { useCustomerContext } from "../../hooks/adminHooks/useCustomerContext";
import CustomerContextSelector from "../../shared/components/common/CustomerContextSelector";
import {
  useFetchCountries,
  useFetchProductPricing,
  useFetchGeneralRegions,
} from "../../hooks/resource";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import { useFetchSecurityGroups } from "../../hooks/adminHooks/securityGroupHooks";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import { useFetchSubnets } from "../../hooks/adminHooks/subnetHooks";
import { useFetchNetworks } from "../../hooks/adminHooks/networkHooks";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";
import { AdditionalVolume, Configuration, Option } from "../../types/InstanceConfiguration";
import AdminInstanceConfigurationCard from "../components/AdminInstanceConfigurationCard";
import { useInstanceFormState } from "../../hooks/useInstanceCreation";
import { useApiContext } from "../../hooks/useApiContext";
import InstanceSummaryCard from "../../shared/components/instance-wizard/InstanceSummaryCard";
import OrderOverviewCard from "../../shared/components/instance-wizard/OrderOverviewCard";
import WorkflowSelectionStep from "../../shared/components/instance-wizard/WorkflowSelectionStep";
import ReviewSubmitStep from "../../shared/components/instance-wizard/ReviewSubmitStep";
import PaymentStep from "../../shared/components/instance-wizard/PaymentStep";
import ConfigurationListStep from "../../shared/components/instance-wizard/ConfigurationListStep";
import { useInstanceOrderCreation } from "../../hooks/useInstanceOrderCreation";
import { useInstanceResources } from "../../hooks/useInstanceResources";
import { useAdminCreateInstanceLogic } from "../../hooks/useAdminCreateInstanceLogic";
import {
  COUNTRY_FALLBACK,
  normalizeCountryCandidate,
  matchCountryFromOptions,
  resolveCountryCodeFromEntity,
  hasValue,
  evaluateConfigurationCompleteness,
  normalizePaymentOptions,
  formatCurrencyValue,
  findLabel,
  formatComputeLabel,
  formatOsLabel,
  formatVolumeLabel,
  formatKeypairLabel,
  formatSubnetLabel,
  toNumber,
} from "../../utils/instanceCreationUtils";

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
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
    handleCreateOrder,
    handlePaymentCompleted,
    adminToken,
    apiBaseUrl,
  } = logic;

  // Derived values for display
  const summaryConfigurationCount = configurationSummaries.length || configurations.length || 0;
  const taxLabelSuffix =
    summaryTaxValue > 0 && summarySubtotalValue > 0
      ? ` (${((summaryTaxValue / summarySubtotalValue) * 100).toFixed(2)}%)`
      : "";
  const currentStep = Math.min(activeStep, steps.length - 1);
  const reviewStepIndex = useMemo(() => steps.findIndex((step) => step.id === "review"), [steps]);
  useEffect(() => {
    if (!hasLockedPaymentStep && reviewStepIndex >= 0 && activeStep >= reviewStepIndex) {
      setHasLockedPaymentStep(true);
    }
  }, [activeStep, reviewStepIndex, hasLockedPaymentStep]);
  const stepCounterLabel = `Step ${currentStep + 1} of ${steps.length}`;

  const handleStepChange = useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentStep) return;
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
    [currentStep, isFastTrack, reviewStepIndex, isPaymentSuccessful, hasLockedPaymentStep]
  );

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Create Instance"
        description="Provision new compute resources for a tenant or user."
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
        <div className="mx-auto max-w-5xl space-y-8 pb-20">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {steps.map((step, idx) => {
              const isActive = idx === activeStep;
              const isCompleted = idx < activeStep;
              const isClickable = isCompleted || isActive;
              return (
                <div
                  key={step.id}
                  onClick={() => {
                    if (isClickable) handleStepChange(idx);
                  }}
                  className={`relative flex flex-col gap-2 rounded-xl border p-4 transition-all ${
                    isActive
                      ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-200"
                      : isCompleted
                        ? "cursor-pointer border-slate-200 bg-white hover:border-slate-300"
                        : "border-slate-100 bg-slate-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-primary-600 text-white"
                          : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : idx + 1}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                        Current
                      </span>
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isActive ? "text-primary-900" : "text-slate-900"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show instance summary sidebar on steps 0-2 */}
          {activeStep < steps.length - 1 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {activeStep === 0 && (
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
                    onModeChange={handleModeChange}
                    onContextTypeChange={setContextType}
                    onTenantChange={setSelectedTenantId}
                    onUserChange={setSelectedUserId}
                    onCountryChange={setBillingCountry}
                    onContinue={() => setActiveStep(1)}
                  />
                )}

                {!isFastTrack && activeStep === 1 && (
                  <ConfigurationListStep
                    configurations={configurations}
                    resources={resources}
                    generalRegions={generalRegions}
                    regionOptions={regionSelectOptions}
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
                  />
                )}

                {!isFastTrack && activeStep === 2 && (
                  <PaymentStep
                    submissionResult={submissionResult}
                    orderReceipt={orderReceipt}
                    isPaymentSuccessful={isPaymentSuccessful}
                    summaryGrandTotalValue={summaryGrandTotalValue}
                    summaryDisplayCurrency={summaryDisplayCurrency}
                    contextType={contextType}
                    selectedUserId={String(selectedUserId)}
                    clientOptions={clientOptions}
                    onPaymentComplete={handlePaymentCompleted}
                    authToken={adminToken}
                    apiBaseUrl={apiBaseUrl}
                    paymentTransactionLabel={paymentTransactionLabel}
                  />
                )}
              </div>

              {/* Summary Sidebar - shown on steps 0-2 */}
              <div className="lg:col-span-1">
                <InstanceSummaryCard
                  configurations={configurations}
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
                />
              </div>
            </div>
          ) : (
            /* Review step - full width without sidebar */
            <div className="space-y-6">
              {((isFastTrack && activeStep === 2) || (!isFastTrack && activeStep === 3)) && (
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
                  onBack={() => setActiveStep(isFastTrack ? 1 : 2)}
                  onEditConfiguration={() => setActiveStep(1)}
                />
              )}
            </div>
          )}
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminCreateInstance;
