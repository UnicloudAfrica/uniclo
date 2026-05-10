import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCustomerContext } from "./adminHooks/useCustomerContext";
import { useFetchGeneralRegions } from "./resource";
import { useInstanceFormState } from "./useInstanceCreation";
import { useInstanceOrderCreation } from "./useInstanceOrderCreation";
import { useInstanceResources } from "./useInstanceResources";
import { Option } from "../types/InstanceConfiguration";
import {
  toNumber,
  evaluateConfigurationCompleteness,
  formatComputeLabel,
  formatOsLabel,
  formatVolumeLabel,
  formatKeypairLabel,
  formatSubnetLabel,
  normalizeCountryCandidate,
  COUNTRY_FALLBACK,
  pickPreferredPaymentOption,
} from "../utils/instanceCreationUtils";
import { useFetchCountries } from "./resource";
import { useApiContext } from "./useApiContext";
import { buildProvisioningSteps } from "../shared/components/instance-wizard/provisioningSteps";
import useAuthStore from "../stores/authStore";
import { resolveCountryCodeFromEntity } from "./objectStorageUtils";

/**
 * Loose record type for entities returned from the API where we only
 * need to read a handful of optional string-ish fields. Avoids
 * `unknown`'s "property doesn't exist" cascade in this file (62
 * TS2339 errors as of the Week-3 audit).
 */
type LooseRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is LooseRecord =>
  Boolean(value) && typeof value === "object";

/**
 * Coerce an unknown API value into a string when it's truthy and
 * scalar-ish, else return undefined. Lets us write
 * `pickString(item.name) ?? pickString(item.identifier)` without
 * ts-ignoring `String(unknown)`.
 */
const pickString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
};

const asPricingBreakdownEntries = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object")
    );
  }

  if (value && typeof value === "object") {
    return [value as Record<string, unknown>];
  }

  return [];
};

interface AdminCreateInstanceLogicOptions {
  protectionPlan?: {
    plan: string;
    redundancyPattern?: string;
    drSpec?: {
      mode: "match" | "custom";
      drTargetAz?: string;
      drTargetAzLabel?: string;
      computeInstanceId?: string;
      computeLabel?: string;
      pricePerVm?: number;
      drMonthlyCost?: number;
      drVmCount?: number;
      drVmFullPrice?: number;
    };
  };
}

