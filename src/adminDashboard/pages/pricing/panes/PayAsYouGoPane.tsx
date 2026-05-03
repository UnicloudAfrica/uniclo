import React, { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  useFetchMeteredPrices,
  useUpdateMeteredPrice,
  type MeteredUnitPriceRow,
} from "@/hooks/adminHooks/adminMeteredPricingHooks";
import {
  useTenantFetchMeteredPricing,
  useTenantUpdateMeteredPricing,
  useTenantRevertMeteredPricing,
} from "@/hooks/tenantHooks/tenantMeteredPricingHooks";
import ToastUtils from "@/utils/toastUtil";
import type { PricingRole } from "../PricingShell";

const formatPrice = (amount: number, currency = "NGN") => {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 4,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(4)}`;
  }
};

/**
 * PayAsYouGoPane — per-VM, per-GB, per-attack rate card.
 *
 * Admin role — full edit (label / unit / unit_price / active toggle).
 * Tenant role — sees the platform default joined with their override
 * row; inline edit upserts a `tenant_metered_unit_prices` row, the
 * revert button deletes it.
 *
 * Drives every `subscription_items` row flagged `is_usage_based`. The
 * billing engine multiplies recorded usage_quantity × the unit_price
 * resolved per-tenant at invoice generation time.
 */
const PayAsYouGoPane: React.FC<{ role: PricingRole }> = ({ role }) => {
  if (role === "tenant") return <TenantView />;
  return <AdminView />;
};

// ── Admin variant ────────────────────────────────────────────────────

interface AdminDraft {
  id: number;
  metric_key: string;
  label: string;
  description: string;
  unit: string;
  unit_price: string;
  currency_code: string;
  is_active: boolean;
  dirty: boolean;
}

const toAdminDraft = (row: MeteredUnitPriceRow): AdminDraft => ({
  id: row.id,
  metric_key: row.metric_key,
  label: row.label,
  description: row.description ?? "",
  unit: row.unit,
  unit_price: row.unit_price === null || row.unit_price === undefined ? "" : String(row.unit_price),
  currency_code: row.currency_code,
  is_active: row.is_active,
  dirty: false,
});

const AdminView: React.FC = () => {
  const { data: rows = [], isFetching } = useFetchMeteredPrices();
  const { mutateAsync: update, isPending } = useUpdateMeteredPrice();

  const [drafts, setDrafts] = useState<AdminDraft[]>([]);

  useEffect(() => {
    setDrafts((prev) => {
      const dirty = new Map(prev.filter((d) => d.dirty).map((d) => [d.id, d]));
      return rows.map((r) => dirty.get(r.id) ?? toAdminDraft(r));
    });
  }, [rows]);

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);

  const setField = <K extends keyof AdminDraft>(id: number, key: K, value: AdminDraft[K]) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [key]: value, dirty: true } : d)),
    );
  };

  const saveOne = async (draft: AdminDraft) => {
    const original = rows.find((r) => r.id === draft.id);
    if (!original) return;
    const value = Number(draft.unit_price);
    if (!Number.isFinite(value) || value < 0) {
      ToastUtils.error(`Invalid price for ${draft.label}.`);
      return;
    }
    const patch: Partial<MeteredUnitPriceRow> = {};
    if (draft.label !== original.label) patch.label = draft.label;
    if ((draft.description || null) !== (original.description || null))
      patch.description = draft.description || null;
    if (draft.unit !== original.unit) patch.unit = draft.unit;
    if (value !== Number(original.unit_price)) patch.unit_price = value;
    if (draft.is_active !== original.is_active) patch.is_active = draft.is_active;

    if (Object.keys(patch).length === 0) {
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, dirty: false } : d)));
      return;
    }
    try {
      await update({ id: draft.id, patch });
      ToastUtils.success(`Saved ${draft.label}.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to save.");
    }
  };

  const saveAll = async () => {
    for (const d of drafts.filter((d) => d.dirty)) {
      // eslint-disable-next-line no-await-in-loop
      await saveOne(d);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

  return (
    <ModernCard padding="default" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pay-as-you-go rates</h2>
          <p className="text-sm text-slate-500">
            Per-VM, per-GB, per-attack and per-incident rates. Multiplied by recorded usage at
            invoice time.
          </p>
        </div>
        <ModernButton
          type="button"
          variant="primary"
          disabled={dirtyCount === 0 || isPending}
          onClick={saveAll}
          leftIcon={
            isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />
          }
        >
          {dirtyCount === 0 ? "No changes" : `Save ${dirtyCount}`}
        </ModernButton>
      </div>

      {isFetching && rows.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rate card…
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 pr-3">Metric</th>
              <th className="py-3 pr-3">Unit</th>
              <th className="py-3 pr-3">Currency</th>
              <th className="py-3 pr-3 text-right">Unit price</th>
              <th className="py-3 pr-3">Active</th>
              <th className="py-3 pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map((draft) => (
              <tr key={draft.id} className={draft.dirty ? "bg-amber-50/40" : ""}>
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    value={draft.label}
                    onChange={(e) => setField(draft.id, "label", e.target.value)}
                    className={inputCls}
                  />
                  <code className="text-[10px] text-slate-400">{draft.metric_key}</code>
                </td>
                <td className="py-2 pr-3 font-mono text-xs text-slate-600">{draft.unit}</td>
                <td className="py-2 pr-3 text-xs text-slate-600">{draft.currency_code}</td>
                <td className="py-2 pr-3 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={draft.unit_price}
                    onChange={(e) => setField(draft.id, "unit_price", e.target.value)}
                    className={`${inputCls} w-32 text-right`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <button
                    type="button"
                    onClick={() => setField(draft.id, "is_active", !draft.is_active)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                      draft.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        draft.is_active ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {draft.is_active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="py-2">
                  <ModernButton
                    type="button"
                    variant={draft.dirty ? "primary" : "outline"}
                    size="sm"
                    disabled={!draft.dirty || isPending}
                    onClick={() => saveOne(draft)}
                  >
                    {draft.dirty ? "Save" : "Saved"}
                  </ModernButton>
                </td>
              </tr>
            ))}

            {!isFetching && drafts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                  No metered metrics configured. Run the MeteredUnitPriceSeeder to bootstrap.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModernCard>
  );
};

// ── Tenant variant ───────────────────────────────────────────────────

interface TenantDraft {
  metric_id: number;
  metric_key: string;
  label: string;
  unit: string;
  currency_code: string;
  admin_unit_price: number;
  tenant_unit_price: string;
  has_override: boolean;
  is_active: boolean;
  dirty: boolean;
}

const TenantView: React.FC = () => {
  const { data: rows = [], isFetching } = useTenantFetchMeteredPricing();
  const { mutateAsync: update, isPending: isSaving } = useTenantUpdateMeteredPricing();
  const { mutateAsync: revert, isPending: isReverting } = useTenantRevertMeteredPricing();

  const [drafts, setDrafts] = useState<TenantDraft[]>([]);

  useEffect(() => {
    setDrafts((prev) => {
      const dirty = new Map(prev.filter((d) => d.dirty).map((d) => [d.metric_id, d]));
      return rows.map((row) => {
        const existing = dirty.get(row.metric_id);
        if (existing) return existing;
        return {
          metric_id: row.metric_id,
          metric_key: row.metric_key,
          label: row.label,
          unit: row.unit,
          currency_code: row.currency_code,
          admin_unit_price: row.admin_unit_price,
          tenant_unit_price:
            row.tenant_unit_price === null
              ? String(row.admin_unit_price)
              : String(row.tenant_unit_price),
          has_override: row.has_override,
          is_active: row.is_active,
          dirty: false,
        };
      });
    });
  }, [rows]);

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);

  const setField = <K extends keyof TenantDraft>(id: number, key: K, value: TenantDraft[K]) => {
    setDrafts((prev) =>
      prev.map((d) => (d.metric_id === id ? { ...d, [key]: value, dirty: true } : d)),
    );
  };

  const saveOne = async (draft: TenantDraft) => {
    const value = Number(draft.tenant_unit_price);
    if (!Number.isFinite(value) || value < 0) {
      ToastUtils.error(`Invalid price for ${draft.label}.`);
      return;
    }
    try {
      await update({ metricId: draft.metric_id, unit_price: value, is_active: draft.is_active });
      ToastUtils.success(`Saved ${draft.label} override.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to save override.");
    }
  };

  const revertOne = async (draft: TenantDraft) => {
    try {
      await revert(draft.metric_id);
      ToastUtils.success(`Reverted ${draft.label} to platform default.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to revert.");
    }
  };

  const saveAll = async () => {
    for (const d of drafts.filter((d) => d.dirty)) {
      // eslint-disable-next-line no-await-in-loop
      await saveOne(d);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

  return (
    <ModernCard padding="default" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pay-as-you-go — your prices</h2>
          <p className="text-sm text-slate-500">
            Set the per-unit price you bill your customers for each metric. Platform default shown
            alongside; revert to fall back to it.
          </p>
        </div>
        <ModernButton
          type="button"
          variant="primary"
          disabled={dirtyCount === 0 || isSaving}
          onClick={saveAll}
          leftIcon={
            isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />
          }
        >
          {dirtyCount === 0 ? "No changes" : `Save ${dirtyCount}`}
        </ModernButton>
      </div>

      {isFetching && rows.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rate card…
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 pr-3">Metric</th>
              <th className="py-3 pr-3">Unit</th>
              <th className="py-3 pr-3 text-right">Platform default</th>
              <th className="py-3 pr-3 text-right">Your price</th>
              <th className="py-3 pr-3 text-right">Markup</th>
              <th className="py-3 pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map((draft) => {
              const desired = Number(draft.tenant_unit_price);
              const markup =
                draft.admin_unit_price > 0 && Number.isFinite(desired)
                  ? Math.round(((desired - draft.admin_unit_price) / draft.admin_unit_price) * 100)
                  : 0;
              return (
                <tr key={draft.metric_id} className={draft.dirty ? "bg-amber-50/40" : ""}>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-slate-900">{draft.label}</p>
                    <code className="text-[10px] text-slate-400">{draft.metric_key}</code>
                    {draft.has_override && (
                      <span className="ml-1 text-[10px] uppercase text-primary-600">
                        Overridden
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-slate-600">{draft.unit}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">
                    {formatPrice(draft.admin_unit_price, draft.currency_code)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={draft.tenant_unit_price}
                      onChange={(e) => setField(draft.metric_id, "tenant_unit_price", e.target.value)}
                      className={`${inputCls} w-32 text-right`}
                    />
                  </td>
                  <td className="py-2 pr-3 text-right text-xs">
                    <span
                      className={
                        markup === 0
                          ? "text-slate-400"
                          : markup > 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                      }
                    >
                      {markup > 0 ? `+${markup}%` : `${markup}%`}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <ModernButton
                        type="button"
                        variant={draft.dirty ? "primary" : "outline"}
                        size="sm"
                        disabled={!draft.dirty || isSaving}
                        onClick={() => saveOne(draft)}
                      >
                        {draft.dirty ? "Save" : "Saved"}
                      </ModernButton>
                      {draft.has_override && (
                        <button
                          type="button"
                          onClick={() => revertOne(draft)}
                          disabled={isReverting}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-40"
                          title="Revert to platform default"
                          aria-label="Revert to platform default"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isFetching && drafts.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                  No metered metrics available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModernCard>
  );
};

export default PayAsYouGoPane;
