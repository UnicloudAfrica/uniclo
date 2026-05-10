import React, { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  useFetchFlowPlans,
  useUpdateFlowPlan,
  type FlowPlanRow,
} from "@/hooks/adminHooks/adminFlowPlanPricingHooks";
import {
  useTenantFetchFlowPlanPricing,
  useTenantUpdateFlowPlanPricing,
  useTenantRevertFlowPlanPricing,
} from "@/hooks/tenantHooks/tenantFlowPlanPricingHooks";
import ToastUtils from "@/utils/toastUtil";
import type { PricingRole } from "../PricingShell";
import { compactInputClassName } from "./styles";

/**
 * SlimDeployPane — pricing editor for SlimDeploy plan tiers.
 *
 * Admin role — reads/writes `flow_plans` directly.
 * Tenant role — reads the platform default joined with the tenant's
 * override row from `tenant_flow_plan_pricing`. Inline edit upserts
 * the override; the revert button deletes it so the row falls back
 * to the platform default.
 *
 * NGN is shown to the operator; the API stores kobo (minor units),
 * so we convert on each save.
 */

const koboToNaira = (kobo: number | null | undefined) =>
  kobo === null || kobo === undefined ? "" : (Number(kobo) / 100).toFixed(2);

const formatNgn = (kobo: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(kobo / 100);

interface AdminDraft {
  id: number;
  name: string;
  monthly_naira: string;
  is_active: boolean;
  dirty: boolean;
}

interface TenantDraft {
  plan_id: number;
  name: string;
  admin_kobo: number;
  tenant_naira: string;
  has_override: boolean;
  effective_kobo: number;
  is_active: boolean;
  dirty: boolean;
}

const planToAdminDraft = (plan: FlowPlanRow): AdminDraft => ({
  id: plan.id,
  name: plan.name,
  monthly_naira: koboToNaira(plan.price_monthly_kobo),
  is_active: !!plan.is_active,
  dirty: false,
});

const SlimDeployPane: React.FC<{ role: PricingRole }> = ({ role }) => {
  if (role === "tenant") {
    return <TenantView />;
  }
  return <AdminView />;
};

// ── Admin variant ────────────────────────────────────────────────────

const AdminView: React.FC = () => {
  const { data: plans = [], isFetching } = useFetchFlowPlans();
  const { mutateAsync: update, isPending } = useUpdateFlowPlan();

  const [drafts, setDrafts] = useState<AdminDraft[]>([]);

  useEffect(() => {
    setDrafts((prev) => {
      const dirty = new Map(prev.filter((d) => d.dirty).map((d) => [d.id, d]));
      return plans.map((p) => dirty.get(p.id) ?? planToAdminDraft(p));
    });
  }, [plans]);

  const setField = <K extends keyof AdminDraft>(id: number, key: K, value: AdminDraft[K]) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [key]: value, dirty: true } : d)),
    );
  };

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);

  const saveOne = async (draft: AdminDraft) => {
    const original = plans.find((p) => p.id === draft.id);
    if (!original) return;
    const patch: Record<string, unknown> = {};
    if (draft.name !== original.name) patch.name = draft.name;
    const desiredKobo = Math.max(0, Math.round(Number(draft.monthly_naira || 0) * 100));
    if (desiredKobo !== original.price_monthly_kobo) patch.price_monthly_kobo = desiredKobo;
    if (draft.is_active !== original.is_active) patch.is_active = draft.is_active;

    if (Object.keys(patch).length === 0) {
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, dirty: false } : d)));
      return;
    }
    try {
      await update({ id: draft.id, patch });
      ToastUtils.success(`Saved ${draft.name}.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to save.");
    }
  };

  const saveAll = async () => {
    for (const draft of drafts.filter((d) => d.dirty)) {
      // eslint-disable-next-line no-await-in-loop
      await saveOne(draft);
    }
  };

  const inputCls = compactInputClassName;

  return (
    <ModernCard padding="default" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">SlimDeploy plans</h2>
          <p className="text-sm text-slate-500">
            Monthly subscription tiers. NGN displayed; API stores kobo.
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

      {isFetching && plans.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 pr-3">Plan</th>
              <th className="py-3 pr-3 text-right">Monthly (₦)</th>
              <th className="py-3 pr-3">Status</th>
              <th className="py-3 pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map((draft) => (
              <tr key={draft.id} className={draft.dirty ? "bg-amber-50/40" : ""}>
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setField(draft.id, "name", e.target.value)}
                    className={inputCls}
                  />
                </td>
                <td className="py-2 pr-3 text-right">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.monthly_naira}
                    onChange={(e) => setField(draft.id, "monthly_naira", e.target.value)}
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
                <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                  No SlimDeploy plans configured. Run the FlowPlanSeeder to bootstrap.
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

const TenantView: React.FC = () => {
  const { data: rows = [], isFetching } = useTenantFetchFlowPlanPricing();
  const { mutateAsync: update, isPending: isSaving } = useTenantUpdateFlowPlanPricing();
  const { mutateAsync: revert, isPending: isReverting } = useTenantRevertFlowPlanPricing();

  const [drafts, setDrafts] = useState<TenantDraft[]>([]);

  useEffect(() => {
    setDrafts((prev) => {
      const dirty = new Map(prev.filter((d) => d.dirty).map((d) => [d.plan_id, d]));
      return rows.map((row) => {
        const existing = dirty.get(row.plan_id);
        if (existing) return existing;
        return {
          plan_id: row.plan_id,
          name: row.name,
          admin_kobo: row.admin_price_monthly_kobo,
          tenant_naira:
            row.tenant_price_monthly_kobo === null
              ? koboToNaira(row.admin_price_monthly_kobo)
              : koboToNaira(row.tenant_price_monthly_kobo),
          has_override: row.has_override,
          effective_kobo: row.effective_price_monthly_kobo,
          is_active: row.is_active,
          dirty: false,
        };
      });
    });
  }, [rows]);

  const setField = <K extends keyof TenantDraft>(planId: number, key: K, value: TenantDraft[K]) => {
    setDrafts((prev) =>
      prev.map((d) => (d.plan_id === planId ? { ...d, [key]: value, dirty: true } : d)),
    );
  };

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);

  const saveOne = async (draft: TenantDraft) => {
    const desiredKobo = Math.max(0, Math.round(Number(draft.tenant_naira || 0) * 100));
    try {
      await update({
        planId: draft.plan_id,
        price_monthly_kobo: desiredKobo,
        is_active: draft.is_active,
      });
      ToastUtils.success(`Saved ${draft.name} override.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to save override.");
    }
  };

  const revertOne = async (draft: TenantDraft) => {
    try {
      await revert(draft.plan_id);
      ToastUtils.success(`Reverted ${draft.name} to platform default.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to revert override.");
    }
  };

  const saveAll = async () => {
    for (const draft of drafts.filter((d) => d.dirty)) {
      // eslint-disable-next-line no-await-in-loop
      await saveOne(draft);
    }
  };

  const inputCls = compactInputClassName;

  return (
    <ModernCard padding="default" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">SlimDeploy plans — your prices</h2>
          <p className="text-sm text-slate-500">
            Set the price you bill your customers. Platform default shown alongside; revert to fall
            back to it.
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
          <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 pr-3">Plan</th>
              <th className="py-3 pr-3 text-right">Platform default</th>
              <th className="py-3 pr-3 text-right">Your price (₦)</th>
              <th className="py-3 pr-3 text-right">Markup</th>
              <th className="py-3 pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drafts.map((draft) => {
              const desiredKobo = Math.max(0, Math.round(Number(draft.tenant_naira || 0) * 100));
              const markup =
                draft.admin_kobo > 0
                  ? Math.round(((desiredKobo - draft.admin_kobo) / draft.admin_kobo) * 100)
                  : 0;
              return (
                <tr key={draft.plan_id} className={draft.dirty ? "bg-amber-50/40" : ""}>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-slate-900">{draft.name}</p>
                    {draft.has_override && (
                      <span className="text-[10px] uppercase text-primary-600">Overridden</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right text-slate-600">
                    {formatNgn(draft.admin_kobo)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.tenant_naira}
                      onChange={(e) => setField(draft.plan_id, "tenant_naira", e.target.value)}
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
                <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                  No SlimDeploy plans available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ModernCard>
  );
};

export default SlimDeployPane;
