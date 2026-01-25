import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

// Utilities
import {
  Option,
  ServiceProfile,
  createServiceProfile,
  getRegionCode,
  makeTierKey,
  buildTierLabel,
  resolveTierQuota,
  formatCountryOptions,
  formatRegionOptions,
  resolveCountryCodeFromEntity,
  GLOBAL_TIER_KEY,
  COUNTRY_FALLBACK,
} from "./objectStorageUtils";

// Form state and pricing hooks
import { useObjectStorageFormState } from "./useObjectStorageFormState";
import { useObjectStoragePricing, ResolvedProfile, SummaryTotals } from "./useObjectStoragePricing";
import { normalizePaymentOptions } from "../utils/instanceCreationUtils";

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
  allowFastTrack?: boolean;
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
  handleStorageGbChange: (id: string, storageGb: string) => void;
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
  orderId?: string | null;
  transactionId?: string | null;
  accountIds: string[];
  paymentRequired: boolean | null;
  paymentTransactionData: any;
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
  createOrder: (options?: { fastTrackOverride?: boolean }) => Promise<any | null>;
  handlePaymentCompleted: (payload?: any) => void;
  resetOrderState: () => void;
  submitOrder: (event?: any, fastTrackOverride?: boolean, options?: any) => Promise<any | null>;
  resetForm: () => void;

  // Context info
  dashboardContext: ObjectStorageContext;
}

