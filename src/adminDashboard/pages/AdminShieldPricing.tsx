import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Shield, Zap } from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  useFetchIntegrationPricing,
  useUpdateIntegrationPricing,
  type IntegrationPricingRow,
} from "@/hooks/adminHooks/adminIntegrationPricingHooks";
import ToastUtils from "@/utils/toastUtil";

interface DraftRow {
  id: number;
  service_type: string;
  name: string;
  description: string | null;
  unit_label: string | null;
  provider: string | null;
  billing_model: string;
  price: string;
  currency_code: string;
  dirty: boolean;
}

const toDraft = (row: IntegrationPricingRow): DraftRow => ({
  id: row.id,
  service_type: row.service_type,
  name: row.name,
  description: row.description,
  unit_label: row.unit_label,
  provider: row.provider,
  billing_model: row.billing_model,
  price: row.price === null || row.price === undefined ? "" : String(row.price),
  currency_code: row.currency_code || "USD",
  dirty: false,
});

const formatPrice = (amount: number | null | undefined, currency = "USD") => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

const AdminShieldPricing = () => {
  const { data: rows = [], isFetching, isLoading } = useFetchIntegrationPricing("shield");
  const { mutateAsync: updatePricing, isPending: isSaving } = useUpdateIntegrationPricing("shield");

  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  useEffect(() => {
    setDrafts((prev) => {
      const dirtyById = new Map(
        prev.filter((d) => d.dirty).map((d) => [`${d.id}|${d.provider ?? ""}`, d]),
      );
      return rows.map((row) => dirtyById.get(`${row.id}|${row.provider ?? ""}`) ?? toDraft(row));
    });
  }, [rows]);

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);
  const totalPriced = useMemo(() => drafts.filter((d) => Number(d.price) > 0).length, [drafts]);

  // Group rows by provider so admins see Stormwall and Cloudflare side-by-side.
  const byProvider = useMemo(() => {
    const groups: Record<string, DraftRow[]> = {};
    drafts.forEach((draft) => {
      const key = draft.provider || "—";
      if (!groups[key]) groups[key] = [];
      groups[key].push(draft);
    });
    return groups;
  }, [drafts]);

  const setPrice = (id: number, provider: string | null, price: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id && (d.provider ?? null) === (provider ?? null)
          ? { ...d, price, dirty: true }
          : d,
      ),
    );
  };

  const setCurrency = (id: number, provider: string | null, currency_code: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id && (d.provider ?? null) === (provider ?? null)
          ? { ...d, currency_code: currency_code.toUpperCase(), dirty: true }
          : d,
      ),
    );
  };

  const saveOne = async (draft: DraftRow) => {
    const priceValue = Number(draft.price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      ToastUtils.error(`Invalid price for ${draft.name}.`);
      return;
    }
    try {
      await updatePricing({
        id: draft.id,
        price: priceValue,
        currency_code: draft.currency_code,
      });
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

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

  return (
    <AdminPageShell
      title="Shield package pricing"
      description="Edit the published price for every Shield service (DDoS, WAF, SSL, bandwidth overage). Each provider — Stormwall and Cloudflare — has its own rate."
      contentClassName="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <ModernCard padding="default">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Services</p>
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
            Loading Shield catalog…
          </div>
        </ModernCard>
      )}

      {Object.entries(byProvider).map(([provider, providerRows]) => (
        <ModernCard key={provider} padding="default" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {provider === "stormwall" ? "StormWall" : provider === "cloudflare" ? "Cloudflare" : provider}
              </h3>
              <p className="text-sm text-slate-500">
                {providerRows.length} service{providerRows.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 pr-3">Service</th>
                  <th className="py-3 pr-3">Billing</th>
                  <th className="py-3 pr-3">Unit</th>
                  <th className="py-3 pr-3">Currency</th>
                  <th className="py-3 pr-3 text-right">Price</th>
                  <th className="py-3 pr-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providerRows.map((draft) => {
                  const original = rows.find(
                    (r) => r.id === draft.id && (r.provider ?? null) === (draft.provider ?? null),
                  );
                  return (
                    <tr key={`${draft.id}-${draft.provider}`} className={draft.dirty ? "bg-amber-50/40" : ""}>
                      <td className="py-2 pr-3">
                        <div>
                          <p className="font-medium text-slate-900">{draft.name}</p>
                          {draft.description && (
                            <p className="mt-0.5 text-xs text-slate-500">{draft.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {draft.billing_model.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-slate-500">
                        {draft.unit_label || "—"}
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={draft.currency_code}
                          onChange={(e) => setCurrency(draft.id, draft.provider, e.target.value)}
                          className={`${inputCls} w-24`}
                        >
                          <option value="USD">USD</option>
                          <option value="NGN">NGN</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-col items-end gap-0.5">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.price}
                            onChange={(e) => setPrice(draft.id, draft.provider, e.target.value)}
                            placeholder="0.00"
                            className={`${inputCls} w-32 text-right`}
                          />
                          {original && original.price !== null && (
                            <span className="text-[10px] text-slate-400">
                              currently {formatPrice(original.price, original.currency_code)}
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
      ))}

      {!isLoading && drafts.length === 0 && (
        <ModernCard padding="default">
          <p className="text-sm text-slate-500">
            No Shield services configured yet. Run{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              php artisan db:seed --class=ShieldPricingSeeder
            </code>{" "}
            to seed the default catalog.
          </p>
        </ModernCard>
      )}
    </AdminPageShell>
  );
};

export default AdminShieldPricing;
