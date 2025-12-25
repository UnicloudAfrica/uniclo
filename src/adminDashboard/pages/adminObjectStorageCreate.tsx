// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, HardDrive, ListChecks, Plus, Trash2 } from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import ModernInput from "../../shared/components/ui/ModernInput";
import ModernSelect from "../../shared/components/ui/ModernSelect";
import StatusPill from "../../shared/components/ui/StatusPill";
import ToastUtils from "../../utils/toastUtil";
import PaymentModal from "../../shared/components/ui/PaymentModal";
import config from "../../config";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import objectStorageApi from "../../services/objectStorageApi";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import { useFetchCountries } from "../../hooks/resource";
import { useFetchProductPricing } from "../../hooks/resource";
import { useCustomerContext } from "../../hooks/adminHooks/useCustomerContext";
import CustomerContextSelector from "../../shared/components/common/CustomerContextSelector";
import ObjectStoragePlanSelector from "../../shared/components/objectStorage/ObjectStoragePlanSelector";

const COUNTRY_OPTIONS = [{ value: "US", label: "United States (US)" }];

const initialFormState = {
  countryCode: "US",
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

const generateProfileId = () => `profile_${Math.random().toString(36).slice(2, 10)}`;

const createServiceProfile = () => ({
  id: generateProfileId(),
  name: "",
  region: "",
  tierKey: "",
  months: "12",
  unitPriceOverride: "",
});

const getPricingRegionCode = (pricing: any) =>
  pricing.region ||
  pricing.product?.region ||
  pricing.product?.region_code ||
  pricing.product?.provider_region ||
  pricing.product?.location ||
  "";

const GLOBAL_TIER_KEY = "__all__";

const makeTierKey = (regionKey: any, pricing: any) => {
  const baseId =
    pricing.productable_id ??
    pricing.product_id ??
    pricing.id ??
    pricing.product?.productable_id ??
    pricing.product?.id ??
    pricing.provider_resource_id ??
    pricing.product_name ??
    "";
  const normalizedRegion = regionKey?.toLowerCase().trim() || "region";
  const normalizedId =
    String(baseId || "").trim() || pricing.id || Math.random().toString(36).slice(2, 10);
  return `${normalizedRegion}::${normalizedId}`;
};
const OBJECT_STORAGE_KEYWORDS = ["object_storage", "object storage"];

const toLowerCaseStrings = (values = []) =>
  values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        (typeof value === "string" || typeof value === "number")
    )
    .map((value: any) => value.toString().toLowerCase().trim())
    .filter(Boolean);

const includesObjectStorageKeyword = (candidates = []) =>
  candidates.some((value) => OBJECT_STORAGE_KEYWORDS.some((keyword) => value.includes(keyword)));

const isObjectStoragePricing = (pricing: any) => {
  if (!pricing || typeof pricing !== "object") {
    return false;
  }

  const typeCandidates = toLowerCaseStrings([
    pricing.productable_type,
    pricing.product_type,
    pricing.productableType,
    pricing.productable_type,
    pricing.product?.productable_type,
    pricing.product?.product_type,
    pricing.product?.productable?.type,
    pricing.product?.service_type,
    pricing.product?.service_category,
  ]);

  if (includesObjectStorageKeyword(typeCandidates)) {
    return true;
  }

  if (pricing.product?.object_storage || pricing.object_storage_configuration) {
    return true;
  }

  const nameCandidates = toLowerCaseStrings([
    pricing.product?.name,
    pricing.product_name,
    pricing.product?.product_name,
    pricing.provider_resource_id,
  ]);

  if (nameCandidates.some((value) => value.includes("object storage"))) {
    return true;
  }

  return false;
};
const resolveTierUnitPrice = (tier: any) => {
  if (!tier) return 0;
  const candidates = [
    tier.price_local,
    tier.price_usd,
    tier.price,
    tier.total_price,
    tier.pricing?.price_local,
    tier.pricing?.price_usd,
    tier.pricing?.price,
    tier.pricing?.total_price,
  ];
  for (const value of candidates) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return 0;
};
const resolveTierCurrency = (tier, fallback = "USD") => {
  if (!tier) return fallback;
  const candidates = [
    tier.currency,
    tier.price_currency,
    tier.currency_code,
    tier.currencyCode,
    tier.pricing?.currency,
    tier.pricing?.currency_code,
    tier.pricing?.currencyCode,
  ];
  for (const value of candidates) {
    if (value) return value.toString().toUpperCase();
  }
  return fallback;
};
const getRegionCode = (region: any) => {
  if (!region) return "";
  return (
    region.code ||
    region.region_code ||
    region.region ||
    region.identifier ||
    region.slug ||
    region.id ||
    ""
  ).toString();
};
const buildTierLabel = (pricing, currencyOverride, selectedCurrency) => {
  if (!pricing) return "Object storage tier";
  const name =
    pricing.product?.name ||
    pricing.product_name ||
    pricing.product?.product_name ||
    pricing.provider_resource_id ||
    `Tier ${pricing.productable_id ?? pricing.id ?? ""}`.trim();
  const quota =
    pricing.product?.object_storage?.quota_gb ??
    pricing.product?.productable?.quota_gb ??
    pricing.quota_gb ??
    pricing.quota ??
    null;
  const price = resolveTierUnitPrice(pricing);
  const tierCurrency = resolveTierCurrency(pricing);
  const currency = currencyOverride || tierCurrency;
  const parts = [name];
  if (quota) {
    parts.push(`${quota} GiB`);
  }
  if (price) {
    const mainLabel = `${currency} ${price.toFixed(2)}`;
    // Temporary: if user selected a different currency but backend only returned USD, annotate it
    if (selectedCurrency && currency && selectedCurrency !== currency) {
      parts.push(`${selectedCurrency} (${mainLabel})`);
    } else {
      parts.push(mainLabel);
    }
  }
  return parts.join(" • ");
};
const getTierDisplayName = (pricing: any) =>
  pricing?.product?.name ||
  pricing?.product_name ||
  pricing?.product?.product_name ||
  pricing?.provider_resource_id ||
  "";

