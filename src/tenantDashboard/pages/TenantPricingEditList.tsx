import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cpu, Database, Globe, HardDrive, Cable, Wifi, Tag } from "lucide-react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import {
  ModernButton,
  ModernInput,
  ModernSelect,
  ModernTable,
  type Column,
} from "@/shared/components/ui";
import { useFetchTenantRegions } from "@/hooks/tenantHooks/regionHooks";
import { useFetchProductPricing } from "@/hooks/resource";
import {
  useDeleteTenantPricingOverride,
  type TenantPricingCreatePayload,
  type TenantPricingOverride,
  useFetchTenantPricingOverrides,
  useUpsertTenantPricingOverride,
  useUpdateTenantPricingOverride,
} from "@/hooks/tenantHooks/tenantPricingHooks";
import { matchesProductType, normalizeProductType } from "@/utils/productTypeUtils";
import ToastUtils from "@/utils/toastUtil";
import useTenantAuthStore from "@/stores/tenantAuthStore";
import { resolveCountryCodeFromEntity } from "@/shared/utils/countryUtils";

interface TenantRegion {
  code: string;
  name: string;
  provider?: string;
  country_code?: string | null;
  [key: string]: unknown;
}

interface PricingCatalogProduct {
  productable_id?: string | number;
  productable_type?: string;
  name?: string;
  productable_name?: string;
  productable_label?: string;
  [key: string]: unknown;
}

