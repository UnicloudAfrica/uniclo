/**
 * Admin monitoring pricing page (B7 frontend).
 *
 * Lists the three monitoring tier prices (standard / professional /
 * enterprise) with inline edit, plus a tenant-override section that
 * lets an admin set a per-tenant price floor for any tier.
 *
 * Mirrors the layout idioms of `AdminShieldPricing.tsx` — stat cards,
 * "Save N" header button, dirty-row highlighting, per-row Save button.
 */
import { useEffect, useMemo, useState } from "react";
import { Activity, Database, Loader2, Save, Zap } from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import {
  ModernCard,
  ModernButton,
  ModernSelect,
  InfoCallout,
} from "@/shared/components/ui";
import { PriceLabel } from "@/shared/components/ui/PriceLabel";
import ToastUtils from "@/utils/toastUtil";
import { useFetchTenants } from "@/hooks/adminHooks/tenantHooks";

import {
  useMonitoringPricing,
  useUpdateMonitoringPricing,
  useTenantMonitoringPricing,
  useUpsertTenantMonitoringPricing,
  type MonitoringPricingRow,
  type MonitoringTier,
} from "../hooks/useAdminMonitoringPricing";

interface DraftRow {
  tier: MonitoringTier;
  price: string;
  retention_days: number;
  features: string[];
  dirty: boolean;
}

const TIER_LABELS: Record<MonitoringTier, string> = {
  standard: "Standard",
  professional: "Professional",
  enterprise: "Enterprise",
};

const toDraft = (row: MonitoringPricingRow): DraftRow => ({
  tier: row.tier,
  price: row.price_per_host_usd === null || row.price_per_host_usd === undefined
    ? ""
    : String(row.price_per_host_usd),
  retention_days: row.retention_days,
  features: row.features,
  dirty: false,
});

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

