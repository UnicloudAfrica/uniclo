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

// ═══════════════════════════════════════════════════════════════════
// TENANT INSTANCE CREATION LOGIC HOOK
// ═══════════════════════════════════════════════════════════════════

export const useTenantProvisioningLogic = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ─────────────────────────────────────────────────────────────────
  // Auth & Config
  // ─────────────────────────────────────────────────────────────────
  const authToken = useTenantAuthStore((state: any) => state.token);
  const profile = useTenantAuthStore((state: any) => state.profile);
  const apiBaseUrl = config.baseURL;

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
        { id: "configure", title: "Configure", desc: "Select resources" },
        { id: "review", title: "Review", desc: "Confirm order" },
      ];
    }
    return [
      { id: "workflow", title: "Workflow", desc: "Select provisioning mode" },
      { id: "configure", title: "Configure", desc: "Select resources" },
      { id: "payment", title: "Payment", desc: "Complete payment" },
      { id: "review", title: "Review", desc: "Confirm order" },
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
    if (profile?.country_code && !billingCountry) {
      setBillingCountry(profile.country_code);
      setIsCountryLocked(true);
    }
  }, [profile?.country_code, billingCountry]);

  // ─────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────
  const { data: countriesData = [], isLoading: isCountriesLoading } = useFetchCountries();

  // Fetch pricing using tenant API (not generic API)
  const [pricingData, setPricingData] = useState<any>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!authToken || !billingCountry) return;
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
  }, [authToken, billingCountry]);

  // Fetch regions using tenant API
  const [generalRegions, setGeneralRegions] = useState<any[]>([]);
  const [isRegionsLoading, setIsRegionsLoading] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      if (!authToken) return;
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
  }, [authToken]);

  // ─────────────────────────────────────────────────────────────────
  // Fast-Track Region Eligibility
  // ─────────────────────────────────────────────────────────────────
  const [fastTrackRegions, setFastTrackRegions] = useState<string[]>([]);
  const [isLoadingFastTrackRegions, setIsLoadingFastTrackRegions] = useState(false);

  // Fetch regions with fast-track eligibility when hook initializes
  useEffect(() => {
    const fetchFastTrackRegions = async () => {
      if (!authToken) return;
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
  }, [authToken]);

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
      // For each configuration, determine if it qualifies for fast-track
      // This enables split orders: fast-track regions are free, others require payment
      const items = configurations.map((cfg) => {
        const regionIsFastTrack = fastTrackRegions.includes(cfg.region || "");
        const itemFastTrack = isFastTrack || regionIsFastTrack;

        return {
          launch_mode: cfg.launch_mode,
          name: cfg.name || `instance-${Date.now()}`,
          instance_count: cfg.instance_count || 1,
          project_id: cfg.project_id,
          region: cfg.region,
          months: cfg.months || 12,
          compute_instance_id: cfg.compute_instance_id,
          os_image_id: cfg.os_image_id,
          volume_type_id: cfg.volume_type_id,
          storage_size_gb: cfg.storage_size_gb,
          bandwidth_id: cfg.bandwidth_id,
          bandwidth_count: cfg.bandwidth_count || 1,
          floating_ip_count: cfg.floating_ip_count || 0,
          security_group_ids: cfg.security_group_ids,
          keypair_name: cfg.keypair_name,
          network_id: cfg.network_id,
          subnet_id: cfg.subnet_id,
          additional_volumes: cfg.additional_volumes,
          fast_track: itemFastTrack,
        };
      });

      // Determine if entire order is fast-track or has paid items
      const allFastTrack = items.every((item) => item.fast_track);
      const hasPaidItems = items.some((item) => !item.fast_track);

      const payload = {
        billing_country: billingCountry,
        fast_track: allFastTrack, // Overall order flag
        items,
      };

      const response = await tenantApi("POST", "/admin/instances/create", payload as any);
      setSubmissionResult(response);
      setOrderReceipt((response as any)?.data);

      if (allFastTrack) {
        // All items are fast-track, skip payment
        setIsPaymentSuccessful(true);
        setActiveStep(2); // Go directly to review
        ToastUtils.success("Fast-track order submitted! Instances are being provisioned.");
      } else if (hasPaidItems) {
        // Mixed order or all paid - go to payment
        setActiveStep(2); // Move to payment step
        const fastTrackCount = items.filter((i) => i.fast_track).length;
        if (fastTrackCount > 0) {
          ToastUtils.success(
            `Order created! ${fastTrackCount} instance(s) will be fast-tracked. Complete payment for the remaining.`
          );
        } else {
          ToastUtils.success("Order created! Please complete payment.");
        }
      }
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  }, [configurations, billingCountry, isFastTrack, fastTrackRegions]);

  const handlePaymentCompleted = useCallback((paymentResult: any) => {
    setIsPaymentSuccessful(true);
    setActiveStep(3); // Move to review step
    ToastUtils.success("Payment successful! Order confirmed.");
  }, []);

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
    const receipt = orderReceipt?.pricing || {};
    return {
      subtotal: receipt.subtotal || 0,
      tax: receipt.tax || 0,
      gatewayFees: receipt.gateway_fees || 0,
      grandTotal: receipt.grand_total || receipt.subtotal || 0,
      currency: receipt.currency || (billingCountry === "NG" ? "NGN" : "USD"),
    };
  }, [orderReceipt, billingCountry, isFastTrack]);

  // ─────────────────────────────────────────────────────────────────
  // Configuration Summaries for Review
  // ─────────────────────────────────────────────────────────────────
  const configurationSummaries = useMemo(
    () =>
      configurations.map((cfg) => ({
        id: cfg.id,
        name: cfg.name || "Unnamed Instance",
        region: allRegionOptions.find((r) => r.value === cfg.region)?.label || cfg.region,
        project: "Default Project",
        count: cfg.instance_count || 1,
        months: cfg.months || 12,
        canFastTrack: fastTrackRegions.includes(cfg.region || ""),
      })),
    [configurations, allRegionOptions, fastTrackRegions]
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
  };
};

export default useTenantProvisioningLogic;
