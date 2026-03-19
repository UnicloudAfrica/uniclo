import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, Database, Globe, HardDrive, Cable, Wifi, Tag, Upload, Download, Shield, Pencil, Layers } from "lucide-react";
import TenantPageShell from "../../../dashboard/components/TenantPageShell";
import PricingSideMenu from "../../../adminDashboard/components/pricingSideMenu";
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
  type TenantPricingOverride,
  useFetchTenantPricingOverrides,
  useImportTenantPricingOverrides,
  useExportTenantPricingTemplate,
  useUpsertTenantPricingOverride,
  useUpdateTenantPricingOverride,
} from "@/hooks/tenantHooks/tenantPricingHooks";
import {
  useFetchAnyCloudFlowPricing,
} from "@/hooks/adminHooks/adminAnyCloudFlowPricingHooks";
import { matchesProductType, normalizeProductType } from "@/utils/productTypeUtils";
import { resolveCountryCodeFromEntity } from "@/shared/utils/countryUtils";
import ToastUtils from "@/utils/toastUtil";
import useTenantAuthStore from "@/stores/tenantAuthStore";
import type {
  PricingTabDefinition,
  TenantRegion,
  PricingCatalogRow,
  PricingCatalogProduct,
  OverrideLookup,
} from "./pricingOverridesTypes";
import { formatCurrency, extractRowsFromPayload } from "./pricingOverridesTypes";
import ImportOverridesModal from "./ImportOverridesModal";
import PriceOverrideModal from "./PriceOverrideModal";
import ApplyToRegionsModal from "@/shared/components/ApplyToRegionsModal";
import type { ApplyToRegionsItem } from "@/shared/components/ApplyToRegionsModal";
import { useTenantApplyPriceToRegions } from "@/hooks/shared/useApplyPriceToRegions";
import type { BulkAction } from "@/shared/components/ui/ModernTable/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRICING_TABS: PricingTabDefinition[] = [
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
  {
    id: "managed-databases",
    name: "Managed Databases",
    caption: "Dedicated VMs",
    productType: "managed_database_plan",
    icon: Database,
  },
  {
    id: "anycloudflow",
    name: "AnyCloudFlow",
    caption: "Platform services",
    productType: "integration_product",
    icon: Shield,
    isGlobal: true,
  },
];

