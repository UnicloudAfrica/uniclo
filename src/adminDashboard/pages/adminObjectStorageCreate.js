import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  HardDrive,
  ListChecks,
  Plus,
  Rocket,
  Trash2,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import ModernInput from "../components/ModernInput";
import ModernSelect from "../components/ModernSelect";
import StatusPill from "../components/StatusPill";
import ToastUtils from "../../utils/toastUtil";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import { useFetchProductPricing as useAdminProductPricing } from "../../hooks/adminHooks/adminproductPricingHook";

const COUNTRY_OPTIONS = [
  { value: "NG", label: "Nigeria (NG)" },
  { value: "GH", label: "Ghana (GH)" },
  { value: "KE", label: "Kenya (KE)" },
  { value: "ZA", label: "South Africa (ZA)" },
  { value: "US", label: "United States (US)" },
  { value: "GB", label: "United Kingdom (GB)" },
];

const initialFormState = {
  countryCode: COUNTRY_OPTIONS[0].value,
};

const generateProfileId = () =>
  `profile_${Math.random().toString(36).slice(2, 10)}`;

const createServiceProfile = () => ({
  id: generateProfileId(),
  region: "",
  tierKey: "",
  months: "12",
  unitPriceOverride: "",
});

const getPricingRegionCode = (pricing) =>
  pricing.region ||
  pricing.product?.region ||
  pricing.product?.region_code ||
  pricing.product?.provider_region ||
  pricing.product?.location ||
  "";

