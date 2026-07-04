import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AdditionalVolume, Option } from "../types/InstanceConfiguration";
import { useInstanceFormState } from "./useInstanceCreation";
import { useFetchCountries, useFetchGeneralRegions } from "./resource";
import useAuthStore, { UnifiedAuthState } from "@/stores/authStore";
import config from "../config";
import tenantApi from "../index/tenant/tenantApi";
import silentApi from "../index/silent";
import ToastUtils from "../utils/toastUtil";
import {
  evaluateConfigurationCompleteness,
  normalizePaymentOptions,
} from "../utils/instanceCreationUtils";
import {
  PREVIEW_PRICING_DEBOUNCE_MS,
  buildPreviewPricingPayload,
  composeExpectedTotal,
  extractPreviewPricingEstimate,
} from "../utils/instancePreviewPricing";
import { useTenantCustomerContext } from "./tenantHooks/useTenantCustomerContext";
import { buildProvisioningSteps } from "../shared/components/instance-wizard/provisioningSteps";
import { resolveCountryCodeFromEntity } from "./objectStorageUtils";
import { useAsyncAction } from "../shared/hooks/useAsyncAction";

// ═══════════════════════════════════════════════════════════════════
// TENANT INSTANCE CREATION LOGIC HOOK
// ═══════════════════════════════════════════════════════════════════

export interface TenantProvisioningProtectionPlan {
  plan: string;
  monthlyCost: number;
  redundancyPattern?: string;
}

/**
 * Build the order payload's protection_plan block (admin parity:
 * useInstanceOrderCreation.buildPayload). Returns null for no/none plan so
 * the payload omits the key entirely. Exported for unit tests per the
 * module-scope-helper convention (web/CLAUDE.md).
 */
export const buildProtectionPlanPayload = (
  protectionPlan?: TenantProvisioningProtectionPlan
): Record<string, unknown> | null => {
  if (!protectionPlan || !protectionPlan.plan || protectionPlan.plan === "none") {
    return null;
  }
  const isDrPlan = ["dr_standby", "dr_replication"].includes(protectionPlan.plan);
  return {
    plan: protectionPlan.plan,
    monthly_cost: protectionPlan.monthlyCost || 0,
    ...(isDrPlan && protectionPlan.redundancyPattern
      ? { redundancy_pattern: protectionPlan.redundancyPattern }
      : {}),
  };
};

