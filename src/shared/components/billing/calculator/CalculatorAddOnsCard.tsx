import React, { useMemo, useState } from "react";
import { Activity, Inbox, Plus, Server, Shield, Trash2 } from "lucide-react";

import { ModernCard, ModernButton, ModernInput } from "../../ui";
import { useFetchFlowPlans } from "@/hooks/adminHooks/adminFlowPlanPricingHooks";
import { useFetchIntegrationPricing } from "@/hooks/adminHooks/adminIntegrationPricingHooks";
import { useFetchMeteredPrices } from "@/hooks/adminHooks/adminMeteredPricingHooks";
import type {
  CalculatorData,
  FlowPlanLineItem,
  ShieldServiceLineItem,
  MeteredLineItem,
} from "../types";

/**
 * Calculator add-ons — surfaces SimpleDeploy plans, Shield packages, and
 * usage-based metrics in the pricing calculator. Each track has its own
 * mini-builder (pick item → enter qty + months → Add). The selected
 * line items live on `calculatorData.flow_plan_items`,
 * `calculatorData.shield_items`, `calculatorData.metered_items` and roll
 * up into the calculator's existing total alongside compute and storage.
 */
interface AddOnsCardProps {
  calculatorData: CalculatorData;
  updateCalculatorData: (field: keyof CalculatorData, value: unknown) => void;
}

