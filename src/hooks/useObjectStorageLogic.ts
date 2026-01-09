import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Utilities
import {
  Option,
  ServiceProfile,
  createServiceProfile,
  getRegionCode,
  makeTierKey,
  buildTierLabel,
  resolveTierUnitPrice,
  resolveTierCurrency,
  formatCountryOptions,
  formatRegionOptions,
  resolveCountryCodeFromEntity,
  GLOBAL_TIER_KEY,
  COUNTRY_FALLBACK,
} from "./objectStorageUtils";

// Form state and pricing hooks
import { useObjectStorageFormState } from "./useObjectStorageFormState";
import { useObjectStoragePricing, ResolvedProfile, SummaryTotals } from "./useObjectStoragePricing";

// Shared hooks
import { useFetchCountries, useFetchProductPricing } from "./resource";

// Context-specific hooks - these will be passed or resolved based on context
import { useCustomerContext } from "./adminHooks/useCustomerContext";
import { useFetchRegions } from "./adminHooks/regionHooks";

// Types
export type ObjectStorageContext = "admin" | "tenant" | "client";

export interface ObjectStorageLogicConfig {
  context?: ObjectStorageContext;
  tenantId?: string;
  userId?: string;
  // API overrides - allow passing custom hooks/functions for different contexts
  useRegionsHook?: () => { data: any[]; isFetching: boolean };
  useCountriesHook?: () => { data: any[]; isFetching: boolean };
  usePricingHook?: (
    region: string,
    productType: string,
    options: any
  ) => { data: any[]; isFetching: boolean };
  submitOrderFn?: (payload: any) => Promise<any>;
}

export interface ObjectStorageLogicReturn {
  // Mode & Steps
  mode: string;
  isFastTrack: boolean;
  activeStep: number;
  steps: { id: string; label: string; description: string }[];
  isFirstStep: boolean;
  isLastStep: boolean;

  // Service Profiles
  serviceProfiles: ServiceProfile[];
  resolvedProfiles: ResolvedProfile[];
  addProfile: () => void;
  removeProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<ServiceProfile>) => void;
  handleRegionChange: (id: string, region: string) => void;
  handleTierChange: (id: string, tierKey: string) => void;
  handleMonthsChange: (id: string, months: string) => void;
  handleNameChange: (id: string, name: string) => void;
  handleUnitPriceChange: (id: string, unitPrice: string) => void;

  // Options
  regionOptions: Option[];
  countryOptions: Option[];
  tenantOptions: Option[];
  clientOptions: Option[];

  // Form Data
  formData: { countryCode: string };
  selectedCountryCode: string;
  selectedCurrency: string;
  isCountryLocked: boolean;
  setFormData: React.Dispatch<React.SetStateAction<{ countryCode: string }>>;
  setBillingCountry: (code: string) => void;
  setIsCountryLocked: (locked: boolean) => void;

  // Customer Context
  contextType: string;
  setContextType: (type: string) => void;
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  assignmentLabel: string;

  // Pricing
  summaryTotals: SummaryTotals;
  displayedTotals: SummaryTotals;
  summaryCurrency: string;
  grandTotalWithFees: number;
  hasCurrencyMismatch: boolean;

  // Order State
  lastOrderSummary: any;
  paymentOptions: any[];
  selectedPaymentOption: any;
  setSelectedPaymentOption: (option: any) => void;
  isPaymentComplete: boolean;
  isPaymentFailed: boolean;
  transactionStatus: string;

  // Loading States
  isRegionsLoading: boolean;
  isCountriesLoading: boolean;
  isPricingLoading: boolean;
  isTenantsFetching: boolean;
  isUsersFetching: boolean;
  isSubmitting: boolean;
  isGeneratingPayment: boolean;

  // Handlers
  handleModeChange: (mode: string) => void;
  goToStep: (step: number) => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  validateWorkflowStep: () => boolean;
  validateServiceStep: () => boolean;
  submitOrder: (event?: any, fastTrackOverride?: boolean, options?: any) => Promise<void>;
  resetForm: () => void;

  // Context info
  dashboardContext: ObjectStorageContext;
}

const BASE_STEPS_FAST_TRACK = [
  {
    id: "workflow",
    label: "Workflow & assignment",
    description: "Choose billing path and who owns this request.",
  },
  {
    id: "services",
    label: "Service profiles",
    description: "Select regions, tiers, and contract length.",
  },
  {
    id: "review",
    label: "Review & submit",
    description: "Validate totals and confirm provisioning.",
  },
];

