import { useState } from "react";
import AdminPageShell from "../components/AdminPageShell";
import { Loader2, Plus } from "lucide-react";
import ToastUtils from "@/utils/toastUtil";
import {
  useFetchPublishedFxRates,
  usePublishFxRate,
  type PublishedFxRateRow,
} from "@/hooks/adminHooks/adminPublishedFxRateHooks";

/**
 * Admin screen for the Published FX Rates table (Part C of the pricing
 * plan). Lists rate history per pair and lets staff publish a new rate
 * that atomically closes the previous row's `effective_until`.
 *
 * Keeping the UI deliberately minimal — the artisan command
 * `php artisan fx:publish USD NGN 1600` is the primary write path for
 * ops, and this screen is the audit + in-tab convenience layer.
 */

const CURRENCIES = ["NGN", "USD", "GBP", "EUR", "ZAR", "KES"];

export default function AdminPublishedFxRates() {
  const { data: rates, isLoading } = useFetchPublishedFxRates({});
  const publish = usePublishFxRate();

  const [form, setForm] = useState({
    source_currency: "USD",
    target_currency: "NGN",
    rate: "",
    notes: "",
  });

  const onSubmit = async () => {
    const rate = Number(form.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      ToastUtils.error("Rate must be a positive number");
      return;
    }
    if (form.source_currency === form.target_currency) {
      ToastUtils.error("Source and target currencies must differ");
      return;
    }
    try {
      await publish.mutateAsync({
        source_currency: form.source_currency,
        target_currency: form.target_currency,
        rate,
        notes: form.notes || undefined,
      });
      ToastUtils.success(
        `Published ${form.source_currency} → ${form.target_currency} @ ${rate}`,
      );
      setForm({ ...form, rate: "", notes: "" });
    } catch (err) {
      ToastUtils.error(`Failed to publish rate: ${(err as Error).message}`);
    }
  };

  return (
    <AdminPageShell title="Published FX Rates">
      <div className="space-y-6">
        {/* Publish a new rate */}
        <section className="rounded-xl border bg-white p-4 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Publish a new rate
          </h2>
          <p className="mb-4 text-xs text-neutral-500">
            Publishing closes the previous pair's validity window atomically. Customer-
            facing prices use the stable rate until you publish a new one.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <label className="block">
              <span className="text-xs text-neutral-600">Source</span>
              <select
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.source_currency}
                onChange={(e) =>
                  setForm({ ...form, source_currency: e.target.value })
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">Target</span>
              <select
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.target_currency}
                onChange={(e) =>
                  setForm({ ...form, target_currency: e.target.value })
                }
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-neutral-600">Rate</span>
              <input
                type="number"
                min="0"
                step="0.000001"
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder="e.g. 1600"
              />
            </label>
            <label className="block md:col-span-1">
              <span className="text-xs text-neutral-600">Note (optional)</span>
              <input
                type="text"
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Monthly close"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={onSubmit}
                disabled={publish.isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {publish.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Publish
              </button>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="rounded-xl border bg-white p-4 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Rate history
          </h2>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (rates ?? []).length === 0 ? (
            <div className="py-6 text-center text-sm text-neutral-500">
              No rates published yet. Publish one above — customer prices will stay
              locked until you do.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-2 py-2">Pair</th>
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2">Effective from</th>
                    <th className="px-2 py-2">Effective until</th>
                    <th className="px-2 py-2">Source</th>
                    <th className="px-2 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(rates ?? []).map((r: PublishedFxRateRow) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="px-2 py-2 font-mono text-xs">
                        {r.source_currency} → {r.target_currency}
                      </td>
                      <td className="px-2 py-2 text-right font-mono">{r.rate}</td>
                      <td className="px-2 py-2 text-xs text-neutral-600">
                        {r.effective_from ?? "—"}
                      </td>
                      <td className="px-2 py-2 text-xs text-neutral-600">
                        {r.effective_until ?? (
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                            active
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs">{r.source}</td>
                      <td className="px-2 py-2 text-xs text-neutral-600">
                        {r.notes ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
