import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  HardDrive,
  DollarSign,
  Layers,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useFetchProducts } from "../../../hooks/adminHooks/adminProductHooks";
import { useFetchProductPricing } from "../../../hooks/adminHooks/adminproductPricingHook";
import EditObjectStorageTierModal from "./objectStorageSubs/editTier";
import DeleteObjectStorageTierModal from "./objectStorageSubs/deleteTier";
import ModernCard from "../../components/ModernCard";
import ModernButton from "../../components/ModernButton";
import IconBadge from "../../components/IconBadge";

const parseQuota = (product) => {
  if (!product) return null;

  const quotaFromMeta = product.object_storage?.quota_gb ?? product.productable?.quota_gb;
  if (quotaFromMeta !== undefined && quotaFromMeta !== null) {
    const numeric = Number(quotaFromMeta);
    if (!Number.isNaN(numeric) && numeric > 0) {
      return numeric;
    }
  }

  if (product?.provider_resource_id) {
    const suffixMatch = product.provider_resource_id.match(/-(\d+)-gib$/i);
    if (suffixMatch) {
      return Number(suffixMatch[1]);
    }
  }

  const match = (product?.name || "").match(/(\d+)\s*gi?b/i);
  if (match) {
    return Number(match[1]);
  }

  return null;
};

