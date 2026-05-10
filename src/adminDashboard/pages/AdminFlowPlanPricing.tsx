import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Server, ShieldCheck } from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  useFetchFlowPlans,
  useUpdateFlowPlan,
  type FlowPlanRow,
} from "@/hooks/adminHooks/adminFlowPlanPricingHooks";
import ToastUtils from "@/utils/toastUtil";

interface DraftRow {
  id: number;
  slug: string;
  name: string;
  monthly_naira: string;
  trial_days: string;
  max_servers: string;
  max_sites: string;
  max_databases: string;
  zero_downtime: boolean;
  ssl_management: boolean;
  git_integration: boolean;
  is_active: boolean;
  dirty: boolean;
}

const koboToNaira = (kobo: number | null | undefined) =>
  kobo === null || kobo === undefined ? "" : (Number(kobo) / 100).toFixed(2);

const nairaToKobo = (naira: string) => {
  const value = Number(naira || 0);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
};

const planToDraft = (plan: FlowPlanRow): DraftRow => ({
  id: plan.id,
  slug: plan.slug,
  name: plan.name,
  monthly_naira: koboToNaira(plan.price_monthly_kobo),
  trial_days: String(plan.trial_days ?? 0),
  max_servers: plan.max_servers === null || plan.max_servers === undefined ? "" : String(plan.max_servers),
  max_sites: plan.max_sites === null || plan.max_sites === undefined ? "" : String(plan.max_sites),
  max_databases:
    plan.max_databases === null || plan.max_databases === undefined ? "" : String(plan.max_databases),
  zero_downtime: !!plan.zero_downtime,
  ssl_management: !!plan.ssl_management,
  git_integration: !!plan.git_integration,
  is_active: !!plan.is_active,
  dirty: false,
});