const AdminMonitoringPricing = () => {
  const { data: rows = [], isFetching, isLoading } = useMonitoringPricing();
  const { mutateAsync: updatePricing, isPending: isSaving } = useUpdateMonitoringPricing();

  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  useEffect(() => {
    setDrafts((prev) => {
      const dirtyByTier = new Map(
        prev.filter((d) => d.dirty).map((d) => [d.tier, d]),
      );
      return rows.map((row) => dirtyByTier.get(row.tier) ?? toDraft(row));
    });
  }, [rows]);

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);
  const totalPriced = useMemo(
    () => drafts.filter((d) => Number(d.price) > 0).length,
    [drafts],
  );

  const setPrice = (tier: MonitoringTier, price: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.tier === tier ? { ...d, price, dirty: true } : d)),
    );
  };

  const saveOne = async (draft: DraftRow) => {
    const value = Number(draft.price);
    if (!Number.isFinite(value) || value < 0) {
      ToastUtils.error(`Invalid price for ${TIER_LABELS[draft.tier]}.`);
      return;
    }
    try {
      await updatePricing({ tier: draft.tier, price_per_host_usd: value });
      ToastUtils.success(`Saved ${TIER_LABELS[draft.tier]}.`);
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

  return (
    <AdminPageShell
      title="monitoring tier pricing"
      description="Edit the published per-host monthly rate for every monitoring tier (standard, professional, enterprise) and apply per-tenant overrides."
      contentClassName="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <ModernCard padding="default">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Tiers</p>
              <p className="text-xl font-semibold text-slate-900">{drafts.length}</p>
            </div>
          </div>
        </ModernCard>
        <ModernCard padding="default">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Priced</p>
              <p className="text-xl font-semibold text-slate-900">{totalPriced}</p>
            </div>
          </div>
        </ModernCard>
        <ModernCard padding="default">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Unsaved changes
            </p>
            <p className="text-xl font-semibold text-slate-900">{dirtyCount}</p>
          </div>
        </ModernCard>
      </div>

      <div className="flex justify-end">
        <ModernButton
          variant="primary"
          onClick={saveAll}
          disabled={dirtyCount === 0 || isSaving}
          leftIcon={
            isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />
          }
        >
          {dirtyCount === 0
            ? "No unsaved changes"
            : `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`}
        </ModernButton>
      </div>

      {(isLoading || (isFetching && rows.length === 0)) && (
        <ModernCard padding="default">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading monitoring tier catalog…
          </div>
        </ModernCard>
      )}

      <ModernCard padding="default" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Tier list</h3>
            <p className="text-sm text-slate-500">
              {drafts.length} tier{drafts.length === 1 ? "" : "s"} · price per host per month
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pr-3">Tier</th>
                <th className="py-3 pr-3">Retention</th>
                <th className="py-3 pr-3">Features</th>
                <th className="py-3 pr-3 text-right">Price (USD / host / month)</th>
                <th className="py-3 pr-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drafts.map((draft) => {
                const original = rows.find((r) => r.tier === draft.tier);
                return (
                  <tr key={draft.tier} className={draft.dirty ? "bg-amber-50/40" : ""}>
                    <td className="py-2 pr-3">
                      <p className="font-medium text-slate-900">{TIER_LABELS[draft.tier]}</p>
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-600">
                      {draft.retention_days} day{draft.retention_days === 1 ? "" : "s"}
                    </td>
                    <td className="py-2 pr-3">
                      <ul className="flex flex-wrap gap-1">
                        {draft.features.length === 0 ? (
                          <li className="text-xs text-slate-400">—</li>
                        ) : (
                          draft.features.map((feature) => (
                            <li
                              key={feature}
                              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                            >
                              {feature}
                            </li>
                          ))
                        )}
                      </ul>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-col items-end gap-0.5">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.price}
                          onChange={(e) => setPrice(draft.tier, e.target.value)}
                          placeholder="0.00"
                          aria-label={`Price for ${TIER_LABELS[draft.tier]}`}
                          className={`${inputCls} w-32 text-right`}
                        />
                        {original && (
                          <span className="text-[10px] text-slate-400">
                            currently{" "}
                            <PriceLabel
                              amount={original.price_per_host_usd}
                              sourceCurrency="USD"
                            />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2">
                      <ModernButton
                        type="button"
                        variant={draft.dirty ? "primary" : "outline"}
                        size="sm"
                        disabled={!draft.dirty || isSaving}
                        onClick={() => saveOne(draft)}
                      >
                        {draft.dirty ? "Save" : "Saved"}
                      </ModernButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ModernCard>

      {!isLoading && drafts.length === 0 && (
        <InfoCallout tone="info" title="No tiers configured">
          The monitoring tier catalog is empty. Seed the default tiers from the backend.
        </InfoCallout>
      )}

      <TenantOverridesCard />
    </AdminPageShell>
  );
};

// ─── Per-tenant overrides ────────────────────────────────────────────

const TenantOverridesCard: React.FC = () => {
  const { data: tenants = [], isFetching: isTenantsFetching } = useFetchTenants();
  const { data: pricing = [] } = useMonitoringPricing();
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");

  const { data: overrides = [], isFetching: isOverridesFetching } =
    useTenantMonitoringPricing(selectedTenantId || undefined);
  const { mutateAsync: upsertOverride, isPending: isSavingOverride } =
    useUpsertTenantMonitoringPricing(selectedTenantId || undefined);

  const [overrideDrafts, setOverrideDrafts] = useState<Record<MonitoringTier, string>>({
    standard: "",
    professional: "",
    enterprise: "",
  });

  useEffect(() => {
    // Initialise with the override value if present, else blank so the
    // input shows the admin price as placeholder.
    const next: Record<MonitoringTier, string> = {
      standard: "",
      professional: "",
      enterprise: "",
    };
    overrides.forEach((o) => {
      next[o.tier] = String(o.price_per_host_usd);
    });
    setOverrideDrafts(next);
  }, [overrides, selectedTenantId]);

  const handleSave = async (tier: MonitoringTier) => {
    if (!selectedTenantId) {
      ToastUtils.error("Pick a tenant first.");
      return;
    }
    const value = Number(overrideDrafts[tier]);
    if (!Number.isFinite(value) || value < 0) {
      ToastUtils.error(`Invalid override for ${TIER_LABELS[tier]}.`);
      return;
    }
    try {
      await upsertOverride({ tier, price_per_host_usd: value });
      ToastUtils.success(`Override saved for ${TIER_LABELS[tier]}.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(
        err?.response?.data?.message || err?.message || "Failed to save override.",
      );
    }
  };

  return (
    <ModernCard padding="default" className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Tenant overrides</h3>
          <p className="text-sm text-slate-500">
            Set a per-tenant price for any tier. Clearing an override is done via the backend.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label
          htmlFor="tenant-override-select"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          Apply overrides for
        </label>
        <ModernSelect
          id="tenant-override-select"
          value={selectedTenantId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSelectedTenantId(e.target.value)
          }
          disabled={isTenantsFetching}
          options={[
            { value: "", label: isTenantsFetching ? "Loading tenants…" : "Select a tenant" },
            ...tenants.map((t: { id: string; name?: string; subdomain?: string }) => ({
              value: t.id,
              label: t.name || t.subdomain || t.id,
            })),
          ]}
        />
      </div>

      {selectedTenantId && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pr-3">Tier</th>
                <th className="py-3 pr-3 text-right">Admin price</th>
                <th className="py-3 pr-3 text-right">Override (USD)</th>
                <th className="py-3 pr-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pricing.map((row) => {
                const hasOverride = overrides.some((o) => o.tier === row.tier);
                return (
                  <tr key={row.tier}>
                    <td className="py-2 pr-3">
                      <p className="font-medium text-slate-900">{TIER_LABELS[row.tier]}</p>
                      {hasOverride && (
                        <span className="text-[11px] text-emerald-600">Override active</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right text-xs text-slate-500">
                      <PriceLabel amount={row.price_per_host_usd} sourceCurrency="USD" />
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={overrideDrafts[row.tier]}
                        onChange={(e) =>
                          setOverrideDrafts((prev) => ({
                            ...prev,
                            [row.tier]: e.target.value,
                          }))
                        }
                        placeholder={String(row.price_per_host_usd)}
                        aria-label={`Override for ${TIER_LABELS[row.tier]}`}
                        className={`${inputCls} w-32 text-right`}
                      />
                    </td>
                    <td className="py-2">
                      <ModernButton
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={
                          isSavingOverride ||
                          isOverridesFetching ||
                          overrideDrafts[row.tier] === ""
                        }
                        onClick={() => handleSave(row.tier)}
                      >
                        Save
                      </ModernButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ModernCard>
  );
};

export default AdminMonitoringPricing;
