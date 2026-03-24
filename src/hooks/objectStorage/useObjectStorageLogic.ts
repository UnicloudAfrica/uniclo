import { useState, useMemo, useCallback } from "react";
import { ServiceProfile, resolveTierQuota, GLOBAL_TIER_KEY } from "../objectStorageUtils";
import { useObjectStorageFormState } from "../useObjectStorageFormState";
import {
  useObjectStoragePricing,
  ObjectStorageOrderSummary,
  PaymentOptionLike,
} from "../useObjectStoragePricing";
import type { ObjectStorageLogicConfig, ObjectStorageLogicReturn } from "./types";
import { useStepNavigation } from "./useStepNavigation";
import { useCustomerSelection } from "./useCustomerSelection";
import { useDataFetching } from "./useDataFetching";
import { useOrderManagement } from "./useOrderManagement";

export const useObjectStorageLogic = (
  config: ObjectStorageLogicConfig = {}
): ObjectStorageLogicReturn => {
  const {
    context = "admin",
    tenantId: configTenantId,
    userId: configUserId,
    allowFastTrack = true,
    useRegionsHook,
    useCountriesHook,
    usePricingHook,
    submitOrderFn,
  } = config;

  // ---- Step Navigation ----
  const stepNav = useStepNavigation({ allowFastTrack });
  const { mode, isFastTrack, activeStep, setActiveStep, steps, isFirstStep, isLastStep, goToStep } =
    stepNav;

  // ---- Form Data State ----
  // Default to empty — the useCustomerSelection hook will resolve from profile/tenant
  const [formData, setFormData] = useState({ countryCode: "" });
  const [isCountryLocked, setIsCountryLocked] = useState(false);

  // ---- Service Profiles ----
  const formState = useObjectStorageFormState();
  const {
    serviceProfiles,
    addProfile,
    removeProfile,
    updateProfile,
    handleRegionChange,
    handleAvailabilityZoneChange,
    handleMonthsChange,
    handleStorageGbChange,
    handleNameChange,
    handleUnitPriceChange,
    resetProfiles,
  } = formState;

  // ---- Derived country / currency ----
  const selectedCountryCode = useMemo(
    () => (formData.countryCode || "").toUpperCase(),
    [formData.countryCode]
  );
  const effectiveCountryCode = selectedCountryCode || "US";

  // ---- Data Fetching (regions, countries, pricing, tiers) ----
  // Initial pass to resolve currency from country data
  const dataFetchingInitial = useDataFetching({
    useRegionsHook,
    useCountriesHook,
    usePricingHook,
    serviceProfiles,
    effectiveCountryCode,
    selectedCurrency: "", // placeholder until currency resolved
  });

  // Resolve selected currency from country
  const selectedCurrency = useMemo(
    () => dataFetchingInitial.resolveCurrencyForCountry(selectedCountryCode),
    [dataFetchingInitial, selectedCountryCode]
  );

  // Second pass with resolved currency for correct tier catalog labels.
  // The underlying hooks (React Query) will deduplicate the actual fetches.
  const {
    regionMap,
    regionOptions,
    countryOptions,
    tierCatalog,
    isRegionsLoading,
    isCountriesLoading,
    isPricingLoading,
  } = useDataFetching({
    useRegionsHook,
    useCountriesHook,
    usePricingHook,
    serviceProfiles,
    effectiveCountryCode,
    selectedCurrency,
  });

  // ---- Customer Selection ----
  const customerSelection = useCustomerSelection({
    context,
    configTenantId,
    configUserId,
    countryOptions,
    setFormData,
    setIsCountryLocked,
  });

  const {
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    tenantOptions,
    clientOptions,
    isTenantsFetching,
    isUsersFetching,
    assignmentLabel,
  } = customerSelection;

  // ---- Tier Change Handler ----
  const handleTierChange = useCallback(
    (profileId: string, tierKey: string) => {
      const profile = serviceProfiles.find((item) => item.id === profileId);
      const regionKey = (profile?.region || "").trim().toLowerCase();
      const regionBucket = regionKey ? tierCatalog.get(regionKey) : null;
      const fallbackBucket = tierCatalog.get(GLOBAL_TIER_KEY);
      const catalogEntry = regionBucket || fallbackBucket;
      const tierRow = catalogEntry?.map?.get(tierKey.trim()) || null;
      const tierQuota = resolveTierQuota(tierRow);
      const storageGbValue = Number(profile?.storageGb);
      const hasStorageGb = Number.isFinite(storageGbValue) && storageGbValue > 0;
      const updates: Partial<ServiceProfile> = { tierKey };
      if (!hasStorageGb && tierQuota > 0) {
        updates.storageGb = String(tierQuota);
      }
      updateProfile(profileId, updates);
    },
    [serviceProfiles, tierCatalog, updateProfile]
  );

  // ---- Order / Payment State (lifted up to break circular dependency) ----
  const [lastOrderSummary, setLastOrderSummary] = useState<ObjectStorageOrderSummary | null>(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentOptionLike | null>(
    null
  );

  // ---- Pricing Calculations ----
  const pricing = useObjectStoragePricing(
    serviceProfiles,
    regionMap,
    tierCatalog,
    selectedCurrency,
    lastOrderSummary,
    selectedPaymentOption
  );

  const {
    resolvedProfiles,
    summaryTotals,
    summaryCurrency,
    hasCurrencyMismatch,
    grandTotalWithFees,
    displayedTotals,
  } = pricing;

  // ---- Order Management ----
  const orderManagement = useOrderManagement({
    isFastTrack,
    resolvedProfiles,
    effectiveCountryCode,
    selectedCurrency,
    context,
    selectedTenantId,
    selectedUserId,
    submitOrderFn,
    lastOrderSummary,
    setLastOrderSummary,
    selectedPaymentOption,
    setSelectedPaymentOption,
  });

  // ---- Validation ----
  const [, setErrors] = useState<Record<string, string>>({});
  const [, setProfileErrors] = useState<Record<string, Record<string, string>>>({});

  const validateWorkflowStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.countryCode) {
      newErrors.countryCode = "Please select a billing country";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.countryCode]);

  const validateServiceStep = useCallback((): boolean => {
    const newProfileErrors: Record<string, Record<string, string>> = {};
    let hasErrors = false;

    resolvedProfiles.forEach((profile) => {
      const profileError: Record<string, string> = {};
      if (!profile.region) {
        profileError.region = "Please select a region";
        hasErrors = true;
      }
      if (!profile.tierKey) {
        profileError.tierKey = "Please select a tier";
        hasErrors = true;
      }
      if (!profile.months || Number(profile.months) < 1) {
        profileError.months = "Please enter valid months";
        hasErrors = true;
      }
      if (!profile.storageGb || Number(profile.storageGb) < 1) {
        profileError.storageGb = "Please enter storage size (GB)";
        hasErrors = true;
      } else if (Number(profile.storageGb) > 100000) {
        profileError.storageGb = "Storage size cannot exceed 100000 GB";
        hasErrors = true;
      }
      if (Object.keys(profileError).length > 0) {
        newProfileErrors[profile.id] = profileError;
      }
    });

    setProfileErrors(newProfileErrors);
    return !hasErrors;
  }, [resolvedProfiles]);

  const handleNextStep = useCallback(() => {
    if (activeStep === 0 && !validateWorkflowStep()) return;
    if (activeStep === 1 && !validateServiceStep()) return;
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  }, [activeStep, steps.length, validateWorkflowStep, validateServiceStep, setActiveStep]);

  const handlePreviousStep = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  }, [activeStep, setActiveStep]);

  const setBillingCountry = useCallback((code: string) => {
    setFormData((prev) => ({ ...prev, countryCode: code }));
  }, []);

  const handleModeChange = useCallback(
    (nextMode: string) => {
      stepNav.handleModeChange(nextMode, orderManagement.resetOrderState);
    },
    [stepNav, orderManagement]
  );

  const resetForm = useCallback(() => {
    setFormData({ countryCode: "US" });
    resetProfiles();
    setActiveStep(0);
    orderManagement.resetOrderState();
    setErrors({});
    setProfileErrors({});
  }, [orderManagement, resetProfiles, setActiveStep]);

  return {
    // Mode & Steps
    mode,
    isFastTrack,
    activeStep,
    steps,
    isFirstStep,
    isLastStep,

    // Service Profiles
    serviceProfiles,
    resolvedProfiles,
    addProfile,
    removeProfile,
    updateProfile,
    handleRegionChange,
    handleAvailabilityZoneChange,
    handleTierChange,
    handleMonthsChange,
    handleStorageGbChange,
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
    selectedCurrency,
    isCountryLocked,
    setFormData,
    setBillingCountry,
    setIsCountryLocked,

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
    summaryCurrency,
    grandTotalWithFees,
    hasCurrencyMismatch,

    // Order State
    lastOrderSummary,
    orderId: orderManagement.orderId != null ? String(orderManagement.orderId) : null,
    transactionId:
      orderManagement.transactionId != null ? String(orderManagement.transactionId) : null,
    accountIds: orderManagement.accountIds,
    paymentRequired: orderManagement.paymentRequired,
    paymentTransactionData: orderManagement.paymentTransactionData,
    paymentOptions: orderManagement.paymentOptions,
    selectedPaymentOption,
    setSelectedPaymentOption,
    isPaymentComplete: orderManagement.isPaymentComplete,
    isPaymentFailed: orderManagement.isPaymentFailed,
    transactionStatus: orderManagement.transactionStatus,

    // Loading States
    isRegionsLoading,
    isCountriesLoading,
    isPricingLoading,
    isTenantsFetching,
    isUsersFetching,
    isSubmitting: orderManagement.isSubmitting,
    isGeneratingPayment: orderManagement.isGeneratingPayment,

    // Handlers
    handleModeChange,
    goToStep,
    handleNextStep,
    handlePreviousStep,
    validateWorkflowStep,
    validateServiceStep,
    createOrder: orderManagement.createOrder,
    handlePaymentCompleted: orderManagement.handlePaymentCompleted,
    resetOrderState: orderManagement.resetOrderState,
    submitOrder: orderManagement.submitOrder,
    resetForm,

    // Context info
    dashboardContext: context,
  };
};
