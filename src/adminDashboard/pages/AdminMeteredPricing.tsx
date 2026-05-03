import { useEffect, useMemo, useState } from "react";
import { Activity, Loader2, Plus, Save, Trash2 } from "lucide-react";

import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  useCreateMeteredPrice,
  useDeleteMeteredPrice,
  useFetchMeteredPrices,
  useUpdateMeteredPrice,
  type MeteredUnitPriceRow,
} from "@/hooks/adminHooks/adminMeteredPricingHooks";
import ToastUtils from "@/utils/toastUtil";

interface DraftRow {
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

const toDraft = (row: MeteredUnitPriceRow): DraftRow => ({
  id: row.id,
  metric_key: row.metric_key,
  label: row.label,
  description: row.description ?? "",
  unit: row.unit,
  unit_price:
    row.unit_price === null || row.unit_price === undefined ? "" : String(row.unit_price),
  currency_code: row.currency_code,
  is_active: row.is_active,
  dirty: false,
});

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

const COMMON_UNITS = [
  "per-vm-hour",
  "per-vm-month",
  "per-host-month",
  "per-gb",
  "per-gb-month",
  "per-incident",
  "per-domain",
  "per-attack",
  "per-cert",
];

const AdminMeteredPricing = () => {
  const { data: rows = [], isFetching, isLoading } = useFetchMeteredPrices();
  const { mutateAsync: updateOne, isPending: isUpdating } = useUpdateMeteredPrice();
  const { mutateAsync: createOne, isPending: isCreating } = useCreateMeteredPrice();
  const { mutateAsync: deleteOne, isPending: isDeleting } = useDeleteMeteredPrice();

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRow, setNewRow] = useState({
    metric_key: "",
    label: "",
    description: "",
    unit: "per-vm-month",
    unit_price: "",
    currency_code: "NGN",
  });

