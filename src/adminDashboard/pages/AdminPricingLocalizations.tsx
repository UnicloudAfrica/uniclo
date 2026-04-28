import { useState } from "react";
import AdminPageShell from "../components/AdminPageShell";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import ToastUtils from "@/utils/toastUtil";
import {
  useFetchPricingDrift,
  useFetchPricingLocalizations,
  useRemovePricingLocalization,
  useSetPricingLocalization,
  type PricingLocalizationRow,
  type PricingDriftRow,
} from "@/hooks/adminHooks/adminPricingLocalizationHooks";

/**
 * Admin screen for ProductPricing localizations (Part L).
 *
 * Two panels:
 *   1. Drift report — flags manual localizations whose amount diverges
 *      from the currently-published FX rate by more than the threshold.
 *      Threshold defaults to 10% (mirrors the nightly cron).
 *   2. Localization editor — lookup by ProductPricing ID, add/remove
 *      per-currency pins. The stability win: admin sets $10 + ₦15,000
 *      explicitly and every tenant sees ₦15,000 regardless of FX drift.
 *
 * Lookup-by-id rather than a fat picker keeps the screen simple —
 * admins already have the ID from the neighbouring `adminPricing` page.
 */

const CURRENCIES = ["NGN", "USD", "GBP", "EUR", "ZAR", "KES"];

export default function AdminPricingLocalizations() {
  const [productPricingId, setProductPricingId] = useState<number | null>(null);
  const [idInput, setIdInput] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [amount, setAmount] = useState("");
  const [threshold, setThreshold] = useState(10);

  const localizations = useFetchPricingLocalizations(productPricingId);
  const drift = useFetchPricingDrift(threshold);
  const setLoc = useSetPricingLocalization();
  const removeLoc = useRemovePricingLocalization();

  const onLookup = () => {
    const id = Number(idInput);
    if (!Number.isInteger(id) || id <= 0) {
      ToastUtils.error("Enter a numeric ProductPricing ID");
      return;
    }
    setProductPricingId(id);
  };

  const onAdd = async () => {
    if (!productPricingId) return;
    const a = Number(amount);
    if (!Number.isFinite(a) || a < 0) {
      ToastUtils.error("Amount must be a non-negative number");
      return;
    }
    try {
      await setLoc.mutateAsync({
        productPricingId,
        currency_code: currency,
        amount: a,
        is_manual: true,
      });
      ToastUtils.success(`Localization saved: ${currency} ${a}`);
      setAmount("");
    } catch (err) {
      ToastUtils.error(`Failed to save: ${(err as Error).message}`);
    }
  };

  const onRemove = async (currencyCode: string) => {
    if (!productPricingId) return;
    try {
      await removeLoc.mutateAsync({ productPricingId, currencyCode });
      ToastUtils.success(`Removed ${currencyCode} localization`);
    } catch (err) {
      ToastUtils.error(`Failed to remove: ${(err as Error).message}`);
    }
  };

  return (
    <AdminPageShell title="Pricing Localizations">
      <div className="space-y-6">
        {/* Drift panel */}
        <section className="rounded-xl border bg-white p-4 dark:bg-neutral-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              Drift report{" "}
              <span className="text-xs font-normal text-neutral-500">
                ({drift.data?.meta.count ?? 0} flagged)
              </span>
            </h2>
            <label className="text-xs text-neutral-600">
              Threshold %{" "}
              <input
                type="number"
                min="1"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(1, Number(e.target.value)))}
                className="ml-1 w-16 rounded border px-1.5 py-0.5 text-xs"
              />
            </label>
          </div>

          {drift.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading drift…
            </div>
          ) : (drift.data?.data ?? []).length === 0 ? (
            <div className="py-4 text-center text-sm text-neutral-500">
              No localizations are drifting beyond {threshold}% right now.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-2 py-2">ProductPricing</th>
                    <th className="px-2 py-2">Currency</th>
                    <th className="px-2 py-2 text-right">Actual</th>
                    <th className="px-2 py-2 text-right">Expected</th>
                    <th className="px-2 py-2 text-right">Drift</th>
                  </tr>
                </thead>
                <tbody>
                  {(drift.data?.data ?? []).map((row: PricingDriftRow) => (
                    <tr key={row.localization_id} className="border-b last:border-b-0">
                      <td className="px-2 py-2 font-mono text-xs">
                        #{row.product_pricing_id}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">
                        {row.currency_code}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {row.actual.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {row.expected.toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          {row.drift_percent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Localization editor */}
        <section className="rounded-xl border bg-white p-4 dark:bg-neutral-900">
          <h2 className="mb-3 text-sm font-semibold">Edit localizations</h2>
          <div className="mb-4 flex items-end gap-3">
            <label className="flex-1">
              <span className="text-xs text-neutral-600">ProductPricing ID</span>
              <input
                type="number"
                className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                placeholder="e.g. 42"
              />
            </label>
            <button
              type="button"
              onClick={onLookup}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
            >
              Load
            </button>
          </div>

          {localizations.data && (
            <>
              <div className="mb-4 rounded-md bg-neutral-50 p-3 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                Canonical price:{" "}
                <strong>
                  {localizations.data.product_pricing.canonical_amount.toLocaleString()}{" "}
                  {localizations.data.product_pricing.canonical_currency}
                </strong>
              </div>

              {/* Existing rows */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-2 py-2">Currency</th>
                      <th className="px-2 py-2 text-right">Amount</th>
                      <th className="px-2 py-2">Source</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {localizations.data.localizations.map((row: PricingLocalizationRow) => (
                      <tr key={row.id} className="border-b last:border-b-0">
                        <td className="px-2 py-2 font-mono">{row.currency_code}</td>
                        <td className="px-2 py-2 text-right">{row.amount.toLocaleString()}</td>
                        <td className="px-2 py-2 text-xs">
                          {row.is_manual ? (
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                              manual
                            </span>
                          ) : (
                            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                              auto
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onRemove(row.currency_code)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {localizations.data.localizations.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-sm text-neutral-500">
                          No localizations yet. Add one below.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add a new localization */}
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="text-xs text-neutral-600">Currency</span>
                  <select
                    className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block flex-1">
                  <span className="text-xs text-neutral-600">Amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    className="mt-1 w-full rounded-md border px-2 py-1.5 text-sm"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 15000"
                  />
                </label>
                <button
                  type="button"
                  onClick={onAdd}
                  disabled={setLoc.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {setLoc.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminPageShell>
  );
}