const makeTierKey = (regionKey, pricing) => {
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
  const normalizedId = String(baseId || "").trim() || pricing.id || Math.random().toString(36).slice(2, 10);
  return `${normalizedRegion}::${normalizedId}`;
};
const resolveTierUnitPrice = (tier) => {
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

const getRegionCode = (region) => {
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

const buildTierLabel = (pricing) => {
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
  const currency = resolveTierCurrency(pricing);
  const parts = [name];
  if (quota) {
    parts.push(`${quota} GiB`);
  }
  if (price) {
    parts.push(`${currency} ${price.toFixed(2)}`);
  }
  return parts.join(" • ");
};

const getTierDisplayName = (pricing) =>
  pricing?.product?.name ||
  pricing?.product_name ||
  pricing?.product?.product_name ||
  pricing?.provider_resource_id ||
  "";

const formatCurrency = (amount, currency) => {
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

const normalizeCountryCandidate = (value) => {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  return "";
};

const matchCountryFromOptions = (value) => {
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

const resolveCountryCodeFromEntity = (entity) => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode =
    searchParams.get("mode") === "fast-track" ? "fast-track" : "standard";
  const [mode, setMode] = useState(initialMode);
  const isFastTrack = mode === "fast-track";

  const [formData, setFormData] = useState(initialFormState);
  const [isCountryLocked, setIsCountryLocked] = useState(false);
  const [serviceProfiles, setServiceProfiles] = useState([createServiceProfile()]);
  const [assignmentType, setAssignmentType] = useState("");
  const [assignmentTenantId, setAssignmentTenantId] = useState("");
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [errors, setErrors] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createOrder, fastTrackOrder } = useObjectStorage();

  const { data: regions = [], isFetching: isRegionsLoading } = useFetchRegions();
  const { data: tenants = [], isFetching: isTenantsLoading } = useFetchTenants();
  const { data: clients = [], isFetching: isClientsLoading } = useFetchClients();

  const regionMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(regions) ? regions : []).forEach((region) => {
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
      .map((region) => {
        const code = getRegionCode(region);
        if (!code) return null;
        const lower = code.toLowerCase();
        if (seen.has(lower)) return null;
        seen.add(lower);
        const name =
          region.name ||
          region.display_name ||
          region.region_name ||
          region.provider_label ||
          code;
        const label =
          name && name.toLowerCase() !== code.toLowerCase()
            ? `${name} (${code})`
            : name || code;
        return { value: code, label };
      })
      .filter(Boolean);
  }, [regions]);

  const {
    data: tierPricingPayload,
    isFetching: isPricingLoading,
  } = useAdminProductPricing(
    {
      provider: "zadara",
      productType: "object_storage_configuration",
      perPage: 500,
      page: 1,
    },
    {
      keepPreviousData: true,
    }
  );

  const tierCatalog = useMemo(() => {
    const rows = tierPricingPayload?.data;
    const catalog = new Map();
    if (!Array.isArray(rows)) {
      return catalog;
    }
    rows.forEach((row) => {
      const regionCodeRaw = getPricingRegionCode(row);
      if (!regionCodeRaw) return;
      const regionKey = regionCodeRaw.toString().toLowerCase().trim();
      if (!regionKey) return;
      const key = makeTierKey(regionKey, row);
      if (!catalog.has(regionKey)) {
        catalog.set(regionKey, {
          options: [],
          map: new Map(),
        });
      }
      const entry = catalog.get(regionKey);
      entry.options.push({
        value: key,
        label: buildTierLabel(row),
      });
      entry.map.set(key, row);
    });
    return catalog;
  }, [tierPricingPayload]);

  const tenantOptions = useMemo(() => {
    if (!Array.isArray(tenants)) return [];
    return tenants
      .map((tenant) => {
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
    if (!Array.isArray(clients)) return [];
    return clients
      .map((client) => {
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
  }, [clients]);

  const filteredClientOptions = useMemo(() => {
    if (!assignmentTenantId) {
      return clientOptions;
    }
    return clientOptions.filter((client) =>
      client.tenantId ? client.tenantId === String(assignmentTenantId) : true
    );
  }, [clientOptions, assignmentTenantId]);

  const resolveTenantName = (tenantId) => {
    if (!tenantId) return "";
    const match = tenantOptions.find((tenant) => tenant.value === String(tenantId));
    return match?.label || "";
  };

  const resolveClientName = (clientId) => {
    if (!clientId) return "";
    const match = clientOptions.find((client) => client.value === String(clientId));
    return match?.label || "";
  };

  const assignmentLabel = useMemo(() => {
    if (assignmentType === "tenant") {
      return resolveTenantName(assignmentTenantId) || "Tenant order";
    }
    if (assignmentType === "user") {
      return resolveClientName(assignmentUserId) || "Client order";
    }
    return "Internal order";
  }, [assignmentType, assignmentTenantId, assignmentUserId, tenantOptions, clientOptions]);

  const resolvedProfiles = useMemo(() => {
    return serviceProfiles.map((profile) => {
      const regionTrimmed = profile.region.trim();
      const regionKey = regionTrimmed.toLowerCase();
      const regionData = regionTrimmed
        ? regionMap.get(regionKey) || null
        : null;
      const catalogEntry = regionKey ? tierCatalog.get(regionKey) : undefined;
      const tierRow =
        catalogEntry?.map?.get(profile.tierKey.trim()) || null;
      const fallbackUnitPrice = resolveTierUnitPrice(tierRow);
      const overrideValue = Number(profile.unitPriceOverride);
      const hasOverride =
        profile.unitPriceOverride !== "" &&
        Number.isFinite(overrideValue) &&
        overrideValue > 0;
      const unitPrice = hasOverride ? overrideValue : fallbackUnitPrice;
      const safeUnitPrice =
        Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
      const months = Math.max(1, Number(profile.months) || 0);
      const quantity = 1;
      const subtotal = quantity * months * safeUnitPrice;
      const currency = resolveTierCurrency(tierRow, "USD");

      return {
        ...profile,
        region: regionTrimmed,
        regionKey,
        regionData,
        tierOptions: catalogEntry?.options ?? [],
        tierRow,
        fallbackUnitPrice,
        unitPrice: safeUnitPrice,
        months,
        quantity,
        subtotal,
        currency,
        hasTierData: Boolean(tierRow),
      };
    });
  }, [serviceProfiles, regionMap, tierCatalog]);

  const profileDerivedMap = useMemo(() => {
    const map = new Map();
    resolvedProfiles.forEach((profile) => {
      map.set(profile.id, profile);
    });
    return map;
  }, [resolvedProfiles]);

  const summaryCurrency =
    resolvedProfiles.find((profile) => profile.currency)?.currency || "USD";

  const taxRateValue = 0;

  const subtotal = resolvedProfiles.reduce(
    (sum, profile) => sum + profile.subtotal,
    0
  );
  const tax = subtotal * (taxRateValue / 100);
  const total = subtotal + tax;

  const summaryTotals = {
    subtotal,
    tax,
    total,
    currency: summaryCurrency,
    taxRate: taxRateValue,
  };

  const hasCurrencyMismatch = resolvedProfiles.some(
    (profile) =>
      profile.currency && profile.currency !== summaryTotals.currency
  );

  const primaryProfile = resolvedProfiles[0];

  const fallbackPlanLabel = useMemo(() => {
    const tierName =
      getTierDisplayName(primaryProfile?.tierRow) || "Object storage tier";
    if (assignmentType) {
      return `${assignmentLabel} • ${tierName}`;
    }
    return tierName;
  }, [primaryProfile, assignmentType, assignmentLabel]);

  const countryOptions = useMemo(() => {
    const baseOptions = [...COUNTRY_OPTIONS];
    const currentValue = formData.countryCode;
    if (currentValue) {
      const normalized =
        matchCountryFromOptions(currentValue) ||
        normalizeCountryCandidate(currentValue) ||
        String(currentValue).toUpperCase();
      const exists = baseOptions.some(
        (option) =>
          option?.value &&
          String(option.value).toUpperCase() === normalized
      );
      if (!exists) {
        baseOptions.push({
          value: normalized,
          label: `${normalized} (auto-detected)`,
        });
      }
    }
    return baseOptions;
  }, [formData.countryCode]);

  const billingCountryHelper = useMemo(() => {
    if (assignmentType === "tenant") {
      if (!assignmentTenantId) {
        return "Select a tenant to sync their billing country.";
      }
      return isCountryLocked
        ? "Synced from the tenant's profile."
        : "Tenant has no billing country on file; set it manually.";
    }
    if (assignmentType === "user") {
      if (!assignmentTenantId) {
        return "Select the tenant before assigning a user.";
      }
      if (!assignmentUserId) {
        return isCountryLocked
          ? "Using the tenant's billing country while you select a user."
          : "Select a user or choose a country manually.";
      }
      return isCountryLocked
        ? "Synced from the user's profile."
        : "No billing country found; adjust manually.";
    }
    return "Select the billing country for this internal request.";
  }, [
    assignmentType,
    assignmentTenantId,
    assignmentUserId,
    isCountryLocked,
  ]);

  useEffect(() => {
    const applyAutoCountry = (code) => {
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

    if (assignmentType === "tenant") {
      if (!assignmentTenantId) {
        setIsCountryLocked(false);
        return;
      }
      const tenantEntry = tenantOptions.find(
        (option) => option.value === String(assignmentTenantId)
      );
      const tenantCountry = resolveCountryCodeFromEntity(tenantEntry?.raw);
      if (tenantCountry) {
        applyAutoCountry(tenantCountry);
      } else {
        setIsCountryLocked(false);
      }
      return;
    }

    if (assignmentType === "user") {
      if (!assignmentTenantId && !assignmentUserId) {
        setIsCountryLocked(false);
        return;
      }

      const userEntry = clientOptions.find(
        (client) => client.value === String(assignmentUserId)
      );
      let detectedCountry = resolveCountryCodeFromEntity(userEntry?.raw);

      if (!detectedCountry && assignmentTenantId) {
        const tenantEntry = tenantOptions.find(
          (option) => option.value === String(assignmentTenantId)
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
    assignmentType,
    assignmentTenantId,
    assignmentUserId,
    tenantOptions,
    clientOptions,
    formData.countryCode,
  ]);

  const updateForm = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: null,
    }));
  };

  const updateProfile = (profileId, updater) => {
    setServiceProfiles((prev) =>
      prev.map((profile) => {
        if (profile.id !== profileId) return profile;
        const updates =
          typeof updater === "function" ? updater(profile) : updater;
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

  const removeServiceProfile = (profileId) => {
    setServiceProfiles((prev) =>
      prev.filter((profile) => profile.id !== profileId)
    );
    setProfileErrors((prev) => {
      if (!prev[profileId]) return prev;
      const next = { ...prev };
      delete next[profileId];
      return next;
    });
  };

  const handleRegionChange = (profileId, nextRegion) => {
    const normalizedRegion = (nextRegion || "").trim();
    updateProfile(profileId, {
      region: normalizedRegion,
      tierKey: "",
      unitPriceOverride: "",
    });
  };

  const handleTierChange = (profileId, nextTierKey) => {
    updateProfile(profileId, (current) => {
      const normalizedKey = (nextTierKey || "").trim();
      const regionKey = current.region.trim().toLowerCase();
      const catalogEntry = regionKey ? tierCatalog.get(regionKey) : undefined;
      const tierRow = catalogEntry?.map?.get(normalizedKey) || null;
      const defaultPrice = resolveTierUnitPrice(tierRow);
      return {
        tierKey: normalizedKey,
        unitPriceOverride:
          defaultPrice > 0 ? defaultPrice.toFixed(2) : "",
      };
    });
  };

  const handleMonthsChange = (profileId, value) => {
    updateProfile(profileId, { months: value });
  };

  const handleUnitPriceChange = (profileId, value) => {
    updateProfile(profileId, { unitPriceOverride: value });
  };

  const handleModeChange = (nextMode) => {
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

  const validate = () => {
    const nextErrors = {};
    const nextProfileErrors = {};

    if (!formData.countryCode) {
      nextErrors.countryCode = "Select a billing country.";
    }
    if (serviceProfiles.length === 0) {
      nextErrors.serviceProfiles = "Add at least one service profile.";
    }

    if (assignmentType === "tenant" && !assignmentTenantId) {
      nextErrors.assignment = "Select the tenant for this request.";
    }
    if (assignmentType === "user") {
      if (!assignmentTenantId) {
        nextErrors.assignment = "Select the tenant before choosing a user.";
      } else if (!assignmentUserId) {
        nextErrors.assignment = "Select the user to charge for this request.";
      }
    }

    resolvedProfiles.forEach((profile) => {
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

    return (
      Object.keys(nextErrors).length === 0 &&
      Object.keys(nextProfileErrors).length === 0
    );
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsCountryLocked(false);
    setServiceProfiles([createServiceProfile()]);
    setAssignmentType("");
    setAssignmentTenantId("");
    setAssignmentUserId("");
    setErrors({});
    setProfileErrors({});
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const derivedCustomerType =
        assignmentType === "tenant"
          ? "tenant"
          : assignmentType === "user"
          ? "tenant_client"
          : "tenant";
      const customerName = assignmentType ? assignmentLabel : "";
      const customerEmail =
        assignmentType === "user"
          ? (() => {
              const match = clientOptions.find(
                (client) => client.value === assignmentUserId
              );
              return match?.raw?.email || "";
            })()
          : "";
      const lineItems = resolvedProfiles.map((profile) => {
        const tierName =
          getTierDisplayName(profile.tierRow) || "Object storage tier";
        const rawTierId =
          profile.tierRow?.productable_id ??
          profile.tierRow?.product_id ??
          profile.tierRow?.id ??
          profile.tierRow?.product?.productable_id ??
          profile.tierRow?.product?.id ??
          profile.tierKey;
        return {
          id: profile.id,
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
      const aggregatedUnitPrice =
        primaryLine.unitPrice !== undefined ? primaryLine.unitPrice : 0;
      const payload = {
        label: fallbackPlanLabel,
        customerType: derivedCustomerType,
        customerName: customerName,
        customerEmail,
        countryCode: formData.countryCode,
        currencyCode: summaryTotals.currency,
        region: primaryLine.region || "",
        tierId: primaryLine.tierId || "",
        tierName: primaryLine.tierName || "",
        quantity: primaryLine.quantity ?? 1,
        months: primaryLine.months ?? 12,
        billing: {
          unitPrice: Number(
            Number(aggregatedUnitPrice || 0).toFixed(2)
          ),
          subtotal: Number(summaryTotals.subtotal.toFixed(2)),
          tax: Number(summaryTotals.tax.toFixed(2)),
          total: Number(summaryTotals.total.toFixed(2)),
        },
        assignment: {
          type: assignmentType || "unassigned",
          tenantId: assignmentTenantId || null,
          tenantName: resolveTenantName(assignmentTenantId) || null,
          userId: assignmentUserId || null,
          userName: resolveClientName(assignmentUserId) || null,
          label: assignmentLabel,
        },
        timelineNote: isFastTrack
          ? "Fast-track workflow initiated from admin console"
          : "Object storage plan created from admin console",
        createdBy: "admin_console",
        taxRate: summaryTotals.taxRate,
        workflowMode: isFastTrack ? "fast-track" : "standard",
        lineItems,
        summary: summaryTotals,
      };

      const createdOrderId = isFastTrack
        ? fastTrackOrder(payload)
        : createOrder(payload);

      ToastUtils.success(
        isFastTrack
          ? "Fast-track request scheduled for provisioning."
          : "Object storage plan recorded successfully.",
        {
          description: "You can monitor status from the overview screen.",
        }
      );
      resetForm();
      navigate(`/admin-dashboard/object-storage?order=${createdOrderId}`);
    } catch (error) {
      console.error("Failed to submit object storage order", error);
      ToastUtils.error("Unable to create the object storage record.", {
        description: "Please retry or verify the captured details.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderModeSwitch = () => (
    <ModernCard variant="outlined" padding="lg" className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Select workflow
          </p>
          <p className="text-sm text-slate-500">
            Choose between a guided plan creation or a fast-track provisioning shortcut.
          </p>
        </div>
        <ModernButton variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </ModernButton>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          className={[
            "flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all",
            mode === "standard"
              ? "border-primary-500 bg-primary-50 shadow-sm"
              : "border-primary-200 bg-primary-50 bg-opacity-70 hover:border-primary-300 hover:bg-primary-50 hover:bg-opacity-100",
          ].join(" ")}
          onClick={() => handleModeChange("standard")}
        >
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-primary-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Standard plan
              </p>
              <p className="text-xs text-slate-500">
                Capture billing details and hand off to finance for collection.
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Works for approved sales or finance-led activations.</li>
            <li>• Lets you flag invoices as pending or paid.</li>
            <li>• Keeps provisioning status in manual control.</li>
          </ul>
        </button>
        <button
          type="button"
          className={[
            "flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition-all",
            mode === "fast-track"
              ? "border-emerald-500 bg-emerald-50 shadow-sm"
              : "border-emerald-200 bg-emerald-50 bg-opacity-70 hover:border-emerald-300 hover:bg-emerald-50 hover:bg-opacity-100",
          ].join(" ")}
          onClick={() => handleModeChange("fast-track")}
        >
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Fast-track tenant
              </p>
              <p className="text-xs text-slate-500">
                Skip straight to provisioning once finance approves the exception.
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Marks payment as admin approved automatically.</li>
            <li>• Moves the order into provisioning immediately.</li>
            <li>• Notifies the overview timeline for quick follow-up.</li>
          </ul>
        </button>
      </div>
    </ModernCard>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={() => setIsMobileMenuOpen(true)} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <AdminPageShell
        title={
          isFastTrack ? "Fast-track object storage" : "Create object storage plan"
        }
        description={
          isFastTrack
            ? "Provision storage for tenants that already have executive approval, skipping the invoice wait."
            : "Capture commercial details for a new object storage plan and keep provisioning workflows aligned."
        }
        actions={
          <ModernButton variant="outline" onClick={() => navigate("/admin-dashboard/object-storage")}>
            Back to overview
          </ModernButton>
        }
        contentClassName="space-y-8"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          {renderModeSwitch()}
          <ModernCard
            variant="filled"
            padding="lg"
            className="border border-primary-100/70 bg-primary-25 text-sm text-slate-700"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-white p-2 text-primary-600 shadow-sm">
                <ListChecks className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  Create action steps
                </p>
                <ol className="space-y-2 text-sm leading-relaxed">
                  <li>
                    <span className="font-medium text-slate-900">1.</span>{" "}
                    Decide who owns the request—assign it to a tenant or user, or keep it unassigned for internal tracking.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">2.</span>{" "}
                    Choose a service profile by selecting the region, matching storage tier, and term length. Pricing auto-fills from the catalogue.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">3.</span>{" "}
                    Add another service profile if the order spans multiple regions or tiers; each profile rolls into the billing summary.
                  </li>
                  <li>
                    <span className="font-medium text-slate-900">4.</span>{" "}
                    Fast-track the tenant when you have approval. Otherwise, share the transaction summary for payment through the available gateways.
                  </li>
                </ol>
              </div>
            </div>
          </ModernCard>
          <form className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <ModernCard variant="outlined" padding="lg" className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Customer context
                    </p>
                    <p className="text-sm text-slate-500">
                      Route the request to a tenant or user for visibility, or leave it unassigned for internal tracking.
                    </p>
                  </div>
                  <StatusPill
                    label={
                      assignmentType === "tenant"
                        ? "Tenant assignment"
                        : assignmentType === "user"
                        ? "User assignment"
                        : "Unassigned"
                    }
                    tone={assignmentType ? "info" : "neutral"}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {[{ value: "", label: "Unassigned" }, { value: "tenant", label: "Tenant" }, { value: "user", label: "User" }].map((option) => (
                      <button
                        key={option.value || "none"}
                        type="button"
                        onClick={() => {
                          setAssignmentType(option.value);
                          setAssignmentTenantId("");
                          setAssignmentUserId("");
                          setErrors((prev) => ({ ...prev, assignment: null }));
                        }}
                        className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${assignmentType === option.value
                            ? "border-primary-400 bg-primary-50 text-primary-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <ModernSelect
                      label="Assignment"
                      value={assignmentType}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setAssignmentType(nextValue);
                        setAssignmentTenantId("");
                        setAssignmentUserId("");
                        setErrors((prev) => ({ ...prev, assignment: null }));
                      }}
                      options={[
                        { value: "", label: "Unassigned" },
                        { value: "tenant", label: "Tenant" },
                        { value: "user", label: "User" },
                      ]}
                      helper="Route this order to a tenant or user when you need visibility."
                    />
                    <ModernSelect
                      label="Tenant"
                      value={assignmentTenantId}
                      onChange={(event) => {
                        setAssignmentTenantId(event.target.value);
                        setAssignmentUserId("");
                        setErrors((prev) => ({ ...prev, assignment: null }));
                      }}
                      options={[{ value: "", label: assignmentType ? "Select tenant" : "Choose assignment" }, ...tenantOptions]}
                      disabled={!assignmentType || isTenantsLoading}
                      helper={
                        !assignmentType
                          ? "Choose assignment type first."
                          : isTenantsLoading
                          ? "Loading tenants..."
                          : "Tenant workspace to receive this order."
                      }
                    />
                    <ModernSelect
                      label="User"
                      value={assignmentUserId}
                      onChange={(event) => {
                        setAssignmentUserId(event.target.value);
                        setErrors((prev) => ({ ...prev, assignment: null }));
                      }}
                      options={[{ value: "", label: assignmentType === "user" ? "Select user" : "Choose assignment" }, ...filteredClientOptions.map((client) => ({ value: client.value, label: client.label }))]}
                      disabled={assignmentType !== "user" || isClientsLoading}
                      helper={
                        assignmentType === "user"
                          ? isClientsLoading
                            ? "Loading users..."
                            : filteredClientOptions.length
                            ? "Client user under the selected tenant."
                            : "No users available for the selected tenant yet."
                          : "Only required for user assignments."
                      }
                    />
                  </div>
                  {errors.assignment && (
                    <p className="text-xs text-red-500">{errors.assignment}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Current assignment: <span className="font-medium text-slate-700">{assignmentType ? assignmentLabel : "Unassigned"}</span>
                  </p>
                  <ModernSelect
                    label="Billing country"
                    value={formData.countryCode}
                    onChange={(event) =>
                      updateForm("countryCode", event.target.value)
                    }
                    options={countryOptions}
                    error={errors.countryCode}
                    helper={billingCountryHelper}
                    disabled={isCountryLocked}
                  />
                </div>
              </ModernCard>

              <ModernCard variant="outlined" padding="lg" className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Plan configuration
                    </p>
                    <p className="text-sm text-slate-500">
                      Define the storage tier, commercial terms, and billing cadence.
                    </p>
                  </div>
                  <BadgeCheck className="h-5 w-5 text-primary-500" />
                </div>
                <div className="space-y-6">
                  {serviceProfiles.map((profile, index) => {
                    const derivedProfile =
                      profileDerivedMap.get(profile.id) || profile;
                    const profileError = profileErrors[profile.id] || {};
                    const regionData = derivedProfile.regionData;
                    const regionHelper = regionData
                      ? "Region resolved from configuration."
                      : isRegionsLoading
                      ? "Fetching regions..."
                      : "Select an approved region.";
                    const tierOptions = derivedProfile.tierOptions || [];
                    const tierLoading =
                      Boolean(profile.region.trim()) &&
                      isPricingLoading &&
                      !tierOptions.length;
                    const tierHelper = !profile.region.trim()
                      ? "Select a region to load available tiers."
                      : tierLoading
                      ? "Fetching object storage product pricing..."
                      : tierOptions.length === 0
                      ? "No tiers configured for this region yet."
                      : "Pick the object storage tier for this plan.";
                    const fallbackPrice = derivedProfile.fallbackUnitPrice;
                    const unitPricePlaceholder =
                      fallbackPrice > 0 ? fallbackPrice.toFixed(2) : "";
                    const unitPriceHelper =
                      fallbackPrice > 0
                        ? `Catalog: ${formatCurrency(
                            fallbackPrice,
                            derivedProfile.currency
                          )}`
                        : "Enter a monthly price if catalog data is missing.";
                    const tierName =
                      getTierDisplayName(derivedProfile.tierRow) || "";
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
                          <ModernSelect
                            label="Region"
                            value={profile.region}
                            onChange={(event) =>
                              handleRegionChange(profile.id, event.target.value)
                            }
                            options={[{ value: "", label: regionOptions.length ? "Select region" : "No regions available" }, ...regionOptions]}
                            disabled={isRegionsLoading || regionOptions.length === 0}
                            helper={regionHelper}
                            error={profileError.region}
                          />
                          <ModernSelect
                            label="Object storage tier"
                            value={profile.tierKey}
                            onChange={(event) =>
                              handleTierChange(profile.id, event.target.value)
                            }
                            options={tierOptions}
                            disabled={
                              !profile.region.trim() ||
                              tierOptions.length === 0 ||
                              tierLoading
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
                              handleUnitPriceChange(
                                profile.id,
                                event.target.value
                              )
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
                              <p className="font-medium text-slate-900">
                                {tierName}
                              </p>
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
                                Total {formatCurrency(
                                  derivedProfile.subtotal,
                                  derivedProfile.currency
                                )}
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
                      <p className="mt-2 text-xs text-red-500">
                        {errors.serviceProfiles}
                      </p>
                    )}
                  </div>
                </div>
              </ModernCard>

            </div>

            <div className="space-y-6">
              <ModernCard variant="elevated" padding="lg" className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Order summary
                    </p>
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
                    <dd className="font-medium text-slate-900">
                      {fallbackPlanLabel}
                    </dd>
                  </div>
                  {resolvedProfiles.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Add at least one service profile to generate a summary.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {resolvedProfiles.map((profile) => {
                        const tierName =
                          getTierDisplayName(profile.tierRow) ||
                          "Object storage tier";
                        return (
                          <div
                            key={profile.id}
                            className="flex items-start justify-between rounded-lg border border-slate-100 px-3 py-2"
                          >
                            <div>
                              <p className="font-medium text-slate-900">
                                {profile.region || "N/A"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {tierName} • {profile.months} month
                                {profile.months === 1 ? "" : "s"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">
                                {formatCurrency(
                                  profile.unitPrice,
                                  profile.currency
                                )}
                                <span className="text-xs font-normal text-slate-500">
                                  {" "}
                                  /month
                                </span>
                              </p>
                              <p className="text-xs text-slate-500">
                                Total {formatCurrency(
                                  profile.subtotal,
                                  profile.currency
                                )}
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
                      {formatCurrency(
                        summaryTotals.subtotal,
                        summaryTotals.currency
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">
                      Estimated tax ({Number(summaryTotals.taxRate.toFixed(2))}%)
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {formatCurrency(
                        summaryTotals.tax,
                        summaryTotals.currency
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Grand total</dt>
                    <dd className="text-lg font-semibold text-slate-900">
                      {formatCurrency(
                        summaryTotals.total,
                        summaryTotals.currency
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                  <p>
                    {resolvedProfiles.length} service profile
                    {resolvedProfiles.length === 1 ? "" : "s"} captured. Taxes are
                    estimated and may change after finance review.
                  </p>
                  {hasCurrencyMismatch && (
                    <p className="mt-1 text-[11px] text-amber-600">
                      Multiple currencies detected. Totals are displayed in
                      {" "}
                      {summaryTotals.currency} for quick review.
                    </p>
                  )}
                </div>
              </ModernCard>

              <ModernCard variant="outlined" padding="lg" className="space-y-4">
                <p className="text-base font-semibold text-slate-900">
                  Provisioning expectations
                </p>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>
                    •{" "}
                    {isFastTrack
                      ? "Fast-track orders start provisioning immediately after submission."
                      : "Standard plans remain in pending payment until status changes."}
                  </li>
                  <li>
                    • Timeline updates appear on the overview page for continued tracking.
                  </li>
                  <li>
                    • Remember to attach onboarding documents via the tenant workspace if required.
                  </li>
                </ul>
              </ModernCard>

              <ModernButton
                variant="primary"
                size="lg"
                type="submit"
                isLoading={isSubmitting}
                isDisabled={isSubmitting}
                className="w-full justify-center"
                leftIcon={isFastTrack ? <Rocket className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
              >
                {isFastTrack ? "Fast-track provisioning" : "Record storage plan"}
              </ModernButton>
            </div>
          </form>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminObjectStorageCreate;
