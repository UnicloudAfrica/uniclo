/**
 * useDatabaseProvisioningLogic — Orchestrates the database creation wizard flow.
 *
 * Follows the useClientProvisioningLogic pattern:
 * steps → form state → quote pricing → create order → payment → success.
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import {
  useDatabaseQuote,
  useCreateDatabaseOrder,
  useFetchAvailableEngines,
  useFetchAvailablePlans,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import { useFetchProjects } from "@/shared/hooks/resources";
import { useProjectMembershipSuggestions } from "@/shared/hooks/resources/projectHooks";
import { useFetchRegions, useFetchAvailabilityZones } from "@/shared/hooks/resources/regionHooks";
import { useFetchCountries } from "@/hooks/resource";
import { useCustomerContext } from "@/hooks/adminHooks/useCustomerContext";
import { useApiContext } from "@/hooks/useApiContext";
import useAuthStore from "@/stores/authStore";
import {
  normalizePaymentOptions,
  normalizeCountryCandidate,
  COUNTRY_FALLBACK,
} from "@/utils/instanceCreationUtils";
import { resolveCountryCodeFromEntity } from "@/hooks/objectStorageUtils";
import { sanitizeProviderLabel } from "@/utils/sanitizeProviderLabel";
import ToastUtils from "@/utils/toastUtil";
import type {
  DatabaseEngine,
  PlanSize,
  CustomerContext,
  DatabaseFormState,
  DatabaseQuoteResponse,
  DatabaseOrderResponse,
} from "@/types/managedDatabase";

// ─── Wizard Steps ──────────────────────────────────────────────────

export const DATABASE_WIZARD_STEPS = [
  { id: "engine", title: "Engine", desc: "Choose database engine" },
  { id: "configure", title: "Configure", desc: "Set plan, region & options" },
  { id: "review", title: "Review", desc: "Review pricing & confirm" },
  { id: "payment", title: "Payment", desc: "Complete payment" },
  { id: "success", title: "Done", desc: "Database created" },
] as const;

// ─── Engine Metadata (client-side fallback) ────────────────────────

export const ENGINE_METADATA: Record<
  DatabaseEngine,
  {
    label: string;
    description: string;
    versions: string[];
    defaultVersion: string;
    supportsReplication: boolean;
    supportsSharding: boolean;
    minReplicas: number;
    maxReplicas: number;
  }
> = {
  mongodb: {
    label: "MongoDB",
    description: "Document database for flexible schemas and horizontal scaling",
    versions: ["8.0", "7.0"],
    defaultVersion: "8.0",
    supportsReplication: true,
    supportsSharding: true,
    minReplicas: 1,
    maxReplicas: 7,
  },
  postgresql: {
    label: "PostgreSQL",
    description: "Advanced relational database with full ACID compliance",
    versions: ["18", "17", "16", "15", "14"],
    defaultVersion: "17",
    supportsReplication: true,
    supportsSharding: false,
    minReplicas: 1,
    maxReplicas: 5,
  },
  mysql: {
    label: "MySQL",
    description: "Popular relational database for web applications",
    versions: ["9.6", "8.4", "8.0"],
    defaultVersion: "8.4",
    supportsReplication: true,
    supportsSharding: false,
    minReplicas: 1,
    maxReplicas: 5,
  },
  mariadb: {
    label: "MariaDB",
    description: "MySQL-compatible database with enhanced performance and features",
    versions: ["11.4", "10.11", "10.6"],
    defaultVersion: "11.4",
    supportsReplication: true,
    supportsSharding: false,
    minReplicas: 1,
    maxReplicas: 5,
  },
  redis: {
    label: "Redis",
    description: "In-memory data store for caching and real-time analytics",
    versions: ["8.6", "7.4", "7.2"],
    defaultVersion: "8.6",
    supportsReplication: true,
    supportsSharding: true,
    minReplicas: 1,
    maxReplicas: 5,
  },
};

export const PLAN_SPECS: Record<
  PlanSize,
  { label: string; vcpu: number; memoryMb: number; storageGb: number }
> = {
  micro: { label: "Micro", vcpu: 1, memoryMb: 1024, storageGb: 10 },
  small: { label: "Small", vcpu: 2, memoryMb: 2048, storageGb: 25 },
  medium: { label: "Medium", vcpu: 4, memoryMb: 4096, storageGb: 50 },
  large: { label: "Large", vcpu: 8, memoryMb: 8192, storageGb: 100 },
  xlarge: { label: "XLarge", vcpu: 16, memoryMb: 16384, storageGb: 250 },
};

// ─── Helpers ────────────────────────────────────────────────────────

/** Look up a region label by code. Falls back to the code itself. */
export function getRegionLabel(
  regions: { value: string; label: string }[],
  code: string,
): string {
  const match = regions.find((r) => r.value === code);
  return match?.label || code;
}

