import { useState } from "react";
import AdminPageShell from "../components/AdminPageShell";
import { Loader2, Plus, Trash2 } from "lucide-react";
import ToastUtils from "@/utils/toastUtil";
import {
  useDeleteProviderUnitCost,
  useFetchProviderAzs,
  useFetchProviderUnitCosts,
  useSaveProviderUnitCost,
  type ProviderUnitCostRow,
} from "@/hooks/adminHooks/adminProviderUnitCostHooks";

/**
 * Admin screen for the `provider_unit_costs` table (Part A).
 *
 * Lets ops edit Zadara + Nobus CPU/RAM/storage/bandwidth/object-storage
 * per-unit rates without touching config or running artisan. Saving a
 * row invalidates the product-pricing cache so the downstream recompute
 * shows up the next time someone loads the pricing admin page.
 *
 * For bulk refreshes (e.g. quarterly provider sheet update), ops still
 * runs `php artisan pricing:recompute --provider=all` after editing a
 * batch here.
 */

const PROVIDERS = ["zadara", "nobus"] as const;
const METRICS = [
  "cpu",
  "ram",
  "ebs_ssd",
  "ebs_hdd",
  "storage",
  "bandwidth",
  "object_storage",
] as const;
const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;

const DEFAULT_UNIT_FOR_METRIC: Record<(typeof METRICS)[number], string> = {
  cpu: "vcpu",
  ram: "gb",
  ebs_ssd: "gb",
  ebs_hdd: "gb",
  storage: "gb",
  bandwidth: "mbps",
  object_storage: "tb",
};

export default function AdminProviderUnitCosts() {
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]>("zadara");
  const [azFilter, setAzFilter] = useState<number | null>(null);

  const unitCosts = useFetchProviderUnitCosts({
    provider,
    availability_zone_id: azFilter,
  });
  const azs = useFetchProviderAzs(provider);
  const save = useSaveProviderUnitCost();
  const del = useDeleteProviderUnitCost();

  const [form, setForm] = useState({
    metric: "cpu" as (typeof METRICS)[number],
    unit_amount: "",
    per: 1,
    unit_measure: "vcpu",
    currency_code: "NGN" as (typeof CURRENCIES)[number],
    notes: "",
  });

  const onSubmit = async () => {
    const amount = Number(form.unit_amount);
    if (!Number.isFinite(amount) || amount < 0) {
      ToastUtils.error("Amount must be a non-negative number");
      return;
    }
    try {
      await save.mutateAsync({
        provider,
        availability_zone_id: azFilter,
        metric: form.metric,
        unit_amount: amount,
        per: form.per,
        unit_measure: form.unit_measure,
        currency_code: form.currency_code,
        notes: form.notes || undefined,
      });
      ToastUtils.success(`Saved ${provider} / ${form.metric}`);
      setForm({ ...form, unit_amount: "", notes: "" });
    } catch (err) {
      ToastUtils.error(`Failed to save: ${(err as Error).message}`);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this unit cost row?")) return;
    try {
      await del.mutateAsync(id);
      ToastUtils.success("Deleted");
    } catch (err) {
      ToastUtils.error(`Failed: ${(err as Error).message}`);
    }
  };

  return (
    <AdminPageShell title="Provider Unit Costs">
      <div className="space-y-6">
        {/* Filters */}
        <section className="rounded-xl border bg-white p-4 dark:bg-neutral-900">
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs text-neutral-600">Provider</span>
              <select
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value as (typeof PROVIDERS)[number]);
                  setAzFilter(null);
                }}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">AZ scope</span>
              <select
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={azFilter ?? ""}
                onChange={(e) =>
                  setAzFilter(e.target.value === "" ? null : Number(e.target.value))
                }
              >
                <option value="">All AZs (provider-wide)</option>
                {(azs.data ?? []).map((az) => (
                  <option key={az.id} value={az.id}>
                    {az.code}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-xl border bg-white p-4 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold">
            {provider} {azFilter ? `(AZ #${azFilter})` : "(provider-wide)"}
          </h2>
          {unitCosts.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (unitCosts.data ?? []).length === 0 ? (
            <div className="py-6 text-center text-sm text-neutral-500">
              No unit costs configured. Add one below — these values drive every
              compute, storage, and bandwidth price for this provider.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-2 py-2">Metric</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-right">Per</th>
                    <th className="px-2 py-2">Unit</th>
                    <th className="px-2 py-2">Currency</th>
                    <th className="px-2 py-2 text-right">Per unit</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {(unitCosts.data ?? []).map((row: ProviderUnitCostRow) => (
                    <tr key={row.id} className="border-b last:border-b-0">
                      <td className="px-2 py-2 font-mono text-xs">{row.metric}</td>
                      <td className="px-2 py-2 text-right font-mono">
                        {row.unit_amount.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right">{row.per}</td>
                      <td className="px-2 py-2">{row.unit_measure}</td>
                      <td className="px-2 py-2 font-mono">{row.currency_code}</td>
                      <td className="px-2 py-2 text-right text-neutral-600">
                        {row.per_unit !== null ? row.per_unit.toLocaleString() : ""}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Save form */}
        <section className="rounded-xl border bg-white p-4 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold">Add / update unit cost</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <label className="block">
              <span className="text-xs text-neutral-600">Metric</span>
              <select
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.metric}
                onChange={(e) => {
                  const metric = e.target.value as (typeof METRICS)[number];
                  setForm({
                    ...form,
                    metric,
                    unit_measure: DEFAULT_UNIT_FOR_METRIC[metric],
                  });
                }}
              >
                {METRICS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">Amount</span>
              <input
                type="number"
                min="0"
                step="0.0001"
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.unit_amount}
                onChange={(e) => setForm({ ...form, unit_amount: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">Per</span>
              <input
                type="number"
                min="1"
                step="1"
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.per}
                onChange={(e) => setForm({ ...form, per: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">Unit</span>
              <input
                type="text"
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.unit_measure}
                onChange={(e) => setForm({ ...form, unit_measure: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">Currency</span>
              <select
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.currency_code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currency_code: e.target.value as (typeof CURRENCIES)[number],
                  })
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={onSubmit}
                disabled={save.isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {save.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Save
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Tip — run{" "}
            <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px] dark:bg-neutral-800">
              php artisan pricing:recompute --provider={provider}
            </code>{" "}
            after a batch of edits to regenerate `product_pricings` totals.
          </p>
        </section>
      </div>
    </AdminPageShell>
  );
}