export const useAdminCreateInstanceLogic = (options?: AdminCreateInstanceLogicOptions) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "fast-track" ? "fast-track" : "standard";
  const [mode, setMode] = useState(initialMode);
  const [activeStep, setActiveStep] = useState(0);
  const profile = useAuthStore((state) => state.user);

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
  } = useCustomerContext();

  const [billingCountry, setBillingCountry] = useState("");
  const [isCountryLocked, setIsCountryLocked] = useState(false);
  const { resources, isLoadingResources } = useInstanceResources();
  const {
    configurations,
    addConfiguration,
    addConfigurationWithPatch,
    resetConfigurationWithPatch,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,
  } = useInstanceFormState();

  const [hasLockedPaymentStep, setHasLockedPaymentStep] = useState(false);
  const { data: countryOptions = [], isFetching: isCountriesLoading } = useFetchCountries();
  const { data: generalRegions = [] } = useFetchGeneralRegions();
  const { apiBaseUrl } = useApiContext();

  const isFastTrack = mode === "fast-track";

  const {
    isSubmitting,
    submissionResult,
    orderReceipt,
    selectedPaymentOption,
    setSelectedPaymentOption,
    submissionErrorMessage,
    handleCreateOrder,
    handlePaymentCompleted,
  } = useInstanceOrderCreation({
    configurations,
    contextType,
    selectedTenantId,
    selectedUserId,
    billingCountry,
    isFastTrack,
    setActiveStep,
    protectionPlan: options?.protectionPlan,
  });

  const isPaymentSuccessful = useMemo(() => {
    type PayShape = { transaction?: { status?: string }; payment?: { status?: string } } | null | undefined;
    const sr = submissionResult as PayShape;
    const or = orderReceipt as PayShape;
    const status =
      sr?.transaction?.status ||
      sr?.payment?.status ||
      or?.transaction?.status ||
      or?.payment?.status ||
      "pending";
    return ["paid", "successful", "completed"].includes(String(status).toLowerCase());
  }, [submissionResult, orderReceipt]);

  const steps = useMemo(
    () => buildProvisioningSteps(isFastTrack ? "fast-track" : "standard"),
    [isFastTrack]
  );

  useEffect(() => {
    setActiveStep((prev) => Math.min(prev, steps.length - 1));
  }, [steps.length]);

  const tenantOptions = useMemo(() => {
    if (!Array.isArray(tenants)) return [];
    return tenants
      .map((tenant: unknown): Option | null => {
        if (!isRecord(tenant)) return null;
        const value =
          pickString(tenant.id) ??
          pickString(tenant.identifier) ??
          pickString(tenant.code) ??
          pickString(tenant.slug) ??
          "";
        if (!value) return null;
        const label =
          pickString(tenant.name) ??
          pickString(tenant.company_name) ??
          pickString(tenant.identifier) ??
          pickString(tenant.code) ??
          `Tenant ${value}`;
        return { value, label, raw: tenant };
      })
      .filter((item: Option | null): item is Option => Boolean(item));
  }, [tenants]);

  const clientOptions = useMemo(() => {
    if (!Array.isArray(userPool)) return [];
    return userPool
      .map((client: unknown): Option | null => {
        if (!isRecord(client)) return null;
        const value =
          pickString(client.id) ??
          pickString(client.identifier) ??
          pickString(client.code) ??
          pickString(client.slug) ??
          "";
        if (!value) return null;
        const label =
          pickString(client.name) ??
          pickString(client.full_name) ??
          pickString(client.email) ??
          pickString(client.identifier) ??
          `User ${value}`;
        return { value, label, raw: client };
      })
      .filter((item: Option | null): item is Option => Boolean(item));
  }, [userPool]);

  const regionSelectOptions = useMemo(() => {
    const primary =
      Array.isArray(generalRegions) && generalRegions.length > 0
        ? generalRegions
        : resources.regions || [];
    return primary
      .map((region: unknown): Option | null => {
        if (!isRecord(region)) return null;
        const value =
          pickString(region.code) ??
          pickString(region.region) ??
          pickString(region.slug) ??
          pickString(region.id) ??
          pickString(region.identifier) ??
          "";
        if (!value) return null;
        const name = pickString(region.name);
        const label = name ?? pickString(region.display_name) ?? pickString(region.label) ?? value;
        return {
          value,
          label:
            name && name.toLowerCase() !== value.toLowerCase()
              ? `${name} (${value})`
              : label,
        };
      })
      .filter((item: Option | null): item is Option => Boolean(item));
  }, [generalRegions, resources.regions]);

  const countryOptionsFormatted = useMemo(() => {
    const apiCountries = Array.isArray(countryOptions) ? countryOptions : [];
    if (apiCountries.length > 0) {
      const mapped = apiCountries
        .map((item: unknown): Option | null => {
          if (!isRecord(item)) return null;
          const code =
            normalizeCountryCandidate(
              pickString(item.iso2) ??
                pickString(item.code) ??
                pickString(item.country_code) ??
                pickString(item.iso_code) ??
                pickString(item.iso) ??
                pickString(item.id) ??
                pickString(item.country) ??
                ""
            ) || "";
          if (!code) return null;
          const upper = code.toUpperCase();
          const name =
            pickString(item.name) ??
            pickString(item.country_name) ??
            pickString(item.country) ??
            upper;
          return {
            value: upper,
            label:
              name && name.toLowerCase() !== upper.toLowerCase() ? `${name} (${upper})` : upper,
            currency:
              pickString(item.currency_code) ??
              pickString(item.currency) ??
              pickString(item.currencyCode) ??
              "USD",
          };
        })
        .filter((item: Option | null): item is Option => Boolean(item));

      const hasUS = mapped.some(
        (option) => option?.value && String(option.value).toUpperCase() === "US"
      );
      return hasUS
        ? mapped
        : [{ value: "US", label: "United States (US)", currency: "USD" }, ...mapped];
    }

    return [...COUNTRY_FALLBACK];
  }, [countryOptions]);

  // Auto-set billing country from user profile
  useEffect(() => {
    if (billingCountry) return; // Already set
    const code = resolveCountryCodeFromEntity(profile, countryOptionsFormatted as never);
    if (code) {
      setBillingCountry(code);
    }
  }, [profile, countryOptionsFormatted, billingCountry]);

  const configurationSummaries = useMemo(() => {
    const instanceTypes = resources.instance_types || [];
    const osImages = resources.os_images || [];
    const volumeTypes = resources.volume_types || [];
    const keyPairs = resources.keypairs || [];

    return configurations.map((cfg) => {
      const status = evaluateConfigurationCompleteness(cfg);
      const computeLabel =
        cfg.compute_label ||
        formatComputeLabel(cfg.compute_instance_id, instanceTypes as Record<string, unknown>[]);
      const resolvedComputeLabel =
        computeLabel && !["Not selected", "Instance selected"].includes(computeLabel)
          ? computeLabel
          : "";
      const defaultTitle =
        cfg.name?.trim() ||
        (resolvedComputeLabel ? resolvedComputeLabel : "Instance configuration");
      const osLabel =
        cfg.os_image_label || formatOsLabel(cfg.os_image_id, osImages as Record<string, unknown>[]);
      const storageLabel = cfg.volume_type_label
        ? `${cfg.volume_type_label}${cfg.storage_size_gb ? ` • ${cfg.storage_size_gb} GB` : ""}`
        : formatVolumeLabel(
            cfg.volume_type_id,
            cfg.storage_size_gb,
            volumeTypes as Record<string, unknown>[]
          );
      return {
        id: cfg.id,
        title: defaultTitle,
        regionLabel:
          cfg.region_label ||
          regionSelectOptions.find((opt) => opt.value === cfg.region)?.label ||
          cfg.region ||
          "No region selected",
        computeLabel,
        osLabel,
        termLabel: cfg.months
          ? `${cfg.months} month${Number(cfg.months) === 1 ? "" : "s"}`
          : "Not selected",
        storageLabel,
        floatingIpLabel: `${Number(cfg.floating_ip_count || 0)} floating IP${Number(cfg.floating_ip_count || 0) === 1 ? "" : "s"}`,
        keypairLabel: formatKeypairLabel(
          cfg.keypair_name,
          keyPairs as Record<string, unknown>[],
          cfg.keypair_label
        ),
        subnetLabel: formatSubnetLabel(cfg),
        statusLabel: status.isComplete ? "Complete" : "Incomplete",
        isComplete: status.isComplete,
      };
    });
  }, [configurations, regionSelectOptions, resources]);

  // Derived Labels
  const selectedTenantLabel = useMemo(() => {
    if (!selectedTenantId) return "";
    return tenantOptions.find((t) => t.value === String(selectedTenantId))?.label || "";
  }, [selectedTenantId, tenantOptions]);

  const selectedUserLabel = useMemo(() => {
    if (!selectedUserId) return "";
    return clientOptions.find((c) => c.value === String(selectedUserId))?.label || "";
  }, [selectedUserId, clientOptions]);

  const assignmentSummary = useMemo(() => {
    if (contextType === "tenant") {
      if (!selectedTenantId) return "Select tenant";
      return selectedTenantLabel || "Tenant selected";
    }
    if (contextType === "user") {
      if (!selectedUserId) return "Select user";
      return selectedUserLabel || "User selected";
    }
    return "Unassigned";
  }, [contextType, selectedTenantId, selectedTenantLabel, selectedUserId, selectedUserLabel]);

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

  // Country/Context Logic
  // (Simplifying: we return handlers and state, logic stays in component? No, move handlers here)

  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
    if (newMode === "fast-track") {
      // Logic handled by useEffect/steps
    }
  };

  // Pricing Logic
  type PaymentShape = {
    payment_gateway_options?: unknown;
    gateway?: unknown;
  };
  type TxShape = {
    identifier?: unknown;
    amount?: unknown;
    currency?: unknown;
    third_party_fee?: unknown;
    transaction_fee?: unknown;
    metadata?: { pricing_breakdown?: unknown };
  };
  type ResultShape = {
    payment?: PaymentShape;
    transaction?: TxShape;
    pricing_breakdown?: unknown;
    order?: { total?: unknown };
  };
  const subResult = submissionResult as ResultShape | null;
  const orderRcpt = orderReceipt as ResultShape | null;
  const selectedPay = selectedPaymentOption as
    | {
        charge_breakdown?: { total_fees?: unknown };
        total_fees?: unknown;
        fees?: unknown;
        currency?: unknown;
      }
    | null;
  const paymentOptionsList =
    subResult?.payment?.payment_gateway_options ||
    orderRcpt?.payment?.payment_gateway_options ||
    [];
  const preferredPaymentOption = pickPreferredPaymentOption(
    paymentOptionsList as Array<Record<string, unknown>>
  );
  const effectivePaymentOption =
    selectedPay || preferredPaymentOption || null;
  const rawPricingBreakdown =
    subResult?.pricing_breakdown ||
    subResult?.transaction?.metadata?.pricing_breakdown ||
    orderRcpt?.pricing_breakdown ||
    orderRcpt?.transaction?.metadata?.pricing_breakdown ||
    null;

  const backendPricingData = useMemo(() => {
    const entries = asPricingBreakdownEntries(rawPricingBreakdown);
    if (!entries.length) {
      return null;
    }

    type PricingAccumulator = {
      lines: Record<string, unknown>[];
      pre_discount_subtotal: number;
      discount: number;
      subtotal: number;
      tax: number;
      total: number;
      colocation_amount: number;
      currency: string;
    };
    const initial: PricingAccumulator = {
      lines: [],
      pre_discount_subtotal: 0,
      discount: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      colocation_amount: 0,
      currency: "",
    };
    return entries.reduce<PricingAccumulator>((acc, entry) => {
      const rawLines = entry.lines;
      const lines = Array.isArray(rawLines) ? (rawLines as Record<string, unknown>[]) : [];
      acc.lines.push(...lines);
      acc.pre_discount_subtotal += toNumber(entry.pre_discount_subtotal);
      acc.discount += toNumber(entry.discount);
      acc.subtotal += toNumber(entry.subtotal);
      acc.tax += toNumber(entry.tax);
      acc.total += toNumber(entry.total);
      acc.colocation_amount += toNumber(entry.colocation_amount);
      acc.currency = acc.currency || (typeof entry.currency === "string" ? entry.currency : "");
      return acc;
    }, initial);
  }, [rawPricingBreakdown]);

  const gatewayBreakdown = (effectivePaymentOption?.charge_breakdown ?? {}) as {
    total_fees?: unknown;
  };
  const summaryGatewayFeesValue = toNumber(
    gatewayBreakdown?.total_fees ??
      effectivePaymentOption?.total_fees ??
      effectivePaymentOption?.fees ??
      subResult?.transaction?.third_party_fee ??
      orderRcpt?.transaction?.third_party_fee ??
      subResult?.transaction?.transaction_fee ??
      orderRcpt?.transaction?.transaction_fee ??
      0
  );
  const fallbackGrandTotal = toNumber(
    subResult?.transaction?.amount ??
      orderRcpt?.order?.total ??
      orderRcpt?.transaction?.amount ??
      0
  );
  const summaryGrandTotalValue: number = Number(backendPricingData?.total) || Number(fallbackGrandTotal) || 0;
  const summarySubtotalValue: number =
    Number(backendPricingData?.subtotal) ||
    (summaryGrandTotalValue > 0
      ? Math.max(summaryGrandTotalValue - Number(summaryGatewayFeesValue || 0), 0)
      : 0);
  const summaryTaxValue: number = Number(backendPricingData?.tax) || 0;
  const summaryDisplayCurrency =
    backendPricingData?.currency ||
    (subResult?.transaction?.currency as string | undefined) ||
    (orderRcpt?.transaction?.currency as string | undefined) ||
    (effectivePaymentOption?.currency as string | undefined) ||
    (billingCountry === "NG" ? "NGN" : "USD");

  const summaryPlanLabel = useMemo(() => {
    if (!configurationSummaries.length) return "Instance profile";
    if (configurationSummaries.length === 1)
      return configurationSummaries[0]!.title || "Instance profile";
    return `${configurationSummaries.length} compute profiles`;
  }, [configurationSummaries]);

  const summaryWorkflowLabel = isFastTrack
    ? "Fast-Track Provisioning"
    : "Standard Request w/ Payment";
  const paymentTransactionLabel =
    (subResult?.transaction?.identifier as string | undefined) ||
    (orderRcpt?.transaction?.identifier as string | undefined) ||
    "N/A";
  const billingCountryLabel = useMemo(() => {
    if (!billingCountry) return "Not selected";
    const c = countryOptionsFormatted.find((opt: unknown) => {
      const o = opt as { value?: unknown } | null;
      return o?.value === billingCountry;
    }) as { label?: string } | undefined;
    return c ? c.label || billingCountry : billingCountry;
  }, [billingCountry, countryOptionsFormatted]);

  return {
    // State
    mode,
    activeStep,
    steps,
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
    countryOptions: countryOptionsFormatted,
    tenantOptions,
    clientOptions,
    generalRegions,
    regionSelectOptions,
    configurationSummaries,
    isFastTrack,

    // Context
    contextType,
    selectedTenantId,
    selectedUserId,
    selectedTenantLabel,
    selectedUserLabel,
    assignmentSummary,

    // Order State
    isSubmitting,
    submissionResult,
    orderReceipt,
    submissionErrorMessage,
    isPaymentSuccessful,
    paymentTransactionLabel,
    hasLockedPaymentStep,

    // Pricing Derived
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

    // Handlers
    handleModeChange,
    setActiveStep,
    setContextType,
    setSelectedTenantId,
    setSelectedUserId,
    setBillingCountry,
    setIsCountryLocked,
    setHasLockedPaymentStep,

    // Form Handlers
    addConfiguration,
    addConfigurationWithPatch,
    resetConfigurationWithPatch,
    removeConfiguration,
    updateConfiguration,
    addAdditionalVolume,
    updateAdditionalVolume,
    removeAdditionalVolume,

    // Action Handlers
    handleCreateOrder,
    handlePaymentCompleted,
    setSelectedPaymentOption,

    // Misc
    apiBaseUrl,
  };
};
