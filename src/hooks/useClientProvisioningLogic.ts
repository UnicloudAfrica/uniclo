import { useState, useCallback, useMemo, useEffect } from "react";
import { Configuration, AdditionalVolume, Option } from "../types/InstanceConfiguration";
import { useInstanceFormState } from "./useInstanceCreation";
import { useFetchCountries, useFetchGeneralRegions } from "./resource";
import useClientAuthStore from "../stores/clientAuthStore";
import config from "../config";
import clientApi from "../index/client/api";
import silentClientApi from "../index/client/silent";
import ToastUtils from "../utils/toastUtil";
import {
  evaluateConfigurationCompleteness,
  normalizePaymentOptions,
} from "../utils/instanceCreationUtils";
import { buildProvisioningSteps } from "../shared/components/instance-wizard/provisioningSteps";
import { resolveCountryCodeFromEntity } from "./objectStorageUtils";

// ═══════════════════════════════════════════════════════════════════
// CLIENT INSTANCE CREATION LOGIC HOOK
// ═══════════════════════════════════════════════════════════════════

export const useClientProvisioningLogic = () => {
  // ─────────────────────────────────────────────────────────────────
  // Auth & Config
  // ─────────────────────────────────────────────────────────────────
  const isAuthenticated = useClientAuthStore((state: any) => state.isAuthenticated);
  const profile = useClientAuthStore((state: any) => state.user);
  const apiBaseUrl = config.baseURL;

  // ─────────────────────────────────────────────────────────────────
  // Steps Configuration (Simplified for client)
  // ─────────────────────────────────────────────────────────────────
  const steps = useMemo(() => buildProvisioningSteps("standard"), []);

  const [activeStep, setActiveStep] = useState(0);

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
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────
  const { data: countriesData = [], isLoading: isCountriesLoading } = useFetchCountries();

  // ─────────────────────────────────────────────────────────────────
  // Build Options
  // ─────────────────────────────────────────────────────────────────
  // Ensure value is string to match resolveCountryCodeFromEntity expectation
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

  // Auto-set billing country from profile
  useEffect(() => {
    // Cast countryOptions to any to avoid strict Option type conflict if needed, or ensure mismatch is handled
    const code = resolveCountryCodeFromEntity(profile, countryOptions as any);
    if (code) {
      setBillingCountry(code);
      setIsCountryLocked(true);
    }
  }, [profile, countryOptions]);

  const { data: generalRegions = [], isFetching: isRegionsLoading } = useFetchGeneralRegions({
    enabled: isAuthenticated,
  });

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


  const regionOptions: Option[] = useMemo(
    () =>
      generalRegions.map((r: any) => ({
        value: r.code || r.region || r.id || r.slug,
        label: r.label || r.name || r.region || r.code,
      })),
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

  useEffect(() => {
    if (!Array.isArray(configurations) || configurations.length === 0) return;
    configurations.forEach((cfg) => {
      const currentScope = cfg.assignment_scope || "internal";
      if (currentScope !== "internal") {
        updateConfiguration(cfg.id, {
          assignment_scope: "internal",
          member_user_ids: [],
        });
      }
    });
  }, [configurations, updateConfiguration]);

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

    setIsSubmitting(true);
    try {
      const incompleteIndex = configurations.findIndex(
        (cfg) => !evaluateConfigurationCompleteness(cfg).isComplete
      );
      if (incompleteIndex !== -1) {
        throw new Error(`Complete Configuration #${incompleteIndex + 1} before pricing.`);
      }

      const pricing_requests = configurations.map((cfg) => {
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
          fast_track: false,
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
        fast_track: false,
        pricing_requests,
      };

      const response = await clientApi("POST", "/business/instances/create", payload as any);
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
        setActiveStep(paymentStepIndex);
        ToastUtils.success("Order created! Please complete payment.");
      } else {
        setIsPaymentSuccessful(true);
        setActiveStep(reviewStepIndex);
        ToastUtils.success("Order created! Instance provisioning is starting.");
      }
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  }, [configurations, billingCountry, paymentStepIndex, reviewStepIndex]);

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
  }, [orderReceipt, billingCountry]);

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
          regionOptions.find((r) => r.value === cfg.region)?.label ||
          cfg.region,
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
    isAuthenticated,
    apiBaseUrl,
    profile,
  };
};

export default useClientProvisioningLogic;
