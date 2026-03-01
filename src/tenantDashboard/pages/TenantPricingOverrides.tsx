import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cpu,
  Database,
  Globe,
  HardDrive,
  Cable,
  Wifi,
  Tag,
  Upload,
  Download,
  type LucideIcon,
} from "lucide-react";
import TenantPageShell from "../../dashboard/components/TenantPageShell";
import PricingSideMenu from "../../adminDashboard/components/pricingSideMenu";
import {
  ModernButton,
  ModernInput,
  ModernModal,
  ModernSelect,
  ModernTable,
  type Column,
} from "../../shared/components/ui";
import { useFetchTenantRegions } from "../../hooks/tenantHooks/regionHooks";
import { useFetchProductPricing } from "../../hooks/resource";
import {
  useDeleteTenantPricingOverride,
  type TenantPricingCreatePayload,
  type TenantPricingImportError,
  type TenantPricingImportResult,
  type TenantPricingOverride,
  useFetchTenantPricingOverrides,
  useImportTenantPricingOverrides,
  useExportTenantPricingTemplate,
  useUpsertTenantPricingOverride,
  useUpdateTenantPricingOverride,
} from "../../hooks/tenantHooks/tenantPricingHooks";
import type { ModalAction } from "../../shared/components/ui/ModernModal";
import { matchesProductType, normalizeProductType } from "../../utils/productTypeUtils";
import { resolveCountryCodeFromEntity } from "../../shared/utils/countryUtils";
import ToastUtils from "../../utils/toastUtil";
import { FileInput } from "../../utils/fileInput";
import useTenantAuthStore from "../../stores/tenantAuthStore";

interface PricingTabDefinition {
  id: string;
  name: string;
  caption: string;
  productType: string;
  icon: LucideIcon;
}

interface TenantRegion {
  code: string;
  name: string;
  provider?: string;
  country_code?: string | null;
  [key: string]: unknown;
}

interface PricingCatalogProduct {
  id?: string | number;
  name?: string;
  productable_name?: string;
  productable_label?: string;
  productable_type?: string;
  productable_id?: string | number;
  [key: string]: unknown;
}

interface PricingAmount {
  price_usd?: number | null;
  price_local?: number | null;
  currency?: string | null;
  scope?: string | null;
  source?: string | null;
  [key: string]: unknown;
}

