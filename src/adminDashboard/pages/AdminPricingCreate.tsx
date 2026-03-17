import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import ModernTable from "@/shared/components/ui/ModernTable";

import {
  useFetchRegions,
} from "@/hooks/adminHooks/regionHooks";
import { useFetchProducts } from "@/hooks/adminHooks/adminProductHooks";
import { useCreateProductPricing } from "@/hooks/adminHooks/adminProductPricingHooks";
import { productTypes } from "@/utils/productImportUtils";
import ToastUtils from "@/utils/toastUtil";
import useAuthRedirect from "@/utils/adminAuthRedirect";
import { getCurrencySymbol } from "@/utils/resource";
import silentApi from "../../index/admin/silent";

interface PricingEntry {
  region: string;
  availability_zone: string;
  provider: string;
  category: string;
  product_id: string;
  price: string;
  errors: Record<string, string>;
}

interface RegionOption {
  code: string;
  name: string;
  country_code?: string;
  [key: string]: unknown;
}

interface AZOption {
  id: number | string;
  code: string;
  name?: string;
  provider: string;
  [key: string]: unknown;
}

interface ProductOption {
  id: number | string;
  name: string;
  productable_type: string;
  [key: string]: unknown;
}

const PROVIDER_CURRENCIES: Record<string, string> = {
  zadara: "USD",
  nobus: "NGN",
};

const createEmptyEntry = (): PricingEntry => ({
  region: "",
  availability_zone: "",
  provider: "",
  category: "",
  product_id: "",
  price: "",
  errors: {},
});

