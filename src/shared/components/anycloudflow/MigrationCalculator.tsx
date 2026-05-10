import { useMemo, useState } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle,
  ArrowUpCircle,
  Sparkles,
} from "lucide-react";
import { ModernButton, ModernCard } from "@/shared/components/ui";
import { FriendlyTooltip, RESILIENCE } from "@/shared/components/orbit";
import {
  useFetchAcfServices,
  useCalculateMigration,
  useFetchAcfQuotas,
  useUpgradeAcfQuota,
  type AcfService,
  type AcfServiceCategory,
  type CalculatorItem,
  type CalculatorResult,
  type QuotaStatus,
} from "@/hooks/anyCloudFlowCalculatorHooks";

interface MigrationCalculatorProps {
  context: "admin" | "tenant" | "client";
}

/**
 * Group display config — order, label, description, emoji.
 *
 * Mirrors the `category` enum the backend now stamps on each
 * service. Anything we don't know about lands in "other" so unknown
 * SKUs don't disappear.
 */
const CATEGORY_CONFIG: Record<
  AcfServiceCategory,
  { label: string; helper: string; emoji: string; order: number }
> = {
  subscription: {
    label: "Pick your plan",
    helper: "How much horsepower do you want? You can change this later.",
    emoji: "📦",
    order: 1,
  },
  migration: {
    label: "Move things once",
    helper: "Lift-and-shift servers or databases between regions or providers.",
    emoji: "🚚",
    order: 2,
  },
  replication: {
    label: "Keep things in sync",
    helper: "Continuous server-to-server copy so a backup is always ready.",
    emoji: "🔁",
    order: 3,
  },
  bucket: {
    label: "Move or mirror buckets",
    helper: "Object-storage bucket transfer and continuous mirroring.",
    emoji: "🪣",
    order: 4,
  },
  backup: {
    label: "Scheduled backups",
    helper: "Recurring snapshots to your own storage. We orchestrate, you own the data.",
    emoji: "💾",
    order: 5,
  },
  other: {
    label: "Other services",
    helper: "Add-ons that don't fit the buckets above.",
    emoji: "✨",
    order: 99,
  },
};

/**
 * Compact, currency-aware money formatter.
 *
 * The backend used to return NGN amounts under a `unit_price` field
 * with no currency hint, so the old UI hardcoded `$` and the user
 * saw "$78400" against a tenant page that read "₦78,400". We now
 * accept the currency code from the API response and render the
 * Intl-correct symbol.
 */