const newId = () => `addon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const formatMoney = (amount: number, currency = "NGN") => {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const CalculatorAddOnsCard: React.FC<AddOnsCardProps> = ({
  calculatorData,
  updateCalculatorData,
}) => {
  const [activeTrack, setActiveTrack] = useState<
    "flow" | "anycloudflow" | "shield" | "metered"
  >("flow");

  const { data: flowPlans = [], isFetching: isFlowFetching } = useFetchFlowPlans();
  const { data: shieldServices = [], isFetching: isShieldFetching } =
    useFetchIntegrationPricing("shield");
  const { data: anycloudflowServices = [], isFetching: isAcfFetching } =
    useFetchIntegrationPricing("anycloudflow");
  const { data: meteredMetrics = [], isFetching: isMeteredFetching } = useFetchMeteredPrices();

  const flowItems = calculatorData.flow_plan_items ?? [];
  const shieldItems = calculatorData.shield_items ?? [];
  const anycloudflowItems = calculatorData.anycloudflow_items ?? [];
  const meteredItems = calculatorData.metered_items ?? [];

  // ── SimpleDeploy plan picker ──────────────────────
  const [flowDraft, setFlowDraft] = useState({ plan_id: "", quantity: "1", months: "1" });

  const addFlowPlan = () => {
    const plan = flowPlans.find((p) => String(p.id) === String(flowDraft.plan_id));
    if (!plan) return;
    const monthly = Number(plan.price_monthly_kobo || 0) / 100;
    const quantity = Math.max(1, Number(flowDraft.quantity) || 1);
    const months = Math.max(1, Number(flowDraft.months) || 1);
    const item: FlowPlanLineItem = {
      id: newId(),
      plan_id: plan.id,
      plan_name: plan.name,
      monthly_naira: monthly,
      quantity,
      months,
      total_price: monthly * quantity * months,
      currency: "NGN",
      unit_summary: `${formatMoney(monthly, "NGN")} / month × ${quantity}`,
    };
    updateCalculatorData("flow_plan_items", [...flowItems, item]);
    setFlowDraft({ plan_id: "", quantity: "1", months: "1" });
  };

  const removeFlowItem = (id: string) => {
    updateCalculatorData(
      "flow_plan_items",
      flowItems.filter((i) => i.id !== id),
    );
  };

  // ── Shield service picker ─────────────────────────
  const [shieldDraft, setShieldDraft] = useState({ key: "", quantity: "1", months: "1" });

  const shieldKeyFor = (s: { id: number; provider: string | null }) => `${s.id}|${s.provider ?? ""}`;
  const selectedShieldService = useMemo(() => {
    if (!shieldDraft.key) return undefined;
    return shieldServices.find((s) => shieldKeyFor(s) === shieldDraft.key);
  }, [shieldServices, shieldDraft.key]);

  const addShieldItem = () => {
    const svc = selectedShieldService;
    if (!svc || svc.price === null || svc.price === undefined) return;
    const quantity = Math.max(1, Number(shieldDraft.quantity) || 1);
    const months = Math.max(1, Number(shieldDraft.months) || 1);
    const monthsForBilling = svc.billing_model === "monthly_flat" ? months : 1;
    const total = Number(svc.price) * quantity * monthsForBilling;
    const item: ShieldServiceLineItem = {
      id: newId(),
      service_id: svc.id,
      service_name: svc.name,
      provider: svc.provider ?? "—",
      unit_label: svc.unit_label,
      unit_price: Number(svc.price),
      currency: svc.currency_code || "USD",
      quantity,
      months: monthsForBilling,
      billing_model: svc.billing_model,
      total_price: total,
      unit_summary: `${formatMoney(Number(svc.price), svc.currency_code)} × ${quantity}${
        svc.billing_model === "monthly_flat" ? ` × ${monthsForBilling} mo` : ""
      }`,
    };
    updateCalculatorData("shield_items", [...shieldItems, item]);
    setShieldDraft({ key: "", quantity: "1", months: "1" });
  };

  const removeShieldItem = (id: string) => {
    updateCalculatorData(
      "shield_items",
      shieldItems.filter((i) => i.id !== id),
    );
  };

  // ── AnyCloudFlow service picker ───────────────────
  // Same data shape as Shield (both are IntegrationProduct rows) so we
  // reuse the line-item type + add logic. The only difference is the
  // catalog source and the bucket the items land in.
  const [acfDraft, setAcfDraft] = useState({ id: "", quantity: "1", months: "1" });
  const selectedAcfService = useMemo(() => {
    if (!acfDraft.id) return undefined;
    return anycloudflowServices.find((s) => String(s.id) === String(acfDraft.id));
  }, [anycloudflowServices, acfDraft.id]);

  const addAcfItem = () => {
    const svc = selectedAcfService;
    if (!svc || svc.price === null || svc.price === undefined) return;
    const quantity = Math.max(1, Number(acfDraft.quantity) || 1);
    const months = Math.max(1, Number(acfDraft.months) || 1);
    const monthsForBilling = svc.billing_model === "monthly_flat" ? months : 1;
    const total = Number(svc.price) * quantity * monthsForBilling;
    const item: ShieldServiceLineItem = {
      id: newId(),
      service_id: svc.id,
      service_name: svc.name,
      provider: svc.provider ?? "anycloudflow",
      unit_label: svc.unit_label,
      unit_price: Number(svc.price),
      currency: svc.currency_code || "USD",
      quantity,
      months: monthsForBilling,
      billing_model: svc.billing_model,
      total_price: total,
      unit_summary: `${formatMoney(Number(svc.price), svc.currency_code)} × ${quantity}${
        svc.billing_model === "monthly_flat" ? ` × ${monthsForBilling} mo` : ""
      }`,
    };
    updateCalculatorData("anycloudflow_items", [...anycloudflowItems, item]);
    setAcfDraft({ id: "", quantity: "1", months: "1" });
  };

  const removeAcfItem = (id: string) => {
    updateCalculatorData(
      "anycloudflow_items",
      anycloudflowItems.filter((i) => i.id !== id),
    );
  };

  // ── Metered metric picker ─────────────────────────
  const [meterDraft, setMeterDraft] = useState({ id: "", quantity: "1", months: "1" });
  const selectedMetric = useMemo(
    () => meteredMetrics.find((m) => String(m.id) === String(meterDraft.id)),
    [meteredMetrics, meterDraft.id],
  );

  const addMeterItem = () => {
    const metric = selectedMetric;
    if (!metric) return;
    const quantity = Math.max(0, Number(meterDraft.quantity) || 0);
    const months = Math.max(1, Number(meterDraft.months) || 1);
    // For per-X-month units, multiply quantity by months. For one-shot
    // units (per-incident, per-cert), months is informational only.
    const isMonthly = /\bmonth\b/i.test(metric.unit);
    const billingMonths = isMonthly ? months : 1;
    const total = Number(metric.unit_price) * quantity * billingMonths;
    const item: MeteredLineItem = {
      id: newId(),
      metric_id: metric.id,
      metric_key: metric.metric_key,
      metric_label: metric.label,
      unit: metric.unit,
      unit_price: Number(metric.unit_price),
      currency: metric.currency_code,
      estimated_quantity: quantity,
      months: billingMonths,
      total_price: total,
      unit_summary: `${formatMoney(Number(metric.unit_price), metric.currency_code)} × ${quantity} ${metric.unit}${
        isMonthly ? ` × ${billingMonths} mo` : ""
      }`,
    };
    updateCalculatorData("metered_items", [...meteredItems, item]);
    setMeterDraft({ id: "", quantity: "1", months: "1" });
  };

  const removeMeterItem = (id: string) => {
    updateCalculatorData(
      "metered_items",
      meteredItems.filter((i) => i.id !== id),
    );
  };

  // ── Header tab strip ──────────────────────────────
  const tabs = useMemo(
    () => [
      {
        id: "flow" as const,
        label: "SimpleDeploy",
        icon: Server,
        count: flowItems.length,
      },
      {
        id: "anycloudflow" as const,
        label: "AnyCloudFlow",
        icon: Inbox,
        count: anycloudflowItems.length,
      },
      { id: "shield" as const, label: "Shield", icon: Shield, count: shieldItems.length },
      {
        id: "metered" as const,
        label: "Pay-as-you-go",
        icon: Activity,
        count: meteredItems.length,
      },
    ],
    [
      flowItems.length,
      anycloudflowItems.length,
      shieldItems.length,
      meteredItems.length,
    ],
  );

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

  return (
    <ModernCard padding="lg" className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Add-on services</h3>
        <p className="text-sm text-slate-500">
          Include SimpleDeploy plans, Shield packages, and usage-based metrics in the quote.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTrack === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTrack(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                    isActive ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTrack === "flow" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Plan</label>
              <select
                value={flowDraft.plan_id}
                onChange={(e) => setFlowDraft((d) => ({ ...d, plan_id: e.target.value }))}
                className={inputClass}
                disabled={isFlowFetching || flowPlans.length === 0}
              >
                <option value="">
                  {isFlowFetching ? "Loading plans…" : flowPlans.length ? "Select a plan" : "No plans configured"}
                </option>
                {flowPlans
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatMoney(p.price_monthly_kobo / 100, "NGN")}/mo
                    </option>
                  ))}
              </select>
            </div>
            <ModernInput
              label="Quantity"
              type="number"
              min="1"
              value={flowDraft.quantity}
              onChange={(e) => setFlowDraft((d) => ({ ...d, quantity: e.target.value }))}
            />
            <ModernInput
              label="Months"
              type="number"
              min="1"
              value={flowDraft.months}
              onChange={(e) => setFlowDraft((d) => ({ ...d, months: e.target.value }))}
            />
            <div className="flex items-end">
              <ModernButton
                variant="primary"
                onClick={addFlowPlan}
                disabled={!flowDraft.plan_id}
                leftIcon={<Plus className="h-4 w-4" />}
                className="h-[42px] w-full md:w-auto"
              >
                Add
              </ModernButton>
            </div>
          </div>

          <AddedList
            items={flowItems.map((item) => ({
              id: item.id,
              title: item.plan_name,
              meta: `${item.quantity} seat${item.quantity === 1 ? "" : "s"} · ${item.months} mo`,
              price: item.total_price ?? 0,
              currency: item.currency || "NGN",
              summary: item.unit_summary,
            }))}
            onRemove={removeFlowItem}
            emptyLabel="No SimpleDeploy plans added yet."
          />
        </div>
      )}

      {activeTrack === "shield" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Service</label>
              <select
                value={shieldDraft.key}
                onChange={(e) => setShieldDraft((d) => ({ ...d, key: e.target.value }))}
                className={inputClass}
                disabled={isShieldFetching || shieldServices.length === 0}
              >
                <option value="">
                  {isShieldFetching
                    ? "Loading services…"
                    : shieldServices.length
                      ? "Select a Shield service"
                      : "No Shield services configured"}
                </option>
                {shieldServices.map((s) => {
                  const key = `${s.id}|${s.provider ?? ""}`;
                  const priceLabel =
                    s.price === null || s.price === undefined
                      ? "no price"
                      : formatMoney(Number(s.price), s.currency_code);
                  const providerLabel =
                    s.provider === "stormwall"
                      ? "StormWall"
                      : s.provider === "cloudflare"
                        ? "Cloudflare"
                        : s.provider || "—";
                  return (
                    <option key={key} value={key}>
                      {providerLabel} · {s.name} — {priceLabel} {s.unit_label ?? ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <ModernInput
              label="Quantity"
              type="number"
              min="1"
              value={shieldDraft.quantity}
              onChange={(e) => setShieldDraft((d) => ({ ...d, quantity: e.target.value }))}
            />
            <ModernInput
              label="Months"
              type="number"
              min="1"
              value={shieldDraft.months}
              onChange={(e) => setShieldDraft((d) => ({ ...d, months: e.target.value }))}
              disabled={selectedShieldService?.billing_model !== "monthly_flat"}
            />
            <div className="flex items-end">
              <ModernButton
                variant="primary"
                onClick={addShieldItem}
                disabled={
                  !selectedShieldService ||
                  selectedShieldService.price === null ||
                  selectedShieldService.price === undefined
                }
                leftIcon={<Plus className="h-4 w-4" />}
                className="h-[42px] w-full md:w-auto"
              >
                Add
              </ModernButton>
            </div>
          </div>

          <AddedList
            items={shieldItems.map((item) => ({
              id: item.id,
              title: `${item.service_name}`,
              meta: `${item.provider} · ${item.quantity} ${item.unit_label ?? "unit"}${
                item.billing_model === "monthly_flat" ? ` · ${item.months} mo` : ""
              }`,
              price: item.total_price ?? 0,
              currency: item.currency,
              summary: item.unit_summary,
            }))}
            onRemove={removeShieldItem}
            emptyLabel="No Shield services added yet."
          />
        </div>
      )}

      {activeTrack === "anycloudflow" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Service</label>
              <select
                value={acfDraft.id}
                onChange={(e) => setAcfDraft((d) => ({ ...d, id: e.target.value }))}
                className={inputClass}
                disabled={isAcfFetching || anycloudflowServices.length === 0}
              >
                <option value="">
                  {isAcfFetching
                    ? "Loading services…"
                    : anycloudflowServices.length
                      ? "Select an AnyCloudFlow service"
                      : "No services configured"}
                </option>
                {anycloudflowServices.map((s) => {
                  const priceLabel =
                    s.price === null || s.price === undefined
                      ? "no price"
                      : formatMoney(Number(s.price), s.currency_code);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} — {priceLabel} {s.unit_label ?? ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <ModernInput
              label="Quantity"
              type="number"
              min="1"
              value={acfDraft.quantity}
              onChange={(e) => setAcfDraft((d) => ({ ...d, quantity: e.target.value }))}
            />
            <ModernInput
              label="Months"
              type="number"
              min="1"
              value={acfDraft.months}
              onChange={(e) => setAcfDraft((d) => ({ ...d, months: e.target.value }))}
              disabled={selectedAcfService?.billing_model !== "monthly_flat"}
            />
            <div className="flex items-end">
              <ModernButton
                variant="primary"
                onClick={addAcfItem}
                disabled={
                  !selectedAcfService ||
                  selectedAcfService.price === null ||
                  selectedAcfService.price === undefined
                }
                leftIcon={<Plus className="h-4 w-4" />}
                className="h-[42px] w-full md:w-auto"
              >
                Add
              </ModernButton>
            </div>
          </div>

          {selectedAcfService?.description && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {selectedAcfService.description}
            </p>
          )}

          <AddedList
            items={anycloudflowItems.map((item) => ({
              id: item.id,
              title: item.service_name,
              meta: `${item.quantity} ${item.unit_label ?? "unit"}${
                item.billing_model === "monthly_flat" ? ` · ${item.months} mo` : ""
              }`,
              price: item.total_price ?? 0,
              currency: item.currency,
              summary: item.unit_summary,
            }))}
            onRemove={removeAcfItem}
            emptyLabel="No AnyCloudFlow services added yet."
          />
        </div>
      )}

      {activeTrack === "metered" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_minmax(0,0.9fr)_minmax(0,0.9fr)_auto]">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Metric</label>
              <select
                value={meterDraft.id}
                onChange={(e) => setMeterDraft((d) => ({ ...d, id: e.target.value }))}
                className={inputClass}
                disabled={isMeteredFetching || meteredMetrics.length === 0}
              >
                <option value="">
                  {isMeteredFetching
                    ? "Loading metrics…"
                    : meteredMetrics.length
                      ? "Select a metric"
                      : "No metrics configured"}
                </option>
                {meteredMetrics
                  .filter((m) => m.is_active)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} — {formatMoney(Number(m.unit_price), m.currency_code)} {m.unit}
                    </option>
                  ))}
              </select>
            </div>
            <ModernInput
              label="Estimated qty"
              type="number"
              min="0"
              step="0.01"
              value={meterDraft.quantity}
              onChange={(e) => setMeterDraft((d) => ({ ...d, quantity: e.target.value }))}
            />
            <ModernInput
              label="Months"
              type="number"
              min="1"
              value={meterDraft.months}
              onChange={(e) => setMeterDraft((d) => ({ ...d, months: e.target.value }))}
              disabled={!selectedMetric || !/\bmonth\b/i.test(selectedMetric.unit)}
            />
            <div className="flex items-end">
              <ModernButton
                variant="primary"
                onClick={addMeterItem}
                disabled={!selectedMetric}
                leftIcon={<Plus className="h-4 w-4" />}
                className="h-[42px] w-full md:w-auto"
              >
                Add
              </ModernButton>
            </div>
          </div>

          {selectedMetric?.description && (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {selectedMetric.description}
            </p>
          )}

          <AddedList
            items={meteredItems.map((item) => ({
              id: item.id,
              title: item.metric_label,
              meta: `${item.estimated_quantity} ${item.unit}${
                /\bmonth\b/i.test(item.unit) ? ` · ${item.months} mo` : ""
              }`,
              price: item.total_price ?? 0,
              currency: item.currency,
              summary: item.unit_summary,
            }))}
            onRemove={removeMeterItem}
            emptyLabel="No usage metrics estimated yet."
          />
        </div>
      )}
    </ModernCard>
  );
};

interface AddedListProps {
  items: Array<{
    id: string;
    title: string;
    meta: string;
    price: number;
    currency: string;
    summary?: string;
  }>;
  onRemove: (id: string) => void;
  emptyLabel: string;
}

const AddedList: React.FC<AddedListProps> = ({ items, onRemove, emptyLabel }) => {
  if (!items.length) {
    return (
      <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-xs text-slate-500">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{item.title}</p>
            <p className="truncate text-xs text-slate-500">{item.meta}</p>
            {item.summary && (
              <p className="truncate text-[11px] text-slate-400">{item.summary}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">
              {formatMoney(item.price, item.currency)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-slate-400 transition hover:text-red-500"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalculatorAddOnsCard;