const formatNgn = (kobo: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(kobo / 100);

const AdminFlowPlanPricing = () => {
  const { data: plans = [], isFetching, isLoading } = useFetchFlowPlans();
  const { mutateAsync: updatePlan, isPending: isSaving } = useUpdateFlowPlan();

  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  // Hydrate drafts from server data; preserve dirty edits if the user has
  // started typing while a refetch lands.
  useEffect(() => {
    setDrafts((prev) => {
      const dirtyById = new Map(prev.filter((d) => d.dirty).map((d) => [d.id, d]));
      return plans.map((plan) => dirtyById.get(plan.id) ?? planToDraft(plan));
    });
  }, [plans]);

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);
  const totalMonthly = useMemo(
    () => plans.reduce((sum, p) => sum + (p.price_monthly_kobo || 0), 0),
    [plans],
  );

  const setField = <K extends keyof DraftRow>(id: number, key: K, value: DraftRow[K]) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [key]: value, dirty: true } : d)),
    );
  };

  const saveOne = async (draft: DraftRow) => {
    const original = plans.find((p) => p.id === draft.id);
    if (!original) return;

    const patch: Record<string, unknown> = {};
    if (draft.name !== original.name) patch.name = draft.name;
    if (draft.slug !== original.slug) patch.slug = draft.slug;

    const desiredKobo = nairaToKobo(draft.monthly_naira);
    if (desiredKobo !== original.price_monthly_kobo) patch.price_monthly_kobo = desiredKobo;

    const trial = Number(draft.trial_days || 0);
    if (trial !== original.trial_days) patch.trial_days = trial;

    const numericOrNull = (v: string) => (v === "" ? null : Number(v));
    const desiredServers = numericOrNull(draft.max_servers);
    if (desiredServers !== original.max_servers) patch.max_servers = desiredServers;
    const desiredSites = numericOrNull(draft.max_sites);
    if (desiredSites !== original.max_sites) patch.max_sites = desiredSites;
    const desiredDbs = numericOrNull(draft.max_databases);
    if (desiredDbs !== original.max_databases) patch.max_databases = desiredDbs;

    if (draft.zero_downtime !== original.zero_downtime) patch.zero_downtime = draft.zero_downtime;
    if (draft.ssl_management !== original.ssl_management) patch.ssl_management = draft.ssl_management;
    if (draft.git_integration !== original.git_integration) patch.git_integration = draft.git_integration;
    if (draft.is_active !== original.is_active) patch.is_active = draft.is_active;

    if (Object.keys(patch).length === 0) {
      // Clear the dirty flag if user reverted manually.
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, dirty: false } : d)));
      return;
    }

    try {
      await updatePlan({ id: draft.id, patch });
      ToastUtils.success(`Saved ${draft.name}.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to save plan.");
    }
  };

  const saveAllDirty = async () => {
    const dirty = drafts.filter((d) => d.dirty);
    if (!dirty.length) return;
    for (const draft of dirty) {
      // eslint-disable-next-line no-await-in-loop -- sequential to avoid hammering the API
      await saveOne(draft);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  return (
    <AdminPageShell
      title="SlimDeploy plan pricing"
      description="Edit the monthly fee, included quotas, and feature flags for each SlimDeploy plan. Prices are entered in ₦; the API stores them as kobo."
      contentClassName="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <ModernCard padding="default">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Plans</p>
              <p className="text-xl font-semibold text-slate-900">{plans.length}</p>
            </div>
          </div>
        </ModernCard>
        <ModernCard padding="default">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active</p>
              <p className="text-xl font-semibold text-slate-900">
                {plans.filter((p) => p.is_active).length}
              </p>
            </div>
          </div>
        </ModernCard>
        <ModernCard padding="default">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Combined monthly list
            </p>
            <p className="text-xl font-semibold text-slate-900">{formatNgn(totalMonthly)}</p>
          </div>
        </ModernCard>
      </div>

      <ModernCard padding="default" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Plan rate sheet</h3>
            <p className="text-sm text-slate-500">
              Click any field to edit. Save individual rows with the row button, or save all
              edits at once.
            </p>
          </div>
          <ModernButton
            variant="primary"
            onClick={saveAllDirty}
            disabled={dirtyCount === 0 || isSaving}
            leftIcon={
              isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )
            }
          >
            {dirtyCount === 0 ? "No unsaved changes" : `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`}
          </ModernButton>
        </div>

        {(isLoading || (isFetching && plans.length === 0)) && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading plans…
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pr-3">Plan</th>
                <th className="py-3 pr-3">Slug</th>
                <th className="py-3 pr-3">Monthly (₦)</th>
                <th className="py-3 pr-3">Trial days</th>
                <th className="py-3 pr-3">Servers</th>
                <th className="py-3 pr-3">Sites</th>
                <th className="py-3 pr-3">Databases</th>
                <th className="py-3 pr-3">Features</th>
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
                      value={draft.name}
                      onChange={(e) => setField(draft.id, "name", e.target.value)}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      value={draft.slug}
                      onChange={(e) => setField(draft.id, "slug", e.target.value)}
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.monthly_naira}
                      onChange={(e) => setField(draft.id, "monthly_naira", e.target.value)}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={draft.trial_days}
                      onChange={(e) => setField(draft.id, "trial_days", e.target.value)}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={draft.max_servers}
                      onChange={(e) => setField(draft.id, "max_servers", e.target.value)}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={draft.max_sites}
                      onChange={(e) => setField(draft.id, "max_sites", e.target.value)}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      placeholder="∞"
                      value={draft.max_databases}
                      onChange={(e) => setField(draft.id, "max_databases", e.target.value)}
                      className={`${inputCls} text-right`}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <FeatureToggle
                        label="ZDD"
                        title="Zero-downtime deploys"
                        active={draft.zero_downtime}
                        onToggle={(v) => setField(draft.id, "zero_downtime", v)}
                      />
                      <FeatureToggle
                        label="SSL"
                        title="Managed SSL"
                        active={draft.ssl_management}
                        onToggle={(v) => setField(draft.id, "ssl_management", v)}
                      />
                      <FeatureToggle
                        label="Git"
                        title="Git integration"
                        active={draft.git_integration}
                        onToggle={(v) => setField(draft.id, "git_integration", v)}
                      />
                    </div>
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
                      disabled={!draft.dirty || isSaving}
                      onClick={() => saveOne(draft)}
                    >
                      {draft.dirty ? "Save" : "Saved"}
                    </ModernButton>
                  </td>
                </tr>
              ))}
              {!drafts.length && !isLoading && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-sm text-slate-500">
                    No SlimDeploy plans configured. Run{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                      php artisan db:seed --class=FlowPlanSeeder
                    </code>{" "}
                    to create the default tier sheet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ModernCard>
    </AdminPageShell>
  );
};

const FeatureToggle: React.FC<{
  label: string;
  title: string;
  active: boolean;
  onToggle: (value: boolean) => void;
}> = ({ label, title, active, onToggle }) => (
  <button
    type="button"
    title={title}
    onClick={() => onToggle(!active)}
    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold transition ${
      active
        ? "border-primary-200 bg-primary-50 text-primary-700"
        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
    }`}
  >
    {label}
  </button>
);

export default AdminFlowPlanPricing;