export const useTenantProvisioningLogic = (options?: {
  protectionPlan?: TenantProvisioningProtectionPlan;
}) => {
  const protectionPlan = options?.protectionPlan;
  const [searchParams, setSearchParams] = useSearchParams();

  // ─────────────────────────────────────────────────────────────────
  // Auth & Config
  // ─────────────────────────────────────────────────────────────────
  const isAuthenticated = useAuthStore((state: UnifiedAuthState) => state.isAuthenticated);
  const profile = useAuthStore((state: UnifiedAuthState) => state.user);
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

  const countries = countriesData as unknown as Array<Record<string, unknown>>;
  const countryOptions: Option[] = useMemo(
    () =>
      countries.map((c) => ({
        value: String(c.iso2 || c.code || c.id),
        label: typeof c.name === "string" ? c.name : String(c.name ?? ""),
      })),
    [countries]
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
      const selected = tenants.find(
        (t: { id?: string | number }) => String(t.id) === String(selectedTenantId)
      );
      candidate = resolveCountryCodeFromEntity(selected, countryOptions as never);
    } else if (contextType === "user" && selectedUserId) {
      const selected = userPool.find(
        (u: { id?: string | number }) => String(u.id) === String(selectedUserId)
      );
      candidate = resolveCountryCodeFromEntity(selected, countryOptions as never);
    }

    // 2. Fallback to self-tenant (Standard Tenant)
    if (!candidate && selfTenant) {
      candidate = resolveCountryCodeFromEntity(selfTenant, countryOptions as never);
    }

    // 3. Fallback to user profile
    if (!candidate && profile) {
      candidate = resolveCountryCodeFromEntity(profile, countryOptions as never);
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
    countryOptions,
  ]);

  // Fetch pricing using public catalog (tenant-specific filter when available)
  const [pricingData, setPricingData] = useState<Record<string, unknown> | null>(null);
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
        const response = (await silentApi(
          "GET",
          `/product-pricing?${params.toString()}`
        )) as Record<string, unknown>;
        setPricingData(((response?.data ?? response) as Record<string, unknown>) || null);
      } catch {
        setPricingData(null);
      } finally {
        setIsPricingLoading(false);
      }
    };
    fetchPricing();
  }, [isAuthenticated, billingCountry, contextType, selectedTenantId, selfTenant?.id]);

  const { data: generalRegionsRaw = [], isFetching: isRegionsLoading } = useFetchGeneralRegions({
    enabled: isAuthenticated,
  });
  const generalRegions = generalRegionsRaw as Array<Record<string, unknown>>;

  // ─────────────────────────────────────────────────────────────────
  // Fast-Track Region Eligibility
  // ─────────────────────────────────────────────────────────────────
  const fastTrackRegions = useMemo<string[]>(
    () =>
      generalRegions
        .filter((region) => region?.can_fast_track === true)
        .map((region) => String(region?.code || region?.region || region?.slug || region?.id || ""))
        .filter((s): s is string => Boolean(s)),
    [generalRegions]
  );

  const isLoadingFastTrackRegions = isRegionsLoading;
  const hasFastTrackAccess = fastTrackRegions.length > 0;

  // ─────────────────────────────────────────────────────────────────
  // Build Options
  // ─────────────────────────────────────────────────────────────────

  const regionOptions: Option[] = useMemo(() => {
    const allRegions = generalRegions.map((r) => {
      const value = String(r.code || r.region || r.id || r.slug || "");
      return {
        value,
        label: String(r.label || r.name || r.region || r.code || ""),
        canFastTrack: fastTrackRegions.includes(value),
      };
    });

    // If in fast-track mode, only show eligible regions
    if (isFastTrack) {
      return allRegions.filter((r) => r.canFastTrack);
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
      generalRegions.map((r): Option & { canFastTrack: boolean } => {
        const value = String(r.code || r.region || r.id || r.slug || "");
        return {
          value,
          label: String(r.label || r.name || r.region || r.code || ""),
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
  // Pre-order pricing estimate
  // ─────────────────────────────────────────────────────────────────
  // Quote the configured order via POST /admin/instances/preview-pricing
  // (same engine the create endpoint bills with) so operators see a price
  // while configuring instead of only after the order exists. Best-effort
  // and standard-mode only (fast-track skips payment, so the wizard
  // intentionally shows no totals there). Keyed on the serialized payload
  // so any price-affecting edit invalidates the estimate before it can be
  // displayed or price-locked.
  const [pricingEstimate, setPricingEstimate] = useState<{
    key: string;
    total: number;
    currency: string;
  } | null>(null);

  // The order is prepaid upfront for its term, so the protection fee is billed
  // fee × months. Use the longest config term the plan protects, matching the
  // backend's per-order resolution.
  const orderTermMonths = useMemo(
    () => configurations.reduce((max, cfg) => Math.max(max, Number(cfg.months) || 1), 1),
    [configurations]
  );

  const previewPayloadKey = useMemo(() => {
    if (isFastTrack) return "";
    // Mirror the create action's tenant resolution: explicit selection
    // first, otherwise the actor's own tenant — tenant price overrides
    // would otherwise make the estimate drift from the billed total.
    const pricingTenantId =
      (contextType === "tenant" || contextType === "user" ? selectedTenantId : "") ||
      (selfTenant?.id as string | number | undefined) ||
      undefined;
    const payload = buildPreviewPricingPayload(configurations, billingCountry, pricingTenantId);
    return payload ? JSON.stringify(payload) : "";
  }, [isFastTrack, contextType, selectedTenantId, selfTenant?.id, configurations, billingCountry]);

  useEffect(() => {
    if (!previewPayloadKey) {
      setPricingEstimate(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await silentApi(
          "POST",
          "/admin/instances/preview-pricing",
          JSON.parse(previewPayloadKey) as Record<string, unknown>
        );
        const estimate = extractPreviewPricingEstimate(response);
        if (!cancelled) {
          setPricingEstimate(estimate ? { key: previewPayloadKey, ...estimate } : null);
        }
      } catch {
        if (!cancelled) setPricingEstimate(null);
      }
    }, PREVIEW_PRICING_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [previewPayloadKey]);

  // ─────────────────────────────────────────────────────────────────
  // Order Creation & Submission
  // ─────────────────────────────────────────────────────────────────
  const createOrderAction = useAsyncAction();
  const [submissionResult, setSubmissionResult] = useState<Record<string, unknown> | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<Record<string, unknown> | null>(null);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const paymentStepIndex = useMemo(() => steps.findIndex((step) => step.id === "payment"), [steps]);
  const reviewStepIndex = useMemo(() => steps.findIndex((step) => step.id === "review"), [steps]);

  const handleCreateOrder = useCallback(async () => {
    await createOrderAction.run(
      async () => {
        if (configurations.length === 0) {
          throw new Error("Please add at least one configuration");
        }

        // In fast-track mode, validate all configs are in eligible regions
        if (isFastTrack) {
          const invalidRegions = configurations.filter(
            (cfg) => !fastTrackRegions.includes(cfg.region || "")
          );
          if (invalidRegions.length > 0) {
            throw new Error("Some configurations are in regions not eligible for fast-track");
          }
        }

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
            ? cfg.member_user_ids.map((id: string | number) => Number(id)).filter(Boolean)
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
              : ((cfg.security_group_ids as string) || "").split(",")
          )
            .map((v: unknown) => {
              if (v && typeof v === "object" && "value" in v) {
                return (v as { value: unknown }).value;
              }
              return v;
            })
            .map((v: unknown) => (v ?? "").toString().trim())
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

        const payload: Record<string, unknown> = {
          country_iso: billingCountry,
          fast_track: isFastTrack,
          pricing_requests,
        };
        // Forward the protection plan the user selected in the Protection
        // step — without this block the fee is displayed but never billed.
        // The backend rejects paid plans with no resolvable price.
        const protectionPlanPayload = buildProtectionPlanPayload(protectionPlan);
        if (protectionPlanPayload) {
          payload.protection_plan = protectionPlanPayload;
        }
        // Price lock (root CLAUDE.md convention): send the estimate the
        // operator just reviewed in the sidebar as `expected_total` so
        // InitiateMultiInstancesAction 409s on drift instead of charging
        // a number they never saw. The backend adds the protection fee to
        // the grand total before the guard runs, so fold it in here.
        //
        // `expected_total` is REQUIRED by the create endpoint (a 422 otherwise).
        // FAST-TRACK GAP: the pre-order preview is gated off in fast-track mode
        // (see `previewPayloadKey` returning "" when isFastTrack), so
        // `pricingEstimate` is always null here and no displayed total exists to
        // echo. Fast-track submits will therefore 422 until the backend exempts
        // fast-track from the expected_total requirement (it skips payment, so
        // there is no charge to price-lock). We intentionally do NOT invent a
        // total on the client. For the standard path, block on a stale/missing
        // estimate rather than let the backend 422 opaquely.
        if (!isFastTrack) {
          if (pricingEstimate && pricingEstimate.key === previewPayloadKey) {
            payload.expected_total = composeExpectedTotal(
              pricingEstimate.total,
              Number(protectionPlanPayload?.monthly_cost) || 0,
              orderTermMonths
            );
          } else {
            throw new Error(
              "The price changed since you last reviewed it. Please review the updated total, then try again."
            );
          }
        }
        if (contextType === "tenant" && selectedTenantId) {
          payload.tenant_id = selectedTenantId;
        } else if (contextType === "user" && selectedUserId) {
          payload.user_id = selectedUserId;
          if (selectedTenantId) {
            payload.tenant_id = selectedTenantId;
          }
        }

        const response = await tenantApi<{ data?: unknown }>(
          "POST",
          "/admin/instances/create",
          payload
        );
        const data = ((response?.data || response) as Record<string, unknown>) || {};
        const payment = data.payment as Record<string, unknown> | undefined;
        const transaction = data.transaction as Record<string, unknown> | undefined;
        const order = data.order as Record<string, unknown> | undefined;
        const transactionMeta = transaction?.metadata as Record<string, unknown> | undefined;

        const normalizedGatewayOptions = normalizePaymentOptions(
          payment?.payment_gateway_options || payment?.options || data?.payment_options
        );
        const pricingBreakdownPayload =
          data?.pricing_breakdown ||
          transactionMeta?.pricing_breakdown ||
          order?.pricing_breakdown ||
          null;

        const mergedTransaction = transaction
          ? {
              ...transaction,
              metadata: {
                ...(transactionMeta || {}),
                ...(pricingBreakdownPayload ? { pricing_breakdown: pricingBreakdownPayload } : {}),
              },
            }
          : null;

        const mergedResult: Record<string, unknown> = {
          ...data,
          transaction: mergedTransaction,
          payment: payment
            ? { ...payment, payment_gateway_options: normalizedGatewayOptions }
            : normalizedGatewayOptions.length
              ? { payment_gateway_options: normalizedGatewayOptions }
              : payment,
          pricing_breakdown: pricingBreakdownPayload || data?.pricing_breakdown || null,
        };

        setSubmissionResult(mergedResult);
        setOrderReceipt({
          transaction: mergedResult?.transaction || null,
          order: mergedResult?.order || null,
          payment: mergedResult?.payment || null,
          pricing_breakdown: mergedResult?.pricing_breakdown || null,
        });

        const mergedPayment = mergedResult?.payment as { required?: boolean } | undefined;
        const isPaymentRequired = mergedPayment?.required;
        if (isPaymentRequired) {
          if (paymentStepIndex >= 0) {
            setActiveStep(paymentStepIndex);
          } else if (reviewStepIndex >= 0) {
            ToastUtils.error("Payment is required. Switch to standard mode to continue.");
            setActiveStep(reviewStepIndex);
          } else {
            ToastUtils.error("Payment is required. Switch to standard mode to continue.");
          }
        } else {
          setIsPaymentSuccessful(true);
          if (reviewStepIndex >= 0) {
            setActiveStep(reviewStepIndex);
          } else {
            // Fallback: advance to the last meaningful step
            setActiveStep(steps.length - 1);
          }
        }
        return {
          isPaymentRequired: Boolean(isPaymentRequired),
        };
      },
      {
        successToast: (result) => {
          if (result.isPaymentRequired) {
            return "Order created! Please complete payment.";
          }
          return isFastTrack
            ? "Fast-track order submitted! Instances are being provisioned."
            : "Order created! Instance provisioning is starting.";
        },
        fallbackErrorMessage: "Failed to create order.",
        rethrow: false,
      }
    );
  }, [
    createOrderAction,
    configurations,
    billingCountry,
    isFastTrack,
    protectionPlan,
    fastTrackRegions,
    contextType,
    selectedTenantId,
    selectedUserId,
    paymentStepIndex,
    pricingEstimate,
    previewPayloadKey,
    reviewStepIndex,
    steps.length,
  ]);

  const handlePaymentCompleted = useCallback(() => {
    setIsPaymentSuccessful(true);
    if (reviewStepIndex >= 0) {
      setActiveStep(reviewStepIndex);
    } else {
      // Fallback: advance to the last meaningful step
      setActiveStep(steps.length - 1);
    }
    ToastUtils.success("Payment successful! Order confirmed.");
  }, [reviewStepIndex, steps.length]);

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
        isEstimate: false,
      };
    }
    type Totals = { subtotal: number; tax: number; total: number; currency: string };
    type BreakdownItem = { subtotal?: number; tax?: number; total?: number; currency?: string };
    const breakdown: BreakdownItem[] = Array.isArray(orderReceipt?.pricing_breakdown)
      ? (orderReceipt?.pricing_breakdown as BreakdownItem[])
      : [];
    const totals: Totals = breakdown.reduce<Totals>(
      (acc, item) => {
        acc.subtotal += Number(item?.subtotal || 0);
        acc.tax += Number(item?.tax || 0);
        acc.total += Number(item?.total || 0);
        acc.currency = acc.currency || (item?.currency ?? "");
        return acc;
      },
      { subtotal: 0, tax: 0, total: 0, currency: "" }
    );
    const txn = orderReceipt?.transaction as { amount?: number; currency?: string } | undefined;
    const ord = orderReceipt?.order as { total?: number } | undefined;
    const receiptTotal = Number(txn?.amount || ord?.total || 0) || 0;
    // Before the order exists there is no receipt — fall back to the
    // preview-pricing estimate so the operator sees a price while
    // configuring. Flagged so the UI labels it as an estimate.
    const hasReceiptTotals = totals.subtotal > 0 || totals.total > 0 || receiptTotal > 0;
    if (!hasReceiptTotals && pricingEstimate) {
      return {
        subtotal: 0,
        tax: 0,
        gatewayFees: 0,
        // Fold the protection-plan fee (× term) into the displayed estimate —
        // the backend bills it the same way at submit, matching the
        // expected_total computation above.
        grandTotal: composeExpectedTotal(
          pricingEstimate.total,
          Number(protectionPlan?.monthlyCost) || 0,
          orderTermMonths
        ),
        currency: pricingEstimate.currency || (billingCountry === "NG" ? "NGN" : "USD"),
        isEstimate: true,
      };
    }
    return {
      subtotal: totals.subtotal || receiptTotal,
      tax: totals.tax || 0,
      gatewayFees: 0,
      grandTotal: totals.total || receiptTotal,
      currency: totals.currency || txn?.currency || (billingCountry === "NG" ? "NGN" : "USD"),
      isEstimate: false,
    };
  }, [orderReceipt, billingCountry, isFastTrack, pricingEstimate, protectionPlan, orderTermMonths]);

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
    const match = tenants.find((tenant: unknown) => String(tenant.id) === String(selectedTenantId));
    return match?.name || match?.company_name || match?.identifier || "";
  }, [tenants, selectedTenantId]);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUserId) return "";
    const match = userPool.find((user: unknown) => String(user.id) === String(selectedUserId));
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
      userPool.map((user: unknown) => ({
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
    isSubmitting: createOrderAction.isPending,
    submissionResult,
    orderReceipt,
    submissionErrorMessage: createOrderAction.errorMessage,
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