interface PricingCatalogRow {
  id?: string | number | null;
  product?: PricingCatalogProduct | null;
  pricing?: {
    admin?: {
      price_usd?: number | null;
      scope?: string | null;
    };
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

const extractRowsFromPayload = <TRow,>(payload: unknown): TRow[] => {
  if (Array.isArray(payload)) return payload as TRow[];
  if (payload && typeof payload === "object") {
    const rows = (payload as { data?: unknown }).data;
    if (Array.isArray(rows)) return rows as TRow[];
  }
  return [];
};

const PRICING_TABS = [
  {
    id: "compute",
    name: "Compute",
    caption: "Instance classes",
    productType: "compute_instance",
    icon: Cpu,
  },
  {
    id: "os-images",
    name: "OS Images",
    caption: "Templates",
    productType: "os_image",
    icon: HardDrive,
  },
  {
    id: "volumes",
    name: "Volumes",
    caption: "Storage tiers",
    productType: "volume_type",
    icon: Database,
  },
  {
    id: "object-storage",
    name: "Object Storage",
    caption: "S3-compatible",
    productType: "object_storage_configuration",
    icon: HardDrive,
  },
  {
    id: "bandwidth",
    name: "Bandwidth",
    caption: "Throughput tiers",
    productType: "bandwidth",
    icon: Wifi,
  },
  {
    id: "floating-ips",
    name: "Floating IPs",
    caption: "Public addresses",
    productType: "ip",
    icon: Globe,
  },
  {
    id: "cross-connects",
    name: "Cross Connects",
    caption: "Partner links",
    productType: "cross_connect",
    icon: Cable,
  },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...PRICING_TABS.map((tab) => ({ value: tab.id, label: tab.name })),
];

const formatCurrency = (value: unknown, currency = "USD") => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${currency} ${amount.toFixed(2)}`;
};

const buildKey = (product?: PricingCatalogProduct | null) => {
  if (!product) return "";
  return `${normalizeProductType(product.productable_type)}|${product.productable_id}`;
};

const TenantPricingEditList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});

  const tenant = useTenantAuthStore((state) => state?.tenant || null);
  const tenantId = useTenantAuthStore((state) => {
    const rawId = state?.tenant?.id ?? state?.tenant?.identifier ?? state?.tenant?.uuid ?? null;
    return rawId === null || rawId === undefined ? null : String(rawId);
  });

  const activeConfig = useMemo(() => {
    if (activeTab === "all") return null;
    return PRICING_TABS.find((tab) => tab.id === activeTab) || null;
  }, [activeTab]);

  const { data: regionsPayload, isFetching: isRegionsFetching } = useFetchTenantRegions();
  const regions = useMemo<TenantRegion[]>(() => {
    return extractRowsFromPayload<TenantRegion>(regionsPayload);
  }, [regionsPayload]);

  useEffect(() => {
    if (!selectedRegion && regions.length && regions[0]?.code) {
      setSelectedRegion(regions[0].code);
    }
  }, [regions, selectedRegion]);

  const activeRegion = useMemo<TenantRegion | undefined>(
    () => regions.find((region) => region.code === selectedRegion),
    [regions, selectedRegion]
  );

  const tenantCountryCode = useMemo(() => resolveCountryCodeFromEntity(tenant), [tenant]);
  const effectiveCountryCode = tenantCountryCode || activeRegion?.country_code || "";

  const {
    data: catalogPayload,
    isFetching: isCatalogFetching,
    refetch: refetchCatalog,
  } = useFetchProductPricing(selectedRegion, activeConfig?.productType as any, {
    enabled: Boolean(selectedRegion),
    tenantId: tenantId || "",
    countryCode: effectiveCountryCode,
    perPage: 100,
  });

  const {
    data: overridePayload,
    isFetching: isOverridesFetching,
    refetch: refetchOverrides,
  } = useFetchTenantPricingOverrides(
    {
      productableType: activeConfig?.productType,
      provider: activeRegion?.provider,
      perPage: 200,
    },
    {
      enabled: Boolean(activeRegion?.provider),
    }
  );

  const overrides = useMemo<TenantPricingOverride[]>(
    () => overridePayload?.data ?? [],
    [overridePayload]
  );

  const { mutateAsync: upsertOverride, isPending: isSavingOverride } =
    useUpsertTenantPricingOverride();
  const { mutateAsync: updateOverride, isPending: isUpdatingOverride } =
    useUpdateTenantPricingOverride();
  const { mutateAsync: deleteOverride, isPending: isDeletingOverride } =
    useDeleteTenantPricingOverride();

  const isSaving = isSavingOverride || isUpdatingOverride || isDeletingOverride;

  const catalogRows = useMemo<PricingCatalogRow[]>(() => {
    return extractRowsFromPayload<PricingCatalogRow>(catalogPayload);
  }, [catalogPayload]);

  const findOverrideForProduct = useCallback(
    (product?: PricingCatalogProduct | null) => {
      if (
        !product?.productable_type ||
        product.productable_id === null ||
        product.productable_id === undefined
      ) {
        return null;
      }
      const productId = product.productable_id;
      const productType = product.productable_type;
      const countryCode = activeRegion?.country_code?.toUpperCase();

      const matchingOverrides = overrides.filter((override) => {
        if (!override) return false;
        if (!override.productable_type) return false;
        if (override.productable_id === null || override.productable_id === undefined) return false;
        if (Number(override.productable_id) !== Number(productId)) return false;
        if (!matchesProductType(override.productable_type, productType)) return false;
        return true;
      });

      if (!matchingOverrides.length) return null;

      const regionMatch = matchingOverrides.find((override) => override.region === selectedRegion);
      if (regionMatch) {
        return { row: regionMatch, scope: "region" };
      }

      if (countryCode) {
        const countryMatch = matchingOverrides.find(
          (override) => !override.region && override.country_code?.toUpperCase() === countryCode
        );
        if (countryMatch) {
          return { row: countryMatch, scope: "country" };
        }
      }

      return null;
    },
    [overrides, activeRegion, selectedRegion]
  );

  useEffect(() => {
    if (!catalogRows.length) return;

    setDraftPrices((prev) => {
      const next = { ...prev };
      let changed = false;

      catalogRows.forEach((row) => {
        const product = row?.product;
        if (!product) return;
        const key = buildKey(product);
        if (!key) return;
        if (next[key] !== undefined) return;
        const overrideInfo = findOverrideForProduct(product);
        const overridePrice = overrideInfo?.row?.price_usd;
        const adminPrice = row?.pricing?.admin?.price_usd;
        const initial = overridePrice ?? adminPrice ?? "";
        next[key] = initial === null || initial === undefined ? "" : String(initial);
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [catalogRows, findOverrideForProduct]);

  const filteredRows = useMemo(() => {
    return catalogRows.filter((row) => {
      if (!row?.product) return false;
      if (searchValue) {
        const haystack = `${row.product.name || ""} ${row.product.productable_name || ""}`
          .toLowerCase()
          .trim();
        if (!haystack.includes(searchValue.toLowerCase())) return false;
      }
      return true;
    });
  }, [catalogRows, searchValue]);

  const handlePriceChange = useCallback((key: string, value: string) => {
    setDraftPrices((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveRow = useCallback(
    async (row: PricingCatalogRow) => {
      const product = row?.product;
      if (
        !product ||
        !product.productable_type ||
        product.productable_id === null ||
        product.productable_id === undefined ||
        !activeRegion?.provider
      ) {
        ToastUtils.error("Missing product or region details.");
        return;
      }

      const adminDefault = row?.pricing?.admin?.price_usd;
      if (adminDefault === null || adminDefault === undefined) {
        ToastUtils.error("Admin default price must be set before tenant price settings.");
        return;
      }

      const key = buildKey(product);
      const rawValue = draftPrices[key];
      const parsed = Number(rawValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        ToastUtils.error("Enter a valid tenant price.");
        return;
      }
      if (parsed < adminDefault) {
        ToastUtils.error("Tenant price cannot be below admin default.");
        return;
      }

      const overrideInfo = findOverrideForProduct(product);
      const overrideId = overrideInfo?.row?.id;
      const hasOverride = overrideId !== undefined && overrideId !== null;
      const adminScope = row?.pricing?.admin?.scope;

      try {
        if (hasOverride) {
          await updateOverride({
            id: overrideId,
            payload: { price_usd: parsed },
          });
        } else {
          const payload: TenantPricingCreatePayload = {
            productable_type: product.productable_type,
            productable_id: product.productable_id,
            provider: String(activeRegion.provider),
            price_usd: parsed,
          };

          if (adminScope === "country") {
            if (!activeRegion?.country_code) {
              ToastUtils.error("Region is missing a country code.");
              return;
            }
            payload.country_code = activeRegion.country_code;
          } else {
            payload.region = selectedRegion;
          }

          await upsertOverride(payload);
        }

        refetchOverrides();
        refetchCatalog();
        ToastUtils.success("Tenant price saved.");
      } catch (_error) {
        // tenantApi already displays toast errors
      }
    },
    [
      activeRegion,
      draftPrices,
      findOverrideForProduct,
      refetchCatalog,
      refetchOverrides,
      selectedRegion,
      updateOverride,
      upsertOverride,
    ]
  );

  const handleResetRow = useCallback(
    async (row: PricingCatalogRow) => {
      const product = row?.product;
      if (!product) return;
      const overrideInfo = findOverrideForProduct(product);
      const overrideId = overrideInfo?.row?.id;
      if (overrideId === undefined || overrideId === null) {
        ToastUtils.error("No override found for this product.");
        return;
      }

      try {
        await deleteOverride(overrideId);
        refetchOverrides();
        refetchCatalog();
        const key = buildKey(product);
        const adminPrice = row?.pricing?.admin?.price_usd;
        setDraftPrices((prev) => ({
          ...prev,
          [key]: adminPrice === null || adminPrice === undefined ? "" : String(adminPrice),
        }));
        ToastUtils.success("Override reset.");
      } catch (_error) {
        // tenantApi already displays toast errors
      }
    },
    [deleteOverride, findOverrideForProduct, refetchCatalog, refetchOverrides]
  );

  const columns = useMemo<Column<PricingCatalogRow>[]>(
    () => [
      {
        key: "product",
        header: "Product",
        render: (_value: unknown, row: PricingCatalogRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">
              {row?.product?.name || row?.product?.productable_name || "Unnamed"}
            </div>
            <div className="text-xs text-slate-500">
              {row?.product?.productable_label || row?.product?.productable_type}
            </div>
          </div>
        ),
      },
      {
        key: "region",
        header: "Region",
        render: () => <div className="text-sm text-slate-700">{activeRegion?.code || "—"}</div>,
      },
      {
        key: "admin",
        header: "Admin Default",
        render: (_value: unknown, row: PricingCatalogRow) => {
          const admin = row?.pricing?.admin;
          if (!admin?.price_usd && admin?.price_usd !== 0) {
            return <span className="text-xs text-rose-500">Not set</span>;
          }
          return (
            <div className="text-sm text-slate-700">
              {formatCurrency(admin.price_usd, "USD")}
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                {admin.scope}
              </div>
            </div>
          );
        },
      },
      {
        key: "tenant",
        header: "Tenant Price",
        render: (_value: unknown, row: PricingCatalogRow) => {
          const key = buildKey(row?.product);
          const adminDefault = row?.pricing?.admin?.price_usd;
          const hasAdmin = adminDefault !== null && adminDefault !== undefined;
          const rawValue = draftPrices[key] ?? "";
          const parsed = Number(rawValue);
          const hasValue = rawValue !== "" && Number.isFinite(parsed);
          const isBelowAdmin = hasValue && hasAdmin && parsed < adminDefault;

          return (
            <div className="space-y-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={rawValue}
                onChange={(event) => handlePriceChange(key, event.target.value)}
                placeholder={hasAdmin ? String(adminDefault) : "0.00"}
                className={`w-full input-field ${isBelowAdmin ? "border-rose-400" : "border-gray-300"}`}
                disabled={isSaving || !hasAdmin}
              />
              {!hasAdmin && (
                <div className="text-[10px] font-medium text-rose-500">Admin default not set</div>
              )}
              {isBelowAdmin && (
                <div className="text-[10px] font-medium text-rose-500">Must be ≥ admin price</div>
              )}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (_value: unknown, row: PricingCatalogRow) => {
          const overrideInfo = findOverrideForProduct(row?.product);
          const hasOverride = Boolean(overrideInfo?.row?.id);
          const adminDefault = row?.pricing?.admin?.price_usd;
          const hasAdmin = adminDefault !== null && adminDefault !== undefined;
          const key = buildKey(row?.product);
          const rawValue = draftPrices[key];
          const parsed = Number(rawValue);
          const invalid =
            !Number.isFinite(parsed) || parsed < 0 || (hasAdmin && parsed < adminDefault);

          return (
            <div className="flex items-center gap-2">
              <ModernButton
                variant={hasOverride ? "outline" : "primary"}
                size="sm"
                onClick={() => handleSaveRow(row)}
                isDisabled={isSaving || !hasAdmin || invalid}
              >
                {hasOverride ? "Update" : "Set"}
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => handleResetRow(row)}
                isDisabled={!hasOverride || isSaving}
              >
                Reset
              </ModernButton>
            </div>
          );
        },
      },
    ],
    [
      activeRegion,
      draftPrices,
      isSaving,
      findOverrideForProduct,
      handlePriceChange,
      handleSaveRow,
      handleResetRow,
    ]
  );

  const isLoading = isCatalogFetching || isOverridesFetching || isRegionsFetching;

  return (
    <TenantPageShell
      title="Edit Price Settings"
      description="Review admin pricing and set tenant prices. Tenant prices must be equal to or above admin defaults."
      actions={
        <div className="flex items-center gap-2">
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/pricing-overrides")}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            Back to Price Settings
          </ModernButton>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">Price settings</h2>
              <p className="text-sm text-slate-500">
                Edit tenant prices against the admin catalog for the selected region.
              </p>
            </div>
            <div className="grid w-full gap-3 md:w-auto md:grid-cols-3">
              <ModernSelect
                label="Region"
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                options={regions.map((region) => ({
                  value: region.code,
                  label: `${region.name} (${region.code})`,
                }))}
                disabled={!regions.length}
              />
              <ModernSelect
                label="Category"
                value={activeTab}
                onChange={(event) => setActiveTab(event.target.value)}
                options={CATEGORY_OPTIONS}
              />
              <ModernInput
                label="Search"
                placeholder="Search products"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm">
          <ModernTable<PricingCatalogRow>
            data={filteredRows}
            columns={columns}
            loading={isLoading}
            searchable={false}
            filterable={false}
            exportable={false}
            paginated={false}
            emptyMessage={
              <div className="py-16 text-center text-slate-500">
                <Tag className="mx-auto mb-3 h-6 w-6 text-slate-400" />
                No pricing found for this region and category.
              </div>
            }
          />
        </div>
      </div>
    </TenantPageShell>
  );
};

export default TenantPricingEditList;