interface PricingCatalogRow {
  id?: string | number | null;
  product?: PricingCatalogProduct | null;
  pricing?: {
    admin?: PricingAmount;
    tenant?: PricingAmount;
    effective?: PricingAmount;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

type OverrideScope = "region" | "country";

interface ModalRowState {
  item: PricingCatalogRow;
  override: TenantPricingOverride | null;
  overrideScope: OverrideScope;
}

interface OverrideLookup {
  row: TenantPricingOverride;
  scope: OverrideScope;
}

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
];

const DEFAULT_TAB_ID = PRICING_TABS[0]?.id || "";

const formatCurrency = (value: unknown, currency = "USD") => {
  if (value === null || value === undefined || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `${currency} ${amount.toFixed(2)}`;
};

const extractRowsFromPayload = <TRow,>(payload: unknown): TRow[] => {
  if (Array.isArray(payload)) return payload as TRow[];
  if (payload && typeof payload === "object") {
    const rows = (payload as { data?: unknown }).data;
    if (Array.isArray(rows)) return rows as TRow[];
  }
  return [];
};

const TenantPricingOverrides = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB_ID);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<ModalRowState | null>(null);
  const [overrideScope, setOverrideScope] = useState<OverrideScope>("region");
  const [priceValue, setPriceValue] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDryRun, setImportDryRun] = useState(false);
  const [importResult, setImportResult] = useState<TenantPricingImportResult | null>(null);
  const [importError, setImportError] = useState("");
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

  const { data: regionsPayload, isFetching: isRegionsFetching } = useFetchTenantRegions();
  const regions = useMemo<TenantRegion[]>(() => {
    return extractRowsFromPayload<TenantRegion>(regionsPayload);
  }, [regionsPayload]);

  useEffect(() => {
    if (!selectedRegion && regions.length && regions[0]?.code) {
      setSelectedRegion(regions[0].code);
    }
  }, [regions, selectedRegion, setSelectedRegion]);

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
  } = useFetchProductPricing(selectedRegion, activeConfig?.productType || "", {
    enabled: Boolean(selectedRegion),
    tenantId: tenantId || "",
    countryCode: effectiveCountryCode,
  });

  const {
    data: overridePayload,
    isFetching: isOverridesFetching,
    refetch: refetchOverrides,
  } = useFetchTenantPricingOverrides(
    {
      productableType: activeConfig?.productType || "",
      provider: activeRegion?.provider || "",
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
  const { mutateAsync: importOverrides, isPending: isImporting } =
    useImportTenantPricingOverrides();
  const { mutateAsync: exportTemplate, isPending: isExporting } = useExportTenantPricingTemplate();

  const isSaving = isSavingOverride || isUpdatingOverride;

  const catalogRows = useMemo<PricingCatalogRow[]>(() => {
    return extractRowsFromPayload<PricingCatalogRow>(catalogPayload);
  }, [catalogPayload]);

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

  const openOverrideModal = useCallback(
    (row: PricingCatalogRow) => {
      const overrideInfo = findOverrideForProduct(row?.product);
      const overrideRow = overrideInfo?.row || null;
      const hasOverride = Boolean(overrideRow?.id);
      const adminScope = row?.pricing?.admin?.scope;

      setModalRow({
        item: row,
        override: overrideRow,
        overrideScope: overrideInfo?.scope || "region",
      });
      if (adminScope !== "country" && !overrideInfo?.scope) {
        setOverrideScope("region");
      } else {
        setOverrideScope(overrideInfo?.scope || "region");
      }
      setPriceValue(
        hasOverride
          ? String(overrideRow?.price_usd ?? "")
          : String(row?.pricing?.admin?.price_usd ?? "")
      );
      setModalOpen(true);
    },
    [findOverrideForProduct]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalRow(null);
    setPriceValue("");
  }, [setModalOpen, setModalRow, setPriceValue]);

  const resetImportState = useCallback(() => {
    setImportFile(null);
    setImportDryRun(false);
    setImportResult(null);
    setImportError("");
  }, [setImportFile, setImportDryRun, setImportResult, setImportError]);

  const closeImportModal = useCallback(() => {
    resetImportState();
    setImportOpen(false);
  }, [resetImportState, setImportOpen]);

  const modalAdminDefault = modalRow?.item?.pricing?.admin?.price_usd;
  const modalParsedPrice = Number(priceValue);
  const modalHasNumericPrice = Number.isFinite(modalParsedPrice);
  const modalIsBelowAdmin =
    modalHasNumericPrice &&
    modalAdminDefault !== null &&
    modalAdminDefault !== undefined &&
    modalParsedPrice < modalAdminDefault;

  const handleSaveOverride = useCallback(async () => {
    if (!modalRow?.item?.product || !activeRegion?.provider) {
      ToastUtils.error("Missing product or region details.");
      return;
    }

    const product = modalRow.item.product;
    if (
      !product.productable_type ||
      product.productable_id === null ||
      product.productable_id === undefined
    ) {
      ToastUtils.error("Missing product details.");
      return;
    }

    const adminDefault = modalRow?.item?.pricing?.admin?.price_usd;
    const adminScope = modalRow?.item?.pricing?.admin?.scope;
    if (adminDefault === null || adminDefault === undefined) {
      ToastUtils.error("Admin default price must be set before tenant price settings.");
      return;
    }
    if (overrideScope === "country" && adminScope !== "country") {
      ToastUtils.error("Country price settings require a country-level admin default price.");
      return;
    }

    const parsed = Number(priceValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      ToastUtils.error("Enter a valid tenant price.");
      return;
    }
    if (parsed < adminDefault) {
      ToastUtils.error("Tenant price cannot be below admin default.");
      return;
    }

    const overrideId = modalRow?.override?.id;

    try {
      if (overrideId !== undefined && overrideId !== null) {
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

        if (overrideScope === "country") {
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
      closeModal();
    } catch {
      // tenantApi already displays toast errors
    }
  }, [
    modalRow,
    activeRegion,
    overrideScope,
    priceValue,
    updateOverride,
    upsertOverride,
    selectedRegion,
    refetchOverrides,
    refetchCatalog,
    closeModal,
  ]);

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

  const normalizeHeader = useCallback(
    (value: unknown): string =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/([^a-z0-9]+)/g, "_")
        .replace(/(^_+|_+$)/g, ""),
    []
  );

  const parseCsv = useCallback((text: string): string[][] => {
    const rows: string[][] = [];
    let current = "";
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        row.push(current);
        current = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && next === "\n") {
          i += 1;
        }
        row.push(current);
        if (row.some((value) => String(value).trim() !== "")) {
          rows.push(row);
        }
        row = [];
        current = "";
        continue;
      }

      current += char;
    }

    if (current.length || row.length) {
      row.push(current);
      if (row.some((value) => String(value).trim() !== "")) {
        rows.push(row);
      }
    }

    return rows;
  }, []);

  const buildCsv = useCallback((headers: string[], rows: string[][]): string => {
    const escapeCsv = (value: unknown): string => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.map(escapeCsv).join(",")];
    rows.forEach((row) => {
      lines.push(row.map(escapeCsv).join(","));
    });
    return lines.join("\n");
  }, []);

  const stripCsvColumns = useCallback(
    async (file: File): Promise<File> => {
      const expectedHeaders: string[] = [
        "provider",
        "region",
        "country_code",
        "product_id",
        "product_name",
        "productable_type",
        "productable_id",
        "price_usd",
      ];

      try {
        const text = await file.text();
        const rows = parseCsv(text);
        if (!rows.length) return file;

        const headerRow = rows[0] || [];
        const normalizedHeaderMap = headerRow.reduce<Record<string, number>>(
          (acc, header, index) => {
            const normalized = normalizeHeader(header);
            if (normalized) {
              acc[normalized] = index;
            }
            return acc;
          },
          {}
        );

        const dataRows: string[][] = rows.slice(1).map((row) => {
          return expectedHeaders.map((header) => {
            const index = normalizedHeaderMap[header];
            return index !== undefined ? (row[index] ?? "") : "";
          });
        });

        const csv = buildCsv(expectedHeaders, dataRows);
        return new File([csv], file.name, { type: "text/csv" });
      } catch {
        return file;
      }
    },
    [normalizeHeader, parseCsv, buildCsv]
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

  const handleImport = useCallback(
    async (forceDryRun?: boolean) => {
      if (!importFile) {
        setImportError("Please select a CSV file to upload.");
        return;
      }

      try {
        let file: File = importFile;
        if (
          String(importFile.name || "")
            .toLowerCase()
            .endsWith(".csv")
        ) {
          file = await stripCsvColumns(importFile);
        }
        const res = await importOverrides({ file, dry_run: forceDryRun ?? importDryRun });
        setImportResult(res);
        refetchOverrides();
        refetchCatalog();
      } catch {
        // tenantMultipartApi handles toast errors
      }
    },
    [importFile, importDryRun, importOverrides, stripCsvColumns, refetchOverrides, refetchCatalog]
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
          const overrideInfo = findOverrideForProduct(row?.product);
          const override = overrideInfo?.row;
          const adminDefault = row?.pricing?.admin?.price_usd;
          const overridePrice = Number(override?.price_usd ?? 0);
          const isBelowAdmin =
            Boolean(override) &&
            adminDefault !== null &&
            adminDefault !== undefined &&
            Number.isFinite(overridePrice) &&
            overridePrice < adminDefault;
          const effectiveSource = row?.pricing?.effective?.source;
          const isInherited = effectiveSource === "tenant" && !override;

          if (!override) {
            return (
              <div className="text-xs text-slate-400">
                {isInherited ? "Inherited from parent" : "No price setting"}
              </div>
            );
          }

          return (
            <div className="text-sm text-slate-700">
              {formatCurrency(override.price_usd, "USD")}
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                {override.region ? "Region" : "Country"}
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
          const overrideInfo = findOverrideForProduct(row?.product);
          const override = overrideInfo?.row;
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

          if (!effective) return "—";
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
          const isDisabled = !hasAdmin;
          const overrideInfo = findOverrideForProduct(row?.product);
          const hasOverride = Boolean(overrideInfo?.row?.id);

          return (
            <div className="flex items-center gap-2">
              <ModernButton
                variant={hasOverride ? "outline" : "primary"}
                size="sm"
                onClick={() => openOverrideModal(row)}
                isDisabled={isDisabled}
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

  const isLoading = isCatalogFetching || isOverridesFetching || isRegionsFetching;

  const catalogProductKeys = useMemo<Set<string>>(() => {
    const keys = new Set<string>();
    catalogRows.forEach((row) => {
      const product = row?.product;
      if (
        product?.productable_type &&
        product?.productable_id !== undefined &&
        product?.productable_id !== null
      ) {
        const normalizedType = normalizeProductType(product.productable_type);
        keys.add(`${normalizedType}|${product.productable_id}`);
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
      if (!override.region && countryCode && override.country_code?.toUpperCase() !== countryCode) {
        return false;
      }
      const normalizedType = normalizeProductType(override.productable_type);
      const key = `${normalizedType}|${override.productable_id}`;
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
            {row.productable_type} • {row.productable_id}
          </div>
        ),
      },
      {
        key: "scope",
        header: "Scope",
        render: (_value: unknown, row: TenantPricingOverride) => (
          <div className="text-xs text-slate-600">
            {row.region ? `Region: ${row.region}` : `Country: ${row.country_code}`}
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

  const overrideModalActions: ModalAction[] = [
    {
      label: "Cancel",
      variant: "ghost",
      onClick: closeModal,
    },
    {
      label: isSaving ? "Saving..." : "Save Override",
      variant: "primary",
      onClick: () => {
        void handleSaveOverride();
      },
      disabled: isSaving || modalIsBelowAdmin,
    },
  ];

  const importModalActions = useMemo<ModalAction[]>(() => {
    if (importResult) {
      const actions: ModalAction[] = [
        {
          label: "Close",
          variant: "primary",
          onClick: closeImportModal,
        },
      ];

      if (importResult.dry_run) {
        actions.push({
          label: isImporting ? "Importing..." : "Run Import",
          variant: "outline",
          onClick: () => {
            void handleImport(false);
          },
          disabled: isImporting || !importFile,
        });
      }
      return actions;
    }

    return [
      {
        label: "Cancel",
        variant: "ghost",
        onClick: closeImportModal,
      },
      {
        label: isImporting ? "Uploading..." : "Upload",
        variant: "primary",
        onClick: () => {
          void handleImport();
        },
        disabled: isImporting || !importFile,
      },
    ];
  }, [closeImportModal, handleImport, importFile, importResult, isImporting]);

  return (
    <TenantPageShell
      title="Price Settings"
      description="Adjust admin pricing to set your own tenant rates. Admin defaults must be set first."
      actions={
        <div className="flex items-center gap-2">
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
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => {
              refetchCatalog();
              refetchOverrides();
            }}
          >
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
                <h2 className="text-xl font-semibold text-slate-900">Pricing catalogue</h2>
                <p className="text-sm text-slate-500">
                  Adjust admin defaults per region. Price settings apply to your tenants and client
                  users.
                </p>
              </div>
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
                  No products found for this region and category.
                </div>
              }
            />
          </div>

          {staleOverrides.length > 0 && (
            <div className="rounded-3xl border border-amber-200/70 bg-amber-50/40 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-amber-700">
                <Tag className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  Stale price settings (not found in this region’s catalog)
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

      <ModernModal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Set price setting"
        subtitle={modalRow?.item?.product?.name || ""}
        actions={overrideModalActions}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Admin default price: {formatCurrency(modalRow?.item?.pricing?.admin?.price_usd, "USD")}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Price scope
            </p>
            <div className="flex flex-wrap gap-2">
              <ModernButton
                variant={overrideScope === "region" ? "primary" : "outline"}
                size="sm"
                onClick={() => setOverrideScope("region")}
                isDisabled={Boolean(modalRow?.override?.id)}
              >
                Region ({activeRegion?.code || "—"})
              </ModernButton>
              <ModernButton
                variant={overrideScope === "country" ? "primary" : "outline"}
                size="sm"
                onClick={() => setOverrideScope("country")}
                isDisabled={
                  Boolean(modalRow?.override?.id) ||
                  !activeRegion?.country_code ||
                  modalRow?.item?.pricing?.admin?.scope !== "country"
                }
              >
                Country ({activeRegion?.country_code || "—"})
              </ModernButton>
            </div>
            {modalRow?.override?.id && (
              <p className="text-xs text-slate-400">
                Scope cannot be changed on existing overrides. Reset first to change scope.
              </p>
            )}
            {!modalRow?.override?.id && modalRow?.item?.pricing?.admin?.scope !== "country" && (
              <p className="text-xs text-slate-400">
                Country price settings require a country-level admin default price.
              </p>
            )}
          </div>

          <ModernInput
            label="Tenant price (USD)"
            type="number"
            min="0"
            step="0.01"
            value={priceValue}
            onChange={(event) => setPriceValue(event.target.value)}
            placeholder="0.00"
          />
          {modalIsBelowAdmin && (
            <p className="text-xs text-rose-500">
              Tenant price cannot be below admin default ({formatCurrency(modalAdminDefault, "USD")}
              ).
            </p>
          )}
        </div>
      </ModernModal>

      <ModernModal
        isOpen={importOpen}
        onClose={closeImportModal}
        title={importResult ? "Import Summary" : "Import Overrides"}
        subtitle="Upload a CSV file to update price settings."
        actions={importModalActions}
      >
        {importResult ? (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
              <div className="text-slate-500">Total rows</div>
              <div className="font-semibold text-slate-800">{importResult.total_rows}</div>
              <div className="text-slate-500">
                {importResult.dry_run ? "Would process" : "Processed"}
              </div>
              <div className="font-semibold text-slate-800">{importResult.processed}</div>
              <div className="text-slate-500">
                {importResult.dry_run ? "Would create/update" : "Succeeded"}
              </div>
              <div className="font-semibold text-slate-800">
                {(importResult.created || 0) + (importResult.updated || 0)}
              </div>
              <div className="text-slate-500">Skipped</div>
              <div className="font-semibold text-slate-800">{importResult.skipped}</div>
              <div className="text-slate-500">Errors</div>
              <div className="font-semibold text-rose-600">
                {(importResult.errors || []).length}
              </div>
            </div>

            {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                  Error details
                </p>
                <div className="max-h-40 overflow-y-auto rounded-2xl border border-rose-100 bg-rose-50 p-3">
                  {importResult.errors.map((error: TenantPricingImportError, index: number) => (
                    <div key={`${error.row}-${index}`} className="mb-2 text-xs text-rose-600">
                      <span className="font-semibold">Row {error.row}: </span>
                      {Array.isArray(error.messages) ? error.messages.join(", ") : error.messages}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <FileInput
              id="tenant-pricing-upload"
              label="Price Settings CSV"
              onChange={(value) => {
                if (value instanceof File) {
                  setImportFile(value);
                } else {
                  const candidate = value?.target?.files?.[0];
                  setImportFile(candidate instanceof File ? candidate : null);
                }
                setImportError("");
              }}
              selectedFile={importFile}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              outputAs="file"
              error={importError}
            />
            <ModernButton
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              isDisabled={!selectedRegion || isExporting}
            >
              <Download size={14} />
              {isExporting ? "Exporting..." : "Download Template"}
            </ModernButton>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={importDryRun}
                onChange={(event) => setImportDryRun(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Perform a dry run (validate without importing)
            </label>
            <p className="text-xs text-slate-400">
              Extra columns in CSV files are stripped before upload.
            </p>
          </div>
        )}
      </ModernModal>
    </TenantPageShell>
  );
};

export default TenantPricingOverrides;
