import { useState, useCallback, useMemo, useEffect } from "react";
import { Configuration, AdditionalVolume, Option } from "../types/InstanceConfiguration";
import { useInstanceFormState } from "./useInstanceCreation";
import { useFetchCountries } from "./resource";
import useClientAuthStore from "../stores/clientAuthStore";
import config from "../config";
import clientApi from "../index/client/api";
import silentClientApi from "../index/client/silent";
import ToastUtils from "../utils/toastUtil";

// ═══════════════════════════════════════════════════════════════════
// CLIENT INSTANCE CREATION LOGIC HOOK
// ═══════════════════════════════════════════════════════════════════

export const useClientProvisioningLogic = () => {
  // ─────────────────────────────────────────────────────────────────
  // Auth & Config
  // ─────────────────────────────────────────────────────────────────
  const authToken = useClientAuthStore((state: any) => state.token);
  const profile = useClientAuthStore((state: any) => state.profile);
  const apiBaseUrl = config.baseURL;

  // ─────────────────────────────────────────────────────────────────
  // Steps Configuration (Simplified for client)
  // ─────────────────────────────────────────────────────────────────
  const steps = useMemo(
    () => [
      { id: "configure", title: "Configure", desc: "Select resources" },
      { id: "payment", title: "Payment", desc: "Complete payment" },
      { id: "review", title: "Review", desc: "Confirm order" },
    ],
    []
  );

  const [activeStep, setActiveStep] = useState(0);

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

  // Fetch regions using client API (business endpoint)
  const [generalRegions, setGeneralRegions] = useState<any[]>([]);
  const [isRegionsLoading, setIsRegionsLoading] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      if (!authToken) return;
      setIsRegionsLoading(true);
      try {
        const response = (await silentClientApi("GET", "/business/cloud-regions")) as any;
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

  // Fetch pricing using client API (public product-pricing endpoint is fine for clients)
  const [pricingData, setPricingData] = useState<any>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!billingCountry) return;
      setIsPricingLoading(true);
      try {
        const params = new URLSearchParams();
        if (billingCountry) {
          params.append("country_code", billingCountry.toUpperCase());
        }
        // Public product-pricing endpoint works for clients
        const response = (await silentClientApi(
          "GET",
          `/product-pricing?${params.toString()}`
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
  }, [billingCountry]);

  // ─────────────────────────────────────────────────────────────────
  // Build Options
  // ─────────────────────────────────────────────────────────────────
  const countryOptions: Option[] = useMemo(
    () => countriesData.map((c: any) => ({ value: c.code || c.id, label: c.name })),
    [countriesData]
  );

  const regionOptions: Option[] = useMemo(
    () => generalRegions.map((r: any) => ({ value: r.id || r.slug, label: r.name })),
    [generalRegions]
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

  const isLoadingResources = isPricingLoading || isRegionsLoading;

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

    setIsSubmitting(true);
    try {
      const payload = {
        billing_country: billingCountry,
        items: configurations.map((cfg) => ({
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
        })),
      };

      const response = await clientApi("POST", "/business/instances/create", payload as any);
      setSubmissionResult(response);
      setOrderReceipt((response as any)?.data);
      setActiveStep(1); // Move to payment step
      ToastUtils.success("Order created! Please complete payment.");
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  }, [configurations, billingCountry]);

  const handlePaymentCompleted = useCallback((paymentResult: any) => {
    setIsPaymentSuccessful(true);
    setActiveStep(2); // Move to review step
    ToastUtils.success("Payment successful! Order confirmed.");
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Pricing Calculations
  // ─────────────────────────────────────────────────────────────────
  const pricingSummary = useMemo(() => {
    const receipt = orderReceipt?.pricing || {};
    return {
      subtotal: receipt.subtotal || 0,
      tax: receipt.tax || 0,
      gatewayFees: receipt.gateway_fees || 0,
      grandTotal: receipt.grand_total || receipt.subtotal || 0,
      currency: receipt.currency || (billingCountry === "NG" ? "NGN" : "USD"),
    };
  }, [orderReceipt, billingCountry]);

  // ─────────────────────────────────────────────────────────────────
  // Configuration Summaries for Review
  // ─────────────────────────────────────────────────────────────────
  const configurationSummaries = useMemo(
    () =>
      configurations.map((cfg) => ({
        id: cfg.id,
        name: cfg.name || "Unnamed Instance",
        region: regionOptions.find((r) => r.value === cfg.region)?.label || cfg.region,
        project: "Default Project",
        count: cfg.instance_count || 1,
        months: cfg.months || 12,
      })),
    [configurations, regionOptions]
  );

  return {
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

export default useClientProvisioningLogic;
