import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  ShieldCheck,
  ArrowUpDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Layers,
  Server,
  Globe,
  Info,
  MapPin,
} from "lucide-react";
import { ModernButton } from "../ui";
import { SearchableSelect } from "../ui";
import { useFetchAcfPublicServices } from "@/hooks/useCostExplorer";
import { useFetchProductPricing } from "@/hooks/resource";
import { useFetchAvailabilityZones } from "@/shared/hooks/resources/regionHooks";
import { RESILIENCE } from "@/shared/branding";

export type ProtectionPlan = "none" | "backup_only" | "dr_standby" | "dr_replication";
export type RedundancyPattern = "n_plus_1" | "one_plus_1" | "one_plus_n";

export interface DrCustomSpec {
  mode: "match" | "custom";
  drTargetAz?: string;
  drTargetAzLabel?: string;
  computeInstanceId?: string;
  computeLabel?: string;
  pricePerVm?: number;
  matchedFamilyLabel?: string;
  matchedFamilyPrice?: number;
  /** Computed DR monthly cost — set automatically by ProtectionPlanStep */
  drMonthlyCost?: number;
  /** Computed DR VM count — set automatically by ProtectionPlanStep */
  drVmCount?: number;
  /** The effective full VM price (before 80% discount) */
  drVmFullPrice?: number;
}

interface WizardConfig {
  compute_label?: string;
  os_image_label?: string;
  storage_size_gb?: number | string;
  compute_instance_id?: string;
  region?: string;
  availability_zone?: string;
  availability_zone_label?: string;
  family_code?: string;
}

interface ProtectionPlanStepProps {
  selectedPlan: ProtectionPlan;
  onPlanChange: (plan: ProtectionPlan) => void;
  selectedRedundancy?: RedundancyPattern;
  onRedundancyChange?: (pattern: RedundancyPattern) => void;
  drSpec?: DrCustomSpec;
  onDrSpecChange?: (spec: DrCustomSpec) => void;
  onBack: () => void;
  onContinue: () => void;
  instanceCount?: number;
  storageGb?: number;
  computePricePerVm?: number;
  computeLabel?: string;
  osLabel?: string;
  currency?: string;
  billingCountry?: string;
  resourceLabel?: string;
  configurations?: WizardConfig[];
}

/* ── Plan definitions ─────────────────────────────────────────────── */
const PLANS: {
  id: ProtectionPlan;
  label: string;
  description: string;
  features: string[];
  icon: React.FC<{ className?: string }>;
  accentBorder: string;
  accentBg: string;
  badge?: string;
  badgeColor?: string;
}[] = [
  {
    id: "none",
    label: "No Protection",
    description:
      "Your server has no safety net. If something breaks, your data could be lost. Only pick this for testing or temporary servers.",
    features: [],
    icon: Shield,
    accentBorder: "border-gray-200",
    accentBg: "",
  },
  {
    id: "backup_only",
    label: "Backup Only",
    description:
      "We save a copy of your server every day, like taking a photo. If something goes wrong, we can bring it back from that photo within 24 hours.",
    features: [
      "Automatic daily save (snapshot) of your server",
      "Keep saves for 7 to 90 days — you choose how long",
      "Restore your server to any saved point in time",
      "Saves are stored in a separate safe location",
    ],
    icon: Shield,
    accentBorder: "border-amber-300",
    accentBg: "bg-amber-50/50",
    badge: "Basic",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "dr_standby",
    label: `${RESILIENCE} DR Standby`,
    description: `A spare copy of your server sits ready in another location. If your main server fails, you can switch to the spare one. ${RESILIENCE} keeps them in sync.`,
    features: [
      "A ready-to-go spare server in a different location",
      `${RESILIENCE} syncs your data to the spare periodically`,
      "You can manually switch to the spare if your main server fails",
      "Daily backups are also included",
      `${RESILIENCE} agent watches your server health`,
    ],
    icon: ArrowUpDown,
    accentBorder: "border-blue-300",
    accentBg: "bg-blue-50/50",
    badge: "Recommended",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "dr_replication",
    label: `${RESILIENCE} DR Replication`,
    description: `Your server is copied in real-time to a spare, every second. If your main server fails, ${RESILIENCE} automatically switches to the spare — almost no data is lost.`,
    features: [
      "Real-time copying of every change to the spare server",
      `${RESILIENCE} automatically switches if your main server fails`,
      "Almost zero data loss (less than a minute behind)",
      "Recovery happens in minutes, not hours",
      `${RESILIENCE} monitors replication health 24/7`,
      "Daily backups and a spare server are also included",
      `${RESILIENCE} agent runs on both your main and spare servers`,
    ],
    icon: ShieldCheck,
    accentBorder: "border-green-300",
    accentBg: "bg-green-50/50",
    badge: "Enterprise",
    badgeColor: "bg-green-100 text-green-700",
  },
];