const BASE_STEPS_STANDARD = [
  {
    id: "workflow",
    label: "Workflow & assignment",
    description: "Choose billing path and who owns this request.",
  },
  {
    id: "services",
    label: "Service profiles",
    description: "Select regions, tiers, and contract length.",
  },
  {
    id: "payment",
    label: "Payment",
    description: "Generate payment options and share with finance.",
  },
  {
    id: "review",
    label: "Review & submit",
    description: "Validate totals and confirm provisioning.",
  },
];

export const useObjectStorageLogic = (
  config: ObjectStorageLogicConfig = {}
): ObjectStorageLogicReturn => {
  const {
    context = "admin",
    tenantId: configTenantId,
    userId: configUserId,
    useRegionsHook,
    useCountriesHook,
    usePricingHook,
    submitOrderFn,
  } = config;

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode and Steps
  const initialMode = searchParams.get("mode") === "fast-track" ? "fast-track" : "standard";
  const [mode, setMode] = useState(initialMode);
  const isFastTrack = mode === "fast-track";
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => (isFastTrack ? BASE_STEPS_FAST_TRACK : BASE_STEPS_STANDARD),
    [isFastTrack]
  );

  useEffect(() => {
    setActiveStep((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;

  // Form Data State
  const [formData, setFormData] = useState({ countryCode: "US" });
  const [isCountryLocked, setIsCountryLocked] = useState(false);

  // Service Profiles (using extracted hook)
  const formState = useObjectStorageFormState();
  const {
    serviceProfiles,
    addProfile,
    removeProfile,
    updateProfile,
    handleRegionChange,
    handleTierChange,
    handleMonthsChange,
    handleNameChange,
    handleUnitPriceChange,
    resetProfiles,
  } = formState;

  // Customer Context - use provided context or default admin hook
  const customerContext = useCustomerContext();
  const {
    contextType,
    setContextType,
    selectedTenantId: hookTenantId,
    setSelectedTenantId,
    selectedUserId: hookUserId,
    setSelectedUserId,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
  } = customerContext;

  // Use config overrides for tenant/user if provided
  const selectedTenantId = configTenantId || hookTenantId;
  const selectedUserId = configUserId || hookUserId;

  // Order State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [lastOrderSummary, setLastOrderSummary] = useState<any>(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<any>(null);

  // API Hooks - use provided hooks or defaults
  const defaultRegionsHook = useFetchRegions;
  const regionsHook = useRegionsHook || defaultRegionsHook;
  const { data: regions = [], isFetching: isRegionsLoading } = regionsHook();

  const defaultCountriesHook = useFetchCountries;
  const countriesHook = useCountriesHook || defaultCountriesHook;
  const { data: sharedCountries = [], isFetching: isCountriesLoading } = countriesHook();

  // Derived Values
  const selectedCountryCode = useMemo(
    () => (formData.countryCode || "").toUpperCase(),
    [formData.countryCode]
  );

  const resolveCurrencyForCountry = useMemo(() => {
    return (code: string) => {
      if (!code || !Array.isArray(sharedCountries)) {
        return "USD";
      }
      const match = sharedCountries.find((country: any) => {
        const iso = (country.code || country.iso2 || country.country_code || "").toUpperCase();
        return iso === code.toUpperCase();
      });
      return (
        match?.currency_code ||
        match?.currency ||
        match?.currencyCode ||
        match?.currency_symbol ||
        match?.currencySymbol ||
        "USD"
      ).toUpperCase();
    };
  }, [sharedCountries]);

  const selectedCurrency = useMemo(
    () => resolveCurrencyForCountry(selectedCountryCode),
    [resolveCurrencyForCountry, selectedCountryCode]
  );

  const effectiveCountryCode = selectedCountryCode || "US";
  const primaryRegion = useMemo(() => (serviceProfiles[0]?.region || "").trim(), [serviceProfiles]);

  // Pricing Hook
  const defaultPricingHook = useFetchProductPricing;
  const pricingHook = usePricingHook || defaultPricingHook;
  const { data: tierPricingPayload = [], isFetching: isPricingLoading } = pricingHook(
    primaryRegion,
    "object_storage_configuration",
    { enabled: Boolean(primaryRegion), countryCode: effectiveCountryCode }
  );

  // Region Map
  const regionMap = useMemo(() => {
    const map = new Map<string, any>();
    (Array.isArray(regions) ? regions : []).forEach((region: any) => {
      const code = getRegionCode(region);
      if (code) {
        map.set(code.toLowerCase(), region);
      }
    });
    return map;
  }, [regions]);

  // Region Options
  const regionOptions = useMemo(() => formatRegionOptions(regions), [regions]);

  // Country Options
  const countryOptions = useMemo(() => formatCountryOptions(sharedCountries), [sharedCountries]);

  // Tier Catalog
  const tierCatalog = useMemo(() => {
    const rawRows = Array.isArray(tierPricingPayload) ? tierPricingPayload : [];
    const catalog = new Map<string, { options: Option[]; map: Map<string, any> }>();

    rawRows.forEach((row: any) => {
      const product = row?.product || {};
      const effectivePricing = row?.pricing?.effective || {};
      const regionCodeRaw = product.region || row?.region || product.region_code || GLOBAL_TIER_KEY;
      const regionKey = regionCodeRaw?.toString().toLowerCase().trim() || GLOBAL_TIER_KEY;
      const key = makeTierKey(regionKey, {
        productable_type: product.productable_type,
        productable_id: product.productable_id,
      });

      const ensureBucket = (bucketKey: string) => {
        if (!catalog.has(bucketKey)) {
          catalog.set(bucketKey, {
            options: [],
            map: new Map(),
          });
        }
        return catalog.get(bucketKey)!;
      };

      const currency = effectivePricing.currency || selectedCurrency || "USD";
      const composite = {
        ...effectivePricing,
        currency,
        product,
        product_name: product.name || row?.product_name,
        productable_id: product.productable_id || row?.productable_id,
        productable_type: product.productable_type || row?.productable_type,
        region: regionCodeRaw || "",
        quota_gb: product.object_storage?.quota_gb || product.quota_gb || product.quota || null,
      };

      const label = buildTierLabel(composite, null, selectedCurrency || "USD");
      const regionBucket = ensureBucket(regionKey);
      regionBucket.options.push({ value: key, label });
      regionBucket.map.set(key, composite);

      const globalBucket = ensureBucket(GLOBAL_TIER_KEY);
      const globalKey = makeTierKey(GLOBAL_TIER_KEY, composite);
      globalBucket.options.push({ value: globalKey, label });
      globalBucket.map.set(globalKey, composite);
    });

    return catalog;
  }, [tierPricingPayload, selectedCurrency]);

  // Pricing calculations
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

  // Tenant/Client Options
  const tenantOptions = useMemo(() => {
    if (!Array.isArray(tenants)) return [];
    return tenants
      .map((tenant: any) => {
        const value = tenant.id ?? tenant.identifier ?? tenant.code ?? tenant.slug ?? "";
        if (value === null || value === undefined || value === "") {
          return null;
        }
        return {
          value: String(value),
          label:
            tenant.name ||
            tenant.company_name ||
            tenant.identifier ||
            tenant.code ||
            `Tenant ${tenant.id}`,
          raw: tenant,
        };
      })
      .filter(Boolean) as Option[];
  }, [tenants]);

  const clientOptions = useMemo(() => {
    if (!Array.isArray(userPool)) return [];
    return userPool
      .map((client: any) => {
        const tenantId =
          client.tenant_id ??
          client.tenantId ??
          client.tenant?.id ??
          client.tenant_identifier ??
          client.tenant_code ??
          "";
        const rawClientId = client.id ?? client.identifier ?? client.uuid ?? "";
        if (rawClientId === null || rawClientId === undefined || rawClientId === "") {
          return null;
        }
        return {
          value: String(rawClientId),
          label:
            client.company_name ||
            client.business_name ||
            client.full_name ||
            client.email ||
            `Client ${client.id}`,
          tenantId: tenantId ? String(tenantId) : "",
          raw: client,
        };
      })
      .filter(Boolean) as Option[];
  }, [userPool]);

  // Assignment Label
  const assignmentLabel = useMemo(() => {
    if (contextType === "tenant") {
      const match = tenantOptions.find((t) => t.value === String(selectedTenantId));
      return match?.label || "Tenant order";
    }
    if (contextType === "user") {
      const match = clientOptions.find((c) => c.value === String(selectedUserId));
      return match?.label || "Client order";
    }
    return "Internal order";
  }, [contextType, selectedTenantId, selectedUserId, tenantOptions, clientOptions]);

  // Payment Status
  const paymentOptions =
    lastOrderSummary?.payment?.payment_gateway_options ||
    lastOrderSummary?.transaction?.payment_gateway_options ||
    lastOrderSummary?.paymentOptions?.payment_gateway_options ||
    [];

  const transactionStatus = (lastOrderSummary?.transaction?.status || "").toLowerCase();
  const isPaymentComplete =
    transactionStatus === "successful" ||
    transactionStatus === "completed" ||
    transactionStatus === "paid";
  const isPaymentFailed = transactionStatus === "failed";

  // Country auto-lock based on tenant/user selection
  useEffect(() => {
    if (context !== "admin") {
      // For tenant/client contexts, country is usually locked
      return;
    }

    if (contextType === "tenant" && selectedTenantId) {
      const tenantEntry = tenantOptions.find((t) => t.value === String(selectedTenantId));
      const tenantCountry = resolveCountryCodeFromEntity(tenantEntry?.raw, countryOptions);
      if (tenantCountry) {
        setIsCountryLocked(true);
        setFormData((prev) => ({ ...prev, countryCode: tenantCountry }));
      } else {
        setIsCountryLocked(false);
      }
    } else if (contextType === "user" && selectedUserId) {
      const clientEntry = clientOptions.find((c) => c.value === String(selectedUserId));
      const clientCountry = resolveCountryCodeFromEntity(clientEntry?.raw, countryOptions);
      if (clientCountry) {
        setIsCountryLocked(true);
        setFormData((prev) => ({ ...prev, countryCode: clientCountry }));
      } else {
        setIsCountryLocked(false);
      }
    } else {
      setIsCountryLocked(false);
    }
  }, [
    context,
    contextType,
    selectedTenantId,
    selectedUserId,
    tenantOptions,
    clientOptions,
    countryOptions,
  ]);

  // Handlers
  const handleModeChange = useCallback(
    (nextMode: string) => {
      if (nextMode === mode) return;
      setMode(nextMode);
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (nextMode === "fast-track") {
          params.set("mode", "fast-track");
        } else {
          params.delete("mode");
        }
        return params;
      });
    },
    [mode, setSearchParams]
  );

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setActiveStep(stepIndex);
      }
    },
    [steps.length]
  );

  const setBillingCountry = useCallback((code: string) => {
    setFormData((prev) => ({ ...prev, countryCode: code }));
  }, []);

  // Validation
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
  }, [activeStep, steps.length, validateWorkflowStep, validateServiceStep]);

  const handlePreviousStep = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  }, [activeStep]);

  // Submit Order (placeholder - actual implementation depends on API)
  const submitOrder = useCallback(
    async (event?: any, fastTrackOverride?: boolean, options: any = {}) => {
      event?.preventDefault();
      setIsSubmitting(true);

      try {
        // Build payload
        const payload = {
          country_code: effectiveCountryCode,
          currency: selectedCurrency,
          is_fast_track: fastTrackOverride ?? isFastTrack,
          context_type: contextType,
          tenant_id: selectedTenantId || null,
          user_id: selectedUserId || null,
          profiles: resolvedProfiles.map((profile) => ({
            name: profile.name || profile.tierName,
            region: profile.region,
            tier_key: profile.tierKey,
            months: profile.months,
            unit_price: profile.unitPrice,
            quantity: profile.quantity,
          })),
        };

        // Use provided submit function or throw error
        if (submitOrderFn) {
          const result = await submitOrderFn(payload);
          setLastOrderSummary(result);
        } else {
          console.warn("No submitOrderFn provided - order not submitted");
        }
      } catch (error) {
        console.error("Order submission failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      effectiveCountryCode,
      selectedCurrency,
      isFastTrack,
      contextType,
      selectedTenantId,
      selectedUserId,
      resolvedProfiles,
      submitOrderFn,
    ]
  );

  const resetForm = useCallback(() => {
    setFormData({ countryCode: "US" });
    resetProfiles();
    setActiveStep(0);
    setLastOrderSummary(null);
    setSelectedPaymentOption(null);
    setErrors({});
    setProfileErrors({});
  }, [resetProfiles]);

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
    isGeneratingPayment,

    // Handlers
    handleModeChange,
    goToStep,
    handleNextStep,
    handlePreviousStep,
    validateWorkflowStep,
    validateServiceStep,
    submitOrder,
    resetForm,

    // Context info
    dashboardContext: context,
  };
};
