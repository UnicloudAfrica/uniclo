import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  useFetchIntegrationPricing,
  useUpdateIntegrationPricing,
  type IntegrationPricingRow,
} from "@/hooks/adminHooks/adminIntegrationPricingHooks";
import ToastUtils from "@/utils/toastUtil";
import type { PricingRole } from "../PricingShell";

/**
 * IntegrationPricingPane — single component for any integration_key
 * (Shield, AnyCloudFlow, future). Shield groups by sub-provider
 * (StormWall / Cloudflare); AnyCloudFlow has no sub-provider so the
 * heading is suppressed.
 */

interface DraftRow {
  id: number;
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
  if (amount === null || amount === undefined) return "—";
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

const PROVIDER_LABEL: Record<string, string> = {
  stormwall: "StormWall",
  cloudflare: "Cloudflare",
};

interface IntegrationPricingPaneProps {
  role: PricingRole;
  integrationKey: string;
  title: string;
  description: string;
  groupByProvider?: boolean;
}

const IntegrationPricingPane: React.FC<IntegrationPricingPaneProps> = ({
  role,
  integrationKey,
  title,
  description,
  groupByProvider = false,
}) => {
  const { data: rows = [], isFetching } = useFetchIntegrationPricing(integrationKey);
  const { mutateAsync: update, isPending } = useUpdateIntegrationPricing(integrationKey);

  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  useEffect(() => {
    setDrafts((prev) => {
      const dirty = new Map(
        prev.filter((d) => d.dirty).map((d) => [`${d.id}|${d.provider ?? ""}`, d]),
      );
      return rows.map((r) => dirty.get(`${r.id}|${r.provider ?? ""}`) ?? toDraft(r));
    });
  }, [rows]);

  const dirtyCount = useMemo(() => drafts.filter((d) => d.dirty).length, [drafts]);

  const grouped = useMemo(() => {
    const out: Record<string, DraftRow[]> = {};
    drafts.forEach((d) => {
      const key = groupByProvider ? d.provider || "—" : "all";
      if (!out[key]) out[key] = [];
      out[key].push(d);
    });
    return out;
  }, [drafts, groupByProvider]);

  const setField = <K extends keyof DraftRow>(
    id: number,
    provider: string | null,
    key: K,
    value: DraftRow[K],
  ) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id && (d.provider ?? null) === (provider ?? null)
          ? { ...d, [key]: value, dirty: true }
          : d,
      ),
    );
  };

  const saveOne = async (draft: DraftRow) => {
    const value = Number(draft.price);
    if (!Number.isFinite(value) || value < 0) {
      ToastUtils.error(`Invalid price for ${draft.name}.`);
      return;
    }
    try {
      await update({ id: draft.id, price: value, currency_code: draft.currency_code });
      ToastUtils.success(`Saved ${draft.name}.`);
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
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {role === "admin" && (
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
        )}
      </div>

      {(isFetching && rows.length === 0) && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading services…
        </div>
      )}

      {Object.entries(grouped).map(([providerKey, providerRows]) => (
        <div key={providerKey} className="space-y-2">
          {groupByProvider && (
            <h3 className="text-sm font-semibold text-slate-700">
              {PROVIDER_LABEL[providerKey] || providerKey}
            </h3>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 pr-3">Service</th>
                  <th className="py-3 pr-3">Billing</th>
                  <th className="py-3 pr-3">Unit</th>
                  <th className="py-3 pr-3">Currency</th>
                  <th className="py-3 pr-3 text-right">Price</th>
                  {role === "tenant" && <th className="py-3 pr-3 text-right">Your price</th>}
                  <th className="py-3 pr-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {providerRows.map((draft) => {
                  const original = rows.find(
                    (r) => r.id === draft.id && (r.provider ?? null) === (draft.provider ?? null),
                  );
                  return (
                    <tr
                      key={`${draft.id}-${draft.provider}`}
                      className={draft.dirty ? "bg-amber-50/40" : ""}
                    >
                      <td className="py-2 pr-3">
                        <p className="font-medium text-slate-900">{draft.name}</p>
                        {draft.description && (
                          <p className="text-xs text-slate-500">{draft.description}</p>
                        )}
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
                        {role === "admin" ? (
                          <select
                            value={draft.currency_code}
                            onChange={(e) =>
                              setField(draft.id, draft.provider, "currency_code", e.target.value.toUpperCase())
                            }
                            className={`${inputCls} w-24`}
                          >
                            <option value="USD">USD</option>
                            <option value="NGN">NGN</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        ) : (
                          <span className="text-xs text-slate-600">{draft.currency_code}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {role === "admin" ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.price}
                              onChange={(e) => setField(draft.id, draft.provider, "price", e.target.value)}
                              placeholder="0.00"
                              className={`${inputCls} w-32 text-right`}
                            />
                            {original && original.price !== null && (
                              <span className="text-[10px] text-slate-400">
                                currently {formatPrice(original.price, original.currency_code)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            {formatPrice(original?.price, original?.currency_code || draft.currency_code)}
                          </span>
                        )}
                      </td>
                      {role === "tenant" && (
                        <td className="py-2 pr-3 text-right text-xs text-slate-400">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                            same as platform
                          </span>
                        </td>
                      )}
                      <td className="py-2">
                        {role === "admin" && (
                          <ModernButton
                            type="button"
                            variant={draft.dirty ? "primary" : "outline"}
                            size="sm"
                            disabled={!draft.dirty || isPending}
                            onClick={() => saveOne(draft)}
                          >
                            {draft.dirty ? "Save" : "Saved"}
                          </ModernButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {!isFetching && drafts.length === 0 && (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          No services configured for this integration yet.
        </p>
      )}
    </ModernCard>
  );
};

export default IntegrationPricingPane;