  useEffect(() => {
    setDrafts((prev) => {
      const dirtyById = new Map(prev.filter((d) => d.dirty).map((d) => [d.id, d]));
      return rows.map((row) => dirtyById.get(row.id) ?? toDraft(row));
    });
  }, [rows]);

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);
  const activeCount = useMemo(() => drafts.filter((d) => d.is_active).length, [drafts]);

  const setField = <K extends keyof DraftRow>(id: number, key: K, value: DraftRow[K]) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, [key]: value, dirty: true } : d)));
  };

  const saveOne = async (draft: DraftRow) => {
    const original = rows.find((r) => r.id === draft.id);
    if (!original) return;
    const priceValue = Number(draft.unit_price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      ToastUtils.error(`Invalid price for ${draft.label}.`);
      return;
    }

    const patch: Partial<MeteredUnitPriceRow> = {};
    if (draft.label !== original.label) patch.label = draft.label;
    if ((draft.description || null) !== (original.description || null))
      patch.description = draft.description || null;
    if (draft.unit !== original.unit) patch.unit = draft.unit;
    if (priceValue !== Number(original.unit_price)) patch.unit_price = priceValue;
    if (draft.is_active !== original.is_active) patch.is_active = draft.is_active;

    if (Object.keys(patch).length === 0) {
      setDrafts((prev) => prev.map((d) => (d.id === draft.id ? { ...d, dirty: false } : d)));
      return;
    }

    try {
      await updateOne({ id: draft.id, patch });
      ToastUtils.success(`Saved ${draft.label}.`);
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

  const removeRow = async (draft: DraftRow) => {
    const confirmed = globalThis.window.confirm(
      `Remove the metered metric "${draft.label}"? Subscription items billing on this metric will need to be re-mapped.`,
    );
    if (!confirmed) return;
    try {
      await deleteOne(draft.id);
      ToastUtils.success(`Removed ${draft.label}.`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to delete.");
    }
  };

  const submitNewRow = async () => {
    if (!newRow.metric_key.trim() || !newRow.label.trim() || !newRow.unit.trim()) {
      ToastUtils.error("metric_key, label, and unit are required.");
      return;
    }
    const priceValue = Number(newRow.unit_price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      ToastUtils.error("Unit price must be a positive number.");
      return;
    }
    try {
      await createOne({
        metric_key: newRow.metric_key.trim(),
        label: newRow.label.trim(),
        description: newRow.description.trim() || null,
        unit: newRow.unit.trim(),
        unit_price: priceValue,
        currency_code: newRow.currency_code.toUpperCase(),
        is_active: true,
      });
      ToastUtils.success(`Added ${newRow.label}.`);
      setNewRow({
        metric_key: "",
        label: "",
        description: "",
        unit: "per-vm-month",
        unit_price: "",
        currency_code: "NGN",
      });
      setShowAdd(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to create.");
    }
  };

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100";

  return (
    <AdminPageShell
      title="Usage-based metric pricing"
      description="Per-VM, per-GB, per-attack and per-incident rate card. The billing engine multiplies each metric's unit price by the recorded usage on every subscription item flagged usage-based."
      contentClassName="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <ModernCard padding="default">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Metrics</p>
              <p className="text-xl font-semibold text-slate-900">{drafts.length}</p>
            </div>
          </div>
        </ModernCard>
        <ModernCard padding="default">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active</p>
            <p className="text-xl font-semibold text-slate-900">{activeCount}</p>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ModernButton
          variant="outline"
          onClick={() => setShowAdd((v) => !v)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          {showAdd ? "Hide new metric" : "Add metric"}
        </ModernButton>
        <ModernButton
          variant="primary"
          onClick={saveAll}
          disabled={dirtyCount === 0 || isUpdating}
          leftIcon={
            isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />
          }
        >
          {dirtyCount === 0
            ? "No unsaved changes"
            : `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`}
        </ModernButton>
      </div>

      {showAdd && (
        <ModernCard padding="default" className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">New metric</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Metric key (snake_case)
              </label>
              <input
                value={newRow.metric_key}
                onChange={(e) => setNewRow((r) => ({ ...r, metric_key: e.target.value }))}
                placeholder="vm_runtime_per_hour"
                className={`${inputCls} font-mono text-xs`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Label</label>
              <input
                value={newRow.label}
                onChange={(e) => setNewRow((r) => ({ ...r, label: e.target.value }))}
                placeholder="VM runtime"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Unit</label>
              <input
                value={newRow.unit}
                onChange={(e) => setNewRow((r) => ({ ...r, unit: e.target.value }))}
                list="metered-unit-options"
                placeholder="per-vm-month"
                className={inputCls}
              />
              <datalist id="metered-unit-options">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <input
                value={newRow.description}
                onChange={(e) => setNewRow((r) => ({ ...r, description: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Unit price</label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={newRow.unit_price}
                  onChange={(e) => setNewRow((r) => ({ ...r, unit_price: e.target.value }))}
                  className={`${inputCls} text-right`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Currency</label>
                <select
                  value={newRow.currency_code}
                  onChange={(e) => setNewRow((r) => ({ ...r, currency_code: e.target.value }))}
                  className={inputCls}
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <ModernButton variant="outline" onClick={() => setShowAdd(false)} disabled={isCreating}>
              Cancel
            </ModernButton>
            <ModernButton
              variant="primary"
              onClick={submitNewRow}
              disabled={isCreating}
              leftIcon={
                isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />
              }
            >
              Add metric
            </ModernButton>
          </div>
        </ModernCard>
      )}

      <ModernCard padding="default" className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Rate card</h3>

        {(isLoading || (isFetching && rows.length === 0)) && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading metered rate card…
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
              {drafts.map((draft) => {
                const original = rows.find((r) => r.id === draft.id);
                return (
                  <tr key={draft.id} className={draft.dirty ? "bg-amber-50/40" : ""}>
                    <td className="py-2 pr-3">
                      <div>
                        <input
                          type="text"
                          value={draft.label}
                          onChange={(e) => setField(draft.id, "label", e.target.value)}
                          className={`${inputCls} mb-1`}
                        />
                        <code className="text-[10px] text-slate-400">{draft.metric_key}</code>
                        <input
                          type="text"
                          value={draft.description}
                          onChange={(e) => setField(draft.id, "description", e.target.value)}
                          placeholder="Description"
                          className={`${inputCls} mt-1 text-xs`}
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={draft.unit}
                        onChange={(e) => setField(draft.id, "unit", e.target.value)}
                        list="metered-unit-options"
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-600">{draft.currency_code}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-col items-end gap-0.5">
                        <input
                          type="number"
                          min="0"
                          step="0.0001"
                          value={draft.unit_price}
                          onChange={(e) => setField(draft.id, "unit_price", e.target.value)}
                          className={`${inputCls} w-32 text-right`}
                        />
                        {original && (
                          <span className="text-[10px] text-slate-400">
                            currently {formatPrice(Number(original.unit_price), original.currency_code)}
                          </span>
                        )}
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
                      <div className="flex items-center justify-end gap-1.5">
                        <ModernButton
                          type="button"
                          variant={draft.dirty ? "primary" : "outline"}
                          size="sm"
                          disabled={!draft.dirty || isUpdating}
                          onClick={() => saveOne(draft)}
                        >
                          {draft.dirty ? "Save" : "Saved"}
                        </ModernButton>
                        <button
                          type="button"
                          onClick={() => removeRow(draft)}
                          disabled={isDeleting}
                          className="inline-flex items-center justify-center rounded-full border border-red-200 p-1.5 text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-40"
                          aria-label="Remove metric"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!drafts.length && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                    No metered metrics configured. Run{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                      php artisan db:seed --class=MeteredUnitPriceSeeder
                    </code>{" "}
                    to seed the default rate card.
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

export default AdminMeteredPricing;