/* ── Redundancy patterns ─────────────────────────────────────────── */
const REDUNDANCY_PATTERNS: {
  id: RedundancyPattern;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: "n_plus_1",
    label: "N+1 — Shared Standby",
    shortLabel: "N+1",
    description:
      "All your servers share one spare. Like having one backup car for the whole family — cheapest option, but only one can use it at a time.",
    icon: Layers,
  },
  {
    id: "one_plus_1",
    label: "1+1 — Dedicated Standby",
    shortLabel: "1+1",
    description:
      "Every server gets its own personal spare. Like each family member having their own backup car — costs more, but everyone is covered.",
    icon: Server,
  },
  {
    id: "one_plus_n",
    label: "1+N — Multi-Region DR",
    shortLabel: "1+N",
    description:
      "Every server has multiple spares in different locations. Like parking backup cars in different cities — maximum safety, highest cost.",
    icon: Globe,
  },
];

/* ── Helpers ──────────────────────────────────────────────────────── */
const DR_DISCOUNT = 0.80; // 80% off — DR VM costs 20% of production VM

const formatPrice = (amount: number, currency: string) => {
  const symbol =
    currency === "USD" ? "$" : currency === "NGN" ? "₦" : currency;
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getDrVmCount = (
  pattern: RedundancyPattern,
  instanceCount: number,
  drTargets: number
) => {
  switch (pattern) {
    case "n_plus_1":
      return 1; // all VMs share 1 standby
    case "one_plus_1":
      return instanceCount; // 1 standby per VM
    case "one_plus_n":
      return instanceCount * drTargets; // multiple standby per VM
    default:
      return 1;
  }
};

/* ── Component ────────────────────────────────────────────────────── */
/* ── Pricing helper types (mirrors AdminInstanceConfigurationCard) ── */
interface PricingEffect {
  price_local?: number | string | null;
  price_usd?: number | string | null;
  amount?: number | string | null;
  currency?: string;
}
interface PricingResource {
  productable_id?: string | number;
  id?: string | number;
  product_id?: string | number;
  name?: string;
  price_local?: number | string | null;
  price_usd?: number | string | null;
  amount?: number | string | null;
  vcpus?: number | string;
  memory_mb?: number | string;
  memoryMb?: number | string;
  memory_gb?: number | string;
  config?: { vcpus?: number | string; memory_mb?: number | string };
  configuration?: { vcpus?: number | string };
  product?: PricingResource;
  pricing?: { effective?: PricingEffect };
}

const _resolveEffectivePrice = (item: PricingResource | null | undefined) => {
  const effective = item?.pricing?.effective || {};
  for (const candidate of [
    effective.price_local, effective.price_usd, effective.amount,
    item?.price_local, item?.price_usd, item?.amount,
  ]) {
    if (candidate == null || candidate === "") continue;
    const n = Number(candidate);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
};

const ProtectionPlanStep: React.FC<ProtectionPlanStepProps> = ({
  selectedPlan,
  onPlanChange,
  selectedRedundancy: controlledRedundancy,
  onRedundancyChange,
  drSpec: controlledDrSpec,
  onDrSpecChange,
  onBack,
  onContinue,
  instanceCount = 1,
  storageGb = 50,
  computePricePerVm = 0,
  computeLabel,
  osLabel,
  currency = "NGN",
  billingCountry = "",
  resourceLabel = "Cube-Instance",
  configurations = [],
}) => {
  // Internal redundancy state (fallback if not controlled)
  const [internalRedundancy, setInternalRedundancy] =
    useState<RedundancyPattern>("n_plus_1");
  const redundancy = controlledRedundancy ?? internalRedundancy;
  const setRedundancy = onRedundancyChange ?? setInternalRedundancy;

  // Internal DR spec state (fallback if not controlled)
  const [internalDrSpec, setInternalDrSpec] = useState<DrCustomSpec>({ mode: "match" });
  const drSpec = controlledDrSpec ?? internalDrSpec;
  const setDrSpec = onDrSpecChange ?? setInternalDrSpec;

  // DR targets for 1+N (default 2 regions)
  const [drTargets, setDrTargets] = useState(2);

  const { data: acfServices } = useFetchAcfPublicServices();

  const isDrPlan =
    selectedPlan === "dr_standby" || selectedPlan === "dr_replication";

  // ── DR Target AZ logic ─────────────────────────────────────────────
  const primaryRegion = configurations[0]?.region || "";
  const primaryAz = configurations[0]?.availability_zone || "";
  const primaryFamilyCode = configurations[0]?.family_code || "";

  // Fetch all AZs in the region so we can offer a different one for DR
  const { data: regionAzs } = useFetchAvailabilityZones(primaryRegion || undefined);

  // Filter out the primary AZ — DR must be in a different location
  const drAzOptions = useMemo(() => {
    if (!regionAzs || !Array.isArray(regionAzs)) return [];
    return regionAzs
      .filter((az) => az.is_active !== false && az.code !== primaryAz)
      .map((az) => ({
        value: az.code,
        label: az.name || az.code,
      }));
  }, [regionAzs, primaryAz]);

  // Auto-select the first available DR AZ if none is chosen yet
  useEffect(() => {
    if (isDrPlan && !drSpec.drTargetAz && drAzOptions.length > 0) {
      const firstAz = drAzOptions[0];
      setDrSpec({
        ...drSpec,
        drTargetAz: firstAz.value,
        drTargetAzLabel: firstAz.label,
      });
    }
  }, [isDrPlan, drAzOptions, drSpec.drTargetAz]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedDrAz = drSpec.drTargetAz || "";

  // Fetch compute pricing for the DR target AZ (different from production AZ)
  const { data: computePricingRaw } = useFetchProductPricing(
    primaryRegion,
    "compute_instance",
    {
      countryCode: billingCountry || "US",
      perPage: 100,
      withProduct: true,
      availabilityZone: selectedDrAz,
      enabled: primaryRegion.length > 0 && selectedDrAz.length > 0,
    }
  );

  // Parse DR compute pricing into selectable options
  const drComputeOptionsWithFamily = useMemo(() => {
    const rawData = computePricingRaw;
    const rows = (Array.isArray(rawData)
      ? rawData
      : Array.isArray((rawData as { data?: unknown })?.data)
        ? ((rawData as { data: unknown[] }).data)
        : []) as Array<Record<string, unknown>>;
    return rows
      .filter((item) => {
        const eff = item?.pricing?.effective;
        return eff && (eff.price_local != null || eff.price_usd != null);
      })
      .map((item, idx: number) => {
        const product = item?.product || {};
        const value = product?.productable_id || product?.id || item?.product_id || item?.id;
        if (!value) return null;

        const baseLabel = product?.productable_name || product?.name || item?.name || `Instance ${idx + 1}`;
        const vcpus = product?.vcpus || item?.vcpus;
        const memoryMb = product?.memory_mb || item?.memory_mb;
        const memoryGb = memoryMb ? Math.round(Number(memoryMb) / 1024) : null;
        const familyCode = product?.family_code || null;

        const effective = item?.pricing?.effective || {};
        const priceLocal = effective.price_local ?? effective.price_usd ?? effective.amount;
        const priceCurrency = effective.currency || currency || "USD";
        const priceNum = priceLocal != null ? Number(priceLocal) : null;

        const labelParts = [baseLabel];
        if (vcpus) labelParts.push(`${vcpus} vCPU`);
        if (memoryGb) labelParts.push(`${memoryGb} GB RAM`);
        if (priceNum != null && Number.isFinite(priceNum)) {
          const formatted = priceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          labelParts.push(`${String(priceCurrency).toUpperCase()} ${formatted}`);
        }

        return {
          value: String(value),
          label: labelParts.join(" • "),
          _price: priceNum ?? 0,
          _familyCode: familyCode,
          _vcpus: vcpus ? Number(vcpus) : 0,
          _memoryGb: memoryGb ?? 0,
        };
      })
      .filter(Boolean) as { value: string; label: string; _price: number; _familyCode: string | null; _vcpus: number; _memoryGb: number }[];
  }, [computePricingRaw, currency]);

  const drComputeOptions = drComputeOptionsWithFamily;

  // ── Cross-AZ matching: family_code first, then spec-based (vCPU + RAM) fallback
  // Parse the primary instance's vCPU and RAM from its label for spec matching
  const primarySpecs = useMemo(() => {
    const label = configurations[0]?.compute_label || "";
    const vcpuMatch = label.match(/(\d+)\s*vCPU/i);
    const ramMatch = label.match(/(\d+)\s*GB\s*RAM/i);
    return {
      vcpus: vcpuMatch ? Number(vcpuMatch[1]) : 0,
      memoryGb: ramMatch ? Number(ramMatch[1]) : 0,
    };
  }, [configurations]);

  const familyMatchedOption = useMemo(() => {
    if (!drComputeOptionsWithFamily.length) return null;

    // 1) Exact family_code match — best case
    if (primaryFamilyCode) {
      const familyMatch = drComputeOptionsWithFamily.find((o) => o._familyCode === primaryFamilyCode);
      if (familyMatch) return { ...familyMatch, _matchType: "family_code" as const };
    }

    // 2) Spec-based fallback — match by vCPU + RAM
    if (primarySpecs.vcpus > 0 && primarySpecs.memoryGb > 0) {
      // Exact spec match
      const exactSpecMatch = drComputeOptionsWithFamily.find(
        (o) => o._vcpus === primarySpecs.vcpus && o._memoryGb === primarySpecs.memoryGb
      );
      if (exactSpecMatch) return { ...exactSpecMatch, _matchType: "exact_spec" as const };

      // Closest spec match — find the option with the smallest difference in total resources
      let bestMatch = drComputeOptionsWithFamily[0];
      let bestScore = Infinity;
      for (const opt of drComputeOptionsWithFamily) {
        if (opt._vcpus === 0 && opt._memoryGb === 0) continue;
        // Score by euclidean distance of normalised vCPU + RAM difference
        const vcpuDiff = Math.abs(opt._vcpus - primarySpecs.vcpus) / Math.max(primarySpecs.vcpus, 1);
        const ramDiff = Math.abs(opt._memoryGb - primarySpecs.memoryGb) / Math.max(primarySpecs.memoryGb, 1);
        const score = vcpuDiff + ramDiff;
        // Prefer instances >= production size for DR (don't undersize the DR server)
        const undersized = opt._vcpus < primarySpecs.vcpus || opt._memoryGb < primarySpecs.memoryGb;
        const adjustedScore = undersized ? score + 1 : score;
        if (adjustedScore < bestScore) {
          bestScore = adjustedScore;
          bestMatch = opt;
        }
      }
      if (bestMatch && bestScore < Infinity) {
        return { ...bestMatch, _matchType: "closest_spec" as const };
      }
    }

    return null;
  }, [primaryFamilyCode, primarySpecs, drComputeOptionsWithFamily]);

  // When in "match" mode, use the family-matched price from the DR AZ
  const effectiveDrVmPrice = useMemo(() => {
    if (drSpec.mode === "custom" && drSpec.pricePerVm !== undefined) {
      return drSpec.pricePerVm;
    }
    // In match mode, prefer the family-matched price from DR AZ
    if (drSpec.mode === "match" && familyMatchedOption) {
      return familyMatchedOption._price;
    }
    return computePricePerVm;
  }, [drSpec, computePricePerVm, familyMatchedOption]);

  const pricing = useMemo(() => {
    const backupSvc = acfServices?.find((s) => s.service_type === "backup");
    const replicationSvc = acfServices?.find(
      (s) =>
        s.service_type === "replication" ||
        s.service_type === "dr_replication"
    );

    const backupPerGb = backupSvc?.unit_price ?? 16;
    const replicationPerVm = replicationSvc?.unit_price ?? 12000;

    // DR standby VM = 20% of VM price (80% discount)
    // Uses custom DR spec price if user chose a different instance type
    const drVmPrice = effectiveDrVmPrice * (1 - DR_DISCOUNT);
    const drVmCount = getDrVmCount(redundancy, instanceCount, drTargets);

    const backupCost = backupPerGb * storageGb * instanceCount;
    const drStandbyCost = drVmPrice * drVmCount;
    const replicationCost = replicationPerVm * drVmCount;

    return {
      none: { monthly: 0, breakdown: [], drVmCount: 0 },
      backup_only: {
        monthly: backupCost,
        drVmCount: 0,
        breakdown: [
          {
            label: "Backup",
            detail: `${instanceCount} × ${storageGb} GB × ${formatPrice(backupPerGb, currency)}/GB`,
            cost: backupCost,
          },
        ],
      },
      dr_standby: {
        monthly: backupCost + drStandbyCost,
        drVmCount,
        breakdown: [
          {
            label: "Backup",
            detail: `${instanceCount} × ${storageGb} GB × ${formatPrice(backupPerGb, currency)}/GB`,
            cost: backupCost,
          },
          {
            label: drSpec.mode === "custom" ? "DR Standby VM (Custom)" : "DR Standby VM",
            detail: `${drVmCount} VM × ${formatPrice(drVmPrice, currency)} (80% off ${formatPrice(effectiveDrVmPrice, currency)})`,
            cost: drStandbyCost,
          },
        ],
      },
      dr_replication: {
        monthly: backupCost + drStandbyCost + replicationCost,
        drVmCount,
        breakdown: [
          {
            label: "Backup",
            detail: `${instanceCount} × ${storageGb} GB × ${formatPrice(backupPerGb, currency)}/GB`,
            cost: backupCost,
          },
          {
            label: drSpec.mode === "custom" ? "DR Standby VM (Custom)" : "DR Standby VM",
            detail: `${drVmCount} VM × ${formatPrice(drVmPrice, currency)} (80% off ${formatPrice(effectiveDrVmPrice, currency)})`,
            cost: drStandbyCost,
          },
          {
            label: `${RESILIENCE} Replication`,
            detail: `${drVmCount} VM × ${formatPrice(replicationPerVm, currency)}/VM`,
            cost: replicationCost,
          },
        ],
      },
    };
  }, [
    acfServices,
    instanceCount,
    storageGb,
    effectiveDrVmPrice,
    currency,
    redundancy,
    drTargets,
  ]);

  // Sync computed DR pricing back to parent via drSpec
  useEffect(() => {
    if (!isDrPlan) return;
    const planPricing = pricing[selectedPlan];
    const currentCost = planPricing?.monthly ?? 0;
    const currentVmCount = planPricing?.drVmCount ?? 0;
    // Only update if values actually changed to avoid infinite loops
    if (
      drSpec.drMonthlyCost !== currentCost ||
      drSpec.drVmCount !== currentVmCount ||
      drSpec.drVmFullPrice !== effectiveDrVmPrice
    ) {
      setDrSpec({
        ...drSpec,
        drMonthlyCost: currentCost,
        drVmCount: currentVmCount,
        drVmFullPrice: effectiveDrVmPrice,
      });
    }
  }, [isDrPlan, pricing, selectedPlan, effectiveDrVmPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Protection Plan</h2>
        <p className="mt-1 text-sm text-gray-500">
          How safe do you want your{" "}
          {instanceCount > 1
            ? `${instanceCount} ${resourceLabel}s`
            : resourceLabel}{" "}
          to be? Pick a plan below. You can always change this later.
        </p>
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const Icon = plan.icon;
          const planPricing = pricing[plan.id];
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onPlanChange(plan.id)}
              className={`relative flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? `${plan.accentBorder} ${plan.accentBg} shadow-sm`
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
              }`}
            >
              {/* Radio indicator */}
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300 bg-white"
                }`}
              >
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>

              {/* Icon */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isSelected ? "bg-white shadow-sm" : "bg-gray-100"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isSelected ? "text-blue-600" : "text-gray-400"
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {plan.label}
                    </span>
                    {plan.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${plan.badgeColor}`}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  {/* Price tag */}
                  <div className="text-right shrink-0">
                    {planPricing.monthly === 0 ? (
                      <span className="text-sm font-semibold text-gray-400">
                        {plan.id === "none" ? "Free" : formatPrice(0, currency)}
                      </span>
                    ) : (
                      <div>
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? "text-blue-700" : "text-gray-700"
                          }`}
                        >
                          {formatPrice(planPricing.monthly, currency)}
                        </span>
                        <span className="text-[10px] text-gray-400">/mo</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">{plan.description}</p>

                {/* Features */}
                {isSelected && plan.features.length > 0 && (
                  <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {plan.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-1.5 text-xs text-gray-600"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}

                {/* DR discount badge */}
                {isSelected &&
                  (plan.id === "dr_standby" || plan.id === "dr_replication") &&
                  computePricePerVm > 0 && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                      <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="text-[11px] text-blue-700">
                        Your spare server costs <strong>80% less</strong> —
                        only{" "}
                        {formatPrice(
                          effectiveDrVmPrice * (1 - DR_DISCOUNT),
                          currency
                        )}
                        /VM instead of the full{" "}
                        {formatPrice(effectiveDrVmPrice, currency)}/VM price
                        {drSpec.mode === "custom" && " (custom size)"}
                      </span>
                    </div>
                  )}

                {/* Pricing breakdown */}
                {isSelected && planPricing.breakdown.length > 0 && (
                  <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Cost breakdown
                    </span>
                    {planPricing.breakdown.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium text-gray-700">
                            {item.label}
                          </span>
                          <span className="ml-1.5 text-gray-400">
                            {item.detail}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-700">
                          {formatPrice(item.cost, currency)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-1.5 text-xs">
                      <span className="font-semibold text-gray-800">
                        Total monthly
                      </span>
                      <span className="font-bold text-blue-700">
                        {formatPrice(planPricing.monthly, currency)}/mo
                      </span>
                    </div>
                  </div>
                )}

                {/* Resilience product call-out (Orbit / white-label) */}
                {isSelected &&
                  (plan.id === "dr_standby" ||
                    plan.id === "dr_replication") && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/80 border border-green-200 px-3 py-2">
                      <RefreshCw className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span className="text-[11px] text-green-700">
                        <strong>{RESILIENCE}</strong> —{" "}
                        {plan.id === "dr_standby"
                          ? "keeps your spare server updated with periodic copies. You switch manually when needed."
                          : "copies every change to your spare in real-time. Switches automatically if something goes wrong."}
                      </span>
                    </div>
                  )}

                {/* DR VM spec configuration — AZ selection, match or custom */}
                {isSelected &&
                  (plan.id === "dr_standby" || plan.id === "dr_replication") &&
                  configurations.length > 0 && (
                    <div
                      className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      role="group"
                      aria-label="DR server configuration"
                    >
                      {/* DR Target AZ Selector */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            DR Target Location
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Your DR server will be placed in a different availability zone for geographic redundancy.
                        </p>
                        {drAzOptions.length > 0 ? (
                          <select
                            value={selectedDrAz}
                            onChange={(e) => {
                              const azCode = e.target.value;
                              const azOption = drAzOptions.find((o) => o.value === azCode);
                              setDrSpec({
                                ...drSpec,
                                drTargetAz: azCode,
                                drTargetAzLabel: azOption?.label || azCode,
                                // Reset custom selection when AZ changes
                                ...(drSpec.mode === "custom" ? { computeInstanceId: "", computeLabel: "", pricePerVm: undefined } : {}),
                              });
                            }}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                          >
                            <option value="">Select DR availability zone...</option>
                            {drAzOptions.map((az) => (
                              <option key={az.value} value={az.value}>
                                {az.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                            <p className="text-[10px] text-amber-700">
                              No other availability zones found in this region. DR requires at least two availability zones.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Only show spec configuration if a DR AZ is selected */}
                      {selectedDrAz && (
                        <>
                          <div className="border-t border-gray-200 pt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                DR Server Specs
                              </span>
                              {/* Toggle: Match / Custom */}
                              <div className="flex rounded-md border border-gray-200 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDrSpec({ ...drSpec, mode: "match" });
                                  }}
                                  className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                                    drSpec.mode === "match"
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  Match production
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDrSpec({
                                      ...drSpec,
                                      mode: "custom",
                                      computeInstanceId: "",
                                      computeLabel: "",
                                      pricePerVm: undefined,
                                    });
                                  }}
                                  className={`px-2.5 py-1 text-[10px] font-semibold transition-colors border-l border-gray-200 ${
                                    drSpec.mode === "custom"
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  Custom size
                                </button>
                              </div>
                            </div>
                          </div>

                          {drSpec.mode === "match" ? (
                            <>
                              <p className="text-[10px] text-gray-500">
                                {familyMatchedOption?._matchType === "family_code"
                                  ? `Equivalent instance found in ${drSpec.drTargetAzLabel || selectedDrAz} — same product family, different location.`
                                  : familyMatchedOption?._matchType === "exact_spec"
                                    ? `Matched by specs (${primarySpecs.vcpus} vCPU, ${primarySpecs.memoryGb} GB RAM) in ${drSpec.drTargetAzLabel || selectedDrAz}.`
                                    : familyMatchedOption?._matchType === "closest_spec"
                                      ? `Closest match found in ${drSpec.drTargetAzLabel || selectedDrAz} — ${familyMatchedOption._vcpus} vCPU, ${familyMatchedOption._memoryGb} GB RAM.`
                                      : `Your spare server will match your production specs in ${drSpec.drTargetAzLabel || selectedDrAz}.`}
                              </p>
                              {configurations.map((cfg, i) => {
                                const label = cfg.compute_label || computeLabel || "";
                                const os = cfg.os_image_label || osLabel || "";
                                const disk = Number(cfg.storage_size_gb) || storageGb;
                                if (!label && !os) return null;
                                return (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2 rounded-md bg-white border border-gray-100 px-3 py-2"
                                  >
                                    <Server className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                    <div className="text-[11px] text-gray-700 space-y-0.5">
                                      {configurations.length > 1 && (
                                        <div className="font-semibold text-gray-800">
                                          {resourceLabel} #{i + 1}
                                        </div>
                                      )}
                                      {familyMatchedOption ? (
                                        <div>
                                          <span className="text-gray-400">DR instance: </span>
                                          <span className="font-medium">{familyMatchedOption.label}</span>
                                        </div>
                                      ) : label ? (
                                        <div>
                                          <span className="text-gray-400">Instance type: </span>
                                          <span className="font-medium">{label}</span>
                                        </div>
                                      ) : null}
                                      {os && (
                                        <div>
                                          <span className="text-gray-400">OS: </span>
                                          <span className="font-medium">{os}</span>
                                        </div>
                                      )}
                                      {disk > 0 && (
                                        <div>
                                          <span className="text-gray-400">Disk: </span>
                                          <span className="font-medium">{disk} GB</span>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-gray-400">DR location: </span>
                                        <span className="font-medium">{drSpec.drTargetAzLabel || selectedDrAz}</span>
                                      </div>
                                      <div className="text-[10px] text-blue-600 font-medium mt-1">
                                        {familyMatchedOption?._matchType === "family_code"
                                          ? "DR copy = same product family, 80% off"
                                          : familyMatchedOption?._matchType === "exact_spec"
                                            ? "DR copy = same specs (vCPU + RAM), 80% off"
                                            : familyMatchedOption?._matchType === "closest_spec"
                                              ? `DR copy = closest match (${familyMatchedOption._vcpus} vCPU, ${familyMatchedOption._memoryGb} GB), 80% off`
                                              : "DR copy = same specs, 80% off"}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            /* Custom DR spec */
                            <div className="space-y-2">
                              <p className="text-[10px] text-gray-500">
                                Pick a different instance type from {drSpec.drTargetAzLabel || selectedDrAz} for your spare server.
                                Storage stays the same — your data must fit on the DR server.
                              </p>
                              <div onClick={(e) => e.stopPropagation()}>
                                <SearchableSelect
                                  label="DR Server Instance Type"
                                  placeholder="Select instance type for DR..."
                                  value={drSpec.computeInstanceId || ""}
                                  options={drComputeOptions}
                                  onChange={(e) => {
                                    const selectedId = e.target.value;
                                    const match = drComputeOptions.find((o) => o.value === selectedId);
                                    setDrSpec({
                                      ...drSpec,
                                      mode: "custom",
                                      computeInstanceId: selectedId,
                                      computeLabel: match?.label || "",
                                      pricePerVm: match?._price ?? 0,
                                    });
                                  }}
                                  searchPlaceholder="Search instance types..."
                                />
                              </div>
                              {drSpec.computeLabel && (
                                <div className="flex items-start gap-2 rounded-md bg-white border border-blue-100 px-3 py-2">
                                  <Server className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <div className="text-[11px] text-gray-700 space-y-0.5">
                                    <div>
                                      <span className="text-gray-400">DR instance type: </span>
                                      <span className="font-medium">{drSpec.computeLabel}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Disk: </span>
                                      <span className="font-medium">{storageGb} GB (same as production)</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">DR location: </span>
                                      <span className="font-medium">{drSpec.drTargetAzLabel || selectedDrAz}</span>
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-medium mt-1">
                                      DR cost = {formatPrice(effectiveDrVmPrice * (1 - DR_DISCOUNT), currency)}/VM (80% off {formatPrice(effectiveDrVmPrice, currency)})
                                    </div>
                                  </div>
                                </div>
                              )}
                              {!drSpec.computeLabel && (
                                <p className="text-[10px] text-amber-600">
                                  Please select an instance type for your DR server above.
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Redundancy Pattern Selector (only when DR plan selected) ── */}
      {isDrPlan && instanceCount >= 1 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              How many spare servers?
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Choose how {RESILIENCE} sets up spare servers for your{" "}
              {instanceCount}{" "}
              {instanceCount > 1 ? `${resourceLabel}s` : resourceLabel}.
              More spares = more safety, but costs more.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {REDUNDANCY_PATTERNS.map((pattern) => {
              const isActive = redundancy === pattern.id;
              const PatternIcon = pattern.icon;
              const drVms = getDrVmCount(
                pattern.id,
                instanceCount,
                drTargets
              );
              const drVmPrice =
                computePricePerVm * (1 - DR_DISCOUNT);
              const patternDrCost = drVmPrice * drVms;

              return (
                <button
                  key={pattern.id}
                  type="button"
                  onClick={() => setRedundancy(pattern.id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    isActive
                      ? "border-blue-400 bg-blue-50/60 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <PatternIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <span
                        className={`text-xs font-bold ${
                          isActive ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {pattern.shortLabel}
                      </span>
                    </div>
                    {/* Radio */}
                    <div
                      className={`ml-auto flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? "border-blue-600 bg-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <p className="mt-2 text-[11px] font-semibold text-gray-700">
                    {pattern.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-gray-500">
                    {pattern.description}
                  </p>

                  {/* Stats */}
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-white border border-gray-100 px-2.5 py-1.5">
                    <div className="text-center">
                      <div className="text-[10px] text-gray-400">
                        Production
                      </div>
                      <div className="text-xs font-bold text-gray-800">
                        {instanceCount} VM{instanceCount > 1 ? "s" : ""}
                      </div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-gray-300" />
                    <div className="text-center">
                      <div className="text-[10px] text-gray-400">
                        DR Standby
                      </div>
                      <div className="text-xs font-bold text-blue-700">
                        {drVms} VM{drVms > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* DR cost for this pattern */}
                  {computePricePerVm > 0 && (
                    <div className="mt-2 text-center">
                      <span className="text-[10px] text-gray-400">
                        DR VM cost:{" "}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isActive ? "text-blue-700" : "text-gray-600"
                        }`}
                      >
                        {formatPrice(patternDrCost, currency)}/mo
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 1+N targets selector */}
          {redundancy === "one_plus_n" && (
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
              <Globe className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-700">
                  Spare copies per server
                </span>
                <p className="text-[10px] text-gray-400">
                  How many spare servers in different locations should each of your servers have?
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDrTargets(Math.max(2, drTargets - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold text-gray-800">
                  {drTargets}
                </span>
                <button
                  type="button"
                  onClick={() => setDrTargets(Math.min(5, drTargets + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Summary row */}
          {computePricePerVm > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <div>
                <span className="text-xs font-semibold text-blue-800">
                  {instanceCount} Production VM{instanceCount > 1 ? "s" : ""} +{" "}
                  {pricing[selectedPlan].drVmCount} DR Standby VM
                  {pricing[selectedPlan].drVmCount > 1 ? "s" : ""}
                </span>
                <p className="text-[10px] text-blue-600">
                  {redundancy === "n_plus_1" && "One shared spare — can rescue one server at a time"}
                  {redundancy === "one_plus_1" && "Each server has its own spare — everyone is covered"}
                  {redundancy === "one_plus_n" && `Extra safe — ${drTargets} spare copies of each server in different locations`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-blue-800">
                  {formatPrice(pricing[selectedPlan].monthly, currency)}
                  <span className="text-[10px] font-normal text-blue-500">
                    /mo
                  </span>
                </div>
                <div className="text-[10px] text-blue-500">
                  total protection cost
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-5">
        <ModernButton variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </ModernButton>
        <ModernButton variant="primary" onClick={onContinue}>
          Continue
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </ModernButton>
      </div>
    </div>
  );
};

export default ProtectionPlanStep;