const formatNumber = (value, suffix = "") =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${value.toLocaleString()}${suffix}`
    : value
    ? `${Number(value).toLocaleString()}${suffix}`
    : "—";

const makeKey = (region, product) => {
  const quota = parseQuota(product);
  const fallback = product?.productable_id ?? 0;
  const fallbackNumeric = Number(fallback) || 0;
  const resolved = quota ?? fallbackNumeric;
  return `${(region || "").toLowerCase()}::${resolved}`;
};

const ObjectStorageInventory = ({ selectedRegion, onMetricsChange }) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [removedKeys, setRemovedKeys] = useState([]);
  const [priceOverrides, setPriceOverrides] = useState({});

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const {
    data: products = [],
    isFetching: isProductsFetching,
  } = useFetchProducts("", "", {
    productType: "object_storage_configuration",
    enabled: true,
  });

  const {
    data: pricingPayload,
    isFetching: isPricingFetching,
  } = useFetchProductPricing(
    {
      provider: "zadara",
      productType: "object_storage_configuration",
      perPage: 1000,
      page: 1,
    },
    { keepPreviousData: true }
  );

  const pricingMap = useMemo(() => {
    const entries = pricingPayload?.data || [];
    return entries.reduce((acc, item) => {
      const productMeta = item.product || {};
      const region = productMeta.region || item.region;
      const key = makeKey(region, {
        ...productMeta,
        productable_id: item.productable_id,
        provider_resource_id: productMeta.provider_resource_id || item.product_name,
      });
      acc[key] = item;
      return acc;
    }, {});
  }, [pricingPayload]);

  const removalSet = useMemo(() => new Set(removedKeys), [removedKeys]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((product) => {
      const key = makeKey(product.region, product);
      return !removalSet.has(key);
    });
  }, [products, removalSet]);

  useEffect(() => {
    if (!products) return;
    const productKeys = new Set(
      products.map((product) => makeKey(product.region, product))
    );
    setRemovedKeys((prev) => {
      if (!prev.some((key) => !productKeys.has(key))) {
        return prev;
      }
      return prev.filter((key) => productKeys.has(key));
    });
  }, [products]);

  useEffect(() => {
    setPriceOverrides((prev) => {
      if (!prev || Object.keys(prev).length === 0) {
        return prev;
      }
      let mutated = false;
      const next = { ...prev };
      Object.entries(prev).forEach(([key, override]) => {
        const pricing = pricingMap[key];
        if (pricing && Number(pricing.price_usd) === Number(override.price_usd)) {
          delete next[key];
          mutated = true;
        }
      });
      return mutated ? next : prev;
    });
  }, [pricingMap]);

  const enrichedProducts = useMemo(() => {
    return filteredProducts.map((product) => {
      const key = makeKey(product.region, product);
      const pricing = pricingMap[key] || null;
      const override = priceOverrides[key];
      const mergedPricing = override
        ? {
            ...(pricing || override),
            price_usd: override.price_usd,
          }
        : pricing;
      return {
        ...product,
        pricing: mergedPricing,
      };
    });
  }, [filteredProducts, pricingMap, priceOverrides]);

  const isFetching = isProductsFetching || isPricingFetching;

  const filteredByRegion = useMemo(() => {
    if (!selectedRegion) return enrichedProducts;
    return enrichedProducts.filter(
      (item) => (item.region || "").toLowerCase() === selectedRegion.toLowerCase()
    );
  }, [enrichedProducts, selectedRegion]);

  const searchedRows = useMemo(() => {
    if (!search.trim()) return filteredByRegion;
    const query = search.toLowerCase();
    return filteredByRegion.filter((item) => {
      const name = (item.name || item.pricing?.product_name || "").toLowerCase();
      const identifier = (item.provider_resource_id || "").toLowerCase();
      const pricingName = (item.pricing?.product_name || "").toLowerCase();
      return name.includes(query) || identifier.includes(query) || pricingName.includes(query);
    });
  }, [filteredByRegion, search]);

  const total = searchedRows.length;
  const totalQuota = useMemo(() => {
    return searchedRows.reduce((acc, item) => {
      const quota = parseQuota(item);
      return acc + (quota || 0);
    }, 0);
  }, [searchedRows]);

  const baseRate = useMemo(() => {
    const baseRow =
      searchedRows.find((row) => parseQuota(row) === 1) ||
      filteredByRegion.find((row) => parseQuota(row) === 1);
    if (!baseRow?.pricing?.price_usd) return null;
    return Number(baseRow.pricing.price_usd);
  }, [filteredByRegion, searchedRows]);

  useEffect(() => {
    onMetricsChange?.({
      metrics: [
        {
          label: "Object storage tiers",
          value: total,
          description: "Quota tiers available",
          icon: <HardDrive className="h-5 w-5" />,
        },
        {
          label: "Total quota",
          value: formatNumber(totalQuota, " GiB"),
          description: "Across visible tiers",
          icon: <Layers className="h-5 w-5" />,
        },
        {
          label: "Base rate",
          value: baseRate ? `$${baseRate.toFixed(4)}/GiB` : "—",
          description: "Price per GiB",
          icon: <DollarSign className="h-5 w-5" />,
        },
      ],
      description:
        "Pricing grows in 1 GiB increments—once usage reaches a quota tier, the listed amount applies.",
    });
  }, [total, totalQuota, baseRate, onMetricsChange]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return searchedRows.slice(start, start + perPage);
  }, [searchedRows, page, perPage]);

  const openEdit = (row) => {
    setIsDeleteOpen(false);
    setSelectedTier({
      product: row,
      pricing: row.pricing,
      quota: parseQuota(row),
    });
    setIsEditOpen(true);
  };

  const openDelete = (row) => {
    setIsEditOpen(false);
    setSelectedTier({
      product: row,
      pricing: row.pricing,
      quota: parseQuota(row),
    });
    setIsDeleteOpen(true);
  };

  const closeModals = () => {
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setSelectedTier(null);
  };

  const handleTierDeleted = (tier) => {
    if (!tier?.product) return;
    const key = makeKey(tier.product.region, tier.product);
    setRemovedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setPriceOverrides((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    const productsKey = ["productsadmin", "none", "none", "object_storage_configuration"];
    queryClient.setQueryData(productsKey, (existing) => {
      if (!Array.isArray(existing)) {
        return existing;
      }
      return existing.filter((product) => {
        const productKey = makeKey(product.region, product);
        return productKey !== key;
      });
    });

    const pricingKey = ["product-pricing-admin", "", "zadara", 1, 1000, "", "object_storage_configuration"];
    queryClient.setQueryData(pricingKey, (payload) => {
      if (!payload || !Array.isArray(payload.data)) {
        return payload;
      }
      return {
        ...payload,
        data: payload.data.filter((pricing) => {
          const productMeta = pricing.product || {};
          const productKey = makeKey(pricing.region, {
            ...productMeta,
            productable_id: pricing.productable_id,
            provider_resource_id: productMeta.provider_resource_id || pricing.product_name,
          });
          return productKey !== key;
        }),
        meta: payload.meta,
      };
    });
  };

  const handleTierUpdated = (tier, totalPrice) => {
    if (!tier?.product || totalPrice === undefined || totalPrice === null) return;
    const key = makeKey(tier.product.region, tier.product);
    setPriceOverrides((prev) => ({
      ...prev,
      [key]: {
        ...(tier.pricing || {
          provider: tier.product.provider,
          region: tier.product.region,
          product_id: tier.product.id,
          productable_id: tier.product.productable_id,
          productable_type: tier.product.productable_type,
        }),
        price_usd: Number(totalPrice),
      },
    }));

    const pricingKey = ["product-pricing-admin", "", "zadara", 1, 1000, "", "object_storage_configuration"];
    queryClient.setQueryData(pricingKey, (payload) => {
      if (!payload || !Array.isArray(payload.data)) {
        return payload;
      }
      const updated = payload.data.map((pricing) => {
        const productMeta = pricing.product || {};
        const productKey = makeKey(pricing.region, {
          ...productMeta,
          productable_id: pricing.productable_id,
          provider_resource_id: productMeta.provider_resource_id || pricing.product_name,
        });
        if (productKey === key) {
          return {
            ...pricing,
            price_usd: Number(totalPrice),
          };
        }
        return pricing;
      });
      return {
        ...payload,
        data: updated,
        meta: payload.meta,
      };
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startIndex = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = Math.min(total, page * perPage);

  return (
    <div className="space-y-6">
      <ModernCard padding="lg" className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Object storage tiers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review S3-compatible quotas across regions and adjust pricing to keep provisioning aligned with provider costs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              Region: {selectedRegion ? selectedRegion.toUpperCase() : "All regions"}
            </span>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
            >
              Reset view
            </ModernButton>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),auto] md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search SKU or provider ID"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-300 focus:bg-white focus:shadow-sm"
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Rows per page
            </label>
            <select
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none"
            >
              {[10, 20, 50].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ModernCard>

      <ModernCard padding="none" className="overflow-hidden">
        {isFetching ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            <p className="text-sm text-slate-500">Loading object storage tiers…</p>
          </div>
        ) : paginatedRows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Region
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quota (GiB)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Per GiB (USD)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total (USD)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRows.map((row) => {
                    const quotaValue = formatNumber(parseQuota(row));
                    const totalPrice = row.pricing?.price_usd
                      ? Number(row.pricing.price_usd).toFixed(4)
                      : null;
                    const perGiB = (() => {
                      const quota = parseQuota(row);
                      if (!quota || !row.pricing?.price_usd) return null;
                      return (Number(row.pricing.price_usd) / quota).toFixed(4);
                    })();

                    return (
                      <tr key={`${row.id}-${row.provider_resource_id}`} className="transition hover:bg-slate-50/70">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <IconBadge iconKey="business.companyType" tone="indigo" size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                {row.name || row.pricing?.product_name || "Unnamed tier"}
                              </p>
                              <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">
                                {row.provider_resource_id || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {row.region || "Global"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                          {quotaValue}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-700">
                          {perGiB ? `$${perGiB}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                          {totalPrice ? `$${totalPrice}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <ModernButton
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => openEdit(row)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </ModernButton>
                            <ModernButton
                              variant="danger"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => openDelete(row)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </ModernButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
              <span className="text-xs text-slate-500">
                Showing {startIndex}-{endIndex} of {total}
              </span>
              <div className="flex items-center gap-2">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="gap-2 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </ModernButton>
                <span className="text-xs font-medium text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="gap-2 text-xs"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </ModernButton>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
              <HardDrive className="h-5 w-5" />
            </span>
            <h3 className="text-base font-semibold text-slate-900">
              No object storage SKUs
            </h3>
            <p className="max-w-sm text-sm text-slate-500">
              Seed object storage quotas to expose them to provisioning and tenant pricing workflows.
            </p>
          </div>
        )}
      </ModernCard>

      <EditObjectStorageTierModal
        isOpen={isEditOpen}
        onClose={closeModals}
        tier={selectedTier}
        onUpdated={(updatedTier, totalPrice) => {
          handleTierUpdated(updatedTier || selectedTier, totalPrice);
        }}
      />
      <DeleteObjectStorageTierModal
        isOpen={isDeleteOpen}
        onClose={closeModals}
        tier={selectedTier}
        onDeleted={(deletedTier) => {
          handleTierDeleted(deletedTier || selectedTier);
        }}
      />
    </div>
  );
};

export default ObjectStorageInventory;
