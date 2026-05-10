import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Search } from "lucide-react";

import { ModernCard, ModernButton } from "@/shared/components/ui";
import {
  useFetchProductPricing,
  useUpdateProductPricing,
} from "@/hooks/adminHooks/adminProductPricingHooks";
import {
  useFetchAvailabilityZones,
  useFetchRegions,
} from "@/hooks/adminHooks/regionHooks";
import ToastUtils from "@/utils/toastUtil";
import type { PricingRole } from "../PricingShell";
import { compactInputClassName } from "./styles";

/**
 * CatalogPane — single pane that renders the price table for any
 * polymorphic product type that lives in `product_pricing`
 * (compute_instance, os_image, volume_type, object_storage_configuration,
 * bandwidth, ip, cross_connect, managed_database_plan).
 *
 * Server-side paginated. The compute catalog alone routinely lands in
 * the hundreds of rows once Zadara flavors × regions × tenants get
 * multiplied — so we never load the full set in one shot. Page state
 * is local, paging metadata comes from the response envelope.
 */

interface CatalogPaneProps {
  productableType: string;
  title: string;
  description: string;
  role: PricingRole;
}

interface FlatPricingRow {
  id?: number | string;
  product_name?: string;
  productable_type?: string;
  productable_id?: number | string;
  provider?: string | null;
  region?: string | null;
  availability_zone?: string | null;
  country_code?: string | null;
  price_usd?: number | string | null;
  price_local?: number | string | null;
  currency_code?: string | null;
}

interface EnrichedPricingRow {
  product?: {
    id?: number | string;
    productable_id?: number | string;
    productable_type?: string;
    name?: string;
    provider?: string | null;
    region?: string | null;
    availability_zone?: string | null;
    family_code?: string | null;
  };
  pricing?: {
    id?: number | string;
    price_usd?: number | string | null;
    currency_code?: string | null;
    effective?: {
      price_usd?: number | string | null;
      price_local?: number | string | null;
      currency?: string | null;
    };
  };
}

interface NormalisedRow {
  // The id used by the update mutation. Prefer the pricing row id since
  // the mutation hits `/product-pricing/{id}`.
  pricingId?: number | string;
  productName: string;
  region: string | null;
  availabilityZone: string | null;
  provider: string | null;
  countryCode: string | null;
  priceUsd: number | null;
  priceLocal: number | null;
  currency: string | null;
}

