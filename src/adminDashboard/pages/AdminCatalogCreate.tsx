import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2, Plus, Trash2, Upload } from "lucide-react";
import Papa from "papaparse";
import { read as readWorkbook, utils as xlsxUtils } from "xlsx";

import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import { useFetchRegions } from "@/hooks/adminHooks/regionHooks";
import { useFetchCountries } from "@/hooks/resource";
import { useCreateProducts } from "@/hooks/adminHooks/adminProductHooks";
import { productTypes, OBJECT_STORAGE_TYPE } from "@/utils/productImportUtils";
import ToastUtils from "@/utils/toastUtil";
import useAuthRedirect from "@/utils/adminAuthRedirect";
import silentApi from "../../index/admin/silent";

interface CountryOption {
  iso2?: string;
  code?: string;
  name?: string;
  label?: string;
  currency_code?: string;
  currency?: string;
  [key: string]: unknown;
}

interface RegionOption {
  code: string;
  name: string;
  country_code?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

interface AZOption {
  id: number;
  code: string;
  name: string;
  provider?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

interface CatalogEntry {
  id: string;
  name: string;
  productable_type: string;
  region: string;
  availability_zone: string;
  family_code: string;
  price: string;
  errors: Record<string, string>;
}

const generateEntryId = () =>
  `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptyEntry = (): CatalogEntry => ({
  id: generateEntryId(),
  name: "",
  productable_type: "",
  region: "",
  availability_zone: "",
  family_code: "",
  price: "",
  errors: {},
});

const AdminCatalogCreate = () => {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading } = useAuthRedirect();

  const [entries, setEntries] = useState<CatalogEntry[]>([createEmptyEntry()]);

  const { isFetching: isRegionsFetching, data: regionsData } = useFetchRegions();
  const { data: countriesData } = useFetchCountries();
  const { mutateAsync: createProducts, isPending: isCreating } = useCreateProducts();

  const regions = useMemo<RegionOption[]>(() => {
    if (!Array.isArray(regionsData)) return [];
    return (regionsData as unknown as RegionOption[]).filter(
      (r) => r.name && r.is_active !== false,
    );
  }, [regionsData]);

  const regionLookup = useMemo(() => {
    return regions.reduce((acc: Record<string, RegionOption>, region) => {
      acc[region.code] = region;
      return acc;
    }, {});
  }, [regions]);

  // Country → local currency lookup. The country code on the region drives
  // the currency on the published price. Operators don't pick the country
  // separately — Lagos always means NG which always means NGN.
  const currencyByCountry = useMemo(() => {
    const map: Record<string, string> = {};
    const list = (Array.isArray(countriesData) ? countriesData : []) as CountryOption[];
    list.forEach((c) => {
      const key = String(c.iso2 || c.code || "").toUpperCase();
      const currency = String(
        c.currency_code || c.currency || "",
      ).toUpperCase();
      if (key && currency) map[key] = currency;
    });
    return map;
  }, [countriesData]);

  const resolveCurrencyForRegion = useCallback(
    (regionCode: string): string => {
      const country = String(regionLookup[regionCode]?.country_code || "").toUpperCase();
      if (!country) return "—";
      return currencyByCountry[country] || (country === "NG" ? "NGN" : "USD");
    },
    [regionLookup, currencyByCountry],
  );

  const usedRegionCodes = useMemo(
    () => [...new Set(entries.map((e) => e.region).filter(Boolean))],
    [entries],
  );

  // Match the canonical `useFetchAvailabilityZones` cache shape — return a
  // raw `AvailabilityZone[]`, NOT a wrapped object. Earlier the Add pages
  // used `{ code, data: [...] }` and silently broke whenever the shared
  // cache was already populated by another screen using the canonical
  // hook. See AdminPricingCreate / AdminProductCreate for the same fix.
  const azQueryResults = useQueries({
    queries: usedRegionCodes.map((code) => ({
      queryKey: ["availability-zones", code],
      queryFn: async () => {
        const res = await silentApi<{ data?: AZOption[] }>(
          "GET",
          `/regions/${code}/availability-zones`,
        );
        const azList = (res as { data?: AZOption[] })?.data ?? [];
        if (!Array.isArray(azList)) {
          throw new Error("Failed to fetch availability zones");
        }
        return azList as AZOption[];
      },
      enabled: !!code,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    })),
  });

  const azByRegion = useMemo(() => {
    const map: Record<string, AZOption[]> = {};
    usedRegionCodes.forEach((code, index) => {
      const data = azQueryResults[index]?.data;
      if (Array.isArray(data)) {
        map[code] = data as AZOption[];
      }
    });
    return map;
  }, [azQueryResults, usedRegionCodes]);

  const azFetchingByRegion = useMemo(() => {
    const map: Record<string, boolean> = {};
    usedRegionCodes.forEach((code, i) => {
      map[code] = azQueryResults[i]?.isFetching ?? false;
    });
    return map;
  }, [azQueryResults, usedRegionCodes]);

  const getAzsForRegion = useCallback(
    (regionCode: string): AZOption[] => azByRegion[regionCode] || [],
    [azByRegion],
  );

  // Provider is derived from the chosen AZ (each AZ in cloud config is
  // bound to exactly one provider). Operators never type a provider
  // directly — the page hides it from the form and resolves it on save.
  const deriveProvider = useCallback(
    (regionCode: string, azCode: string): string => {
      const azs = getAzsForRegion(regionCode);
      if (azCode) {
        return azs.find((az) => az.code === azCode)?.provider || "";
      }
      const uniqueProviders = [...new Set(azs.map((az) => az.provider).filter(Boolean))];
      return uniqueProviders.length === 1 ? (uniqueProviders[0] as string) : "";
    },
    [getAzsForRegion],
  );

  const handleField = useCallback(
    (index: number, field: keyof CatalogEntry, value: string) => {
      setEntries((prev) => {
        const next = [...prev];
        const entry = { ...next[index], [field]: value, errors: { ...next[index].errors } };
        delete entry.errors[field as string];

        // Region change → reset AZ (it's region-scoped)
        if (field === "region") {
          entry.availability_zone = "";
        }

        next[index] = entry;
        return next;
      });
    },
    [],
  );

  const addRow = useCallback(() => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  }, []);

  const removeRow = useCallback((index: number) => {
    setEntries((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  // ─────────────────────────────────────────────
  //  CSV / Excel import + template download
  // ─────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const validProductTypes = useMemo(
    () => new Set(productTypes.map((t) => t.value)),
    [],
  );

  // Map a parsed sheet row → CatalogEntry. Returns either the entry or
  // an inline { row, message } error so the import can show a per-row
  // validation summary instead of dropping silently.
  const mapSheetRowToEntry = useCallback(
    (
      row: Record<string, unknown>,
      rowIndex: number,
    ): { entry?: CatalogEntry; error?: { row: number; message: string } } => {
      const lineLabel = rowIndex + 2; // header row counts as line 1

      const get = (...keys: string[]) => {
        for (const key of keys) {
          const value = row[key];
          if (value !== undefined && value !== null && String(value).trim() !== "") {
            return String(value).trim();
          }
        }
        return "";
      };

      const name = get("name", "product_name", "Name", "Product Name");
      const region = get("region", "region_code", "Region");
      const azCode = get("availability_zone", "availabilityZone", "Availability Zone", "AZ");
      const familyCode = get("family_code", "familyCode", "Family Code", "Family code");
      const rawType = get("productable_type", "type", "ProductType", "Product Type");
      const productableType = rawType
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
        .replace("compute_instance", "compute_instance");
      const rawPrice = get("price", "price_usd", "Price");

      if (!name) {
        return { error: { row: lineLabel, message: "Missing product name." } };
      }
      if (!region) {
        return { error: { row: lineLabel, message: "Missing region." } };
      }
      if (!regionLookup[region]) {
        return { error: { row: lineLabel, message: `Unknown region '${region}'.` } };
      }
      if (!validProductTypes.has(productableType)) {
        return {
          error: {
            row: lineLabel,
            message: `Invalid type '${rawType}'. Use one of: ${[...validProductTypes].join(", ")}.`,
          },
        };
      }
      const priceNumber = Number(rawPrice);
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        return { error: { row: lineLabel, message: "Price must be a positive number." } };
      }

      return {
        entry: {
          ...createEmptyEntry(),
          name,
          productable_type: productableType,
          region,
          availability_zone: azCode,
          family_code: familyCode,
          price: priceNumber.toString(),
        },
      };
    },
    [regionLookup, validProductTypes],
  );

  const triggerFilePick = () => fileInputRef.current?.click();

  const handleFilePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const isCsv = /\.csv$/i.test(file.name) || file.type === "text/csv";

      let rows: Array<Record<string, unknown>> = [];

      if (isCsv) {
        rows = await new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
          Papa.parse<Record<string, unknown>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => resolve(result.data),
            error: (err) => reject(err),
          });
        });
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = readWorkbook(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error("Workbook contains no sheets.");
        }
        const sheet = workbook.Sheets[firstSheetName];
        rows = xlsxUtils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      }

      if (!rows.length) {
        ToastUtils.error("The file has no rows.");
        return;
      }

      const parsed: CatalogEntry[] = [];
      const errors: Array<{ row: number; message: string }> = [];

      rows.forEach((row, idx) => {
        const result = mapSheetRowToEntry(row, idx);
        if (result.entry) parsed.push(result.entry);
        if (result.error) errors.push(result.error);
      });

      if (parsed.length) {
        // Replace empty rows with imported ones; append otherwise.
        setEntries((prev) => {
          const allEmpty = prev.every(
            (e) => !e.name && !e.region && !e.productable_type && !e.price,
          );
          return allEmpty ? parsed : [...prev, ...parsed];
        });
      }

      if (errors.length) {
        const preview = errors
          .slice(0, 3)
          .map((e) => `Row ${e.row}: ${e.message}`)
          .join("\n");
        ToastUtils.error(
          `Imported ${parsed.length} row${parsed.length === 1 ? "" : "s"}, ${errors.length} skipped.\n${preview}${errors.length > 3 ? "\n…" : ""}`,
        );
      } else {
        ToastUtils.success(
          `Imported ${parsed.length} row${parsed.length === 1 ? "" : "s"} from ${file.name}.`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import file.";
      ToastUtils.error(message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = useCallback(() => {
    // Two example rows so operators see a Compute (per-AZ) row alongside an
    // Object Storage row — covers the two most common patterns. Region
    // codes pulled from the live region list so the template is valid out
    // of the box for whatever environment the admin is on.
    const sampleRegion = regions[0]?.code || "uni-ng";
    const csv = Papa.unparse([
      {
        name: "Object Storage (per GiB)",
        region: sampleRegion,
        availability_zone: "uni-ng-lag-az1",
        productable_type: OBJECT_STORAGE_TYPE,
        family_code: "object_storage.standard",
        price: 40.6,
      },
      {
        name: "z.large (4 vCPU / 16 GB)",
        region: sampleRegion,
        availability_zone: "uni-ng-lag-az1",
        productable_type: "compute_instance",
        family_code: "compute.4vcpu.16gb",
        price: 134848.32,
      },
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalog-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [regions]);

  const validate = useCallback((): boolean => {
    let ok = true;
    setEntries((prev) =>
      prev.map((entry) => {
        const errors: Record<string, string> = {};

        if (!entry.name.trim()) {
          errors.name = "Required";
          ok = false;
        }
        if (!entry.productable_type) {
          errors.productable_type = "Required";
          ok = false;
        }
        if (!entry.region) {
          errors.region = "Required";
          ok = false;
        }

        const azs = getAzsForRegion(entry.region);
        if (azs.length > 1 && !entry.availability_zone) {
          errors.availability_zone = "Required";
          ok = false;
        }
        if (!deriveProvider(entry.region, entry.availability_zone) && azs.length > 0) {
          errors.availability_zone = "Pick a valid AZ";
          ok = false;
        }

        if (!entry.price || Number(entry.price) <= 0) {
          errors.price = "Must be > 0";
          ok = false;
        }

        return { ...entry, errors };
      }),
    );
    return ok;
  }, [deriveProvider, getAzsForRegion]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    // The server endpoint accepts a bulk shape `{products: [...]}` and
    // creates Product + ProductPricing for each row in one round-trip.
    // Country and currency are derived from the chosen region — operators
    // don't pick them separately. Family code is the optional cross-provider
    // grouping key (e.g. "compute.small.4vcpu.16gb").
    const products = entries.map((entry) => {
      const provider = deriveProvider(entry.region, entry.availability_zone);
      const region = regionLookup[entry.region];
      const familyCode = entry.family_code.trim();
      const payload: Record<string, unknown> = {
        name: entry.name.trim(),
        productable_type: entry.productable_type,
        productable_id: 0,
        provider,
        region: entry.region,
        availability_zone: entry.availability_zone || undefined,
        country_code: region?.country_code || undefined,
        currency_code: resolveCurrencyForRegion(entry.region),
        price: Number(entry.price),
      };
      if (familyCode) payload.family_code = familyCode;
      return payload;
    });

    try {
      await createProducts({ products } as unknown as Record<string, unknown>);
      ToastUtils.success(`Created ${products.length} catalog ${products.length === 1 ? "entry" : "entries"}.`);
      navigate("/admin-dashboard/products");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      ToastUtils.error(
        err?.response?.data?.message || err?.message || "Failed to create catalog entries.",
      );
    }
  };

  const isBusy = isCreating || isAuthLoading;

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
  const errorClass = "border-red-400 focus:border-red-500 focus:ring-red-100";

  return (
    <AdminPageShell contentClassName="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-slate-500">
            <button
              type="button"
              onClick={() => navigate("/admin-dashboard/products")}
              className="hover:text-slate-700"
            >
              Catalog
            </button>{" "}
            <span className="px-1">/</span>{" "}
            <span className="text-slate-700">Add</span>
          </nav>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Add catalog entries</h1>
          <p className="text-sm text-slate-500">
            Create a new product and publish its price for a region in one step. Each row becomes
            one SKU + one pricing entry — type the name, pick where it sells, set the price.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModernButton
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            leftIcon={<Download className="h-4 w-4" />}
            disabled={isCreating}
          >
            Template
          </ModernButton>
          <ModernButton
            type="button"
            variant="outline"
            onClick={triggerFilePick}
            leftIcon={
              isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )
            }
            disabled={isImporting || isCreating}
          >
            {isImporting ? "Importing…" : "Import CSV/Excel"}
          </ModernButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFilePicked}
            className="hidden"
          />
          <ModernButton
            variant="outline"
            onClick={() => navigate("/admin-dashboard/products")}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to catalog
          </ModernButton>
        </div>
      </div>

      <ModernCard padding="default" className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header row */}
          <div className="hidden grid-cols-[36px_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_56px] items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-500 lg:grid">
            <div>#</div>
            <div>Product name</div>
            <div>Region</div>
            <div>Availability Zone</div>
            <div>Type</div>
            <div>
              Family code{" "}
              <span className="ml-1 text-[10px] font-normal text-slate-400">optional</span>
            </div>
            <div className="text-right">Price</div>
            <div></div>
          </div>

          <div className="space-y-3">
            {entries.map((entry, index) => {
              const azs = getAzsForRegion(entry.region);
              const isAzFetching = azFetchingByRegion[entry.region] || false;
              const requiresAz = azs.length > 1;
              // Currency follows the chosen region's country (Lagos → NGN,
              // US → USD). Operators don't pick currency separately.
              const currency = entry.region ? resolveCurrencyForRegion(entry.region) : "—";

              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[36px_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_56px]"
                >
                  <div className="text-sm font-medium text-slate-500 lg:pt-2">{index + 1}</div>

                  {/* Name (free text — creates a new SKU) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 lg:hidden">
                      Product name
                    </label>
                    <input
                      type="text"
                      value={entry.name}
                      onChange={(e) => handleField(index, "name", e.target.value)}
                      placeholder="e.g. Object Storage (per GiB)"
                      className={`${inputClass} ${entry.errors.name ? errorClass : ""}`}
                      disabled={isBusy}
                    />
                    {entry.errors.name && (
                      <p className="mt-1 text-xs text-red-600">{entry.errors.name}</p>
                    )}
                  </div>

                  {/* Region */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 lg:hidden">
                      Region
                    </label>
                    <select
                      value={entry.region}
                      onChange={(e) => handleField(index, "region", e.target.value)}
                      className={`${inputClass} ${entry.errors.region ? errorClass : ""}`}
                      disabled={isBusy || isRegionsFetching}
                    >
                      <option value="">Select region</option>
                      {regions.map((region) => (
                        <option key={region.code} value={region.code}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                    {entry.errors.region && (
                      <p className="mt-1 text-xs text-red-600">{entry.errors.region}</p>
                    )}
                  </div>

                  {/* AZ */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 lg:hidden">
                      Availability Zone
                    </label>
                    <select
                      value={entry.availability_zone}
                      onChange={(e) => handleField(index, "availability_zone", e.target.value)}
                      className={`${inputClass} ${
                        entry.errors.availability_zone ? errorClass : ""
                      }`}
                      disabled={isBusy || !entry.region || isAzFetching}
                    >
                      <option value="">
                        {!entry.region
                          ? "Pick a region first"
                          : isAzFetching
                            ? "Loading…"
                            : requiresAz
                              ? "Select AZ"
                              : "All AZs"}
                      </option>
                      {azs.map((az) => (
                        <option key={az.code} value={az.code}>
                          {az.name || az.code}
                        </option>
                      ))}
                    </select>
                    {entry.errors.availability_zone && (
                      <p className="mt-1 text-xs text-red-600">{entry.errors.availability_zone}</p>
                    )}
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 lg:hidden">
                      Type
                    </label>
                    <select
                      value={entry.productable_type}
                      onChange={(e) => handleField(index, "productable_type", e.target.value)}
                      className={`${inputClass} ${
                        entry.errors.productable_type ? errorClass : ""
                      }`}
                      disabled={isBusy}
                    >
                      <option value="">Select type</option>
                      {productTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                          {type.value === OBJECT_STORAGE_TYPE ? " (per GiB)" : ""}
                        </option>
                      ))}
                    </select>
                    {entry.errors.productable_type && (
                      <p className="mt-1 text-xs text-red-600">{entry.errors.productable_type}</p>
                    )}
                  </div>

                  {/* Family code (optional cross-provider grouping key) */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 lg:hidden">
                      Family code (optional)
                    </label>
                    <input
                      type="text"
                      value={entry.family_code}
                      onChange={(e) => handleField(index, "family_code", e.target.value)}
                      placeholder="e.g. compute.4vcpu.16gb"
                      className={`${inputClass} ${entry.errors.family_code ? errorClass : ""}`}
                      disabled={isBusy}
                    />
                    {entry.errors.family_code && (
                      <p className="mt-1 text-xs text-red-600">{entry.errors.family_code}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 lg:hidden">
                      Price
                    </label>
                    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100">
                      <span className="flex items-center bg-slate-100 px-2 text-xs font-medium text-slate-600">
                        {currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={entry.price}
                        onChange={(e) => handleField(index, "price", e.target.value)}
                        placeholder="0.00"
                        className="w-full border-none bg-white px-2 py-2 text-right text-sm focus:outline-none"
                        disabled={isBusy}
                      />
                    </div>
                    {entry.errors.price && (
                      <p className="mt-1 text-xs text-red-600">{entry.errors.price}</p>
                    )}
                  </div>

                  {/* Remove */}
                  <div className="flex justify-end lg:pt-1">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={isBusy || entries.length <= 1}
                      className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <ModernButton
              type="button"
              variant="outline"
              onClick={addRow}
              disabled={isBusy}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add another row
            </ModernButton>

            <div className="flex items-center gap-3">
              <ModernButton
                type="button"
                variant="outline"
                onClick={() => navigate("/admin-dashboard/products")}
                disabled={isBusy}
              >
                Cancel
              </ModernButton>
              <ModernButton
                type="submit"
                variant="primary"
                disabled={isBusy}
                leftIcon={isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {isBusy
                  ? "Saving…"
                  : `Save ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`}
              </ModernButton>
            </div>
          </div>
        </form>
      </ModernCard>

      <p className="text-xs text-slate-500">
        Tip: rows that share a region & AZ are grouped server-side, so adding multiple SKUs in
        one submission is safe and idempotent.
      </p>
    </AdminPageShell>
  );
};

export default AdminCatalogCreate;
