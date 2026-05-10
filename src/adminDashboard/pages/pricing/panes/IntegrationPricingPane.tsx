import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { ModernCard, ModernButton } from "@/shared/components/ui";
import InlinePriceEditor from "@/shared/components/ui/InlinePriceEditor";
import { compactInputClassName } from "./styles";
import {
  useFetchIntegrationPricing,
  useUpdateIntegrationPricing,
  useFetchTenantIntegrationOverride,
  useUpsertTenantIntegrationOverride,
  useDeleteTenantIntegrationOverride,
  type IntegrationPricingRow,
} from "@/hooks/adminHooks/adminIntegrationPricingHooks";
import { useFetchTenants } from "@/hooks/adminHooks/tenantHooks";
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

  // Tenant-role state: pick a tenant to apply overrides to.
  const { data: tenants = [], isFetching: isTenantsFetching } = useFetchTenants({
    enabled: role === "tenant",
  });
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const { mutateAsync: upsertTenantOverride, isPending: isUpsertingTenant } =
    useUpsertTenantIntegrationOverride(integrationKey);
  const { mutateAsync: clearTenantOverride, isPending: isClearingTenant } =
    useDeleteTenantIntegrationOverride(integrationKey);
  const isTenantMutating = isUpsertingTenant || isClearingTenant;

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

  const inputCls = compactInputClassName;

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

      {role === "tenant" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Apply tenant overrides for
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className={`${inputCls} max-w-md`}
            disabled={isTenantsFetching}
          >
            <option value="">
              {isTenantsFetching ? "Loading tenants…" : "Select a tenant"}
            </option>
            {tenants.map((t: { id: string; name?: string; subdomain?: string }) => (
              <option key={t.id} value={t.id}>
                {t.name || t.subdomain || t.id}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500">
            Per-tenant prices must be at or above the platform default. Clear an override to fall
            back to the admin price.
          </p>
        </div>
      )}

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
                        <td className="py-2 pr-3 text-right">
                          <TenantOverrideCell
                            integrationProductId={draft.id}
                            tenantId={selectedTenantId}
                            adminPrice={original?.price ?? null}
                            adminCurrencyCode={original?.currency_code || draft.currency_code}
                            disabled={isTenantMutating}
                            onSave={async (price, currencyCode) => {
                              if (!selectedTenantId) {
                                ToastUtils.error("Pick a tenant first.");
                                return;
                              }
                              try {
                                await upsertTenantOverride({
                                  integrationProductId: draft.id,
                                  tenant_id: selectedTenantId,
                                  price,
                                  currency_code: currencyCode,
                                });
                                ToastUtils.success(`Override saved for ${draft.name}.`);
                              } catch (error: unknown) {
                                const err = error as {
                                  response?: { data?: { message?: string } };
                                  message?: string;
                                };
                                ToastUtils.error(
                                  err?.response?.data?.message ||
                                    err?.message ||
                                    "Failed to save override.",
                                );
                              }
                            }}
                            onClear={async () => {
                              if (!selectedTenantId) return;
                              try {
                                await clearTenantOverride({
                                  integrationProductId: draft.id,
                                  tenant_id: selectedTenantId,
                                });
                                ToastUtils.success(`Override cleared for ${draft.name}.`);
                              } catch (error: unknown) {
                                const err = error as {
                                  response?: { data?: { message?: string } };
                                  message?: string;
                                };
                                ToastUtils.error(
                                  err?.response?.data?.message ||
                                    err?.message ||
                                    "Failed to clear override.",
                                );
                              }
                            }}
                          />
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

/**
 * Inline tenant override editor for a single integration-product row.
 *
 * Composes `InlinePriceEditor` for the input + save/revert + dirty
 * tracking + a11y. This component's only job is to bridge the
 * `useFetchTenantIntegrationOverride` query to the editor: pass the
 * server value down, surface an "override active" status, hand
 * `onSave` / `onClear` to the parent's mutation handlers.
 */
interface TenantOverrideCellProps {
  integrationProductId: number;
  tenantId: string;
  adminPrice: number | null | undefined;
  adminCurrencyCode: string;
  disabled: boolean;
  onSave: (price: number, currencyCode: string) => Promise<void>;
  onClear: () => Promise<void>;
}

const TenantOverrideCell: React.FC<TenantOverrideCellProps> = ({
  integrationProductId,
  tenantId,
  adminPrice,
  adminCurrencyCode,
  disabled,
  onSave,
  onClear,
}) => {
  const { data, isFetching } = useFetchTenantIntegrationOverride(
    tenantId ? integrationProductId : null,
    tenantId || null,
  );

  if (!tenantId) {
    return (
      <span className="text-[11px] text-slate-400">Select a tenant to set an override.</span>
    );
  }

  const overrideActive = !!data?.override;
  const resolvedAdminPrice =
    data?.admin_price ?? (typeof adminPrice === "number" ? adminPrice : null);
  const resolvedCurrency = data?.admin_currency_code || adminCurrencyCode || "USD";

  return (
    <InlinePriceEditor
      value={data?.override?.price ?? null}
      currency={resolvedCurrency}
      minPrice={typeof resolvedAdminPrice === "number" ? resolvedAdminPrice : undefined}
      ariaLabel={`Tenant override for integration product ${integrationProductId}`}
      placeholder={
        resolvedAdminPrice !== null && resolvedAdminPrice !== undefined
          ? String(resolvedAdminPrice)
          : "0.00"
      }
      baseline={{
        amount: resolvedAdminPrice,
        currency: resolvedCurrency,
        label: "admin",
      }}
      status={
        <span className={overrideActive ? "text-emerald-600" : "text-slate-400"}>
          {overrideActive ? "Override active" : "No override · uses admin price"}
        </span>
      }
      disabled={disabled}
      isLoading={isFetching && !data}
      onSave={(next) => onSave(next, resolvedCurrency)}
      onClear={overrideActive ? onClear : undefined}
      data-testid={`tenant-override-${integrationProductId}`}
    />
  );
};

export default IntegrationPricingPane;