function formatMoney(amount: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

const MigrationCalculator = ({ context: _context }: MigrationCalculatorProps) => {
  const { data: services, isLoading: servicesLoading } = useFetchAcfServices();
  const { data: quotas } = useFetchAcfQuotas();
  const calculateMutation = useCalculateMigration();
  const upgradeMutation = useUpgradeAcfQuota();

  const [items, setItems] = useState<(CalculatorItem & { enabled: boolean })[]>([]);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [showQuotas, setShowQuotas] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AcfServiceCategory | "all">("all");

  const serviceList = Array.isArray(services) ? services : [];
  const quotaMap = (quotas ?? {}) as QuotaStatus;

  // Currency reflects what the backend resolved for the caller's
  // country. Use the first service's currency if present — the
  // backend stamps the same currency on every row in a given call.
  const currency = serviceList.find((s) => s.currency)?.currency ?? "NGN";

  // Group services by category for the friendly tabbed picker.
  const grouped = useMemo(() => {
    const buckets = new Map<AcfServiceCategory, AcfService[]>();
    for (const svc of serviceList) {
      const cat = (svc.category ?? "other") as AcfServiceCategory;
      const list = buckets.get(cat) ?? [];
      list.push(svc);
      buckets.set(cat, list);
    }
    return buckets;
  }, [serviceList]);

  const visibleCategories = useMemo(() => {
    return Array.from(grouped.keys()).sort(
      (a, b) => (CATEGORY_CONFIG[a]?.order ?? 99) - (CATEGORY_CONFIG[b]?.order ?? 99),
    );
  }, [grouped]);

  const visibleServices = useMemo(() => {
    if (activeCategory === "all") return serviceList;
    return grouped.get(activeCategory) ?? [];
  }, [activeCategory, serviceList, grouped]);

  const addService = (svc: AcfService) => {
    if (items.find((i) => i.service_type === svc.service_type)) return;
    setItems([
      ...items,
      {
        service_type: svc.service_type,
        quantity: svc.is_one_time || svc.is_recurring ? 1 : undefined,
        data_gb: undefined,
        months: svc.is_recurring ? 1 : undefined,
        enabled: true,
      },
    ]);
    setResult(null);
  };

  const updateItem = (idx: number, field: string, value: number) => {
    const updated = [...items];
    (updated[idx] as unknown as Record<string, unknown>)[field] = value;
    setItems(updated);
    setResult(null);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
    setResult(null);
  };

  const handleCalculate = () => {
    const enabledItems = items
      .filter((i) => i.enabled)
      .map(({ enabled: _enabled, ...rest }) => rest);
    if (enabledItems.length === 0) return;
    calculateMutation.mutate(
      { items: enabledItems },
      {
        onSuccess: (data) => setResult(data),
        // onError is intentional: the underlying client toasts the
        // server message, but we also want to surface a near-button
        // hint so the user knows the click DID register and a retry
        // is meaningful. The mutation's `error` state drives that.
        onError: () => setResult(null),
      },
    );
  };

  const getService = (type: string) => serviceList.find((s) => s.service_type === type);

  if (servicesLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 p-12 text-gray-500 dark:text-gray-400"
      >
        <span aria-hidden="true" className="text-4xl animate-pulse">🧮</span>
        <p className="text-sm">Pulling the latest prices…</p>
      </div>
    );
  }

  if (serviceList.length === 0) {
    return (
      <ModernCard>
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <span aria-hidden="true" className="text-5xl">🧮</span>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
            No services priced yet
          </p>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            Once your platform admin seeds the {RESILIENCE} catalog, the calculator will light up here.
          </p>
        </div>
      </ModernCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reassurance pill — pricing matches the override page */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-success-700 dark:bg-success-900/30 dark:text-success-300">
          <Sparkles className="h-3 w-3" />
          Prices in {currency} — same numbers your billing page shows.
        </span>
        <FriendlyTooltip
          mode="inline"
          term={<span className="cursor-help">How does pricing work?</span>}
          definition="Tenant overrides are honoured automatically. If your admin lowered a price for your account, that's the number you'll see here."
          example="Same pricing logic as the billing page — no surprises."
        />
      </div>

      {/* Service picker card */}
      <ModernCard>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              What do you want to add?
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowQuotas((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            {showQuotas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showQuotas ? "Hide quotas" : "Show quotas"}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              activeCategory === "all"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            All
          </button>
          {visibleCategories.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <span aria-hidden="true" className="mr-1">{cfg.emoji}</span>
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Helper line for the active category */}
        {activeCategory !== "all" && (
          <p className="px-5 pt-3 text-xs text-gray-500 dark:text-gray-400">
            {CATEGORY_CONFIG[activeCategory]?.helper}
          </p>
        )}

        {/* Service cards */}
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleServices.map((svc) => {
            const added = items.some((i) => i.service_type === svc.service_type);
            const cat = (svc.category ?? "other") as AcfServiceCategory;
            const emoji = CATEGORY_CONFIG[cat]?.emoji ?? "✨";
            const cardName = svc.friendly_name || svc.name;
            const cardDesc = svc.friendly_description || svc.description;
            const billLabel = svc.is_recurring
              ? `${formatMoney(svc.unit_price, svc.currency || currency)} / ${svc.unit_label || "month"}`
              : `${formatMoney(svc.unit_price, svc.currency || currency)} · ${svc.unit_label || "one-time"}`;

            return (
              <button
                key={svc.service_type}
                type="button"
                onClick={() => !added && addService(svc)}
                disabled={added}
                className={`group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                  added
                    ? "border-success-300 bg-success-50/60 opacity-80 cursor-default dark:border-success-700/50 dark:bg-success-900/10"
                    : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                }`}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-lg">{emoji}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {cardName}
                    </span>
                  </div>
                  {added ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-success-500" aria-label="Added" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-primary-500 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  )}
                </div>
                {cardDesc && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {cardDesc}
                  </p>
                )}
                <span className="mt-auto rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {billLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected items + qty controls */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Tweak amounts — quantity is how many servers, months is how long.
            </p>
            {items.map((item, idx) => {
              const svc = getService(item.service_type);
              if (!svc) return null;
              const cardName = svc.friendly_name || svc.name;
              return (
                <div
                  key={item.service_type}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {cardName}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {formatMoney(svc.unit_price, svc.currency || currency)} {svc.unit_label}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {(svc.is_one_time || svc.is_recurring) && (
                      <label className="flex flex-col items-center text-[10px] text-gray-500 dark:text-gray-400">
                        Qty
                        <input
                          type="number"
                          min={1}
                          value={item.quantity ?? 1}
                          onChange={(e) => updateItem(idx, "quantity", +e.target.value)}
                          className="mt-0.5 w-16 rounded border border-gray-300 px-2 py-1 text-center text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        />
                      </label>
                    )}
                    {svc.is_recurring && (
                      <label className="flex flex-col items-center text-[10px] text-gray-500 dark:text-gray-400">
                        Months
                        <input
                          type="number"
                          min={1}
                          value={item.months ?? 1}
                          onChange={(e) => updateItem(idx, "months", +e.target.value)}
                          className="mt-0.5 w-16 rounded border border-gray-300 px-2 py-1 text-center text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                        />
                      </label>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    aria-label={`Remove ${cardName}`}
                    className="rounded p-1 text-gray-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Calculate CTA */}
        <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <ModernButton
            onClick={handleCalculate}
            disabled={items.filter((i) => i.enabled).length === 0 || calculateMutation.isPending}
            loading={calculateMutation.isPending}
          >
            <Calculator className="h-4 w-4" />
            {calculateMutation.isPending ? "Crunching the numbers…" : "Show me the total"}
          </ModernButton>
          {items.length === 0 && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Pick a service or two above and we'll estimate the cost.
            </p>
          )}
          {calculateMutation.isError && (
            <p
              role="alert"
              className="mt-2 text-xs text-danger-600 dark:text-danger-400"
            >
              Couldn't get a quote just now —{" "}
              <button
                type="button"
                onClick={handleCalculate}
                className="underline hover:no-underline"
              >
                try again
              </button>
              .
            </p>
          )}
        </div>
      </ModernCard>

      {/* Quota status */}
      {showQuotas && Object.keys(quotaMap).length > 0 && (
        <ModernCard>
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Service quotas
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              How many of each service you can run right now.
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(quotaMap).map(([serviceType, quota]) => {
              const isFull = quota.available === 0 && quota.limit > 0;
              const isUnlimited = quota.limit === -1;
              return (
                <div
                  key={serviceType}
                  className={`rounded-lg border p-3 ${
                    isFull
                      ? "border-danger-200 bg-danger-50 dark:border-danger-700/50 dark:bg-danger-900/10"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">
                      {serviceType.replace(/_/g, " ")}
                    </p>
                    {quota.fast_tracked && (
                      <Zap className="h-3 w-3 text-warning-500" aria-label="Fast-tracked" />
                    )}
                  </div>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      isFull
                        ? "text-danger-600 dark:text-danger-400"
                        : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {isUnlimited ? "Unlimited" : `${quota.used} / ${quota.limit}`}
                  </p>
                  {!isUnlimited && quota.limit > 0 && (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full ${
                          isFull
                            ? "bg-danger-500"
                            : quota.percentage_used > 75
                              ? "bg-warning-500"
                              : "bg-success-500"
                        }`}
                        style={{ width: `${Math.min(100, quota.percentage_used)}%` }}
                      />
                    </div>
                  )}
                  {isFull && (
                    <button
                      type="button"
                      onClick={() =>
                        upgradeMutation.mutate({ serviceType, newLimit: quota.limit * 2 })
                      }
                      disabled={upgradeMutation.isPending}
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-primary-600 py-1 text-[10px] font-semibold text-white hover:bg-primary-700"
                    >
                      <ArrowUpCircle className="h-3 w-3" />
                      Need more? Bump to {quota.limit * 2}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </ModernCard>
      )}

      {/* Result */}
      {result && (
        <ModernCard>
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Here's what it'll cost
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Final price after taxes is at the bottom.
            </p>
          </div>

          {/* Lines */}
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                  <th className="px-4 py-2">Service</th>
                  <th className="px-4 py-2">Details</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.lines.map((line, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {(line as { friendly_name?: string }).friendly_name || line.name}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                      {line.breakdown}
                      {line.tier_applied && (
                        <span className="ml-1 rounded bg-primary-50 px-1.5 py-0.5 text-[10px] text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                          {line.tier_applied}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          line.frequency === "recurring"
                            ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {line.frequency === "recurring" ? "Monthly" : "One-time"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {formatMoney(line.line_total, result.summary.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="m-5 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">One-time costs</span>
              <span className="font-medium tabular-nums">
                {formatMoney(result.summary.one_time_total, result.summary.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Monthly recurring</span>
              <span className="font-medium tabular-nums">
                {formatMoney(result.summary.monthly_recurring, result.summary.currency)}/mo
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal for period</span>
              <span className="font-medium tabular-nums">
                {formatMoney(result.summary.total_for_period, result.summary.currency)}
              </span>
            </div>
            {result.summary.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Tax ({result.summary.vat_rate}%)
                </span>
                <span className="tabular-nums">
                  {formatMoney(result.summary.tax, result.summary.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold dark:border-gray-700">
              <span className="text-gray-900 dark:text-gray-100">Grand total</span>
              <span className="tabular-nums text-primary-700 dark:text-primary-300">
                {formatMoney(result.summary.grand_total, result.summary.currency)}
              </span>
            </div>
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default MigrationCalculator;