const formatCurrency = (amount: any, currency: any) => {
  const numericAmount = Number(amount) || 0;
  if (!currency) {
    return numericAmount.toFixed(2);
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(numericAmount);
  } catch (error) {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
};
const normalizePaymentOptions = (options: any) => {
  if (!options) return null;
  if (typeof options === "string") {
    try {
      return JSON.parse(options);
    } catch (error) {
      return null;
    }
  }
  if (typeof options === "object") {
    return options;
  }
  return null;
};
const normalizeCountryCandidate = (value: any) => {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  return "";
};
const matchCountryFromOptions = (value: any) => {
  if (value === null || value === undefined) return "";
  const normalized = normalizeCountryCandidate(value);
  if (normalized) return normalized;

  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();

  const match = COUNTRY_OPTIONS.find((option) => {
    if (!option) return false;
    if (typeof option.value === "string" && option.value.toLowerCase() === lower) {
      return true;
    }
    if (typeof option.label === "string") {
      const labelLower = option.label.toLowerCase();
      if (labelLower === lower) {
        return true;
      }
      const bracketIndex = option.label.indexOf("(");
      if (bracketIndex >= 0) {
        const prefix = option.label.slice(0, bracketIndex).trim().toLowerCase();
        if (prefix === lower) {
          return true;
        }
      }
    }
    return false;
  });

  return match?.value ? String(match.value).toUpperCase() : "";
};
const resolveCountryCodeFromEntity = (entity: any) => {
  if (!entity) return "";
  const candidates = [
    entity.country_code,
    entity.countryCode,
    entity.country_iso,
    entity.countryIso,
    entity.country,
    entity.billing_country_code,
    entity.billingCountryCode,
    entity.billing_country,
    entity.billingCountry,
    entity.billing?.country_code,
    entity.billing?.countryCode,
    entity.billing?.country,
    entity.location?.country_code,
    entity.location?.countryCode,
    entity.address?.country_code,
    entity.address?.countryCode,
    entity.profile?.country_code,
    entity.profile?.countryCode,
    entity.metadata?.country_code,
    entity.metadata?.countryCode,
    entity.primary_contact?.country_code,
    entity.primary_contact?.countryCode,
    entity.contact?.country_code,
    entity.contact?.countryCode,
    entity.tenant_country_code,
    entity.tenant_country,
    entity.tenant?.country_code,
    entity.tenant?.country,
    entity.settings?.country_code,
    entity.settings?.country,
  ];

  for (const candidate of candidates) {
    const code = matchCountryFromOptions(candidate);
    if (code) {
      return code;
    }
  }

  return "";
};
const AdminObjectStorageCreate = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const [formData, setFormData] = useState(initialFormState);
  const [isCountryLocked, setIsCountryLocked] = useState(false);
  const [serviceProfiles, setServiceProfiles] = useState([createServiceProfile()]);

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

  // const [assignmentType, setAssignmentType] = useState("");
  // const [assignmentTenantId, setAssignmentTenantId] = useState("");
  // const [assignmentUserId, setAssignmentUserId] = useState("");
  const [errors, setErrors] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

  const { refreshAccounts } = useObjectStorage();
  const [lastOrderSummary, setLastOrderSummary] = useState(null);
  const isLastStep = activeStep === steps.length - 1;
  const isFirstStep = activeStep === 0;

  const { data: regions = [], isFetching: isRegionsLoading } = useFetchRegions();
  // const { data: tenants = [], isFetching: isTenantsLoading } = useFetchTenants();
  // const { data: clients = [], isFetching: isClientsLoading } = useFetchClients();
  const { data: sharedCountries = [], isFetching: isCountriesLoading } = useFetchCountries();
  const selectedCountryCode = useMemo(
    () => (formData.countryCode || "").toUpperCase(),
    [formData.countryCode]
  );
  const resolveCurrencyForCountry = useMemo(() => {
    return (code) => {
      if (!code || !Array.isArray(sharedCountries)) {
        return "USD";
      }
      const match = sharedCountries.find((country) => {
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
  const paymentOptions =
    lastOrderSummary?.payment?.payment_gateway_options ||
    lastOrderSummary?.transaction?.payment_gateway_options ||
    lastOrderSummary?.paymentOptions?.payment_gateway_options ||
    [];
  const paymentPayloadForModal = lastOrderSummary?.payment
    ? { ...lastOrderSummary.payment, payment_gateway_options: paymentOptions }
    : { payment_gateway_options: paymentOptions };
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const transactionStatus = (lastOrderSummary?.transaction?.status || "").toLowerCase();
  const isPaymentComplete =
    transactionStatus === "successful" ||
    transactionStatus === "completed" ||
    transactionStatus === "paid";
  const isPaymentFailed = transactionStatus === "failed";
  const adminToken = useAdminAuthStore.getState()?.token || null;

  // Load Paystack when payment options are available
  useEffect(() => {
    if (!paymentOptions.length) return;
    if (typeof window !== "undefined" && window.PaystackPop) return;
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [paymentOptions.length]);

  const regionMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(regions) ? regions : []).forEach((region: any) => {
      const code = getRegionCode(region);
      if (code) {
        map.set(code.toLowerCase(), region);
      }
    });
    return map;
  }, [regions]);

  const regionOptions = useMemo(() => {
    const seen = new Set();
    return (Array.isArray(regions) ? regions : [])
      .map((region: any) => {
        const code = getRegionCode(region);
        if (!code) return null;
        const lower = code.toLowerCase();
        if (seen.has(lower)) return null;
        seen.add(lower);
        const name =
          region.name || region.display_name || region.region_name || region.provider_label || code;
        const label =
          name && name.toLowerCase() !== code.toLowerCase() ? `${name} (${code})` : name || code;
        return { value: code, label };
      })
      .filter(Boolean);
  }, [regions]);

  const { data: tierPricingPayload = [], isFetching: isPricingLoading } = useFetchProductPricing(
    primaryRegion,
    "object_storage_configuration",
    {
      enabled: Boolean(primaryRegion),
      countryCode: effectiveCountryCode,
    }
  );

  const tierCatalog = useMemo(() => {
    const rawRows = Array.isArray(tierPricingPayload) ? tierPricingPayload : [];
    const catalog = new Map();

    rawRows.forEach((row: any) => {
      const product = row?.product || {};
      const effectivePricing = row?.pricing?.effective || {};
      const regionCodeRaw = product.region || row?.region || product.region_code || GLOBAL_TIER_KEY;
      const regionKey = regionCodeRaw?.toString().toLowerCase().trim() || GLOBAL_TIER_KEY;
      const key = makeTierKey(regionKey, {
        productable_type: product.productable_type,
        productable_id: product.productable_id,
      });
      const ensureBucket = (bucketKey: any) => {
        if (!catalog.has(bucketKey)) {
          catalog.set(bucketKey, {
            options: [],
            map: new Map(),
          });
        }
        return catalog.get(bucketKey);
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
      .filter(Boolean);
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
      .filter(Boolean);
  }, [userPool]);

  const filteredClientOptions = useMemo(() => {
    if (!selectedTenantId) {
      return clientOptions;
    }
    return clientOptions.filter((client: any) =>
      client.tenantId ? client.tenantId === String(selectedTenantId) : true
    );
  }, [clientOptions, selectedTenantId]);

  const resolveTenantName = (tenantId: any) => {
    if (!tenantId) return "";
    const match = tenantOptions.find((tenant) => tenant.value === String(tenantId));
    return match?.label || "";
  };
  const determineTierCurrency = (tier: any) => {
    // Prefer explicit currency on tier; fallback to USD if only USD is present
    const resolved = resolveTierCurrency(tier);
    if (resolved) return resolved;
    return "USD";
  };
  const resolveClientName = (clientId: any) => {
    if (!clientId) return "";
    const match = clientOptions.find((client) => client.value === String(clientId));
    return match?.label || "";
  };
  const assignmentLabel = useMemo(() => {
    if (contextType === "tenant") {
      return resolveTenantName(selectedTenantId) || "Tenant order";
    }
    if (contextType === "user") {
      return resolveClientName(selectedUserId) || "Client order";
    }
    return "Internal order";
  }, [contextType, selectedTenantId, selectedUserId, tenantOptions, clientOptions]);

  const resolvedProfiles = useMemo(() => {
    return serviceProfiles.map((profile: any) => {
      const regionTrimmed = profile.region.trim();
      const regionKey = regionTrimmed.toLowerCase();
      const regionData = regionTrimmed ? regionMap.get(regionKey) || null : null;
      const regionBucket = regionKey ? tierCatalog.get(regionKey) : null;
      const fallbackBucket = tierCatalog.get(GLOBAL_TIER_KEY);
      const catalogEntry = regionBucket || fallbackBucket;
      const usingFallbackCatalog = Boolean(regionKey && !regionBucket && fallbackBucket);
      const tierRow = catalogEntry?.map?.get(profile.tierKey.trim()) || null;
      const fallbackUnitPrice = resolveTierUnitPrice(tierRow);
      const overrideValue = Number(profile.unitPriceOverride);
      const hasOverride =
        profile.unitPriceOverride !== "" && Number.isFinite(overrideValue) && overrideValue > 0;
      const unitPrice = hasOverride ? overrideValue : fallbackUnitPrice;
      const safeUnitPrice = Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
      const months = Math.max(1, Number(profile.months) || 0);
      const quantity = 1;
      const subtotal = quantity * months * safeUnitPrice;
      const currency = determineTierCurrency(tierRow) || selectedCurrency || "USD";
      const tierName = getTierDisplayName(tierRow) || "";

      return {
        ...profile,
        region: regionTrimmed,
        regionKey,
        regionData,
        tierOptions: catalogEntry?.options ?? [],
        usingFallbackCatalog,
        tierRow,
        fallbackUnitPrice,
        unitPrice: safeUnitPrice,
        months,
        quantity,
        subtotal,
        currency,
        hasTierData: Boolean(tierRow),
        tierName: tierName || profile.tierName || "",
      };
    });
  }, [serviceProfiles, regionMap, tierCatalog]);

  const profileDerivedMap = useMemo(() => {
    const map = new Map();
    resolvedProfiles.forEach((profile: any) => {
      map.set(profile.id, profile);
    });
    return map;
  }, [resolvedProfiles]);

  const summaryCurrency =
    selectedCurrency || resolvedProfiles.find((profile) => profile.currency)?.currency || "USD";

  const taxRateValue = 0;

  const subtotal = resolvedProfiles.reduce((sum, profile) => sum + profile.subtotal, 0);
  const tax = subtotal * (taxRateValue / 100);
  const total = subtotal + tax;

  const summaryTotals = {
    subtotal,
    tax,
    total,
    currency: summaryCurrency,
    taxRate: taxRateValue,
  };
  const backendPricingTotals = useMemo(() => {
    const raw =
      lastOrderSummary?.transaction?.metadata?.pricing_breakdown ||
      lastOrderSummary?.order?.pricing_breakdown ||
      null;
    if (!raw) return null;
    const rawSubtotal = Number(raw.pre_discount_subtotal ?? raw.subtotal ?? 0);
    const rawTax = Number(raw.tax ?? 0);
    let taxRate = Number(raw.tax_rate ?? raw.applied_tax_rate ?? 0);
    if (!taxRate && rawSubtotal > 0 && rawTax > 0) {
      taxRate = Number(((rawTax / rawSubtotal) * 100).toFixed(2));
    }
    return {
      subtotal: rawSubtotal,
      tax: rawTax,
      total: Number(raw.total ?? raw.pre_discount_subtotal ?? 0),
      currency: raw.currency || summaryTotals.currency,
      taxRate,
    };
  }, [lastOrderSummary, summaryTotals.currency]);

  const displayedTotals = backendPricingTotals || summaryTotals;

  const selectedGatewayFee = Number(
    selectedPaymentOption?.charge_breakdown?.total_fees ??
      selectedPaymentOption?.total_fees ??
      selectedPaymentOption?.fees ??
      lastOrderSummary?.transaction?.transaction_fee ??
      lastOrderSummary?.transaction?.third_party_fee ??
      0
  );
  const grandTotalWithFees = (displayedTotals.total || 0) + selectedGatewayFee;

  const backendPricingLines = useMemo(() => {
    const raw =
      lastOrderSummary?.transaction?.metadata?.pricing_breakdown ||
      lastOrderSummary?.order?.pricing_breakdown ||
      null;
    const lines = Array.isArray(raw?.lines) ? raw.lines : [];
    if (!lines.length) return null;
    return lines.map((line, index) => {
      const currency = line.currency || raw?.currency || displayedTotals.currency;
      return {
        id: line.slug || line.name || index,
        region: line.region || line.region_code || "",
        name: line.name || line.label || "Object storage tier",
        months: line.months || line.term || null,
        subtotal: Number(line.total_local ?? line.total ?? 0),
        unitPrice: Number(line.unit_price ?? line.price ?? 0),
        currency,
      };
    });
  }, [lastOrderSummary, displayedTotals.currency]);

  const hasCurrencyMismatch = resolvedProfiles.some(
    (profile) => profile.currency && profile.currency !== summaryTotals.currency
  );

  const primaryProfile = resolvedProfiles[0];

  const fallbackPlanLabel = useMemo(() => {
    const tierName = getTierDisplayName(primaryProfile?.tierRow) || "Object storage tier";
    if (contextType) {
      return `${assignmentLabel} • ${tierName}`;
    }
    return tierName;
  }, [primaryProfile, contextType, assignmentLabel]);

  const countryOptions = useMemo(() => {
    const apiCountries = Array.isArray(sharedCountries) ? sharedCountries : [];
    if (apiCountries.length > 0) {
      const mapped = apiCountries
        .map((item: any) => {
          const code =
            normalizeCountryCandidate(
              item?.code ||
                item?.iso2 ||
                item?.country_code ||
                item?.iso_code ||
                item?.iso ||
                item?.id ||
                item?.country ||
                ""
            ) || "";
          if (!code) return null;
          const upper = code.toUpperCase();
          const name = item?.name || item?.country_name || item?.country || upper;
          return {
            value: upper,
            label:
              name && name.toLowerCase() !== upper.toLowerCase() ? `${name} (${upper})` : upper,
            currency:
              item?.currency_code ||
              item?.currency ||
              item?.currencyCode ||
              item?.currency_symbol ||
              item?.currencySymbol ||
              "USD",
          };
        })
        .filter(Boolean);

      const hasUS = mapped.some(
        (option) => option?.value && String(option.value).toUpperCase() === "US"
      );
      return hasUS ? mapped : [{ value: "US", label: "United States (US)" }, ...mapped];
    }

    return [...COUNTRY_OPTIONS];
  }, [formData.countryCode, sharedCountries]);

  const billingCountryHelper = useMemo(() => {
    if (contextType === "tenant") {
      if (!selectedTenantId) {
        return "Optional. Leave empty to bill in USD by default.";
      }
      return isCountryLocked
        ? "Synced from the tenant's profile."
        : "Tenant has no billing country on file; set it manually or leave empty for USD.";
    }
    if (contextType === "user") {
      if (!selectedTenantId) {
        return "Optional. Leave empty to bill in USD by default.";
      }
      if (!selectedUserId) {
        return isCountryLocked
          ? "Using the tenant's billing country while you select a user."
          : "Select a user or choose a country manually (empty defaults to USD).";
      }
      return isCountryLocked
        ? "Synced from the user's profile."
        : "No billing country found; adjust manually or leave empty for USD.";
    }
    return "Optional. Leave empty to bill in USD by default.";
  }, [contextType, selectedTenantId, selectedUserId, isCountryLocked]);

  useEffect(() => {
    const applyAutoCountry = (code: any) => {
      if (!code) {
        setIsCountryLocked(false);
        return;
      }
      const normalized =
        matchCountryFromOptions(code) ||
        normalizeCountryCandidate(code) ||
        String(code).toUpperCase();
      if (!normalized) {
        setIsCountryLocked(false);
        return;
      }
      const nextCode = normalized.toUpperCase();
      setIsCountryLocked(true);
      if (nextCode === (formData.countryCode || "")) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        countryCode: nextCode,
      }));
      setErrors((prev) => ({
        ...prev,
        countryCode: null,
      }));
    };
    if (contextType === "tenant") {
      if (!selectedTenantId) {
        setIsCountryLocked(false);
        return;
      }
      const tenantEntry = tenantOptions.find((option) => option.value === String(selectedTenantId));
      const tenantCountry = resolveCountryCodeFromEntity(tenantEntry?.raw);
      if (tenantCountry) {
        applyAutoCountry(tenantCountry);
      } else {
        setIsCountryLocked(false);
      }
      return;
    }

    if (contextType === "user") {
      if (!selectedTenantId && !selectedUserId) {
        setIsCountryLocked(false);
        return;
      }

      const userEntry = clientOptions.find((client) => client.value === String(selectedUserId));
      let detectedCountry = resolveCountryCodeFromEntity(userEntry?.raw);

      if (!detectedCountry && selectedTenantId) {
        const tenantEntry = tenantOptions.find(
          (option) => option.value === String(selectedTenantId)
        );
        detectedCountry = resolveCountryCodeFromEntity(tenantEntry?.raw);
      }

      if (detectedCountry) {
        applyAutoCountry(detectedCountry);
      } else {
        setIsCountryLocked(false);
      }
      return;
    }

    setIsCountryLocked(false);
  }, [
    contextType,
    selectedTenantId,
    selectedUserId,
    tenantOptions,
    clientOptions,
    formData.countryCode,
  ]);

  const updateForm = (field: any, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: null,
    }));
  };
  const updateProfile = (profileId: any, updater: any) => {
    setServiceProfiles((prev) =>
      prev.map((profile: any) => {
        if (profile.id !== profileId) return profile;
        const updates = typeof updater === "function" ? updater(profile) : updater;
        return { ...profile, ...updates };
      })
    );
    setProfileErrors((prev) => {
      if (!prev[profileId]) return prev;
      const next = { ...prev };
      delete next[profileId];
      return next;
    });
  };
  const addServiceProfile = () => {
    setServiceProfiles((prev) => [...prev, createServiceProfile()]);
    setErrors((prev) => {
      if (!prev.serviceProfiles) return prev;
      const next = { ...prev };
      delete next.serviceProfiles;
      return next;
    });
  };
  const removeServiceProfile = (profileId: any) => {
    setServiceProfiles((prev) => prev.filter((profile: any) => profile.id !== profileId));
    setProfileErrors((prev) => {
      if (!prev[profileId]) return prev;
      const next = { ...prev };
      delete next[profileId];
      return next;
    });
  };
  const handleRegionChange = (profileId: any, nextRegion: any) => {
    const normalizedRegion = (nextRegion || "").trim();
    updateProfile(profileId, {
      region: normalizedRegion,
      tierKey: "",
      unitPriceOverride: "",
    });
  };
  const handleTierChange = (profileId: any, nextTierKey: any) => {
    updateProfile(profileId, (current) => {
      const normalizedKey = (nextTierKey || "").trim();
      const regionKey = current.region.trim().toLowerCase();
      const catalogEntry = regionKey
        ? tierCatalog.get(regionKey) || tierCatalog.get(GLOBAL_TIER_KEY)
        : tierCatalog.get(GLOBAL_TIER_KEY);
      const tierRow = catalogEntry?.map?.get(normalizedKey) || null;
      const defaultPrice = resolveTierUnitPrice(tierRow);
      return {
        tierKey: normalizedKey,
        unitPriceOverride: defaultPrice > 0 ? defaultPrice.toFixed(2) : "",
        tierName: getTierDisplayName(tierRow) || current.tierName || "",
      };
    });
  };
  const handleProfileNameChange = (profileId: any, value: any) => {
    updateProfile(profileId, { name: value });
  };
  const handleMonthsChange = (profileId: any, value: any) => {
    updateProfile(profileId, { months: value });
  };
  const handleUnitPriceChange = (profileId: any, value: any) => {
    updateProfile(profileId, { unitPriceOverride: value });
  };
  const handleModeChange = (nextMode: any) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setSearchParams((prevParams) => {
      const params = new URLSearchParams(prevParams);
      if (nextMode === "fast-track") {
        params.set("mode", "fast-track");
      } else {
        params.delete("mode");
      }
      return params;
    });
  };
  const goToStep = (stepIndex: any) => {
    const safeIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1);
    setActiveStep(safeIndex);
  };
  const validateWorkflowStep = () => {
    const workflowErrors = {};

    if (contextType === "tenant" && !selectedTenantId) {
      workflowErrors.assignment = "Select the tenant for this request.";
    }
    if (contextType === "user") {
      if (!selectedTenantId) {
        workflowErrors.assignment = "Select the tenant before choosing a user.";
      } else if (!selectedUserId) {
        workflowErrors.assignment = "Select the user to charge for this request.";
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      ["countryCode", "assignment"].forEach((key: any) => {
        if (!(key in workflowErrors)) {
          delete next[key];
        }
      });
      return { ...next, ...workflowErrors };
    });

    return Object.keys(workflowErrors).length === 0;
  };
  const validateServiceStep = () => {
    const nextErrors = {};
    const nextProfileErrors = {};

    if (serviceProfiles.length === 0) {
      nextErrors.serviceProfiles = "Add at least one service profile.";
    }

    resolvedProfiles.forEach((profile: any) => {
      const profileErrs = {};
      if (!profile.region) {
        profileErrs.region = "Select a region.";
      }
      if (!profile.tierKey) {
        profileErrs.tierKey = "Select an object storage tier.";
      } else if (!profile.hasTierData) {
        profileErrs.tierKey = "Pricing unavailable for the selected tier.";
      }
      if (!profile.months || profile.months < 1) {
        profileErrs.months = "Term must be at least 1 month.";
      }
      if (!Number.isFinite(profile.unitPrice) || profile.unitPrice <= 0) {
        profileErrs.unitPrice = "Enter or override the monthly price.";
      }
      if (Object.keys(profileErrs).length) {
        nextProfileErrors[profile.id] = profileErrs;
      }
    });

    setErrors((prev) => {
      const next = { ...prev };
      if (!nextErrors.serviceProfiles) {
        delete next.serviceProfiles;
      }
      return { ...next, ...nextErrors };
    });
    setProfileErrors(nextProfileErrors);

    return Object.keys(nextErrors).length === 0 && Object.keys(nextProfileErrors).length === 0;
  };
  const handleNextStep = async () => {
    const stepId = steps[activeStep]?.id;
    let isValid = true;

    if (stepId === "workflow") {
      isValid = validateWorkflowStep();
    } else if (stepId === "services") {
      isValid = validateServiceStep();
    } else if (stepId === "payment") {
      const hasPaymentOptions =
        lastOrderSummary?.payment?.payment_gateway_options?.length ||
        lastOrderSummary?.transaction?.payment_gateway_options?.length ||
        lastOrderSummary?.paymentOptions?.payment_gateway_options?.length;
      if (!hasPaymentOptions) {
        ToastUtils.error("Generate payment options before continuing.");
        return;
      }
    } else {
      isValid = validate();
    }

    if (!isValid) return;
    if (isLastStep) return;

    const nextStep = steps[activeStep + 1];
    if (nextStep?.id === "payment" && !isFastTrack) {
      try {
        setIsGeneratingPayment(true);
        await handleGeneratePaymentOptions();
      } catch (error) {
        ToastUtils.error(error?.message || "Unable to generate payment options.");
        setIsGeneratingPayment(false);
        return;
      }
      setIsGeneratingPayment(false);
    }

    if (nextStep?.id === "review" && !isFastTrack && !isPaymentComplete) {
      ToastUtils.error("Please complete payment to continue to review.");
      return;
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handlePreviousStep = () => {
    if (isFirstStep) return;
    setActiveStep((prev) => Math.max(prev - 1, 0));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const validate = () => {
    const nextErrors = {};
    const nextProfileErrors = {};

    if (serviceProfiles.length === 0) {
      nextErrors.serviceProfiles = "Add at least one service profile.";
    }

    if (contextType === "tenant" && !selectedTenantId) {
      nextErrors.assignment = "Select the tenant for this request.";
    }
    if (contextType === "user") {
      if (!selectedTenantId) {
        nextErrors.assignment = "Select the tenant before choosing a user.";
      } else if (!selectedUserId) {
        nextErrors.assignment = "Select the user to charge for this request.";
      }
    }

    resolvedProfiles.forEach((profile: any) => {
      const profileErrs = {};
      if (!profile.region) {
        profileErrs.region = "Select a region.";
      }
      if (!profile.tierKey) {
        profileErrs.tierKey = "Select an object storage tier.";
      } else if (!profile.hasTierData) {
        profileErrs.tierKey = "Pricing unavailable for the selected tier.";
      }
      if (!profile.months || profile.months < 1) {
        profileErrs.months = "Term must be at least 1 month.";
      }
      if (!Number.isFinite(profile.unitPrice) || profile.unitPrice <= 0) {
        profileErrs.unitPrice = "Enter or override the monthly price.";
      }
      if (Object.keys(profileErrs).length) {
        nextProfileErrors[profile.id] = profileErrs;
      }
    });

    setErrors(nextErrors);
    setProfileErrors(nextProfileErrors);

    return Object.keys(nextErrors).length === 0 && Object.keys(nextProfileErrors).length === 0;
  };
  const resetForm = () => {
    setFormData(initialFormState);
    setIsCountryLocked(false);
    setServiceProfiles([createServiceProfile()]);
    setContextType("");
    setSelectedTenantId("");
    setSelectedUserId("");
    setErrors({});
    setProfileErrors({});
  };
  useEffect(() => {
    if (lastOrderSummary?.fastTrack) {
      goToStep(steps.length - 1);
    }
  }, [lastOrderSummary, steps.length]);

  useEffect(() => {
    // Reset selected payment option when new options arrive or transaction changes
    setSelectedPaymentOption(null);
  }, [paymentOptions, lastOrderSummary?.transaction?.id]);

  // When billing country changes, clear selected tiers/prices so user reselects with the new pricing context
  useEffect(() => {
    setServiceProfiles((prev) =>
      prev.map((profile: any) => ({
        ...profile,
        tierKey: "",
        unitPriceOverride: "",
      }))
    );
    setProfileErrors({});
  }, [selectedCountryCode]);

  const submitOrder = async (event, fastTrackOverride, options = {}) => {
    if (event) {
      event.preventDefault();
    }
    if (!validate()) return;
    const submissionFastTrack =
      typeof fastTrackOverride === "boolean" ? fastTrackOverride : isFastTrack;

    setIsSubmitting(true);
    try {
      const derivedCustomerType =
        contextType === "tenant" ? "tenant" : contextType === "user" ? "tenant_client" : "tenant";
      const customerName = contextType ? assignmentLabel : "";
      const customerEmail =
        contextType === "user"
          ? (() => {
              const match = clientOptions.find((client) => client.value === selectedUserId);
              return match?.raw?.email || "";
            })()
          : "";
      const lineItems = resolvedProfiles.map((profile: any) => {
        const tierName =
          profile.name || getTierDisplayName(profile.tierRow) || "Object storage tier";
        const rawTierId =
          profile.tierRow?.productable_id ??
          profile.tierRow?.product_id ??
          profile.tierRow?.id ??
          profile.tierRow?.product?.productable_id ??
          profile.tierRow?.product?.id ??
          profile.tierKey;
        return {
          id: profile.id,
          name: profile.name || "",
          region: profile.region,
          tierKey: profile.tierKey,
          tierId: rawTierId ? String(rawTierId) : "",
          tierName,
          months: Number(profile.months) || 0,
          quantity: Number(profile.quantity) || 1,
          currency: profile.currency,
          unitPrice: Number(profile.unitPrice.toFixed(2)),
          subtotal: Number(profile.subtotal.toFixed(2)),
        };
      });

      const primaryLine = lineItems[0] || {};
      const aggregatedUnitPrice = primaryLine.unitPrice !== undefined ? primaryLine.unitPrice : 0;
      if (!lineItems.length) {
        throw new Error("Add at least one eligible service profile before submitting.");
      }

      const tenantIdForRequest =
        contextType === "tenant" || contextType === "user" ? selectedTenantId || null : null;
      const userIdForRequest = contextType === "user" ? selectedUserId || null : null;

      const objectStorageItems = lineItems.map((line, index) => {
        const productableId = Number.parseInt(line.tierId, 10);
        if (!Number.isFinite(productableId)) {
          throw new Error(
            "Unable to resolve the selected object storage tier. Please refresh pricing and try again."
          );
        }

        return {
          region: line.region,
          productable_id: productableId,
          quantity: line.quantity || 1,
          months: line.months || 1,
          name: line.name || line.tierName || `Object storage ${line.region}`,
          metadata: {
            ui_profile_id: line.id,
            tier_key: line.tierKey,
            tier_name: line.tierName,
            line_name: line.name || line.tierName,
            currency: selectedCurrency || line.currency || summaryTotals.currency,
            unit_price: line.unitPrice,
            subtotal: line.subtotal,
            assignment: {
              type: contextType || "unassigned",
              label: assignmentLabel,
              tenant_id: tenantIdForRequest,
              user_id: userIdForRequest,
            },
            customer: {
              type: derivedCustomerType,
              name: customerName,
              email: customerEmail,
            },
            workflow_mode: isFastTrack ? "fast_track" : "standard",
            billing_country: formData.countryCode,
            line_index: index,
          },
        };
      });

      const requestPayload = {
        object_storage_items: objectStorageItems,
        country_iso: effectiveCountryCode.toUpperCase(),
        fast_track: submissionFastTrack,
      };
      if (tenantIdForRequest) {
        requestPayload.tenant_id = tenantIdForRequest;
      }
      if (userIdForRequest) {
        requestPayload.user_id = userIdForRequest;
      }
      const response = await objectStorageApi.createOrder(requestPayload);
      const toastMessage =
        response?.message ||
        (isFastTrack
          ? "Fast-track request scheduled for provisioning."
          : "Object storage plan recorded successfully.");
      const transaction = response?.data?.transaction || null;
      const order = response?.data?.order || null;
      const reference = transaction?.identifier;

      ToastUtils.success(
        toastMessage,
        reference
          ? {
              description: `Reference ${reference}`,
            }
          : undefined
      );

      const paymentPayload = response?.data?.payment || null;
      const normalizedPaymentOptions =
        normalizePaymentOptions(
          paymentPayload?.payment_gateway_options || transaction?.payment_gateway_options
        ) || [];
      const paymentState = paymentPayload
        ? { ...paymentPayload, payment_gateway_options: normalizedPaymentOptions }
        : { payment_gateway_options: normalizedPaymentOptions };
      setLastOrderSummary({
        transaction,
        order,
        payment: paymentState,
        paymentOptions: paymentState,
        fastTrack: submissionFastTrack,
        serviceProfiles: resolvedProfiles,
        order_items: lineItems,
      });

      try {
        await refreshAccounts();
      } catch (refreshError) {
        console.warn("Unable to refresh accounts after order creation", refreshError);
      }

      // After successful fast-track, redirect to the new account details page
      if (submissionFastTrack) {
        // Try to get account ID from response
        const accountId =
          response?.data?.account?.id ||
          response?.data?.accounts?.[0]?.id ||
          response?.data?.object_storage_account_id;

        if (accountId) {
          // Navigate to the new account's details page after a short delay
          setTimeout(() => {
            navigate(`/admin-dashboard/object-storage/${accountId}`);
          }, 1500);
        } else {
          // Fallback: navigate to object storage list
          setTimeout(() => {
            navigate("/admin-dashboard/object-storage");
          }, 1500);
        }
        return; // Skip form reset since we're navigating away
      }

      if (!options.skipReset) {
        resetForm();
        setMode(submissionFastTrack ? "fast-track" : "standard");
      }
    } catch (error) {
      console.error("Failed to submit object storage order", error);
      const message = error?.message || "Unable to create the object storage record.";
      ToastUtils.error(message, {
        description: "Please retry or verify the captured details.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (event: any) => submitOrder(event, false);
  const handleFastTrackSubmit = (event: any) => submitOrder(event, true);
  const handleGeneratePaymentOptions = (event: any) =>
    submitOrder(event, false, { skipReset: true });

  const handlePaystackCard = (option: any) => {
    if (!option?.transaction_reference) {
      ToastUtils.info("Transaction reference is missing for this payment option.");
      return;
    }
    const paystackKey = import.meta.env.VITE_PAYSTACK_KEY;
    if (!paystackKey) {
      ToastUtils.info("Paystack public key missing. Contact support.");
      return;
    }
    if (
      typeof window === "undefined" ||
      !window.PaystackPop ||
      typeof window.PaystackPop.setup !== "function"
    ) {
      ToastUtils.info("Unable to initialize Paystack. Please try again.");
      return;
    }
    try {
      const amountMinorUnits = Math.round(Number(option.total || option.amount || 0) * 100);
      if (!Number.isFinite(amountMinorUnits) || amountMinorUnits <= 0) {
        ToastUtils.error("Invalid payment amount from gateway option.");
        return;
      }
      const { user: adminUser, userEmail: adminUserEmail } = useAdminAuthStore.getState();
      const payerEmail =
        option?.customer_email ||
        lastOrderSummary?.transaction?.user?.email ||
        adminUser?.email ||
        adminUserEmail;
      if (!payerEmail) {
        ToastUtils.info("Missing payer email. Please refresh and try again.");
        return;
      }
      const popup = window.PaystackPop.setup({
        key: paystackKey,
        email: payerEmail,
        amount: amountMinorUnits,
        reference: option.transaction_reference,
        channels: ["card"],
        onSuccess: (response) => {
          ToastUtils.success("Payment completed via Paystack.");
          setLastOrderSummary((prev) => ({
            ...(prev || {}),
            transaction: {
              ...(prev?.transaction || {}),
              status: "successful",
              gateway_response: response,
            },
          }));
        },
        onCancel: () => {
          ToastUtils.info("Payment cancelled.");
        },
        onError: (error) => {
          console.error("Payment failed:", error);
          ToastUtils.error("Card payment failed. Please try again.");
        },
      });
      popup.openIframe();
    } catch (error) {
      console.error("Failed to initialize Paystack", error);
      ToastUtils.error("Unable to initiate Paystack payment.");
    }
  };
  const renderModeSwitch = () => (
    <ObjectStoragePlanSelector
      mode={mode}
      onModeChange={handleModeChange}
      onBack={() => navigate(-1)}
      enableFastTrack
      standardDescription="Process storage payment and capture billing details."
      fastTrackDescription="Skip payment collection and start provisioning immediately."
      onStandardPlan={() => handleModeChange("standard")}
      onFastTrack={() => handleModeChange("fast-track")}
      standardLabel="Process Storage Payment"
      fastTrackLabel="Fast-track Provisioning"
    />
  );

  const renderPaymentSummary = () => {
    if (!lastOrderSummary) return null;
    const { transaction, order, paymentOptions, fastTrack } = lastOrderSummary;
    const amount = transaction?.amount ?? order?.total ?? 0;
    const currency = transaction?.currency ?? order?.currency ?? "USD";
    const paymentLink =
      paymentOptions?.payment_link ||
      paymentOptions?.checkout_url ||
      paymentOptions?.authorization_url ||
      paymentOptions?.url;
    const requiresPayment = !fastTrack;

    return null;
  };
  const renderStepGuide = () => (
    <ModernCard
      variant="filled"
      padding="lg"
      className="border border-primary-100/70 bg-primary-25 text-sm text-slate-700"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Steps</p>
            <p className="text-xs text-slate-600">
              Follow the steps below; click to jump back if needed.
            </p>
          </div>
        </div>
        <StatusPill label={`Step ${activeStep + 1} of ${steps.length}`} tone="info" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const isActiveStep = index === activeStep;
          const isCompleted = index < activeStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                if (index <= activeStep) {
                  goToStep(index);
                }
              }}
              className={[
                "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                "md:w-auto md:flex-1 md:min-w-[240px]",
                isActiveStep
                  ? "border-primary-300 bg-white shadow-sm"
                  : isCompleted
                    ? "border-emerald-200 bg-white/80"
                    : "border-slate-200 bg-white/60 hover:border-primary-200",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isActiveStep
                        ? "border-primary-200 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                  ].join(" ")}
                >
                  {isCompleted ? <BadgeCheck className="h-4 w-4" /> : index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                  <p className="text-xs text-slate-600">{step.description}</p>
                </div>
              </div>
              {isActiveStep && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-700">
                  In progress
                </span>
              )}
            </button>
          );
        })}
      </div>
    </ModernCard>
  );

  const buttonBaseStyle = {
    fontFamily: 'Outfit, Inter, "SF Pro Display", system-ui, sans-serif',
    fontWeight: 400,
    borderRadius: "30px",
    transition: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    outline: "none",
    textDecoration: "none",
    padding: "10px 16px",
    fontSize: "16px",
    lineHeight: "24px",
    minHeight: "40px",
    opacity: 1,
    pointerEvents: "auto",
    cursor: "pointer",
  };
  const nextStepLabel = useMemo(() => {
    const nextStep = steps[activeStep + 1];
    const isPaymentStep = steps[activeStep]?.id === "payment" && nextStep?.id === "review";
    if (isPaymentStep) {
      return "Verify and Provision";
    }
    return nextStep ? `Continue to ${nextStep.label.toLowerCase()}` : "Review & submit";
  }, [activeStep, steps]);

  const isNextDisabled = useMemo(() => {
    const paymentStepIndex = steps.findIndex((step) => step.id === "payment");
    const isJustBeforePayment = paymentStepIndex > -1 && activeStep === paymentStepIndex - 1;
    const isBeforeReviewWithoutPayment =
      !isFastTrack && steps[activeStep + 1]?.id === "review" && !isPaymentComplete;

    if (isGeneratingPayment) return true;
    if (isJustBeforePayment && !primaryRegion) return true;
    if (isBeforeReviewWithoutPayment) return true;
    return false;
  }, [isFastTrack, activeStep, steps, primaryRegion, isPaymentComplete, isGeneratingPayment]);

  const renderStepActions = (variant = "inline", extraClassName = "") => {
    const isSidebar = variant === "sidebar";
    return (
      <div
        className={[
          "flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
          isSidebar ? "sticky top-4" : "",
          extraClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div>
          <p className="text-sm font-semibold text-slate-900">Step controls</p>
          <p className="text-xs text-slate-600">{steps[activeStep]?.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {isFastTrack
              ? "Fast-track skips payment capture and starts provisioning immediately."
              : "Standard flow shares a payment link before provisioning."}
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            {!isFirstStep && (
              <ModernButton
                type="button"
                variant="ghost"
                onClick={handlePreviousStep}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  border: "1px solid #cbd5e1",
                }}
              >
                Back
              </ModernButton>
            )}
            {!isLastStep && (
              <ModernButton
                type="button"
                variant="primary"
                onClick={handleNextStep}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: "#288DD1",
                  color: "#ffffff",
                  border: "1px solid transparent",
                }}
              >
                {nextStepLabel}
              </ModernButton>
            )}
            {isLastStep && !isFastTrack && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={[
                  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition-all",
                  "bg-primary-600 hover:-translate-y-0.5 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  isSubmitting ? "opacity-70" : "",
                ].join(" ")}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: "#288DD1",
                  color: "#ffffff",
                  border: "1px solid transparent",
                }}
              >
                <HardDrive className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Process Storage Payment"}
              </button>
            )}
            {isLastStep && isFastTrack && (
              <button
                type="button"
                onClick={handleFastTrackSubmit}
                disabled={isSubmitting}
                className={[
                  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-4 text-sm font-semibold text-emerald-900 shadow-sm transition-all",
                  "border-emerald-300 bg-emerald-50 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  isSubmitting ? "opacity-70" : "",
                ].join(" ")}
                style={{
                  ...buttonBaseStyle,
                  backgroundColor: "#288DD1",
                  color: "#ffffff",
                  border: "1px solid transparent",
                }}
              >
                {isSubmitting ? "Processing..." : "Fast-track Provisioning"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title={isFastTrack ? "Fast-track object storage" : "Create object storage plan"}
        description={
          isFastTrack
            ? "Provision storage for tenants that already have executive approval, skipping the invoice wait."
            : "Capture commercial details for a new object storage plan and keep provisioning workflows aligned."
        }
        actions={
          <ModernButton
            variant="outline"
            onClick={() => navigate("/admin-dashboard/object-storage")}
          >
            Back to overview
          </ModernButton>
        }
        contentClassName="space-y-8"
      >
        <div className="mx-auto flex w-full flex-col gap-6">
          {renderModeSwitch()}
          {renderPaymentSummary()}
          {renderStepGuide()}
          <form
            className="grid gap-6 pb-32 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
            onSubmit={(event) => {
              event.preventDefault();
              if (isLastStep) {
                handleSubmit(event);
              } else {
                handleNextStep();
              }
            }}
          >
            <div className="space-y-6">
              {activeStep === 0 && (
                <ModernCard variant="outlined" padding="lg" className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Customer context</p>
                      <p className="text-sm text-slate-500">
                        Route the request to a tenant or user for visibility, or leave it unassigned
                        for internal tracking.
                      </p>
                    </div>
                    <StatusPill
                      label={
                        contextType === "tenant"
                          ? "Tenant assignment"
                          : contextType === "user"
                            ? "User assignment"
                            : "Unassigned"
                      }
                      tone={contextType ? "info" : "neutral"}
                    />
                  </div>
                  <div className="space-y-4">
                    <CustomerContextSelector
                      contextType={contextType}
                      setContextType={setContextType}
                      selectedTenantId={selectedTenantId}
                      setSelectedTenantId={setSelectedTenantId}
                      selectedUserId={selectedUserId}
                      setSelectedUserId={setSelectedUserId}
                      tenants={tenants}
                      isTenantsFetching={isTenantsFetching}
                      userPool={userPool}
                      isUsersFetching={isUsersFetching}
                    />
                    <ModernSelect
                      label="Billing country"
                      value={formData.countryCode}
                      onChange={(event) => updateForm("countryCode", event.target.value)}
                      options={countryOptions}
                      helper={
                        isCountriesLoading ? "Loading billing countries..." : billingCountryHelper
                      }
                      error={errors.countryCode}
                      disabled={isCountryLocked || isCountriesLoading}
                    />
                    <div className="flex justify-end pt-1">
                      <ModernButton
                        type="button"
                        variant="primary"
                        onClick={handleNextStep}
                        style={{
                          ...buttonBaseStyle,
                          backgroundColor: "#288DD1",
                          color: "#ffffff",
                          border: "1px solid transparent",
                        }}
                        isDisabled={isNextDisabled}
                      >
                        {nextStepLabel}
                      </ModernButton>
                    </div>
                  </div>
                </ModernCard>
              )}

              {activeStep === 1 && (
                <ModernCard variant="outlined" padding="lg" className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Plan configuration</p>
                      <p className="text-sm text-slate-500">
                        Define the storage tier, commercial terms, and billing cadence.
                      </p>
                    </div>
                    <BadgeCheck className="h-5 w-5 text-primary-500" />
                  </div>
                  <div className="space-y-6">
                    {serviceProfiles.map((profile, index) => {
                      const derivedProfile = profileDerivedMap.get(profile.id) || profile;
                      const profileError = profileErrors[profile.id] || {};
                      const regionData = derivedProfile.regionData;
                      const regionHelper = regionData
                        ? "Region resolved from configuration."
                        : isRegionsLoading
                          ? "Fetching regions..."
                          : "Select an approved region.";
                      const tierOptions = derivedProfile.tierOptions || [];
                      const usingFallbackCatalog = derivedProfile.usingFallbackCatalog;
                      const tierLoading =
                        Boolean(profile.region.trim()) && isPricingLoading && !tierOptions.length;
                      const tierHelper = !profile.region.trim()
                        ? "Select a region to load available tiers."
                        : tierLoading
                          ? "Fetching object storage product pricing..."
                          : tierOptions.length === 0
                            ? "No tiers configured for this region yet."
                            : usingFallbackCatalog
                              ? "No region-specific pricing found; using the default catalog."
                              : "Pick the object storage tier for this plan.";
                      const fallbackPrice = derivedProfile.fallbackUnitPrice;
                      const unitPricePlaceholder =
                        fallbackPrice > 0 ? fallbackPrice.toFixed(2) : "";
                      const unitPriceHelper =
                        fallbackPrice > 0
                          ? `Catalog: ${formatCurrency(fallbackPrice, derivedProfile.currency)}`
                          : "Enter a monthly price if catalog data is missing.";
                      const tierName = getTierDisplayName(derivedProfile.tierRow) || "";
                      return (
                        <div
                          key={profile.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                Service profile #{index + 1}
                              </p>
                              <p className="text-xs text-slate-500">
                                Region, tier, and term for this storage allocation.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeServiceProfile(profile.id)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <ModernInput
                              label="Storage name (optional)"
                              placeholder="e.g., Backup archive, Analytics data"
                              value={profile.name}
                              onChange={(event) =>
                                handleProfileNameChange(profile.id, event.target.value)
                              }
                              helper="A friendly label to identify this storage allocation across payment and provision steps."
                            />
                            <ModernSelect
                              label="Region"
                              value={profile.region}
                              onChange={(event) =>
                                handleRegionChange(profile.id, event.target.value)
                              }
                              options={[
                                {
                                  value: "",
                                  label: regionOptions.length
                                    ? "Select region"
                                    : "No regions available",
                                },
                                ...regionOptions,
                              ]}
                              disabled={isRegionsLoading || regionOptions.length === 0}
                              helper={regionHelper}
                              error={profileError.region}
                            />
                            <ModernSelect
                              label="Object storage tier"
                              value={profile.tierKey}
                              onChange={(event) => handleTierChange(profile.id, event.target.value)}
                              options={tierOptions}
                              disabled={
                                !profile.region.trim() || tierOptions.length === 0 || tierLoading
                              }
                              placeholder={
                                profile.region.trim()
                                  ? tierLoading
                                    ? "Loading tiers..."
                                    : "Select a tier"
                                  : "Select a region first"
                              }
                              helper={tierHelper}
                              error={profileError.tierKey}
                            />
                            <ModernInput
                              label="Term (months)"
                              type="number"
                              min="1"
                              step="1"
                              value={profile.months}
                              onChange={(event) =>
                                handleMonthsChange(profile.id, event.target.value)
                              }
                              error={profileError.months}
                            />
                            <ModernInput
                              label="Unit price (per month)"
                              type="number"
                              min="0"
                              step="0.01"
                              value={profile.unitPriceOverride}
                              onChange={(event) =>
                                handleUnitPriceChange(profile.id, event.target.value)
                              }
                              placeholder={unitPricePlaceholder}
                              helper={unitPriceHelper}
                              error={profileError.unitPrice}
                              disabled={!profile.tierKey}
                            />
                          </div>
                          {tierName && (
                            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600">
                              <div>
                                <p className="font-medium text-slate-900">{tierName}</p>
                                <p className="text-[11px] uppercase tracking-wide">
                                  {derivedProfile.months} month
                                  {derivedProfile.months === 1 ? "" : "s"} term
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">
                                  {formatCurrency(
                                    derivedProfile.unitPrice,
                                    derivedProfile.currency
                                  )}
                                  <span className="text-xs font-normal text-slate-500">
                                    {" "}
                                    /month
                                  </span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Total{" "}
                                  {formatCurrency(derivedProfile.subtotal, derivedProfile.currency)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div>
                      <ModernButton
                        type="button"
                        variant="outline"
                        onClick={addServiceProfile}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add service profile
                      </ModernButton>
                      {errors.serviceProfiles && (
                        <p className="mt-2 text-xs text-red-500">{errors.serviceProfiles}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      {!isFirstStep && (
                        <ModernButton
                          type="button"
                          variant="ghost"
                          onClick={handlePreviousStep}
                          style={{
                            ...buttonBaseStyle,
                            backgroundColor: "#ffffff",
                            color: "#0f172a",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          Back
                        </ModernButton>
                      )}
                      <ModernButton
                        type="button"
                        variant="primary"
                        onClick={handleNextStep}
                        style={{
                          ...buttonBaseStyle,
                          backgroundColor: "#288DD1",
                          color: "#ffffff",
                          border: "1px solid transparent",
                        }}
                        isDisabled={isNextDisabled}
                      >
                        {nextStepLabel}
                      </ModernButton>
                    </div>
                  </div>
                </ModernCard>
              )}

              {activeStep === 2 && !isFastTrack && (
                <ModernCard variant="outlined" padding="lg" className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Payment</p>
                      <p className="text-sm text-slate-500">
                        Generate payment options for this order and share with finance.
                      </p>
                    </div>
                    <StatusPill label="Standard payment" tone="warning" />
                  </div>

                  {isGeneratingPayment ? (
                    <p className="text-sm text-slate-500">Generating payment options…</p>
                  ) : lastOrderSummary?.transaction && paymentOptions.length ? (
                    <PaymentModal
                      isOpen
                      mode="inline"
                      transactionData={{
                        data: {
                          transaction: lastOrderSummary.transaction,
                          order: {
                            type: "object_storage",
                            items: lastOrderSummary?.order_items || [],
                            storage_profiles: lastOrderSummary?.serviceProfiles || [],
                          },
                          instances: [],
                          payment: paymentPayloadForModal,
                        },
                      }}
                      onPaymentComplete={() => {
                        ToastUtils.success("Payment completed.");
                      }}
                      authToken={adminToken}
                      className="border border-slate-200"
                      apiBaseUrl={config.adminURL}
                      onPaymentOptionChange={setSelectedPaymentOption}
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-500">
                        Payment options will appear here after generating the order.
                      </p>
                      {isPaymentFailed && (
                        <p className="text-xs text-amber-600">
                          Payment failed. Regenerate the order to retry payment.
                        </p>
                      )}
                    </div>
                  )}
                  {isPaymentComplete && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="font-semibold">Payment verified</p>
                      <p className="text-xs text-emerald-700">
                        This transaction is confirmed. You can continue to review without making
                        another payment.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    {!isFirstStep && (
                      <ModernButton
                        type="button"
                        variant="ghost"
                        onClick={handlePreviousStep}
                        style={{
                          ...buttonBaseStyle,
                          backgroundColor: "#ffffff",
                          color: "#0f172a",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        Back
                      </ModernButton>
                    )}
                    {!isLastStep && (
                      <ModernButton
                        type="button"
                        variant="primary"
                        onClick={handleNextStep}
                        style={{
                          ...buttonBaseStyle,
                          backgroundColor: "#288DD1",
                          color: "#ffffff",
                          border: "1px solid transparent",
                        }}
                        isDisabled={isNextDisabled}
                      >
                        {steps[activeStep]?.id === "payment"
                          ? "Verify and Provision"
                          : nextStepLabel}
                      </ModernButton>
                    )}
                  </div>
                </ModernCard>
              )}

              {(isFastTrack ? activeStep === 2 : activeStep === 3) && (
                <ModernCard variant="outlined" padding="lg" className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Review checkpoint</p>
                      <p className="text-sm text-slate-500">
                        Confirm ownership, billing country, and tier choices before triggering the
                        workflow.
                      </p>
                    </div>
                    <StatusPill
                      label={isFastTrack ? "Fast-track" : "Standard payment"}
                      tone={isFastTrack ? "info" : "warning"}
                    />
                  </div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Assignment</dt>
                      <dd className="font-semibold text-slate-900">
                        {contextType ? assignmentLabel : "Unassigned"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Billing country
                      </dt>
                      <dd className="font-semibold text-slate-900">
                        {formData.countryCode || "Not set"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Plan label</dt>
                      <dd className="font-semibold text-slate-900">{fallbackPlanLabel}</dd>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Profiles captured
                      </dt>
                      <dd className="font-semibold text-slate-900">
                        {resolvedProfiles.length} profile{resolvedProfiles.length === 1 ? "" : "s"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Workflow</dt>
                      <dd className="font-semibold text-slate-900">
                        {isFastTrack
                          ? "Fast-track provisioning"
                          : "Payment required before provisioning"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Display currency
                      </dt>
                      <dd className="font-semibold text-slate-900">{summaryTotals.currency}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-slate-500">
                    Need to adjust details? Jump back to earlier steps with the stepper above, then
                    return here to submit.
                  </p>
                  {!isFastTrack && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Payment options
                      </p>
                    </div>
                  )}
                </ModernCard>
              )}
              {activeStep === steps.length - 1 && (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {!isFirstStep && (
                    <ModernButton
                      type="button"
                      variant="ghost"
                      onClick={handlePreviousStep}
                      style={{
                        ...buttonBaseStyle,
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      Back
                    </ModernButton>
                  )}
                  {!isLastStep && (
                    <ModernButton
                      type="button"
                      variant="primary"
                      onClick={handleNextStep}
                      style={{
                        ...buttonBaseStyle,
                        backgroundColor: "#288DD1",
                        color: "#ffffff",
                        border: "1px solid transparent",
                      }}
                      isDisabled={isNextDisabled}
                    >
                      {nextStepLabel}
                    </ModernButton>
                  )}
                  {isLastStep && !isFastTrack && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={[
                        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition-all",
                        "bg-primary-600 hover:-translate-y-0.5 hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        isSubmitting ? "opacity-70" : "",
                      ].join(" ")}
                      style={{
                        ...buttonBaseStyle,
                        backgroundColor: "#288DD1",
                        color: "#ffffff",
                        border: "1px solid transparent",
                      }}
                    >
                      <HardDrive className="h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Process Storage Payment"}
                    </button>
                  )}
                  {isLastStep && isFastTrack && (
                    <button
                      type="button"
                      onClick={handleFastTrackSubmit}
                      disabled={isSubmitting}
                      className={[
                        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 px-4 text-sm font-semibold text-emerald-900 shadow-sm transition-all",
                        "border-emerald-300 bg-emerald-50 hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                        isSubmitting ? "opacity-70" : "",
                      ].join(" ")}
                      style={{
                        ...buttonBaseStyle,
                        backgroundColor: "#288DD1",
                        color: "#ffffff",
                        border: "1px solid transparent",
                      }}
                    >
                      {isSubmitting ? "Processing..." : "Fast-track Provisioning"}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6 w-full max-w-xl md:max-w-none md:w-full justify-self-end">
              <ModernCard variant="elevated" padding="lg" className="space-y-4 lg:sticky lg:top-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">Order summary</p>
                    <p className="text-xs text-slate-500">
                      Auto-calculated from the captured configuration.
                    </p>
                  </div>
                  <StatusPill
                    label={isFastTrack ? "Provisioning queued" : "Manual review"}
                    tone={isFastTrack ? "info" : "warning"}
                  />
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Plan label</dt>
                    <dd className="font-medium text-slate-900">{fallbackPlanLabel}</dd>
                  </div>
                  {lastOrderSummary?.transaction && (
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Transaction status</dt>
                      <dd className="font-medium text-slate-900 capitalize">
                        {(lastOrderSummary.transaction.status || "pending").replace(/_/g, " ")}
                      </dd>
                    </div>
                  )}
                  {(!backendPricingLines || backendPricingLines.length === 0) &&
                  resolvedProfiles.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Add at least one service profile to generate a summary.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(backendPricingLines || resolvedProfiles).map((entry, index) => {
                        const isBackend =
                          Array.isArray(backendPricingLines) && backendPricingLines.length > 0;
                        const line = isBackend ? entry : resolvedProfiles[index];
                        if (!line) return null;
                        const lineName = isBackend
                          ? `${line.region || ""} ${line.name || ""}`.trim() ||
                            "Object storage tier"
                          : line.region || "N/A";
                        const detail = isBackend
                          ? `${line.name || "Object storage tier"}${line.months ? ` • ${line.months} month${line.months === 1 ? "" : "s"}` : ""}`
                          : `${line.tierName || "Object storage tier"} • ${line.months} month${line.months === 1 ? "" : "s"}`;
                        const currency = line.currency || displayedTotals.currency;
                        const subtotal = Number(isBackend ? line.subtotal : line.subtotal);
                        const unit = isBackend ? line.unitPrice : line.unitPrice;
                        return (
                          <div
                            key={line.id || index}
                            className="flex items-start justify-between rounded-lg border border-slate-100 px-3 py-2"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{lineName}</p>
                              <p className="text-xs text-slate-500">{detail}</p>
                            </div>
                            <div className="text-right">
                              {Number.isFinite(unit) && unit > 0 && (
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatCurrency(unit, currency)}
                                  <span className="text-xs font-normal text-slate-500">
                                    {" "}
                                    /month
                                  </span>
                                </p>
                              )}
                              <p className="text-xs text-slate-500">
                                Total {formatCurrency(subtotal, currency)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Subtotal</dt>
                    <dd className="font-medium text-slate-900">
                      {formatCurrency(displayedTotals.subtotal, displayedTotals.currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">
                      Estimated tax ({Number(displayedTotals.taxRate.toFixed(2))}%)
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {formatCurrency(displayedTotals.tax, displayedTotals.currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Gateway fees</dt>
                    <dd className="font-medium text-slate-900">
                      {formatCurrency(selectedGatewayFee, displayedTotals.currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Grand total</dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {formatCurrency(grandTotalWithFees, displayedTotals.currency)}
                    </dd>
                  </div>
                </dl>
                <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                  <p>
                    {resolvedProfiles.length} service profile
                    {resolvedProfiles.length === 1 ? "" : "s"} captured. Taxes are estimated and may
                    change after finance review.
                  </p>
                  {hasCurrencyMismatch && (
                    <p className="mt-1 text-[11px] text-amber-600">
                      Multiple currencies detected. Totals are displayed in {summaryTotals.currency}{" "}
                      for quick review.
                    </p>
                  )}
                </div>
              </ModernCard>
            </div>
          </form>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminObjectStorageCreate;
