import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Configuration, AdditionalVolume, Option } from "../types/InstanceConfiguration";
import { useInstanceFormState } from "./useInstanceCreation";
import { useFetchCountries } from "./resource";
import useTenantAuthStore from "../stores/tenantAuthStore";
import config from "../config";
import tenantApi from "../index/tenant/tenantApi";
import silentTenantApi from "../index/tenant/silentTenant";
import ToastUtils from "../utils/toastUtil";
import {
  evaluateConfigurationCompleteness,
  normalizePaymentOptions,
} from "../utils/instanceCreationUtils";
import { useTenantCustomerContext } from "./tenantHooks/useTenantCustomerContext";

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
  const steps = useMemo(() => {
    if (isFastTrack) {
      return [
        { id: "workflow", title: "Workflow", desc: "Select provisioning mode" },
        { id: "configure", title: "Cube-Instance setup", desc: "Select region, size, and image" },
        { id: "review", title: "Review & provision", desc: "Confirm order" },
        { id: "success", title: "Success", desc: "Provisioning started" },
      ];
    }
    return [
      { id: "workflow", title: "Workflow", desc: "Select provisioning mode" },
      { id: "configure", title: "Cube-Instance setup", desc: "Select region, size, and image" },
      { id: "payment", title: "Payment", desc: "Complete payment" },
      { id: "review", title: "Review & provision", desc: "Confirm order" },
      { id: "success", title: "Success", desc: "Provisioning started" },
    ];
  }, [isFastTrack]);

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
  const [billingCountry, setBillingCountry] = useState<string>("");
  const [isCountryLocked, setIsCountryLocked] = useState(false);

  // Auto-set billing country from profile
  useEffect(() => {
    const candidate =
      profile?.country_code || selfTenant?.country_code || selfTenant?.business?.country || "";
    if (candidate && !billingCountry) {
      setBillingCountry(candidate);
      setIsCountryLocked(true);
    }
  }, [profile?.country_code, selfTenant, billingCountry]);

  // ─────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────
  const { data: countriesData = [], isLoading: isCountriesLoading } = useFetchCountries();

  // Fetch pricing using tenant API (not generic API)
  const [pricingData, setPricingData] = useState<any>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!isAuthenticated || !billingCountry) return;
      setIsPricingLoading(true);
      try {
        const params = new URLSearchParams();
        if (billingCountry) {
          params.append("country_code", billingCountry.toUpperCase());
        }
        const response = (await silentTenantApi(
          "GET",
          `/admin/product-pricing?${params.toString()}`
        )) as any;
        setPricingData(response?.data || response || []);
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
        setPricingData([]);
      } finally {
        setIsPricingLoading(false);
      }
    };
    fetchPricing();
  }, [isAuthenticated, billingCountry]);

  // Fetch regions using tenant API
  const [generalRegions, setGeneralRegions] = useState<any[]>([]);
  const [isRegionsLoading, setIsRegionsLoading] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      if (!isAuthenticated) return;
      setIsRegionsLoading(true);
      try {
        const response = (await silentTenantApi("GET", "/admin/cloud-regions")) as any;
        setGeneralRegions(response?.data || response || []);
      } catch (error) {
        console.error("Failed to fetch regions:", error);
        setGeneralRegions([]);
      } finally {
        setIsRegionsLoading(false);
      }
    };
    fetchRegions();
  }, [isAuthenticated]);

  // ─────────────────────────────────────────────────────────────────
  // Fast-Track Region Eligibility
  // ─────────────────────────────────────────────────────────────────
  const [fastTrackRegions, setFastTrackRegions] = useState<string[]>([]);
  const [isLoadingFastTrackRegions, setIsLoadingFastTrackRegions] = useState(false);

  // Fetch regions with fast-track eligibility when hook initializes
  useEffect(() => {
    const fetchFastTrackRegions = async () => {
      if (!isAuthenticated) return;
      setIsLoadingFastTrackRegions(true);
      try {
        const response = (await silentTenantApi("GET", "/admin/cloud-regions")) as any;
        const regions = response?.data || response || [];
        const eligible = regions
          .filter((r: any) => r.can_fast_track === true)
          .map((r: any) => r.code || r.slug || r.id);
        setFastTrackRegions(eligible);
      } catch (error) {
        console.error("Failed to fetch fast-track regions:", error);
        setFastTrackRegions([]);
      } finally {
        setIsLoadingFastTrackRegions(false);
      }
    };
    fetchFastTrackRegions();
  }, [isAuthenticated]);

  const hasFastTrackAccess = fastTrackRegions.length > 0;

  // ─────────────────────────────────────────────────────────────────
  // Build Options
  // ─────────────────────────────────────────────────────────────────
  const countryOptions: Option[] = useMemo(
    () => countriesData.map((c: any) => ({ value: c.code || c.id, label: c.name })),
    [countriesData]
  );

  const regionOptions: Option[] = useMemo(() => {
    const allRegions = generalRegions.map((r: any) => ({
      value: r.code || r.id || r.slug,
      label: r.name,
      canFastTrack: fastTrackRegions.includes(r.code || r.id || r.slug),
    }));

    // If in fast-track mode, only show eligible regions
    if (isFastTrack) {
      return allRegions.filter((r: any) => r.canFastTrack);
    }
    return allRegions;
  }, [generalRegions, fastTrackRegions, isFastTrack]);

  // All regions for display purposes (even when filtering)
  const allRegionOptions: Option[] = useMemo(
    () =>
      generalRegions.map((r: any): Option & { canFastTrack: boolean } => ({
        value: r.code || r.id || r.slug,
        label: r.name,
        canFastTrack: fastTrackRegions.includes(r.code || r.id || r.slug),
      })),
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
          project_name: isNewProject ? (cfg.project_name || undefined) : undefined,
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