const AdminPricingCreate = () => {
  const navigate = useNavigate();
  const { isLoading: isAuthLoading } = useAuthRedirect();

  const [entries, setEntries] = useState<PricingEntry[]>([createEmptyEntry()]);

  const { isFetching: isRegionsFetching, data: regionsData } =
    useFetchRegions();
  const { mutate: createProductPricing, isPending: isCreating } =
    useCreateProductPricing();

  const regions = useMemo<RegionOption[]>(() => {
    if (!Array.isArray(regionsData)) return [];
    return (regionsData as unknown as RegionOption[]).filter(
      (r) => r.name && r.is_active !== false
    );
  }, [regionsData]);

  const regionLookup = useMemo(() => {
    return regions.reduce((acc: Record<string, RegionOption>, region) => {
      acc[region.code] = region;
      return acc;
    }, {});
  }, [regions]);

  // Collect unique region codes used by entries for AZ fetching
  const usedRegionCodes = useMemo(
    () => [...new Set(entries.map((e) => e.region).filter(Boolean))],
    [entries]
  );

  // Fetch AZs for all used regions using useQueries (stable hook count)
  const azQueryResults = useQueries({
    queries: usedRegionCodes.map((code) => ({
      queryKey: ["availability-zones", code],
      queryFn: async () => {
        const res = await silentApi("GET", `/regions/${code}/availability-zones`);
        if (!res?.data) throw new Error("Failed to fetch availability zones");
        return { code, data: res.data as AZOption[] };
      },
      enabled: !!code,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    })),
  });

  const azByRegion = useMemo(() => {
    const map: Record<string, AZOption[]> = {};
    azQueryResults.forEach((result) => {
      if (result.data) {
        map[result.data.code] = result.data.data;
      }
    });
    return map;
  }, [azQueryResults]);

  const azFetchingByRegion = useMemo(() => {
    const map: Record<string, boolean> = {};
    usedRegionCodes.forEach((code, i) => {
      map[code] = azQueryResults[i]?.isFetching ?? false;
    });
    return map;
  }, [azQueryResults, usedRegionCodes]);

  // Fetch all products
  const { isFetching: isProductsFetching, data: productsData } =
    useFetchProducts();

  const allProducts = useMemo<ProductOption[]>(() => {
    if (!Array.isArray(productsData)) return [];
    return productsData as unknown as ProductOption[];
  }, [productsData]);

  const isSubmitting = isCreating || isAuthLoading;

  const deriveProvider = useCallback(
    (regionCode: string, azCode: string): string => {
      const azs = azByRegion[regionCode] || [];
      if (azCode) {
        const az = azs.find((a) => String(a.id) === azCode || a.code === azCode);
        return az?.provider || "";
      }
      return azs.length > 0 ? azs[0].provider : "";
    },
    [azByRegion]
  );

  const handleFieldChange = useCallback(
    (index: number, field: keyof PricingEntry, value: string) => {
      setEntries((prev) => {
        const updated = [...prev];
        const entry = { ...updated[index], [field]: value, errors: { ...updated[index].errors } };

        // Clear error for the changed field
        delete entry.errors[field];

        // When region changes, reset AZ, provider, and potentially product
        if (field === "region") {
          entry.availability_zone = "";
          entry.provider = "";
        }

        // When AZ changes, update provider
        if (field === "availability_zone" || field === "region") {
          const regionCode = field === "region" ? value : entry.region;
          const azCode =
            field === "availability_zone" ? value : entry.availability_zone;
          entry.provider = deriveProvider(regionCode, azCode);
        }

        // When category changes, reset product
        if (field === "category") {
          entry.product_id = "";
        }

        updated[index] = entry;
        return updated;
      });
    },
    [deriveProvider]
  );

  // Update provider when AZ data loads
  // This is handled reactively in the render via deriveProvider

  const addEntry = useCallback(() => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  }, []);

  const removeEntry = useCallback((index: number) => {
    setEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const validateEntries = useCallback((): boolean => {
    let isValid = true;
    setEntries((prev) =>
      prev.map((entry) => {
        const errors: Record<string, string> = {};
        if (!entry.region) {
          errors.region = "Region is required";
          isValid = false;
        }
        if (!entry.category) {
          errors.category = "Category is required";
          isValid = false;
        }
        if (!entry.product_id) {
          errors.product_id = "Product is required";
          isValid = false;
        }
        if (!entry.price || Number(entry.price) <= 0) {
          errors.price = "Price must be greater than 0";
          isValid = false;
        }
        return { ...entry, errors };
      })
    );
    return isValid;
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateEntries()) {
      return;
    }

    // Group entries by region + az + provider
    const groups: Record<string, PricingEntry[]> = {};
    entries.forEach((entry) => {
      const provider = deriveProvider(entry.region, entry.availability_zone);
      const key = `${entry.region}|${entry.availability_zone}|${provider}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...entry, provider });
    });

    const groupKeys = Object.keys(groups);
    let completed = 0;
    let hasError = false;

    groupKeys.forEach((key) => {
      const groupEntries = groups[key];
      const first = groupEntries[0];
      const provider = first.provider;
      const region = regionLookup[first.region];
      const countryCode = region?.country_code || "";
      const currencyCode = PROVIDER_CURRENCIES[provider] ?? "USD";

      const payload = {
        provider,
        country_code: countryCode,
        region: first.region,
        availability_zone: first.availability_zone || undefined,
        currency_code: currencyCode,
        pricings: groupEntries.map((entry) => ({
          product_id: Number(entry.product_id),
          price_usd: Number(entry.price),
        })),
      };

      createProductPricing(payload, {
        onSuccess: () => {
          completed++;
          if (completed === groupKeys.length && !hasError) {
            ToastUtils.success("Pricing entries added successfully!");
            navigate("/admin-dashboard/pricing");
          }
        },
        onError: (error: unknown) => {
          hasError = true;
          const err = error as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          const message =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to add pricing.";
          ToastUtils.error(message);
        },
      });
    });
  };

  const columns = useMemo(
    () => [
      {
        key: "index",
        header: "#",
        render: (_: unknown, __: unknown, index: number) => (
          <span className="text-gray-500">{index + 1}</span>
        ),
        className: "w-12",
      },
      {
        key: "region",
        header: "Region",
        render: (_: unknown, entry: PricingEntry, index: number) => (
          <div>
            <select
              value={entry.region}
              onChange={(e) => handleFieldChange(index, "region", e.target.value)}
              className={`w-full input-field ${entry.errors["region"] ? "border-red-500" : "border-gray-300"}`}
              disabled={isSubmitting || isRegionsFetching}
            >
              <option value="">
                {isRegionsFetching ? "Loading..." : "Select region"}
              </option>
              {regions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
            {entry.errors["region"] && (
              <p className="text-red-500 text-xs mt-1">
                {entry.errors["region"]}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "availability_zone",
        header: "Availability Zone",
        render: (_: unknown, entry: PricingEntry, index: number) => {
          const azs = azByRegion[entry.region] || [];
          const isAzFetching = azFetchingByRegion[entry.region] || false;
          return (
            <div>
              <select
                value={entry.availability_zone}
                onChange={(e) =>
                  handleFieldChange(index, "availability_zone", e.target.value)
                }
                className="w-full input-field border-gray-300"
                disabled={isSubmitting || !entry.region || isAzFetching}
              >
                <option value="">
                  {!entry.region
                    ? "Select region first"
                    : isAzFetching
                      ? "Loading..."
                      : "All AZs"}
                </option>
                {azs.map((az) => (
                  <option key={az.id ?? az.code} value={String(az.id ?? az.code)}>
                    {az.name || az.code} ({az.provider})
                  </option>
                ))}
              </select>
            </div>
          );
        },
      },
      {
        key: "category",
        header: "Category",
        render: (_: unknown, entry: PricingEntry, index: number) => (
          <div>
            <select
              value={entry.category}
              onChange={(e) =>
                handleFieldChange(index, "category", e.target.value)
              }
              className={`w-full input-field ${entry.errors["category"] ? "border-red-500" : "border-gray-300"}`}
              disabled={isSubmitting}
            >
              <option value="">Select category</option>
              {productTypes.map((type: { value: string; label: string }) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {entry.errors["category"] && (
              <p className="text-red-500 text-xs mt-1">
                {entry.errors["category"]}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "product",
        header: "Product",
        render: (_: unknown, entry: PricingEntry, index: number) => {
          const filteredProducts = allProducts.filter(
            (p) => p.productable_type === entry.category
          );
          const isDisabled =
            isSubmitting || isProductsFetching || !entry.category;
          const placeholder = !entry.category
            ? "Select category first"
            : isProductsFetching
              ? "Loading..."
              : "Select product";

          return (
            <div>
              <select
                value={entry.product_id}
                onChange={(e) =>
                  handleFieldChange(index, "product_id", e.target.value)
                }
                className={`w-full input-field ${entry.errors["product_id"] ? "border-red-500" : "border-gray-300"}`}
                disabled={isDisabled}
              >
                <option value="">{placeholder}</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={String(product.id)}>
                    {product.name}
                  </option>
                ))}
              </select>
              {entry.errors["product_id"] && (
                <p className="text-red-500 text-xs mt-1">
                  {entry.errors["product_id"]}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: "price",
        header: "Price",
        render: (_: unknown, entry: PricingEntry, index: number) => {
          const provider = deriveProvider(
            entry.region,
            entry.availability_zone
          );
          const currency = PROVIDER_CURRENCIES[provider] ?? "USD";
          const symbol = getCurrencySymbol(currency);

          return (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Price ({symbol} {currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={entry.price}
                onChange={(e) =>
                  handleFieldChange(index, "price", e.target.value)
                }
                placeholder="0.00"
                className={`w-full input-field ${entry.errors["price"] ? "border-red-500" : "border-gray-300"}`}
                disabled={isSubmitting}
              />
              {entry.errors["price"] && (
                <p className="text-red-500 text-xs mt-1">
                  {entry.errors["price"]}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (_: unknown, __: unknown, index: number) => (
          <div className="text-right">
            {entries.length > 1 && (
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => removeEntry(index)}
                type="button"
                isDisabled={isSubmitting}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </ModernButton>
            )}
          </div>
        ),
      },
    ],
    [
      entries,
      isSubmitting,
      isRegionsFetching,
      isProductsFetching,
      regions,
      azByRegion,
      azFetchingByRegion,
      allProducts,
      handleFieldChange,
      removeEntry,
      deriveProvider,
    ]
  );

  if (isAuthLoading) {
    return null;
  }

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title="Add Pricing"
        description="Add pricing entries for products across regions and availability zones."
        actions={
          <ModernButton
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => navigate("/admin-dashboard/pricing")}
            isDisabled={isSubmitting}
          >
            <ArrowLeft size={16} />
            Back to Pricing
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <ModernCard>
            <ModernTable
              data={entries}
              columns={columns as any}
              className="hidden md:block"
              searchable={false}
              paginated={false}
            />

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              <p className="text-sm text-gray-500 italic">
                Mobile view not fully optimized. Please use desktop.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Select a region to auto-detect the provider. Choose a category
                to filter available products.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                <ModernButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={addEntry}
                  isDisabled={isSubmitting}
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </ModernButton>
              </div>
            </div>
          </ModernCard>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-6 py-2 rounded-lg text-white font-medium transition-all duration-200
                ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30"
                }
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Save Pricing"
              )}
            </button>
          </div>
        </form>
      </AdminPageShell>
    </>
  );
};

export default AdminPricingCreate;
