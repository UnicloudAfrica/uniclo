import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AdditionalVolume, Option } from "../types/InstanceConfiguration";
import { useInstanceFormState } from "./useInstanceCreation";
import { useFetchCountries, useFetchGeneralRegions } from "./resource";
import useTenantAuthStore from "../stores/tenantAuthStore";
import config from "../config";
import tenantApi from "../index/tenant/tenantApi";
import silentTenantApi from "../index/tenant/silentTenant";
import silentApi from "../index/silent";
import ToastUtils from "../utils/toastUtil";
import {
  evaluateConfigurationCompleteness,
  normalizePaymentOptions,
} from "../utils/instanceCreationUtils";
import { useTenantCustomerContext } from "./tenantHooks/useTenantCustomerContext";
import { buildProvisioningSteps } from "../shared/components/instance-wizard/provisioningSteps";
import { resolveCountryCodeFromEntity } from "./objectStorageUtils";

// ═══════════════════════════════════════════════════════════════════
// TENANT INSTANCE CREATION LOGIC HOOK
// ═══════════════════════════════════════════════════════════════════

export const useTenantProvisioningLogic = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ─────────────────────────────────────────────────────────────────
  // Auth & Config
  // ─────────────────────────────────────────────────────────────────
  const isAuthenticated = useTenantAuthStore((state: any) => state.isAuthenticated);
  const profile = useTenantAuthStore((state: any) => state.profile);
  const {
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
    selfTenant,
  } = useTenantCustomerContext();
  const apiBaseUrl = config.tenantURL;

  // ─────────────────────────────────────────────────────────────────
  // Mode Selection (fast-track vs standard)
  // ─────────────────────────────────────────────────────────────────
  const initialMode = searchParams.get("mode") === "fast-track" ? "fast-track" : "standard";
  const [mode, setMode] = useState(initialMode);
  const isFastTrack = mode === "fast-track";

  // ─────────────────────────────────────────────────────────────────
  // Steps Configuration (varies by mode)
  // ─────────────────────────────────────────────────────────────────
  const steps = useMemo(
    () => buildProvisioningSteps(isFastTrack ? "fast-track" : "standard"),
    [isFastTrack]
  );

  const [activeStep, setActiveStep] = useState(0);

  // Ensure activeStep stays within bounds when mode changes
  useEffect(() => {
    setActiveStep((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  // ─────────────────────────────────────────────────────────────────
  // Form State (reuse shared hook)
  // ─────────────────────────────────────────────────────────────────
  const {
    configurations,
    setConfigurations,
    addConfiguration,
    addConfigurationWithPatch,
    resetConfigurationWithPatch,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
  } = useInstanceFormState();

  // ─────────────────────────────────────────────────────────────────
  // Billing Country (from profile or selection)
  // ─────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────
  // Data Fetching and Options
  // ─────────────────────────────────────────────────────────────────
  const { data: countriesData = [], isLoading: isCountriesLoading } = useFetchCountries();

  const countryOptions: Option[] = useMemo(
    () =>
      countriesData.map((c: any) => ({
        value: String(c.iso2 || c.code || c.id),
        label: c.name,
      })),
    [countriesData]
  );

  // ─────────────────────────────────────────────────────────────────
  // Billing Country (from profile or selection)
  // ─────────────────────────────────────────────────────────────────
  const [billingCountry, setBillingCountry] = useState<string>("");
  const [isCountryLocked, setIsCountryLocked] = useState(false);

  // Auto-set billing country from profile or context
  useEffect(() => {
    let candidate = "";

    // 1. Resolve based on context selection (if acting as a Partner/Reseller)
    if (contextType === "tenant" && selectedTenantId) {
      const selected = tenants.find((t: any) => String(t.id) === String(selectedTenantId));
      candidate = resolveCountryCodeFromEntity(selected, countryOptions as any);
    } else if (contextType === "user" && selectedUserId) {
      const selected = userPool.find((u: any) => String(u.id) === String(selectedUserId));
      candidate = resolveCountryCodeFromEntity(selected, countryOptions as any);
    }

    // 2. Fallback to self-tenant (Standard Tenant)
    if (!candidate && selfTenant) {
      candidate = resolveCountryCodeFromEntity(selfTenant, countryOptions as any);
    }

    // 3. Fallback to user profile
    if (!candidate && profile) {
      candidate = resolveCountryCodeFromEntity(profile, countryOptions as any);
    }

    if (candidate) {
      setBillingCountry(candidate);
      setIsCountryLocked(true);
    } else {
      // Unlock if no country resolved to allow manual selection
      setIsCountryLocked(false);
    }
  }, [
    contextType,
    selectedTenantId,
    selectedUserId,
    tenants,
    userPool,
    selfTenant,
    profile,
    countryOptions
  ]);

  // Fetch pricing using public catalog (tenant-specific filter when available)
  const [pricingData, setPricingData] = useState<any>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!isAuthenticated || !billingCountry) return;
      setIsPricingLoading(true);
      try {
        const params = new URLSearchParams();
        const normalizedCountry = String(billingCountry || "").trim();
        if (normalizedCountry) {
          params.append("country_code", normalizedCountry.toUpperCase());
        }
        const pricingTenantId = contextType === "tenant" ? selectedTenantId : selfTenant?.id;
        if (pricingTenantId) {
          params.append("tenant_id", String(pricingTenantId));
        }
        const response = (await silentApi("GET", `/product-pricing?${params.toString()}`)) as any;
        setPricingData(response?.data || response || []);
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
        setPricingData([]);
      } finally {
        setIsPricingLoading(false);
      }
    };
    fetchPricing();
  }, [isAuthenticated, billingCountry, contextType, selectedTenantId, selfTenant?.id]);

  const { data: generalRegions = [], isFetching: isRegionsLoading } = useFetchGeneralRegions({
    enabled: isAuthenticated,
  });

  // ─────────────────────────────────────────────────────────────────
  // Fast-Track Region Eligibility
  // ─────────────────────────────────────────────────────────────────
  const fastTrackRegions = useMemo(
    () =>
      generalRegions
        .filter((region: any) => region?.can_fast_track === true)
        .map((region: any) => region?.code || region?.region || region?.slug || region?.id)
        .filter(Boolean),
    [generalRegions]
  );

  const isLoadingFastTrackRegions = isRegionsLoading;
  const hasFastTrackAccess = fastTrackRegions.length > 0;

  // ─────────────────────────────────────────────────────────────────
  // Build Options
  // ─────────────────────────────────────────────────────────────────


  const regionOptions: Option[] = useMemo(() => {
    const allRegions = generalRegions.map((r: any) => {
      const value = r.code || r.region || r.id || r.slug;
      return {
        value,
        label: r.label || r.name || r.region || r.code,
        canFastTrack: fastTrackRegions.includes(value),
      };
    });

    // If in fast-track mode, only show eligible regions
    if (isFastTrack) {
      return allRegions.filter((r: any) => r.canFastTrack);
    }
    return allRegions;
  }, [generalRegions, fastTrackRegions, isFastTrack]);

  const assignmentScopeForContext = useMemo(() => {
    if (contextType === "tenant") return "tenant";
    if (contextType === "user") return "client";
    return "internal";
  }, [contextType]);

  useEffect(() => {
    if (!Array.isArray(configurations) || configurations.length === 0) return;
    configurations.forEach((cfg) => {
      const currentScope = cfg.assignment_scope || "internal";
      if (currentScope !== assignmentScopeForContext) {
        updateConfiguration(cfg.id, {
          assignment_scope: assignmentScopeForContext,
          member_user_ids: [],
        });
      }
    });
  }, [assignmentScopeForContext, configurations, updateConfiguration]);

  // All regions for display purposes (even when filtering)
  const allRegionOptions: Option[] = useMemo(
    () =>
      generalRegions.map((r: any): Option & { canFastTrack: boolean } => {
        const value = r.code || r.region || r.id || r.slug;
        return {
          value,
          label: r.label || r.name || r.region || r.code,
          canFastTrack: fastTrackRegions.includes(value),
        };
      }),
    [generalRegions, fastTrackRegions]
  );

  // ─────────────────────────────────────────────────────────────────
  // Resources object for ConfigurationListStep
  // ─────────────────────────────────────────────────────────────────
  const resources = useMemo(
    () => ({
      pricing: pricingData,
      projects: [],
      securityGroups: [],
      keyPairs: [],
      networks: [],
      subnets: [],
      // Required fields for InstanceResources type
      regions: generalRegions,
      instance_types: pricingData?.instance_types || [],
      os_images: pricingData?.os_images || [],
      volume_types: pricingData?.volume_types || [],
      bandwidths: pricingData?.bandwidths || [],
      floating_ips: pricingData?.floating_ips || [],
      volumes: pricingData?.volumes || [],
    }),
    [pricingData, generalRegions]
  );

  const isLoadingResources = isPricingLoading || isRegionsLoading || isLoadingFastTrackRegions;

  // ─────────────────────────────────────────────────────────────────
  // Mode Change Handler
  // ─────────────────────────────────────────────────────────────────
  const handleModeChange = useCallback(
    (newMode: string) => {
      setMode(newMode);
      setSearchParams({ mode: newMode });
      // Reset configurations when switching modes to avoid invalid region selections
      if (newMode === "fast-track") {
        // Clear any configurations with non-fast-track regions
        const validConfigs = configurations.filter((cfg) =>
          fastTrackRegions.includes(cfg.region || "")
        );
        if (validConfigs.length !== configurations.length) {
          setConfigurations(validConfigs.length > 0 ? validConfigs : []);
        }
      }
    },
    [configurations, fastTrackRegions, setConfigurations, setSearchParams]
  );

  // ─────────────────────────────────────────────────────────────────
  // Order Creation & Submission
  // ─────────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [orderReceipt, setOrderReceipt] = useState<any>(null);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const paymentStepIndex = useMemo(() => steps.findIndex((step) => step.id === "payment"), [steps]);
  const reviewStepIndex = useMemo(() => steps.findIndex((step) => step.id === "review"), [steps]);

  const handleCreateOrder = useCallback(async () => {
    if (configurations.length === 0) {
      ToastUtils.error("Please add at least one configuration");
      return;
    }

    // In fast-track mode, validate all configs are in eligible regions
    if (isFastTrack) {
      const invalidRegions = configurations.filter(
        (cfg) => !fastTrackRegions.includes(cfg.region || "")
      );
      if (invalidRegions.length > 0) {
        ToastUtils.error("Some configurations are in regions not eligible for fast-track");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const incompleteIndex = configurations.findIndex(
        (cfg) => !evaluateConfigurationCompleteness(cfg).isComplete
      );
      if (incompleteIndex !== -1) {
        throw new Error(`Complete Configuration #${incompleteIndex + 1} before pricing.`);
      }

      const pricing_requests = configurations.map((cfg, index) => {
        const isNewProject = cfg.project_mode === "new" || Boolean(cfg.template_locked);
        const assignmentScopePayload = cfg.assignment_scope || undefined;
        const sanitizedMemberIds = Array.isArray(cfg.member_user_ids)
          ? cfg.member_user_ids.map((id: any) => Number(id)).filter(Boolean)
          : [];
        const parsedBandwidthCount = cfg.bandwidth_id ? 1 : 0;
        const parsedFloatingIpCount = Number(cfg.floating_ip_count) || 0;
        const parsedMonths = Number(cfg.months) || 1;
        const parsedInstances = Number(cfg.instance_count) || 1;
        const parsedStorage = Number(cfg.storage_size_gb) || 50;
        const instanceName = (cfg.name || "").trim() || null;
        const networkId = isNewProject ? undefined : cfg.network_id || undefined;
        const subnetId = isNewProject ? undefined : cfg.subnet_id || undefined;

        const sanitizedSgIds = (
          Array.isArray(cfg.security_group_ids)
            ? cfg.security_group_ids
            : ((cfg.security_group_ids as any) || "").split(",")
        )
          .map((v: any) => (v && v.value ? v.value : v))
          .map((v: any) => (v || "").toString().trim())
          .filter(Boolean);

        const extraVolumes = (cfg.additional_volumes || [])
          .map((vol: AdditionalVolume) => ({
            volume_type_id: vol.volume_type_id,
            storage_size_gb: Number(vol.storage_size_gb) || 0,
          }))
          .filter((vol) => vol.volume_type_id && vol.storage_size_gb > 0);

        const securityGroupPayload =
          !isNewProject && sanitizedSgIds.length > 0 ? sanitizedSgIds : undefined;

        return {
          project_id: isNewProject ? undefined : cfg.project_id || undefined,
          project_name: isNewProject ? cfg.project_name || undefined : undefined,
          network_preset: isNewProject
            ? cfg.network_preset === "empty"
              ? "standard"
              : cfg.network_preset || "standard"
            : undefined,
          region: cfg.region || undefined,
          compute_instance_id: cfg.compute_instance_id,
          os_image_id: cfg.os_image_id,
          months: parsedMonths,
          number_of_instances: parsedInstances,
          volume_types: [
            {
              volume_type_id: cfg.volume_type_id,
              storage_size_gb: parsedStorage,
            },
            ...extraVolumes,
          ],
          bandwidth_id: cfg.bandwidth_id || null,
          bandwidth_count: parsedBandwidthCount,
          floating_ip_count: parsedFloatingIpCount,
          security_group_ids: securityGroupPayload,
          keypair_name: cfg.keypair_name || undefined,
          network_id: networkId,
          subnet_id: subnetId,
          name: instanceName,
          fast_track: isFastTrack,
          ...(isNewProject && assignmentScopePayload
            ? { assignment_scope: assignmentScopePayload }
            : {}),
          ...(isNewProject && sanitizedMemberIds.length
            ? { member_user_ids: sanitizedMemberIds }
            : {}),
        };
      });

      const payload = {
        country_iso: billingCountry,
        fast_track: isFastTrack,
        pricing_requests,
      } as any;
      if (contextType === "tenant" && selectedTenantId) {
        payload.tenant_id = selectedTenantId;
      } else if (contextType === "user" && selectedUserId) {
        payload.user_id = selectedUserId;
        if (selectedTenantId) {
          payload.tenant_id = selectedTenantId;
        }
      }

      const response = await tenantApi("POST", "/admin/instances/create", payload as any);
      const data = response?.data || response;

      const normalizedGatewayOptions = normalizePaymentOptions(
        data?.payment?.payment_gateway_options || data?.payment?.options || data?.payment_options
      );
      const pricingBreakdownPayload =
        data?.pricing_breakdown ||
        data?.transaction?.metadata?.pricing_breakdown ||
        data?.order?.pricing_breakdown ||
        null;

      const mergedTransaction = data?.transaction
        ? {
          ...data.transaction,
          metadata: {
            ...(data.transaction.metadata || {}),
            ...(pricingBreakdownPayload ? { pricing_breakdown: pricingBreakdownPayload } : {}),
          },
        }
        : null;

      const mergedResult = {
        ...data,
        transaction: mergedTransaction,
        payment: data?.payment
          ? { ...data.payment, payment_gateway_options: normalizedGatewayOptions }
          : normalizedGatewayOptions.length
            ? { payment_gateway_options: normalizedGatewayOptions }
            : data?.payment,
        pricing_breakdown: pricingBreakdownPayload || data?.pricing_breakdown || null,
      };

      setSubmissionResult(mergedResult);
      setOrderReceipt({
        transaction: mergedResult?.transaction || null,
        order: mergedResult?.order || null,
        payment: mergedResult?.payment || null,
        pricing_breakdown: mergedResult?.pricing_breakdown || null,
      });

      const isPaymentRequired = mergedResult?.payment?.required;
      if (isPaymentRequired) {
        if (paymentStepIndex >= 0) {
          setActiveStep(paymentStepIndex);
          ToastUtils.success("Order created! Please complete payment.");
        } else {
          ToastUtils.error("Payment is required. Switch to standard mode to continue.");
          setActiveStep(reviewStepIndex);
        }
      } else {
        setIsPaymentSuccessful(true);
        setActiveStep(reviewStepIndex);
        ToastUtils.success("Fast-track order submitted! Instances are being provisioned.");
      }
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    configurations,
    billingCountry,
    isFastTrack,
    fastTrackRegions,
    contextType,
    selectedTenantId,
    selectedUserId,
    paymentStepIndex,
    reviewStepIndex,
  ]);

  const handlePaymentCompleted = useCallback(
    (paymentResult: any) => {
      setIsPaymentSuccessful(true);
      setActiveStep(reviewStepIndex); // Move to review step
      ToastUtils.success("Payment successful! Order confirmed.");
    },
    [reviewStepIndex]
  );

  // ─────────────────────────────────────────────────────────────────
  // Pricing Calculations
  // ─────────────────────────────────────────────────────────────────
  const pricingSummary = useMemo(() => {
    if (isFastTrack) {
      return {
        subtotal: 0,
        tax: 0,
        gatewayFees: 0,
        grandTotal: 0,
        currency: billingCountry === "NG" ? "NGN" : "USD",
      };
    }
    const breakdown = Array.isArray(orderReceipt?.pricing_breakdown)
      ? orderReceipt?.pricing_breakdown
      : [];
    const totals = breakdown.reduce(
      (acc: any, item: any) => {
        acc.subtotal += Number(item?.subtotal || 0);
        acc.tax += Number(item?.tax || 0);
        acc.total += Number(item?.total || 0);
        acc.currency = acc.currency || item?.currency;
        return acc;
      },
      { subtotal: 0, tax: 0, total: 0, currency: "" }
    );
    const receiptTotal =
      Number(orderReceipt?.transaction?.amount || orderReceipt?.order?.total || 0) || 0;
    return {
      subtotal: totals.subtotal || receiptTotal,
      tax: totals.tax || 0,
      gatewayFees: 0,
      grandTotal: totals.total || receiptTotal,
      currency:
        totals.currency ||
        orderReceipt?.transaction?.currency ||
        (billingCountry === "NG" ? "NGN" : "USD"),
    };
  }, [orderReceipt, billingCountry, isFastTrack]);

  // ─────────────────────────────────────────────────────────────────
  // Configuration Summaries for Review
  // ─────────────────────────────────────────────────────────────────
  const configurationSummaries = useMemo(
    () =>
      configurations.map((cfg) => ({
        id: cfg.id,
        name: cfg.name || cfg.compute_label || "Unnamed Instance",
        region:
          cfg.region_label ||
          allRegionOptions.find((r) => r.value === cfg.region)?.label ||
          cfg.region,
        project: "Default Project",
        count: cfg.instance_count || 1,
        months: cfg.months || 12,
        canFastTrack: fastTrackRegions.includes(cfg.region || ""),
      })),
    [configurations, allRegionOptions, fastTrackRegions]
  );

  const selectedTenantLabel = useMemo(() => {
    if (!selectedTenantId) return "";
    const match = tenants.find((tenant: any) => String(tenant.id) === String(selectedTenantId));
    return match?.name || match?.company_name || match?.identifier || "";
  }, [tenants, selectedTenantId]);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUserId) return "";
    const match = userPool.find((user: any) => String(user.id) === String(selectedUserId));
    if (!match) return "";
    return (
      match.full_name ||
      `${match.first_name || ""} ${match.last_name || ""}`.trim() ||
      match.email ||
      ""
    );
  }, [userPool, selectedUserId]);

  const clientOptions = useMemo(
    () =>
      userPool.map((user: any) => ({
        value: String(user.id),
        label:
          user.full_name ||
          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          user.email ||
          `User ${user.id}`,
        raw: user,
      })),
    [userPool]
  );

  return {
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
    addConfigurationWithPatch,
    resetConfigurationWithPatch,
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

    // Customer context (tenant)
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
    selectedTenantLabel,
    selectedUserLabel,
    clientOptions,

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
    isAuthenticated,
    apiBaseUrl,
    profile,
  };
};

export default useTenantProvisioningLogic;