/**
 * Auto-assign replica regions by picking randomly from available regions
 * (excluding the primary).
 */
function assignReplicaRegions(
  additionalReplicas: number,
  primaryRegion: string,
  allRegions: { value: string; label: string }[],
): string[] {
  if (additionalReplicas <= 0 || !primaryRegion) return [];
  const available = allRegions.filter((r) => r.value !== primaryRegion);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(additionalReplicas, available.length)).map((r) => r.value);
}

// ─── Hook ──────────────────────────────────────────────────────────

export const useDatabaseProvisioningLogic = () => {
  // API context and user profile
  const { context } = useApiContext();
  const user = useAuthStore((s) => s.user);

  // Derive billing country from user profile
  const profileCountry = useMemo(() => {
    if (!user) return "";
    return (user.country_iso as string) || (user.country as string) || "";
  }, [user]);

  // Derive default customer context based on role
  const defaultCustomerContext: CustomerContext = useMemo(() => {
    if (context === "client") return "user";
    if (context === "tenant") return "tenant";
    return "tenant"; // admin defaults to tenant
  }, [context]);

  // ─── Countries ─────────────────────────────────────────────────────
  const { data: rawCountries = [], isFetching: isCountriesLoading } = useFetchCountries();

  const countryOptions = useMemo(() => {
    const apiCountries = Array.isArray(rawCountries) ? rawCountries : [];
    if (apiCountries.length > 0) {
      const mapped = apiCountries
        .map((item: any) => {
          const code = normalizeCountryCandidate(
            item?.iso2 || item?.code || item?.country_code || item?.iso_code || item?.iso || ""
          );
          if (!code) return null;
          const name = item?.name || item?.country_name || item?.label || code;
          return { value: code, label: `${name} (${code})` };
        })
        .filter(Boolean) as { value: string; label: string }[];

      const hasUS = mapped.some((o) => String(o.value).toUpperCase() === "US");
      return hasUS
        ? mapped
        : [{ value: "US", label: "United States (US)" }, ...mapped];
    }
    return [...COUNTRY_FALLBACK] as { value: string; label: string }[];
  }, [rawCountries]);

  const isCountryLocked = context === "tenant" || context === "client";

  // ─── Customer Context (admin only) ────────────────────────────────
  const customerCtx = useCustomerContext({ enabled: context === "admin" });

  // Steps
  const steps = useMemo(() => [...DATABASE_WIZARD_STEPS], []);
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [form, setForm] = useState<DatabaseFormState>({
    engine: "",
    engineVersion: "",
    planSize: "",
    region: "",
    availabilityZone: "",
    name: "",
    projectId: null,
    deploymentType: "dedicated",
    replicaCount: 1,
    replicaAzs: [],
    replicaRegions: [],
    backupEnabled: true,
    drEnabled: false,
    firewallCidrs: ["0.0.0.0/0"],
    months: 1,
    fastTrack: false,
    billingCountry: "",
    customerContext: "tenant",
    assignedTenantId: null,
    assignedClientId: null,
    dbName: "",
    dbUser: "",
    dbPassword: "",
    useDefaultCredentials: true,
    networkMode: "public",
    connectionPooling: true,
    tlsEnabled: true,
    dedicatedProxy: false,
    vpnGateway: false,
    memberUserIds: [],
    assignmentScope: context === "admin" ? "internal" : context === "tenant" ? "tenant" : "client",
  });

  // Initialize billing country and customer context from profile once loaded
  useEffect(() => {
    setForm((prev) => {
      const resolvedCountry =
        prev.billingCountry ||
        resolveCountryCodeFromEntity(user, countryOptions as never) ||
        profileCountry;
      return {
        ...prev,
        billingCountry: resolvedCountry,
        customerContext:
          prev.customerContext === "tenant" ? defaultCustomerContext : prev.customerContext,
      };
    });
  }, [profileCountry, defaultCustomerContext, user, countryOptions]);

  // ─── Project Membership (mirrors addProject.tsx flow) ──────────────
  // Derive assignment scope from customer context
  const assignmentScope = useMemo(() => {
    if (context !== "admin") return context === "tenant" ? "tenant" : "client";
    if (customerCtx.contextType === "tenant") return "tenant" as const;
    if (customerCtx.contextType === "user") return "client" as const;
    return "internal" as const;
  }, [context, customerCtx.contextType]);

  // Sync assignmentScope into form
  useEffect(() => {
    setForm((prev) => (prev.assignmentScope !== assignmentScope ? { ...prev, assignmentScope } : prev));
  }, [assignmentScope]);

  // Membership suggestions query
  const membershipSuggestionsParams = useMemo(() => ({
    scope: assignmentScope,
    ...(assignmentScope === "tenant" && customerCtx.selectedTenantId
      ? { tenant_id: String(customerCtx.selectedTenantId) }
      : {}),
    ...(assignmentScope === "client" && customerCtx.selectedUserId
      ? { client_id: String(customerCtx.selectedUserId) }
      : {}),
  }), [assignmentScope, customerCtx.selectedTenantId, customerCtx.selectedUserId]);

  const shouldFetchMembers = assignmentScope === "internal"
    || (assignmentScope === "tenant" && !!customerCtx.selectedTenantId)
    || (assignmentScope === "client" && !!customerCtx.selectedUserId);

  const { data: suggestedMembersData, isFetching: isMembersFetching } =
    useProjectMembershipSuggestions(membershipSuggestionsParams, {
      enabled: shouldFetchMembers,
    });

  const suggestedMembers = useMemo(() => {
    const raw = (suggestedMembersData as any)?.members ?? (suggestedMembersData as any)?.data ?? suggestedMembersData;
    return Array.isArray(raw) ? raw : [];
  }, [suggestedMembersData]);

  // Auto-select all suggested members when they load
  const [memberSignature, setMemberSignature] = useState<string>("");
  useEffect(() => {
    const sig = suggestedMembers.map((m: any) => m.id).sort().join(",");
    if (sig && sig !== memberSignature) {
      setMemberSignature(sig);
      setForm((prev) => ({
        ...prev,
        memberUserIds: suggestedMembers.map((m: any) => Number(m.id)),
      }));
    }
  }, [suggestedMembers, memberSignature]);

  const selectedMemberIds = useMemo(() => new Set(form.memberUserIds), [form.memberUserIds]);

  const selectedMembers = useMemo(
    () => suggestedMembers.filter((m: any) => selectedMemberIds.has(Number(m.id))),
    [suggestedMembers, selectedMemberIds]
  );

  const toggleMember = useCallback((member: any) => {
    const id = Number(member.id);
    setForm((prev) => ({
      ...prev,
      memberUserIds: prev.memberUserIds.includes(id)
        ? prev.memberUserIds.filter((mid) => mid !== id)
        : [...prev.memberUserIds, id],
    }));
  }, []);

  const restoreDefaultMembers = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      memberUserIds: suggestedMembers.map((m: any) => Number(m.id)),
    }));
  }, [suggestedMembers]);

  const showRestoreMembers = useMemo(() => {
    const defaultIds = suggestedMembers.map((m: any) => Number(m.id)).sort().join(",");
    const currentIds = [...form.memberUserIds].sort().join(",");
    return defaultIds !== currentIds;
  }, [suggestedMembers, form.memberUserIds]);

  // Data fetching
  const { data: enginesData } = useFetchAvailableEngines();
  const { data: plansData } = useFetchAvailablePlans(form.engine || undefined);
  const { data: projectsData } = useFetchProjects();
  const { data: regionsData } = useFetchRegions();

  // Fetch AZs using the shared hook when a region is selected
  const { data: fetchedAzsData } = useFetchAvailabilityZones(form.region || undefined);

  // Mutations
  const quoteMutation = useDatabaseQuote();
  const orderMutation = useCreateDatabaseOrder();
  const createOrderAction = useAsyncAction();

  // Order state
  const [quoteResult, setQuoteResult] = useState<DatabaseQuoteResponse | null>(null);
  const [submissionResult, setSubmissionResult] = useState<DatabaseOrderResponse | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<Record<string, unknown> | null>(null);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);

  // Step indices
  const paymentStepIndex = useMemo(() => steps.findIndex((s) => s.id === "payment"), [steps]);
  const _reviewStepIndex = useMemo(() => steps.findIndex((s) => s.id === "review"), [steps]);
  const successStepIndex = useMemo(() => steps.findIndex((s) => s.id === "success"), [steps]);

  // Engine metadata (merge server data with fallback)
  const engines = useMemo(() => {
    if (enginesData && typeof enginesData === "object") {
      const serverEngines = enginesData as Record<string, unknown>;
      // Merge server data over local fallback
      return Object.keys(ENGINE_METADATA).reduce(
        (acc, key) => {
          const k = key as DatabaseEngine;
          const serverEntry = serverEngines[k] as Record<string, unknown> | undefined;
          acc[k] = {
            ...ENGINE_METADATA[k],
            ...(serverEntry
              ? {
                  label: (serverEntry.label as string) || ENGINE_METADATA[k].label,
                  description:
                    (serverEntry.description as string) || ENGINE_METADATA[k].description,
                  versions: (serverEntry.versions as string[]) || ENGINE_METADATA[k].versions,
                  defaultVersion:
                    (serverEntry.default_version as string) || ENGINE_METADATA[k].defaultVersion,
                }
              : {}),
          };
          return acc;
        },
        {} as typeof ENGINE_METADATA
      );
    }
    return ENGINE_METADATA;
  }, [enginesData]);

  // Projects list
  const projects = useMemo(() => {
    if (!projectsData) return [];
    const list = Array.isArray(projectsData) ? projectsData : [];
    return list.map((p: Record<string, unknown>) => ({
      value: p.id as number,
      label: (p.name as string) || (p.identifier as string) || `Project #${p.id}`,
    }));
  }, [projectsData]);

  // Regions list (with raw data for AZ extraction)
  const regionsRaw = useMemo(() => {
    if (!regionsData) return [];
    return Array.isArray(regionsData) ? regionsData : [];
  }, [regionsData]);

  const regions = useMemo(() => {
    return regionsRaw
      .map((r: Record<string, unknown>) => ({
        value: (r.region as string) || (r.code as string) || "",
        label: (r.label as string) || (r.name as string) || (r.region as string) || "",
      }))
      .filter((r) => r.value);
  }, [regionsRaw]);

  // Availability zones for the selected region — prefers fetched AZ data, falls back to region-embedded data
  const availabilityZones = useMemo(() => {
    if (!form.region) return [];

    // Prefer data from the dedicated AZ endpoint
    if (fetchedAzsData && Array.isArray(fetchedAzsData) && fetchedAzsData.length > 0) {
      return fetchedAzsData.map((az) => ({
        value: az.code || "",
        label: sanitizeProviderLabel(az.name || az.code || ""),
      })).filter((az) => az.value);
    }

    // Fallback: extract from region data
    const regionData = regionsRaw.find(
      (r: Record<string, unknown>) =>
        (r.region as string) === form.region || (r.code as string) === form.region
    );
    if (!regionData) return [];
    const azs = (regionData as Record<string, unknown>).availability_zones;
    if (!Array.isArray(azs)) return [];
    return azs.map((az: Record<string, unknown>) => ({
      value: (az.code as string) || "",
      label: sanitizeProviderLabel((az.name as string) || (az.code as string) || ""),
    })).filter((az: { value: string }) => az.value);
  }, [form.region, regionsRaw, fetchedAzsData]);

  // Auto-select first AZ when AZs become available and none is selected
  useEffect(() => {
    if (availabilityZones.length > 0 && !form.availabilityZone) {
      setForm((prev) => ({
        ...prev,
        availabilityZone: availabilityZones[0].value,
      }));
    }
  }, [availabilityZones, form.availabilityZone]);

  // ─── Replica Logic ────────────────────────────────────────────────

  // AZs available for replicas: all AZs in the region except the primary
  // (Provider filtering is no longer needed — AZ codes no longer embed provider names.)
  const replicaAvailableAzs = useMemo(() => {
    if (!form.availabilityZone) return availabilityZones;
    return availabilityZones.filter((az) => az.value !== form.availabilityZone);
  }, [availabilityZones, form.availabilityZone]);

  /** Max additional replicas the user can select (limited by engine and available AZs). */
  const maxReplicaCount = useMemo(() => {
    if (!form.engine || !form.region || !form.availabilityZone) return 0;
    const engineMeta = engines[form.engine as DatabaseEngine];
    const maxByEngine = (engineMeta?.maxReplicas ?? 5) - 1;
    const maxByAzs = replicaAvailableAzs.length;
    return Math.max(0, Math.min(maxByEngine, maxByAzs));
  }, [form.engine, form.region, form.availabilityZone, engines, replicaAvailableAzs]);

  /**
   * Toggle an AZ for read replica placement.
   * Each selected AZ gets one replica.
   */
  const toggleReplicaAz = useCallback(
    (azCode: string) => {
      setForm((prev) => {
        const current = prev.replicaAzs;
        const isSelected = current.includes(azCode);
        let newAzs: string[];
        if (isSelected) {
          newAzs = current.filter((az) => az !== azCode);
        } else {
          if (current.length >= maxReplicaCount) return prev;
          newAzs = [...current, azCode];
        }
        return {
          ...prev,
          replicaAzs: newAzs,
          replicaCount: newAzs.length + 1, // total = primary + replicas
          replicaRegions: newAzs, // backward compat
        };
      });
    },
    [maxReplicaCount],
  );

  // Reset replica AZs when primary AZ changes
  useEffect(() => {
    if (!form.availabilityZone) return;
    // Remove any replica AZs that conflict with the new primary
    setForm((prev) => {
      const filtered = prev.replicaAzs.filter((az) => az !== form.availabilityZone);
      if (filtered.length === prev.replicaAzs.length) return prev;
      return {
        ...prev,
        replicaAzs: filtered,
        replicaCount: filtered.length + 1,
        replicaRegions: filtered,
      };
    });
  }, [form.availabilityZone]);

  // ─── Form Helpers ────────────────────────────────────────────────

  const updateForm = useCallback((patch: Partial<DatabaseFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectEngine = useCallback(
    (engine: DatabaseEngine) => {
      const meta = engines[engine];
      updateForm({
        engine,
        engineVersion: meta.defaultVersion,
        replicaCount: 1,
        replicaAzs: [],
        replicaRegions: [],
      });
    },
    [engines, updateForm]
  );

  // Currently selected engine metadata
  const selectedEngineMeta = useMemo(() => {
    if (!form.engine) return null;
    return engines[form.engine as DatabaseEngine] ?? null;
  }, [form.engine, engines]);

  // ─── Validation ──────────────────────────────────────────────────

  const isEngineStepValid = useMemo(
    () => Boolean(form.engine && form.engineVersion),
    [form.engine, form.engineVersion]
  );

  const isConfigureStepValid = useMemo(() => {
    return Boolean(form.planSize && form.region);
  }, [form.planSize, form.region]);

  const canProceedToReview = isEngineStepValid && isConfigureStepValid;

  // ─── Quote Pricing ──────────────────────────────────────────────

  const fetchQuote = useCallback(async () => {
    if (!canProceedToReview) return;

    const params = {
      engine: form.engine,
      plan_size: form.planSize,
      region: form.region,
      months: form.months,
      replica_count: form.replicaCount,
      backup_enabled: form.backupEnabled,
    };

    try {
      const result = await quoteMutation.mutateAsync(params);
      setQuoteResult(result);
    } catch {
      // Error handled by mutation
    }
  }, [canProceedToReview, form, quoteMutation]);

  // ─── Create Order ────────────────────────────────────────────────

  const handleCreateOrder = useCallback(async () => {
    await createOrderAction.run(
      async () => {
        if (!canProceedToReview) {
          throw new Error("Please complete all required fields before proceeding.");
        }

        const payload: Record<string, unknown> = {
          engine: form.engine,
          engine_version: form.engineVersion,
          plan_size: form.planSize,
          region: form.region,
          availability_zone: form.availabilityZone,
          deployment_type: form.deploymentType,
          replica_count: form.replicaCount,
          replica_azs: form.replicaAzs,
          backup_enabled: form.backupEnabled,
          firewall_cidrs: form.firewallCidrs.filter(Boolean),
          months: form.months,
          fast_track: form.fastTrack,
          fast_track_ends_at: form.fastTrack && form.fastTrackEndsAt ? form.fastTrackEndsAt : undefined,
          country_iso: form.billingCountry || undefined,
          customer_context: form.customerContext,
          network_mode: form.networkMode,
          connection_pooling: form.connectionPooling,
          tls_enabled: form.tlsEnabled,
          dedicated_proxy: form.dedicatedProxy,
          vpn_gateway: form.vpnGateway,
        };

        if (form.name.trim()) payload.name = form.name.trim();
        if (form.projectId) payload.project_id = form.projectId;
        if (form.assignedTenantId) payload.tenant_id = form.assignedTenantId;
        if (form.assignedClientId) payload.client_id = form.assignedClientId;

        const response = await orderMutation.mutateAsync(payload);
        const data = response?.data ?? (response as unknown as DatabaseOrderResponse["data"]);

        // Normalize payment gateway options
        const normalizedGatewayOptions = normalizePaymentOptions(
          data?.payment?.payment_gateway_options || []
        );

        const mergedResult: DatabaseOrderResponse = {
          ...response,
          data: {
            ...data,
            payment: data?.payment
              ? { ...data.payment, payment_gateway_options: normalizedGatewayOptions }
              : undefined,
          },
        };

        setSubmissionResult(mergedResult);
        setOrderReceipt({
          transaction: data?.transaction || null,
          order: data?.order || null,
          payment: data?.payment
            ? { ...data.payment, payment_gateway_options: normalizedGatewayOptions }
            : null,
          pricing_breakdown: data?.pricing_breakdown || null,
          database: data?.database || null,
        });

        const isPaymentRequired = data?.payment?.required;
        if (isPaymentRequired) {
          setActiveStep(paymentStepIndex);
        } else {
          setIsPaymentSuccessful(true);
          setActiveStep(successStepIndex);
        }

        return { isPaymentRequired: Boolean(isPaymentRequired) };
      },
      {
        successToast: (result) =>
          result?.isPaymentRequired
            ? "Order created! Please complete payment."
            : "Database created! Provisioning is starting.",
        fallbackErrorMessage: "Failed to create database order.",
        rethrow: false,
      }
    );
  }, [
    canProceedToReview,
    form,
    orderMutation,
    createOrderAction,
    paymentStepIndex,
    successStepIndex,
  ]);

  // ─── Payment Completion ──────────────────────────────────────────

  const handlePaymentCompleted = useCallback(() => {
    setIsPaymentSuccessful(true);
    setActiveStep(successStepIndex);
    ToastUtils.success("Payment successful! Database provisioning is starting.");
  }, [successStepIndex]);

  // ─── Pricing Summary ────────────────────────────────────────────

  const pricingSummary = useMemo(() => {
    // Prefer quote result; fall back to order pricing_breakdown
    const source = quoteResult || (orderReceipt?.pricing_breakdown as DatabaseQuoteResponse | null);
    if (!source) {
      return {
        subtotal: 0,
        tax: 0,
        gatewayFees: 0,
        grandTotal: 0,
        currency: "USD",
        monthlyCost: 0,
      };
    }
    return {
      subtotal: source.subtotal || 0,
      tax: source.tax || 0,
      gatewayFees: 0,
      grandTotal: source.total || 0,
      currency: source.currency || "USD",
      monthlyCost: source.monthly_cost || 0,
    };
  }, [quoteResult, orderReceipt]);

  // ─── Step Navigation ─────────────────────────────────────────────

  const goToStep = useCallback(
    (step: number) => {
      // Prevent going forward past current validation
      if (step > activeStep) {
        if (step >= 1 && !isEngineStepValid) return;
        if (step >= 2 && !isConfigureStepValid) return;
      }
      setActiveStep(step);
    },
    [activeStep, isEngineStepValid, isConfigureStepValid]
  );

  const nextStep = useCallback(() => {
    goToStep(activeStep + 1);
  }, [activeStep, goToStep]);

  const prevStep = useCallback(() => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  }, [activeStep]);

  const currentStepId = steps[activeStep]?.id ?? "";

  return {
    // Steps
    steps,
    activeStep,
    setActiveStep: goToStep,
    nextStep,
    prevStep,
    currentStepId,

    // Form
    form,
    updateForm,
    selectEngine,
    selectedEngineMeta,

    // Context
    context,
    profileCountry,

    // Countries
    countryOptions,
    isCountriesLoading,
    isCountryLocked,

    // Customer context (admin)
    tenants: customerCtx.tenants,
    isTenantsFetching: customerCtx.isTenantsFetching,
    userPool: customerCtx.userPool,
    isUsersFetching: customerCtx.isUsersFetching,
    customerContextType: customerCtx.contextType,
    setCustomerContextType: customerCtx.setContextType,
    selectedTenantId: customerCtx.selectedTenantId,
    setSelectedTenantId: customerCtx.setSelectedTenantId,
    selectedUserId: customerCtx.selectedUserId,
    setSelectedUserId: customerCtx.setSelectedUserId,

    // Project Membership
    assignmentScope,
    shouldFetchMembers,
    isMembersFetching,
    selectedMembers,
    selectedMemberIds,
    suggestedMembers,
    showRestoreMembers,
    toggleMember,
    restoreDefaultMembers,

    // Data
    engines,
    projects,
    regions,
    availabilityZones,
    plansData,

    // Replicas
    maxReplicaCount,
    replicaAvailableAzs,
    toggleReplicaAz,

    // Validation
    isEngineStepValid,
    isConfigureStepValid,
    canProceedToReview,

    // Quote
    quoteResult,
    fetchQuote,
    isQuoteLoading: quoteMutation.isPending,

    // Order
    submissionResult,
    orderReceipt,
    isSubmitting: createOrderAction.isPending,
    submissionErrorMessage: createOrderAction.errorMessage,
    isPaymentSuccessful,
    handleCreateOrder,
    handlePaymentCompleted,

    // Pricing
    pricingSummary,
  };
};

export default useDatabaseProvisioningLogic;