const normaliseRow = (raw: FlatPricingRow & EnrichedPricingRow): NormalisedRow => {
  // Enriched shape: server returned `{ product: {...}, pricing: {...} }`
  // (happens when availability_zone is on the query, or with_product=1).
  if (raw.product || raw.pricing) {
    const product = raw.product ?? {};
    const pricing = raw.pricing ?? {};
    const effective = pricing.effective ?? {};
    return {
      pricingId: pricing.id,
      productName: product.name ?? "—",
      region: product.region ?? null,
      availabilityZone: product.availability_zone ?? null,
      provider: product.provider ?? null,
      countryCode: null,
      priceUsd:
        pricing.price_usd === undefined || pricing.price_usd === null
          ? null
          : Number(pricing.price_usd),
      priceLocal:
        effective.price_local === undefined || effective.price_local === null
          ? null
          : Number(effective.price_local),
      currency: (effective.currency as string | null) ?? (pricing.currency_code as string | null) ?? null,
    };
  }
  // Flat shape: server returned ProductPricing rows directly.
  return {
    pricingId: raw.id,
    productName: raw.product_name ?? "—",
    region: raw.region ?? null,
    availabilityZone: raw.availability_zone ?? null,
    provider: raw.provider ?? null,
    countryCode: raw.country_code ?? null,
    priceUsd:
      raw.price_usd === undefined || raw.price_usd === null ? null : Number(raw.price_usd),
    priceLocal:
      raw.price_local === undefined || raw.price_local === null ? null : Number(raw.price_local),
    currency: raw.currency_code ?? null,
  };
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const formatPrice = (
  value: number | string | null | undefined,
  currency: string | null | undefined,
) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const code = (currency || "USD").toUpperCase();
  const amount = Number(value);
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const sym = CURRENCY_SYMBOLS[code] ?? `${code} `;
    return `${sym}${amount.toFixed(2)}`;
  }
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const CatalogPane: React.FC<CatalogPaneProps> = ({
  productableType,
  title,
  description,
  role,
}) => {
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(25);
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedAz, setSelectedAz] = useState<string>("");

  // Reset to page 1 + clear filters whenever the product type changes
  // (user clicked a different left-menu entry) — otherwise we'd keep
  // paging into a list that no longer exists.
  useEffect(() => {
    setPage(1);
    setSearch("");
    setSearchInput("");
    setSelectedRegion("");
    setSelectedAz("");
  }, [productableType]);

  // Debounce search input so we don't fire a request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Region + AZ dropdowns. AZ list is region-scoped via the canonical
  // useFetchAvailabilityZones hook so it picks up the cached list the
  // rest of the app populates.
  const { data: regionsData, isFetching: isRegionsFetching } = useFetchRegions();
  const regionOptions = useMemo(() => {
    if (!Array.isArray(regionsData)) return [];
    return (regionsData as Array<{ code?: string; name?: string; is_active?: boolean }>)
      .filter((r) => r.code && r.is_active !== false)
      .map((r) => ({ code: r.code as string, name: r.name || (r.code as string) }));
  }, [regionsData]);

  const { data: azsData, isFetching: isAzsFetching } = useFetchAvailabilityZones(
    selectedRegion || null,
  );
  const azOptions = useMemo(() => {
    if (!Array.isArray(azsData)) return [];
    return (azsData as Array<{ code: string; name?: string; is_active?: boolean }>)
      .filter((az) => az.is_active !== false)
      .map((az) => ({ code: az.code, name: az.name || az.code }));
  }, [azsData]);

  const { data, isFetching } = useFetchProductPricing(
    {
      productType: productableType,
      page,
      perPage,
      search,
      region: selectedRegion || undefined,
      availabilityZone: selectedAz || undefined,
    },
    {
      keepPreviousData: true,
    },
  );

  const { mutateAsync: updatePricing, isPending: isSaving } = useUpdateProductPricing();

  // The hook returns `{ data: <flat OR enriched rows>, meta: {...} }`.
  // Server emits the enriched shape `{ product: {...}, pricing: {...} }`
  // when `availability_zone` (or `with_product=1`) is on the query, and
  // the flat shape otherwise. Normalise either one to a single row type.
  const rows = useMemo<NormalisedRow[]>(() => {
    const payload = data as
      | { data?: Array<FlatPricingRow & EnrichedPricingRow> }
      | Array<FlatPricingRow & EnrichedPricingRow>
      | undefined;
    if (!payload) return [];
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : [];
    return list.map(normaliseRow);
  }, [data]);

  const meta = useMemo(() => {
    const payload = data as
      | { meta?: { total?: number; current_page?: number; last_page?: number; per_page?: number } }
      | undefined;
    return payload?.meta ?? { total: rows.length, current_page: page, last_page: 1, per_page: perPage };
  }, [data, rows.length, page, perPage]);

  const total = Number(meta.total ?? rows.length);
  const lastPage = Number(meta.last_page ?? 1);
  const currentPage = Number(meta.current_page ?? page);
  const fromIndex = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const toIndex = Math.min(currentPage * perPage, total);

  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [draftPrice, setDraftPrice] = useState<string>("");

  const beginEdit = (row: NormalisedRow) => {
    if (row.pricingId === undefined || row.pricingId === null) return;
    setEditingId(row.pricingId);
    setDraftPrice(row.priceUsd === null ? "" : String(row.priceUsd));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraftPrice("");
  };

  const saveEdit = async (row: NormalisedRow) => {
    if (row.pricingId === undefined || row.pricingId === null) return;
    const value = Number(draftPrice);
    if (!Number.isFinite(value) || value < 0) {
      ToastUtils.error("Price must be a positive number.");
      return;
    }
    try {
      // The mutation expects `{ id, pricingData: { price_usd, ... } }`
      // — sending a flat `{ id, price_usd }` makes the request body
      // empty (pricingData is undefined) which is why the server kept
      // returning "The price usd field is required" on every save.
      await updatePricing({
        id: row.pricingId as number,
        pricingData: {
          price_usd: value,
          ...(row.currency ? { currency_code: row.currency } : {}),
        },
      } as unknown as Parameters<typeof updatePricing>[0]);
      ToastUtils.success(`Saved ${row.productName}.`);
      cancelEdit();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(err?.response?.data?.message || err?.message || "Failed to save.");
    }
  };

  const inputCls = compactInputClassName;

  const colspan = role === "tenant" ? 6 : 5;

  return (
    <ModernCard padding="default" className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search SKU…"
                className={`${inputCls} w-56 pl-9`}
              />
            </div>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className={inputCls}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Region + AZ filters. Selecting a Region narrows the AZ list and
            resets the AZ to "all". Both filters reset paging to page 1
            so the user always sees row 1 of the new query. */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:max-w-md">
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedAz("");
                setPage(1);
              }}
              disabled={isRegionsFetching}
              className={inputCls}
            >
              <option value="">
                {isRegionsFetching ? "Loading regions…" : "All regions"}
              </option>
              {regionOptions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={selectedAz}
              onChange={(e) => {
                setSelectedAz(e.target.value);
                setPage(1);
              }}
              disabled={!selectedRegion || isAzsFetching}
              className={inputCls}
            >
              <option value="">
                {!selectedRegion
                  ? "Pick a region first"
                  : isAzsFetching
                    ? "Loading zones…"
                    : "All availability zones"}
              </option>
              {azOptions.map((az) => (
                <option key={az.code} value={az.code}>
                  {az.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isFetching && rows.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading pricing…
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 pr-3">Product</th>
              <th className="py-3 pr-3">Region</th>
              <th className="py-3 pr-3">AZ</th>
              <th className="py-3 pr-3 text-right">List price</th>
              {role === "tenant" && <th className="py-3 pr-3 text-right">Your price</th>}
              <th className="py-3 pr-1"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => {
              const isEditing = editingId !== null && editingId === row.pricingId;
              // Display price prefers the local (FX-converted) price when
              // present, falls back to the stored amount.
              const price = row.priceLocal ?? row.priceUsd;
              return (
                <tr key={`${row.pricingId ?? idx}`}>
                  <td className="py-2 pr-3">
                    <p className="font-medium text-slate-900">{row.productName || "—"}</p>
                    {row.countryCode && (
                      <p className="text-[10px] uppercase text-slate-400">{row.countryCode}</p>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-xs text-slate-600">{row.region ?? "—"}</td>
                  <td className="py-2 pr-3 text-xs text-slate-600">
                    {row.availabilityZone ?? "All"}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {role === "admin" && isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draftPrice}
                        onChange={(e) => setDraftPrice(e.target.value)}
                        className={`${inputCls} w-32 text-right`}
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">
                        {formatPrice(price, row.currency)}
                      </span>
                    )}
                  </td>
                  {role === "tenant" && (
                    <td className="py-2 pr-3 text-right text-xs">
                      {/*
                       * Region-qualified products (compute, OS, volumes,
                       * etc.) carry per-(region, AZ, country) tenant
                       * overrides on `tenant_product_pricings`. Editing
                       * these inline would require region/AZ/country
                       * context the catalog table doesn't surface yet,
                       * so we route operators to the dedicated
                       * tenant-pricing workflow instead of pretending
                       * the override is "same as list".
                       */}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
                        {row.priceUsd === null ? "—" : "no override"}
                      </span>
                    </td>
                  )}
                  <td className="py-2">
                    {role === "admin" &&
                      (isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <ModernButton
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => saveEdit(row)}
                          >
                            Save
                          </ModernButton>
                          <ModernButton
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSaving}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </ModernButton>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => beginEdit(row)}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
                          title="Edit price"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      ))}
                  </td>
                </tr>
              );
            })}

            {!isFetching && rows.length === 0 && (
              <tr>
                <td colSpan={colspan} className="py-6 text-center text-sm text-slate-500">
                  {search
                    ? `No SKUs match "${search}".`
                    : "No published pricing for this product type yet."}{" "}
                  {role === "admin" && !search && (
                    <a href="/admin-dashboard/catalog/add" className="text-primary-600 underline">
                      Add new SKU →
                    </a>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>
          {total === 0
            ? "No rows"
            : `Showing ${fromIndex.toLocaleString()}–${toIndex.toLocaleString()} of ${total.toLocaleString()}`}
        </span>
        <div className="flex items-center gap-1.5">
          <ModernButton
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
          >
            Prev
          </ModernButton>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
            {currentPage} / {lastPage || 1}
          </span>
          <ModernButton
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= lastPage || isFetching}
            onClick={() => setPage((p) => Math.min(lastPage || 1, p + 1))}
            rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
          >
            Next
          </ModernButton>
        </div>
      </div>
    </ModernCard>
  );
};

export default CatalogPane;