const DEFAULT_TAB_ID = PRICING_TABS[0]?.id || "";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TenantPricingOverrides = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB_ID);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchValue, setSearchValue] = useState("");

  /* Override modal state */
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideModalRow, setOverrideModalRow] = useState<PricingCatalogRow | null>(null);
  const [overrideModalInfo, setOverrideModalInfo] = useState<OverrideLookup | null>(null);

  /* Import modal state */
  const [importOpen, setImportOpen] = useState(false);

  /* Apply to regions modal state */
  const [isApplyToRegionsOpen, setApplyToRegionsOpen] = useState(false);
  const [applyToRegionsItems, setApplyToRegionsItems] = useState<ApplyToRegionsItem[]>([]);

  const tenant = useTenantAuthStore((state) => state?.tenant || null);
  const tenantId = useTenantAuthStore((state) => {
    const t = state?.tenant;
    const rawId = t?.id ?? t?.["identifier"] ?? t?.["uuid"] ?? null;
    return rawId === null || rawId === undefined ? null : String(rawId);
  });

  const activeConfig = useMemo(
    () =>
      PRICING_TABS.find((tab) => tab.id === activeTab) ||
      PRICING_TABS[0] ||
      ({} as (typeof PRICING_TABS)[0]),
    [activeTab]
  );
  const isGlobalTab = Boolean(activeConfig?.isGlobal);

  /* ---- Regions ---- */
  const { data: regionsPayload, isFetching: isRegionsFetching } = useFetchTenantRegions();
  const regions = useMemo<TenantRegion[]>(
    () => extractRowsFromPayload<TenantRegion>(regionsPayload),
    [regionsPayload]
  );

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

  /* ---- Catalog ---- */
  const {
    data: catalogPayload,
    isFetching: isCatalogFetching,
    refetch: refetchCatalog,
  } = useFetchProductPricing(selectedRegion, activeConfig?.productType || "", {
    enabled: Boolean(selectedRegion) && !isGlobalTab,
    tenantId: tenantId || "",
    countryCode: effectiveCountryCode,
  });

  /* ---- AnyCloudFlow (global services) ---- */
  const {
    data: acfPayload,
    isFetching: isAcfFetching,
    refetch: refetchAcf,
  } = useFetchAnyCloudFlowPricing({ enabled: isGlobalTab });
  const [editingAcfId, setEditingAcfId] = useState<number | null>(null);
  const [acfEditPrice, setAcfEditPrice] = useState("");

  /* ---- Overrides ---- */
  const {
    data: overridePayload,
    isFetching: isOverridesFetching,
    refetch: refetchOverrides,
  } = useFetchTenantPricingOverrides(
    {
      productableType: isGlobalTab ? "integration_product" : (activeConfig?.productType || ""),
      provider: isGlobalTab ? "platform" : (activeRegion?.provider || ""),
      perPage: 200,
    },
    { enabled: isGlobalTab || Boolean(activeRegion?.provider) }
  );

  const overrides = useMemo<TenantPricingOverride[]>(
    () => overridePayload?.data ?? [],
    [overridePayload]
  );

  /* ---- Mutations ---- */
  const { mutateAsync: upsertOverride, isPending: isSavingOverride } =
    useUpsertTenantPricingOverride();
  const { mutateAsync: updateOverride, isPending: isUpdatingOverride } =
    useUpdateTenantPricingOverride();
  const { mutateAsync: deleteOverride, isPending: isDeletingOverride } =
    useDeleteTenantPricingOverride();
  const { mutateAsync: importOverrides, isPending: isImporting } =
    useImportTenantPricingOverrides();
  const { mutateAsync: exportTemplate, isPending: isExporting } = useExportTenantPricingTemplate();
  const { mutateAsync: applyToRegions, isPending: isApplyingToRegions } =
    useTenantApplyPriceToRegions();

  const isSaving = isSavingOverride || isUpdatingOverride;

  /* ---- Derived data ---- */
  const catalogRows = useMemo<PricingCatalogRow[]>(() => {
    if (isGlobalTab) return [];
    return extractRowsFromPayload<PricingCatalogRow>(catalogPayload);
  }, [catalogPayload, isGlobalTab]);

  const acfServices = useMemo(() => {
    if (!isGlobalTab) return [];
    return acfPayload?.data ?? [];
  }, [acfPayload, isGlobalTab]);

  const findOverrideForProduct = useCallback(
    (product: PricingCatalogProduct | null | undefined): OverrideLookup | null => {
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
        if (override.productable_id === null || override.productable_id === undefined) return false;
        if (!override.productable_type) return false;
        if (Number(override.productable_id) !== Number(productId)) return false;
        if (!matchesProductType(override.productable_type, productType)) return false;
        return true;
      });

      if (!matchingOverrides.length) return null;

      /* AZ-scoped overrides take highest priority */
      const azMatch = matchingOverrides.find(
        (override) => override.region === selectedRegion && override.availability_zone
      );
      if (azMatch) return { row: azMatch, scope: "availability_zone" };

      const regionMatch = matchingOverrides.find(
        (override) => override.region === selectedRegion && !override.availability_zone
      );
      if (regionMatch) return { row: regionMatch, scope: "region" };

      if (countryCode) {
        const countryMatch = matchingOverrides.find(
          (override) => !override.region && override.country_code?.toUpperCase() === countryCode
        );
        if (countryMatch) return { row: countryMatch, scope: "country" };
      }

      return null;
    },
    [activeRegion?.country_code, overrides, selectedRegion]
  );

  const filteredRows = useMemo<PricingCatalogRow[]>(() => {
    return catalogRows.filter((row) => {
      const product = row?.product;
      if (!product) return false;
      if (
        activeConfig?.productType &&
        (!product.productable_type ||
          !matchesProductType(product.productable_type, activeConfig.productType))
      ) {
        return false;
      }
      if (!searchValue) return true;
      const haystack = `${product.name || ""} ${product.productable_name || ""}`
        .toLowerCase()
        .trim();
      return haystack.includes(searchValue.toLowerCase().trim());
    });
  }, [catalogRows, activeConfig?.productType, searchValue]);

  /* ---- Handlers ---- */
  const openOverrideModal = useCallback(
    (row: PricingCatalogRow) => {
      const info = findOverrideForProduct(row?.product);
      setOverrideModalRow(row);
      setOverrideModalInfo(info);
      setOverrideModalOpen(true);
    },
    [findOverrideForProduct]
  );

  const closeOverrideModal = useCallback(() => {
    setOverrideModalOpen(false);
    setOverrideModalRow(null);
    setOverrideModalInfo(null);
  }, []);

  const handleResetOverride = useCallback(
    async (row: PricingCatalogRow) => {
      const overrideInfo = findOverrideForProduct(row?.product);
      const overrideId = overrideInfo?.row?.id;
      if (overrideId === undefined || overrideId === null) {
        ToastUtils.error("No price setting found for this product.");
        return;
      }
      try {
        await deleteOverride(overrideId);
        refetchOverrides();
        refetchCatalog();
      } catch {
        // tenantApi already displays toast errors
      }
    },
    [deleteOverride, findOverrideForProduct, refetchCatalog, refetchOverrides]
  );

  const handleDeleteOverrideById = useCallback(
    async (overrideId: string | number | null | undefined) => {
      if (overrideId === undefined || overrideId === null) {
        ToastUtils.error("No price setting found for this product.");
        return;
      }
      try {
        await deleteOverride(overrideId);
        refetchOverrides();
        refetchCatalog();
      } catch {
        // tenantApi already displays toast errors
      }
    },
    [deleteOverride, refetchCatalog, refetchOverrides]
  );

  const handleExportCsv = async () => {
    if (!activeRegion?.provider || !selectedRegion) {
      ToastUtils.error("Select a region to export pricing.");
      return;
    }
    try {
      const csvContent = await exportTemplate(selectedRegion);
      const blob =
        csvContent instanceof Blob
          ? csvContent
          : new Blob([typeof csvContent === "string" ? csvContent : String(csvContent ?? "")], {
              type: "text/csv;charset=utf-8;",
            });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `tenant_price_settings_${activeConfig?.id || "catalog"}_${selectedRegion}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      ToastUtils.error("Failed to export pricing template.");
    }
  };

  const handleRefreshAll = useCallback(() => {
    refetchCatalog();
    refetchOverrides();
    if (isGlobalTab) refetchAcf();
  }, [refetchCatalog, refetchOverrides, isGlobalTab, refetchAcf]);

  /* ---- Bulk actions ---- */
  const bulkActions: BulkAction<PricingCatalogRow>[] = useMemo(
    () => [
      {
        label: "Apply to Regions",
        icon: <Globe className="h-4 w-4" />,
        onClick: (_selectedIds: string[], selectedRows: PricingCatalogRow[]) => {
          const items: ApplyToRegionsItem[] = selectedRows
            .filter((row) => row?.product?.productable_type && row?.product?.productable_id != null)
            .map((row) => {
              const info = findOverrideForProduct(row.product);
              const overridePrice = info?.row?.price_usd;
              const adminPrice = row.pricing?.admin?.price_usd;
              const effectivePrice = overridePrice ?? adminPrice ?? 0;
              return {
                productable_type: row.product!.productable_type!,
                productable_id: row.product!.productable_id!,
                product_name:
                  row.product!.name || row.product!.productable_name || "Unnamed product",
                price_usd: Number(effectivePrice),
              };
            });
          setApplyToRegionsItems(items);
          setApplyToRegionsOpen(true);
        },
      },
    ],
    [findOverrideForProduct]
  );

  /* ---- Table columns ---- */
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
        key: "override",
        header: "Tenant Price",
        render: (_value: unknown, row: PricingCatalogRow) => {
          const info = findOverrideForProduct(row?.product);
          const override = info?.row;
          const adminDefault = row?.pricing?.admin?.price_usd;
          const overridePrice = Number(override?.price_usd ?? 0);
          const isBelowAdmin =
            Boolean(override) &&
            adminDefault !== null &&
            adminDefault !== undefined &&
            Number.isFinite(overridePrice) &&
            overridePrice < adminDefault;
          const isInherited = row?.pricing?.effective?.source === "tenant" && !override;

          if (!override) {
            return (
              <div className="text-xs text-slate-400">
                {isInherited ? "Inherited from parent" : "No price setting"}
              </div>
            );
          }
          const scopeLabel = override.availability_zone
            ? `AZ: ${override.availability_zone}`
            : override.region
              ? "Region"
              : "Country";
          return (
            <div className="text-sm text-slate-700">
              {formatCurrency(override.price_usd, "USD")}
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                {scopeLabel}
              </div>
              {isBelowAdmin && (
                <div className="text-[10px] font-medium text-rose-500">Below admin minimum</div>
              )}
            </div>
          );
        },
      },
      {
        key: "effective",
        header: "Effective",
        render: (_value: unknown, row: PricingCatalogRow) => {
          const info = findOverrideForProduct(row?.product);
          const override = info?.row;
          const adminDefault = row?.pricing?.admin?.price_usd;
          const overridePrice = Number(override?.price_usd ?? 0);
          const isBelowAdmin =
            Boolean(override) &&
            adminDefault !== null &&
            adminDefault !== undefined &&
            Number.isFinite(overridePrice) &&
            overridePrice < adminDefault;
          const tenantPricing = row?.pricing?.tenant;
          const effective = row?.pricing?.effective;

          if (override) {
            const displayAmount = tenantPricing?.price_local ?? override.price_usd;
            const displayCurrency = tenantPricing?.currency || "USD";
            return (
              <div className="text-sm text-slate-700">
                {formatCurrency(displayAmount, displayCurrency)}
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">tenant</div>
                {isBelowAdmin && (
                  <div className="text-[10px] font-medium text-rose-500">
                    Billing uses admin price
                  </div>
                )}
              </div>
            );
          }
          if (!effective) return "\u2014";
          return (
            <div className="text-sm text-slate-700">
              {formatCurrency(
                effective.price_local ?? effective.price_usd,
                effective.currency || "USD"
              )}
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                {effective.source}
              </div>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (_value: unknown, row: PricingCatalogRow) => {
          const admin = row?.pricing?.admin;
          const hasAdmin = admin?.price_usd !== null && admin?.price_usd !== undefined;
          const info = findOverrideForProduct(row?.product);
          const hasOverride = Boolean(info?.row?.id);
          return (
            <div className="flex items-center gap-2">
              <ModernButton
                variant={hasOverride ? "outline" : "primary"}
                size="sm"
                onClick={() => openOverrideModal(row)}
                isDisabled={!hasAdmin}
              >
                {hasOverride ? "Edit" : "Set"}
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => void handleResetOverride(row)}
                isDisabled={!hasOverride || isDeletingOverride}
              >
                Reset
              </ModernButton>
            </div>
          );
        },
      },
    ],
    [findOverrideForProduct, handleResetOverride, openOverrideModal, isDeletingOverride]
  );

  const isLoading = isGlobalTab
    ? isAcfFetching || isOverridesFetching
    : isCatalogFetching || isOverridesFetching || isRegionsFetching;

  /* ---- Stale overrides ---- */
  const catalogProductKeys = useMemo<Set<string>>(() => {
    const keys = new Set<string>();
    catalogRows.forEach((row) => {
      const product = row?.product;
      if (
        product?.productable_type &&
        product?.productable_id !== undefined &&
        product?.productable_id !== null
      ) {
        keys.add(`${normalizeProductType(product.productable_type)}|${product.productable_id}`);
      }
    });
    return keys;
  }, [catalogRows]);

  const staleOverrides = useMemo<TenantPricingOverride[]>(() => {
    if (!overrides.length) return [];
    const countryCode = activeRegion?.country_code?.toUpperCase();
    return overrides.filter((override) => {
      if (!override || !override.productable_type) return false;
      if (override.productable_id === undefined || override.productable_id === null) return false;
      if (override.region && override.region !== selectedRegion) return false;
      if (!override.region && countryCode && override.country_code?.toUpperCase() !== countryCode)
        return false;
      const key = `${normalizeProductType(override.productable_type)}|${override.productable_id}`;
      return !catalogProductKeys.has(key);
    });
  }, [overrides, catalogProductKeys, activeRegion?.country_code, selectedRegion]);

  const staleOverrideColumns = useMemo<Column<TenantPricingOverride>[]>(
    () => [
      {
        key: "productable",
        header: "Product",
        render: (_value: unknown, row: TenantPricingOverride) => (
          <div className="text-sm text-slate-700">
            {row.productable_type} &bull; {row.productable_id}
          </div>
        ),
      },
      {
        key: "scope",
        header: "Scope",
        render: (_value: unknown, row: TenantPricingOverride) => (
          <div className="text-xs text-slate-600">
            {row.availability_zone
              ? `AZ: ${row.availability_zone} (${row.region})`
              : row.region
                ? `Region: ${row.region}`
                : `Country: ${row.country_code}`}
          </div>
        ),
      },
      {
        key: "price",
        header: "Override",
        render: (_value: unknown, row: TenantPricingOverride) => (
          <div className="text-sm text-slate-700">{formatCurrency(row.price_usd, "USD")}</div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        render: (_value: unknown, row: TenantPricingOverride) => (
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => void handleDeleteOverrideById(row.id)}
            isDisabled={isDeletingOverride}
          >
            Remove
          </ModernButton>
        ),
      },
    ],
    [isDeletingOverride, handleDeleteOverrideById]
  );

  /* ---- AnyCloudFlow columns ---- */
  const acfColumns = useMemo<Column<any>[]>(
    () => [
      {
        key: "service",
        header: "Service",
        render: (_value: unknown, row: any) => (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">{row.name}</div>
              <div className="text-xs text-slate-500">{row.description}</div>
            </div>
          </div>
        ),
      },
      {
        key: "billing_model",
        header: "Billing",
        render: (_value: unknown, row: any) => (
          <div className="text-xs text-slate-600">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
              {(row.billing_model || "").replace(/_/g, " ")}
            </span>
            <div className="mt-1 text-slate-400">{row.unit_label || ""}</div>
          </div>
        ),
      },
      {
        key: "admin_price",
        header: "Admin Default",
        render: (_value: unknown, row: any) => (
          <div className="text-sm text-slate-700">
            {row.price_usd != null ? formatCurrency(row.price_usd, "USD") : "Not set"}
          </div>
        ),
      },
      {
        key: "tiers",
        header: "Volume Tiers",
        render: (_value: unknown, row: any) => {
          const tiers = row.pricing_tiers;
          if (!tiers?.length) {
            return <span className="text-xs text-slate-400">—</span>;
          }
          return (
            <div className="space-y-0.5">
              {tiers.map((tier: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <Layers className="h-3 w-3 text-amber-500" />
                  <span className="font-medium">{tier.label || `${tier.min_units}–${tier.max_units ?? '∞'}`}</span>
                  <span className="text-slate-400">→</span>
                  <span>{formatCurrency(tier.price_usd, "USD")}</span>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        key: "tenant_price",
        header: "Your Price",
        render: (_value: unknown, row: any) => {
          const override = overrides.find(
            (o) =>
              o.productable_id != null &&
              Number(o.productable_id) === Number(row.id) &&
              matchesProductType(o.productable_type || "", "integration_product")
          );
          if (!override) {
            return <span className="text-xs text-slate-400">Using admin default</span>;
          }
          return (
            <div className="text-sm font-semibold text-slate-900">
              {formatCurrency(override.price_usd, "USD")}
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        render: (_value: unknown, row: any) => {
          const override = overrides.find(
            (o) =>
              o.productable_id != null &&
              Number(o.productable_id) === Number(row.id) &&
              matchesProductType(o.productable_type || "", "integration_product")
          );
          if (row.price_usd == null) {
            return <span className="text-xs text-slate-400">No admin price set</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <ModernButton
                variant={override ? "outline" : "primary"}
                size="sm"
                onClick={() => {
                  const catalogRow: PricingCatalogRow = {
                    id: row.id,
                    product: {
                      id: row.id,
                      name: row.name,
                      productable_type: "integration_product",
                      productable_id: row.id,
                    },
                    pricing: {
                      admin: { price_usd: row.price_usd, scope: "global" },
                    },
                  };
                  const info: OverrideLookup | null = override
                    ? { row: override, scope: "country" }
                    : null;
                  setOverrideModalRow(catalogRow);
                  setOverrideModalInfo(info);
                  setOverrideModalOpen(true);
                }}
              >
                {override ? "Edit" : "Set"}
              </ModernButton>
              {override && (
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDeleteOverrideById(override.id)}
                  isDisabled={isDeletingOverride}
                >
                  Reset
                </ModernButton>
              )}
            </div>
          );
        },
      },
    ],
    [overrides, isDeletingOverride, handleDeleteOverrideById]
  );

  /* ---- Render ---- */
  return (
    <TenantPageShell
      title="Price Settings"
      description="Adjust admin pricing to set your own tenant rates. Admin defaults must be set first."
      actions={
        <div className="flex items-center gap-2">
          {!isGlobalTab && (
            <>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/pricing-overrides/edit-list")}
              >
                Edit Price Settings
              </ModernButton>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                isDisabled={!selectedRegion || isExporting}
              >
                <Download size={14} />
                {isExporting ? "Exporting..." : "Download Template"}
              </ModernButton>
              <ModernButton variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                <Upload size={14} />
                Import CSV
              </ModernButton>
            </>
          )}
          <ModernButton variant="outline" size="sm" onClick={handleRefreshAll}>
            Refresh
          </ModernButton>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <PricingSideMenu activeTab={activeTab} onTabChange={setActiveTab} items={PRICING_TABS} />

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {isGlobalTab ? "AnyCloudFlow services" : "Pricing catalogue"}
                </h2>
                <p className="text-sm text-slate-500">
                  {isGlobalTab
                    ? "Set your own rates for backup, DR, replication, and migration services. These apply globally — not per region."
                    : "Adjust admin defaults per region. Price settings apply to your tenants and client users."}
                </p>
              </div>
              {isGlobalTab ? (
                <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-3">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">Global — not region-specific</span>
                </div>
              ) : (
                <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
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
                  <ModernInput
                    label="Search"
                    placeholder="Search products"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm">
            {isGlobalTab ? (
              <ModernTable<any>
                data={acfServices}
                columns={acfColumns}
                loading={isLoading}
                searchable={false}
                filterable={false}
                exportable={false}
                paginated={false}
                emptyMessage={
                  <div className="py-16 text-center text-slate-500">
                    <Shield className="mx-auto mb-3 h-6 w-6 text-slate-400" />
                    No AnyCloudFlow services available. Contact your platform admin.
                  </div>
                }
              />
            ) : (
              <ModernTable<PricingCatalogRow>
                data={filteredRows}
                columns={columns}
                loading={isLoading}
                searchable={false}
                filterable={false}
                exportable={false}
                paginated={false}
                selectable
                bulkActions={bulkActions}
                emptyMessage={
                  <div className="py-16 text-center text-slate-500">
                    <Tag className="mx-auto mb-3 h-6 w-6 text-slate-400" />
                    No products found for this region and category.
                  </div>
                }
              />
            )}
          </div>

          {!isGlobalTab && staleOverrides.length > 0 && (
            <div className="rounded-3xl border border-amber-200/70 bg-amber-50/40 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <Tag className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Stale price settings (not found in this region's catalog)
                </span>
              </div>
              <ModernTable<TenantPricingOverride>
                data={staleOverrides}
                columns={staleOverrideColumns}
                paginated={false}
                searchable={false}
                filterable={false}
                exportable={false}
                emptyMessage={null}
              />
            </div>
          )}
        </div>
      </div>

      <PriceOverrideModal
        isOpen={overrideModalOpen}
        onClose={closeOverrideModal}
        row={overrideModalRow}
        overrideInfo={overrideModalInfo}
        activeRegion={activeRegion}
        selectedRegion={selectedRegion}
        regions={regions}
        isSaving={isSaving}
        onUpsert={upsertOverride}
        onUpdate={updateOverride}
        onSaveComplete={handleRefreshAll}
      />

      <ImportOverridesModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        selectedRegion={selectedRegion}
        isExporting={isExporting}
        onExportCsv={handleExportCsv}
        onImport={importOverrides}
        isImporting={isImporting}
        onImportComplete={handleRefreshAll}
      />

      <ApplyToRegionsModal
        isOpen={isApplyToRegionsOpen}
        onClose={() => setApplyToRegionsOpen(false)}
        items={applyToRegionsItems}
        provider={activeRegion?.provider ?? ""}
        sourceRegion={selectedRegion}
        regions={regions}
        onApply={applyToRegions}
        isApplying={isApplyingToRegions}
      />
    </TenantPageShell>
  );
};

export default TenantPricingOverrides;