const isValidUuid = (value: string) => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

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
    label: "Review & provision",
    description: "Validate totals and confirm provisioning.",
  },
  {
    id: "success",
    label: "Success",
    description: "Provisioning has started.",
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
    label: "Review & provision",
    description: "Validate totals and confirm provisioning.",
  },
  {
    id: "success",
    label: "Success",
    description: "Provisioning has started.",
  },
];

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

  const [searchParams, setSearchParams] = useSearchParams();

  // Mode and Steps
  const canFastTrack = allowFastTrack !== false;
  const initialMode =
    searchParams.get("mode") === "fast-track" && canFastTrack ? "fast-track" : "standard";
  const [mode, setMode] = useState(initialMode);
  const isFastTrack = canFastTrack && mode === "fast-track";
  const [activeStep, setActiveStep] = useState(0);

  const steps = useMemo(
    () => (isFastTrack ? BASE_STEPS_FAST_TRACK : BASE_STEPS_STANDARD),
    [isFastTrack]
  );

  useEffect(() => {
    setActiveStep((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  useEffect(() => {
    if (canFastTrack || mode !== "fast-track") return;
    setMode("standard");
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("mode");
      return params;
    });
  }, [canFastTrack, mode, setSearchParams]);

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
    handleMonthsChange,
    handleStorageGbChange,
    handleNameChange,
    handleUnitPriceChange,
    resetProfiles,
  } = formState;

  // Customer Context - admin uses shared hook, tenant/client use local state
  const isAdminContext = context === "admin";
  const adminContext = useCustomerContext({ enabled: isAdminContext });

  const defaultContextType =
    context === "tenant" ? "tenant" : context === "client" ? "user" : "unassigned";

  const [localContextType, setLocalContextType] = useState(defaultContextType);
  const [localTenantId, setLocalTenantId] = useState(configTenantId || "");
  const [localUserId, setLocalUserId] = useState(configUserId || "");

  useEffect(() => {
    if (!isAdminContext) {
      setLocalContextType(defaultContextType);
    }
  }, [defaultContextType, isAdminContext]);

  useEffect(() => {
    if (!isAdminContext) {
      setLocalTenantId(configTenantId || "");
    }
  }, [configTenantId, isAdminContext]);

  useEffect(() => {
    if (!isAdminContext) {
      setLocalUserId(configUserId || "");
    }
  }, [configUserId, isAdminContext]);

  const contextType = isAdminContext ? adminContext.contextType : localContextType;
  const setContextType = isAdminContext ? adminContext.setContextType : setLocalContextType;

  const selectedTenantId = isAdminContext
    ? configTenantId || adminContext.selectedTenantId
    : localTenantId;
  const setSelectedTenantId = isAdminContext ? adminContext.setSelectedTenantId : setLocalTenantId;

  const selectedUserId = isAdminContext ? configUserId || adminContext.selectedUserId : localUserId;
  const setSelectedUserId = isAdminContext ? adminContext.setSelectedUserId : setLocalUserId;

  const tenants = isAdminContext ? adminContext.tenants : [];
  const isTenantsFetching = isAdminContext ? adminContext.isTenantsFetching : false;
  const userPool = isAdminContext ? adminContext.userPool : [];
  const isUsersFetching = isAdminContext ? adminContext.isUsersFetching : false;

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

  const orderId = useMemo(() => {
    return (
      lastOrderSummary?.order?.identifier ||
      lastOrderSummary?.order?.id ||
      lastOrderSummary?.order_id ||
      null
    );
  }, [lastOrderSummary]);

  const transactionId = useMemo(() => {
    return (
      lastOrderSummary?.transaction?.identifier ||
      lastOrderSummary?.transaction?.reference ||
      lastOrderSummary?.transaction?.id ||
      null
    );
  }, [lastOrderSummary]);

  const accountIds = useMemo(() => {
    const ids = new Set<string>();
    const add = (value: any) => {
      if (value === null || value === undefined || value === "") return;
      ids.add(String(value));
    };

    add(lastOrderSummary?.account?.id);
    add(lastOrderSummary?.object_storage_account_id);
    if (Array.isArray(lastOrderSummary?.accounts)) {
      lastOrderSummary.accounts.forEach((account: any) => add(account?.id));
    }
    const orderItems = lastOrderSummary?.order_items || lastOrderSummary?.order?.items || [];
    if (Array.isArray(orderItems)) {
      orderItems.forEach((item: any) => add(item?.account_id || item?.account?.id));
    }

    return Array.from(ids);
  }, [lastOrderSummary]);

  // Payment Status
  const paymentOptions = useMemo(() => {
    const raw =
      lastOrderSummary?.payment?.payment_gateway_options ||
      lastOrderSummary?.transaction?.payment_gateway_options ||
      lastOrderSummary?.paymentOptions ||
      [];
    return normalizePaymentOptions(raw);
  }, [lastOrderSummary]);

  const paymentRequired =
    typeof lastOrderSummary?.payment?.required === "boolean"
      ? lastOrderSummary.payment.required
      : null;

  const transactionStatus = (
    lastOrderSummary?.transaction?.status ||
    lastOrderSummary?.payment?.status ||
    ""
  ).toLowerCase();

  const isPaymentComplete =
    Boolean(lastOrderSummary) &&
    (paymentRequired === false ||
      transactionStatus === "successful" ||
      transactionStatus === "completed" ||
      transactionStatus === "paid" ||
      transactionStatus === "success" ||
      transactionStatus === "approved");
  const isPaymentFailed = Boolean(lastOrderSummary) && transactionStatus === "failed";

  const paymentTransactionData = useMemo(() => {
    if (!lastOrderSummary?.transaction && !lastOrderSummary?.payment) return null;
    return {
      data: {
        transaction: lastOrderSummary?.transaction || null,
        order: {
          ...(lastOrderSummary?.order || {}),
          type: "object_storage",
          items: lastOrderSummary?.order_items || lastOrderSummary?.order?.items || [],
          storage_profiles: lastOrderSummary?.serviceProfiles || [],
        },
        instances: [],
        accounts: lastOrderSummary?.accounts || [],
        order_items: lastOrderSummary?.order_items || [],
        payment: lastOrderSummary?.payment || null,
      },
    };
  }, [lastOrderSummary]);

  useEffect(() => {
    if (!paymentOptions.length) {
      if (selectedPaymentOption) {
        setSelectedPaymentOption(null);
      }
      return;
    }

    if (
      selectedPaymentOption &&
      paymentOptions.some(
        (option: any) =>
          option?.transaction_reference === selectedPaymentOption?.transaction_reference ||
          option?.reference === selectedPaymentOption?.reference
      )
    ) {
      return;
    }

    setSelectedPaymentOption(paymentOptions[0] || null);
  }, [paymentOptions, selectedPaymentOption]);

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
  const resetOrderState = useCallback(() => {
    setLastOrderSummary(null);
    setSelectedPaymentOption(null);
    setIsGeneratingPayment(false);
  }, []);

  const handleModeChange = useCallback(
    (nextMode: string) => {
      if (!canFastTrack && nextMode === "fast-track") return;
      if (nextMode === mode) return;
      resetOrderState();
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
    [mode, resetOrderState, setSearchParams]
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
  }, [activeStep, steps.length, validateWorkflowStep, validateServiceStep]);

  const handlePreviousStep = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  }, [activeStep]);

  const normalizeOrderSummary = useCallback(
    (payload: any, fastTrackFlag?: boolean) => {
      if (!payload) return null;
      const data = payload?.data || payload;
      const transaction = data?.transaction || null;
      const order = data?.order || null;
      const payment = data?.payment || null;
      const normalizedPaymentOptions = normalizePaymentOptions(
        payment?.payment_gateway_options ||
          transaction?.payment_gateway_options ||
          data?.payment_options ||
          data?.paymentOptions
      );
      const paymentState = payment
        ? { ...payment, payment_gateway_options: normalizedPaymentOptions }
        : normalizedPaymentOptions.length
          ? { payment_gateway_options: normalizedPaymentOptions }
          : null;

      return {
        transaction,
        order,
        payment: paymentState,
        paymentOptions: normalizedPaymentOptions,
        fastTrack:
          typeof fastTrackFlag === "boolean"
            ? fastTrackFlag
            : (data?.fast_track ?? data?.fastTrack ?? isFastTrack),
        serviceProfiles: resolvedProfiles,
        order_items: data?.order_items || order?.items || [],
        accounts: data?.accounts || (data?.account ? [data.account] : []),
        account: data?.account || null,
        object_storage_account_id: data?.object_storage_account_id,
      };
    },
    [isFastTrack, resolvedProfiles]
  );

  // Submit Order (placeholder - actual implementation depends on API)
  const submitOrder = useCallback(
    async (event?: any, fastTrackOverride?: boolean, _options: any = {}) => {
      event?.preventDefault();
      setIsSubmitting(true);

      try {
        const fastTrackFlag =
          typeof fastTrackOverride === "boolean" ? fastTrackOverride : isFastTrack;
        const objectStorageItems = resolvedProfiles.map((profile, index) => {
          const tierRow = profile.tierRow || profile.tierData;
          const rawProductableId =
            tierRow?.productable_id ??
            tierRow?.product_id ??
            tierRow?.id ??
            tierRow?.product?.productable_id ??
            tierRow?.product?.id ??
            profile.tierKey?.split("::")[1];
          const parsedProductableId = Number.parseInt(String(rawProductableId ?? ""), 10);
          if (!Number.isFinite(parsedProductableId)) {
            throw new Error(
              "Unable to resolve the selected Silo Storage tier. Please refresh pricing and try again."
            );
          }
          const baseName = (profile.name || profile.tierName || "").trim();
          const name =
            baseName.length >= 3 ? baseName : `Silo Storage ${profile.region || "region"}`.trim();

          return {
            region: profile.region,
            productable_id: parsedProductableId,
            storage_gb: Number(profile.storageGb) || 0,
            quantity: Number(profile.quantity) || 1,
            months: Number(profile.months) || 1,
            name,
            metadata: {
              ui_profile_id: profile.id,
              tier_key: profile.tierKey,
              tier_name: profile.tierName,
              currency: profile.currency,
              unit_price: profile.unitPrice,
              subtotal: profile.subtotal,
              storage_gb: profile.storageGb,
              line_index: index,
            },
          };
        });

        if (!objectStorageItems.length) {
          throw new Error("Add at least one eligible service profile before submitting.");
        }

        const payload: Record<string, any> = {
          object_storage_items: objectStorageItems,
          fast_track: fastTrackFlag,
        };

        const countryIso = effectiveCountryCode?.toUpperCase();
        if (countryIso) {
          payload.country_iso = countryIso;
        }
        if (selectedTenantId) {
          payload.tenant_id = selectedTenantId;
        }
        const normalizedUserId =
          typeof selectedUserId === "string" ? selectedUserId.trim() : String(selectedUserId || "");
        if (context !== "client" && isValidUuid(normalizedUserId)) {
          payload.user_id = normalizedUserId;
        }

        // Use provided submit function or throw error
        if (submitOrderFn) {
          const result = await submitOrderFn(payload);
          const normalized = normalizeOrderSummary(result, fastTrackOverride);
          if (normalized) {
            setLastOrderSummary(normalized);
          }
          return normalized;
        } else {
          console.warn("No submitOrderFn provided - order not submitted");
        }
      } catch (error) {
        console.error("Order submission failed:", error);
        return null;
      } finally {
        setIsSubmitting(false);
      }
      return null;
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
      normalizeOrderSummary,
    ]
  );

  const createOrder = useCallback(
    async (options: { fastTrackOverride?: boolean } = {}) => {
      setIsGeneratingPayment(true);
      try {
        return await submitOrder(undefined, options.fastTrackOverride, { skipReset: true });
      } finally {
        setIsGeneratingPayment(false);
      }
    },
    [submitOrder]
  );

  const handlePaymentCompleted = useCallback((payload: any = {}) => {
    const rawStatus = payload?.status || payload?.transaction_status || "successful";
    const normalizedStatus = String(rawStatus).toLowerCase();
    setLastOrderSummary((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        transaction: {
          ...(prev.transaction || {}),
          status: normalizedStatus,
          payment_reference: payload?.reference || prev.transaction?.payment_reference,
        },
        payment: {
          ...(prev.payment || {}),
          status: normalizedStatus,
          required: prev.payment?.required ?? false,
          gateway: payload?.gateway || prev.payment?.gateway,
        },
      };
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ countryCode: "US" });
    resetProfiles();
    setActiveStep(0);
    resetOrderState();
    setErrors({});
    setProfileErrors({});
  }, [resetOrderState, resetProfiles]);

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
    orderId,
    transactionId,
    accountIds,
    paymentRequired,
    paymentTransactionData,
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
    createOrder,
    handlePaymentCompleted,
    resetOrderState,
    submitOrder,
    resetForm,

    // Context info
    dashboardContext: context,
  };
};
