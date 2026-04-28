import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import PricingSideMenu from "../components/pricingSideMenu";
import ColocationSetting from "./inventoryComponents/colocation";
import { useFetchRegions, useFetchAvailabilityZones } from "@/hooks/adminHooks/regionHooks";
import {
  useFetchProductPricing,
  useExportProductPricingTemplate,
} from "@/hooks/adminHooks/adminProductPricingHooks";
import {
  useFetchAnyCloudFlowPricing,
  useUpdateAnyCloudFlowPrice,
} from "@/hooks/adminHooks/adminAnyCloudFlowPricingHooks";
import TieredPricingModal from "./productPricingComps/TieredPricingModal";
import {
  Loader2,
  DollarSign,
  TrendingUp,
  Package,
  Globe,
  Plus,
  Upload,
  Download,
  Pencil,
  Trash2,
  Wifi,
  HardDrive,
  Database,
  Cpu,
  Cable,
  Building2,
  Shield,
  Layers,
} from "lucide-react";
import EditProductPricingModal from "./productPricingComps/editProductPricing";
import DeleteProductPricingModal from "./productPricingComps/deleteProductPricing";
import ToastUtils from "@/utils/toastUtil";
import UploadPricingFileModal from "./productPricingComps/uploadPricingFile";
import ResourceHero from "@/shared/components/ui/ResourceHero";
import ResourceDataExplorer from "../components/ResourceDataExplorer";
import { ModernCard, ProviderBadge, getRegionOptionLabel } from "@/shared/components/ui";
import { matchesProductType } from "@/utils/productTypeUtils";
import { getCurrencySymbol } from "@/utils/resource";

const SUPPORTED_CURRENCIES = [
  { code: "", label: "Original" },
  { code: "USD", label: "USD ($)" },
  { code: "NGN", label: "NGN (₦)" },
  { code: "GBP", label: "GBP (£)" },
  { code: "EUR", label: "EUR (€)" },
] as const;

interface PricingRow {
  id?: string | number;
  name?: string;
  description?: string;
  product_name?: string;
  productable_type?: string;
  display_price?: number | string;
  display_currency?: string;
  currency_code?: string;
  price_usd?: number | string;
  region?: string;
  availability_zone?: string;
  provider?: string;
  billing_model?: string;
  unit_label?: string;
  pricing_tiers?: unknown[];
  tenant_override_count?: number;
  [key: string]: unknown;
}

const formatCurrencyValue = (value: unknown, currencyCode?: string) => {
  if (typeof value !== "number" && !value) return "—";
  const num = Number(value || 0);
  const symbol = getCurrencySymbol(currencyCode || "USD");
  return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const computeStats = (rows: PricingRow[]) => {
  const total = rows.length;
  if (!total) {
    return { total: 0, average: 0, highest: 0, uniqueRegions: 0 };
  }

  const prices = rows.map((item) => Number(item.display_price ?? item.price_usd ?? 0));
  const sum = prices.reduce((acc: number, price: number) => acc + price, 0);
  const highest = Math.max(...prices);
  const uniqueRegions = new Set(rows.map((item) => item.region || "global")).size;

  return {
    total,
    average: sum / total,
    highest,
    uniqueRegions,
  };
};
const PRICING_TAB_CONFIG = [
  {
    id: "bandwidth",
    name: "Bandwidth",
    caption: "Network throughput",
    productType: "bandwidth",
    heroTitle: "Bandwidth pricing",
    heroDescription:
      "Tune network throughput tiers so regional rates stay competitive and profitable.",
    tableTitle: "Bandwidth pricing catalogue",
    tableDescription: "Review committed data rate SKUs and their monthly pricing per region.",
    icon: Wifi,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "Throughput tiers",
        value: stats.total,
        description: "Active bandwidth SKUs",
        icon: <Wifi className="h-5 w-5" />,
      },
      {
        label: "Avg monthly price",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Premium tier",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Highest configured rate",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No bandwidth pricing",
    emptyDescription:
      "Add bandwidth rates so provisioning and quoting teams can price throughput tiers.",
  },
  {
    id: "os-images",
    name: "OS Images",
    caption: "Golden templates",
    productType: "os_image",
    heroTitle: "Operating system pricing",
    heroDescription:
      "Keep golden image licensing aligned with vendor requirements across each region.",
    tableTitle: "OS image pricing",
    tableDescription: "Monitor licence costs for curated operating system templates.",
    icon: HardDrive,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "Licensed templates",
        value: stats.total,
        description: "Priced OS images",
        icon: <HardDrive className="h-5 w-5" />,
      },
      {
        label: "Average licence",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest licence",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Premium image cost",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No OS image pricing",
    emptyDescription: "Add OS licensing to unlock image provisioning and ensure compliance.",
  },
  {
    id: "volumes",
    name: "Volumes",
    caption: "Performance tiers",
    productType: "volume_type",
    heroTitle: "Volume pricing",
    heroDescription: "Manage block storage tiers and ensure throughput pricing stays predictable.",
    tableTitle: "Volume pricing",
    tableDescription: "Review block storage profiles and their configured price points.",
    icon: Database,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "Volume profiles",
        value: stats.total,
        description: "Priced storage tiers",
        icon: <Database className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Premium storage tier",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No volume pricing",
    emptyDescription: "Define pricing for volume profiles to support storage provisioning flows.",
  },
  {
    id: "object-storage",
    name: "Silo Storage",
    caption: "S3-compatible",
    productType: "object_storage_configuration",
    heroTitle: "Object storage pricing",
    heroDescription:
      "Manage Silo Storage rates so S3-compatible workloads are billed consistently.",
    tableTitle: "Object storage pricing",
    tableDescription: "Review per-GB-month pricing for Silo Storage across each region.",
    icon: HardDrive,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "Storage SKUs",
        value: stats.total,
        description: "Priced Silo Storage entries",
        icon: <HardDrive className="h-5 w-5" />,
      },
      {
        label: "Avg GB-month",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest rate",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Premium storage tier",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No Silo Storage pricing",
    emptyDescription:
      "Set per-GB prices so tenants can consume Silo Storage with transparent billing.",
  },
  {
    id: "compute",
    name: "Compute",
    caption: "Instance classes",
    productType: "compute_instance",
    heroTitle: "Compute pricing",
    heroDescription:
      "Balance instance class pricing across CPU and memory mixes for each data centre.",
    tableTitle: "Compute pricing",
    tableDescription: "Track compute classes and their per-instance pricing across regions.",
    icon: Cpu,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "Instance classes",
        value: stats.total,
        description: "Priced compute profiles",
        icon: <Cpu className="h-5 w-5" />,
      },
      {
        label: "Average hourly rate",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Top rate",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Highest compute SKU",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No compute pricing",
    emptyDescription: "Add compute instance pricing so tenants can size workloads accurately.",
  },
  {
    id: "floating-ips",
    name: "Floating IPs",
    caption: "Public connectivity",
    productType: "ip",
    heroTitle: "Floating IP pricing",
    heroDescription: "Keep public IP pricing aligned with carrier costs across every footprint.",
    tableTitle: "Floating IP pricing",
    tableDescription: "Manage routable IP pools and the rates exposed to tenants.",
    icon: Globe,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "IP pools",
        value: stats.total,
        description: "Priced floating IP SKUs",
        icon: <Globe className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Premium IP tier",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No floating IP pricing",
    emptyDescription: "Price floating IP pools so tenants can expose workloads externally.",
  },
  {
    id: "cross-connects",
    name: "Cross Connects",
    caption: "Partner links",
    productType: "cross_connect",
    heroTitle: "Cross connect pricing",
    heroDescription: "Align partner cross connect pricing with carrier agreements per metro.",
    tableTitle: "Cross connect pricing",
    tableDescription: "Review carrier cross connect offers and their monthly pricing.",
    icon: Cable,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "Cross connect SKUs",
        value: stats.total,
        description: "Priced partner links",
        icon: <Cable className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Premium cross connect",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No cross connect pricing",
    emptyDescription: "Create cross connect pricing so private links can be ordered.",
  },
  {
    id: "managed-databases",
    name: "Lattice Databases",
    caption: "Dedicated VMs",
    productType: "managed_database_plan",
    heroTitle: "Lattice database pricing",
    heroDescription: "Set pricing for Lattice database plans across engines and regions.",
    tableTitle: "Lattice database pricing",
    tableDescription: "Review Lattice database plan pricing for MongoDB, PostgreSQL, MySQL, MariaDB, and Redis.",
    icon: Database,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }, currency?: string) => [
      {
        label: "Database plans",
        value: stats.total,
        description: "Priced DB plans",
        icon: <Database className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrencyValue(stats.average, currency),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrencyValue(stats.highest, currency),
        description: "Premium database plan",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No Lattice database pricing",
    emptyDescription: "Add database plan pricing to enable Lattice database provisioning.",
  },
  {
    id: "anycloudflow",
    name: "AnyCloudFlow",
    caption: "Platform services",
    productType: "integration_product",
    heroTitle: "AnyCloudFlow service pricing",
    heroDescription:
      "Manage backup, disaster recovery, replication, and migration service rates. These are global platform services — not region-specific.",
    tableTitle: "Service pricing",
    tableDescription: "Review and adjust platform service pricing — these apply globally, not per region.",
    icon: Shield,
    isGlobal: true,
    metrics: (stats: { total: number; average: number; highest: number; uniqueRegions: number }) => [
      {
        label: "Services",
        value: stats.total,
        description: "Active platform services",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrencyValue(stats.average),
        description: "Across all services",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrencyValue(stats.highest),
        description: "Most expensive service",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No AnyCloudFlow pricing",
    emptyDescription: "Run the AnyCloudFlow seeder to populate platform service pricing.",
  },
  {
    id: "colocation",
    name: "Rack & power",
    caption: "Colocation markup",
    heroTitle: "Rack & power",
    heroDescription:
      "Tune colocation markups so rack and power rates stay profitable and predictable.",
    icon: Building2,
    isColocation: true,
  },
];

type PricingTabConfig = (typeof PRICING_TAB_CONFIG)[number];

const TAB_MAP = PRICING_TAB_CONFIG.reduce(
  (acc: Record<string, PricingTabConfig>, tab) => {
    acc[tab.id] = tab;
    return acc;
  },
  {} as Record<string, PricingTabConfig>
);

const DEFAULT_TAB_ID = PRICING_TAB_CONFIG[0]?.id ?? "compute";

interface AdminPricingProps {
  initialTab?: string;
}

export default function AdminPricing({ initialTab = DEFAULT_TAB_ID }: AdminPricingProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTabId = TAB_MAP[initialTab]?.id || DEFAULT_TAB_ID;

  const [activeTab, setActiveTab] = useState(initialTabId);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedAZ, setSelectedAZ] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [heroState, setHeroState] = useState(() => {
    const config = TAB_MAP[initialTabId];
    return {
      title: config.heroTitle,
      description: config.heroDescription,
      metrics: [],
    };
  });
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<PricingRow | null>(null);
  const [isEditPricingOpen, setEditPricingOpen] = useState(false);
  const [isDeletePricingOpen, setDeletePricingOpen] = useState(false);

  const activeConfig = TAB_MAP[activeTab] ?? TAB_MAP[DEFAULT_TAB_ID] ?? PRICING_TAB_CONFIG[0];
  const isColocationTab = Boolean(activeConfig?.isColocation);
  const isGlobalTab = Boolean(activeConfig?.isGlobal);

  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { isFetching: isAZsFetching, data: azData } = useFetchAvailabilityZones(
    selectedRegion || undefined
  );
  const azList = useMemo(() => (Array.isArray(azData) ? azData : []), [azData]);
  const {
    isFetching: isPricingFetching,
    data: pricingData,
    error,
  } = useFetchProductPricing(
    {
      region: selectedRegion,
      page,
      perPage,
      search,
      productType: isColocationTab || isGlobalTab ? "" : activeConfig?.productType,
      availabilityZone: selectedAZ,
      displayCurrency,
    },
    {
      enabled: !isRegionsFetching && !isColocationTab && !isGlobalTab,
      keepPreviousData: true,
    }
  );

  const {
    isFetching: isAcfFetching,
    data: acfData,
    error: acfError,
  } = useFetchAnyCloudFlowPricing({
    enabled: isGlobalTab,
  });
  const { mutate: updateAcfPrice, isPending: isAcfUpdating } = useUpdateAnyCloudFlowPrice();
  const [editingAcfService, setEditingAcfService] = useState<Record<string, unknown> | null>(null);
  const [acfEditPrice, setAcfEditPrice] = useState("");
  const [tieredPricingService, setTieredPricingService] = useState<Record<string, unknown> | null>(null);
  const { mutate: exportTemplate, isPending: isExporting } = useExportProductPricingTemplate();
  const regionsList = useMemo(
    () => (Array.isArray(regions) ? (regions as Array<{ code: string; name?: string }>) : []),
    [regions]
  );
  const pricingPayload = pricingData as { data?: unknown[]; meta?: Record<string, unknown> } | undefined;

  const menuItems = useMemo(
    () =>
      PRICING_TAB_CONFIG.map(({ id, name, caption, icon }) => ({
        id,
        name,
        caption,
        icon,
      })),
    []
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && TAB_MAP[tabParam] && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location.search, activeTab]);

  useEffect(() => {
    setHeroState({
      title: activeConfig.heroTitle,
      description: activeConfig.heroDescription,
      metrics: [],
    });
  }, [activeConfig]);

  useEffect(() => {
    setSearch("");
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (!isRegionsFetching && regionsList.length && !selectedRegion) {
      setSelectedRegion(regionsList[0]!.code);
    }
  }, [isRegionsFetching, regionsList, selectedRegion]);

  const pricingRows = useMemo<PricingRow[]>(() => {
    if (isColocationTab) return [];
    if (isGlobalTab) {
      const rows = (acfData as { data?: unknown[] } | undefined)?.data ?? [];
      return (rows as PricingRow[]).map((item) => ({
        ...item,
        product_name: item.name || "Unnamed service",
      }));
    }
    const rows = (pricingPayload?.data ?? []) as PricingRow[];
    return rows.map((item) => ({
      ...item,
      product_name: item.product_name || item.name || "Unnamed product",
    }));
  }, [pricingPayload, acfData, isColocationTab, isGlobalTab]);

  const filteredRows = useMemo<PricingRow[]>(() => {
    if (isColocationTab) return [];
    if (isGlobalTab) return pricingRows;
    if (!activeConfig || !("productType" in activeConfig) || !activeConfig.productType) return pricingRows;
    return pricingRows.filter((row) =>
      matchesProductType(row.productable_type as string | undefined, (activeConfig as { productType: string }).productType)
    );
  }, [pricingRows, activeConfig, isColocationTab, isGlobalTab]);

  const meta = (!isColocationTab && !isGlobalTab) ? (pricingPayload?.meta ?? null) : null;
  const total = (!isColocationTab) ? filteredRows.length : 0;

  const pricingStats = useMemo(() => {
    if (isColocationTab) {
      return { total: 0, average: 0, highest: 0, uniqueRegions: 0 };
    }
    const stats = computeStats(filteredRows);
    return { ...stats, total };
  }, [filteredRows, total, isColocationTab]);

  useEffect(() => {
    if (!activeConfig || isColocationTab) {
      return;
    }

    const metrics =
      typeof activeConfig.metrics === "function"
        ? activeConfig.metrics(pricingStats, displayCurrency || undefined)
        : [];

    setHeroState({
      title: activeConfig.heroTitle,
      description: activeConfig.heroDescription,
      metrics,
    });
  }, [activeConfig, pricingStats, isColocationTab, displayCurrency]);

  const handleRegionChange = (regionCode: string) => {
    setSelectedRegion(regionCode);
    setSelectedAZ("");
    setPage(1);
  };
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleExport = () => {
    if (!selectedRegion) {
      ToastUtils.warning("Please select a region before exporting.");
      return;
    }
    exportTemplate(selectedRegion, {
      onSuccess: () => ToastUtils.success("Template exported successfully!"),
    });
  };
  const handleTabChange = (tabId: string) => {
    if (!TAB_MAP[tabId] || tabId === activeTab) return;
    setActiveTab(tabId);
    const params = new URLSearchParams(location.search);
    params.set("tab", tabId);
    navigate({ search: params.toString() }, { replace: true });
  };
  const handleColocationSummary = useCallback(
    (payload: { description?: string; metrics?: unknown[] }) => {
      if (!isColocationTab) return;
      setHeroState((prev) => ({
        title: activeConfig.heroTitle,
        description: payload?.description ?? prev.description,
        metrics: Array.isArray(payload?.metrics) ? payload.metrics : prev.metrics,
      }));
    },
    [activeConfig, isColocationTab]
  );

  const openEditPricing = (pricing: PricingRow) => {
    setSelectedPricing(pricing);
    setEditPricingOpen(true);
  };
  const openDeletePricing = (pricing: PricingRow) => {
    setSelectedPricing(pricing);
    setDeletePricingOpen(true);
  };
  const closeEditPricing = () => {
    setEditPricingOpen(false);
    setSelectedPricing(null);
  };
  const closeDeletePricing = () => {
    setDeletePricingOpen(false);
    setSelectedPricing(null);
  };

  const bulkActions: { label: string; icon: React.ReactNode; onClick: (ids: string[], rows: Record<string, unknown>[]) => void }[] = useMemo(
    () => [],
    []
  );

  const handleAcfSave = (service: PricingRow) => {
    if (service.id == null) return;
    const newPrice = parseFloat(acfEditPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      ToastUtils.error("Please enter a valid price.");
      return;
    }
    updateAcfPrice(
      { id: Number(service.id), price_usd: newPrice },
      {
        onSuccess: () => {
          ToastUtils.success(`Price updated for ${service.name}.`);
          setEditingAcfService(null);
          setAcfEditPrice("");
        },
        onError: () => {
          ToastUtils.error("Failed to update price.");
        },
      }
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy column type from ResourceDataExplorer; refactoring would require changing the explorer API
  const columns = useMemo<unknown[]>(() => {
    if (isColocationTab) return [];

    if (isGlobalTab) {
      return [
        {
          header: "Service",
          key: "name",
          render: (row: PricingRow) => (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Shield className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{row.description}</p>
              </div>
            </div>
          ),
        },
        {
          header: "Billing Model",
          key: "billing_model",
          align: "center",
          render: (row: PricingRow) => (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {(row.billing_model || "").replace(/_/g, " ")}
            </span>
          ),
        },
        {
          header: "Unit",
          key: "unit_label",
          align: "center",
          render: (row: PricingRow) => (
            <span className="text-xs text-slate-500">{row.unit_label || "—"}</span>
          ),
        },
        {
          header: "Base Price (USD)",
          key: "price_usd",
          align: "right",
          render: (row: PricingRow) => {
            if (editingAcfService?.id === row.id) {
              return (
                <div className="flex items-center justify-end gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={acfEditPrice}
                    onChange={(e) => setAcfEditPrice(e.target.value)}
                    className="w-28 rounded-lg border border-primary-300 px-3 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleAcfSave(row)}
                    disabled={isAcfUpdating}
                    className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 disabled:opacity-50"
                  >
                    {isAcfUpdating ? "..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAcfService(null);
                      setAcfEditPrice("");
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              );
            }
            return (
              <span className="font-semibold text-slate-900">
                {formatCurrencyValue(row.price_usd)}
              </span>
            );
          },
        },
        {
          header: "Tiers",
          key: "pricing_tiers",
          align: "center",
          render: (row: PricingRow) => {
            const tierCount = row.pricing_tiers?.length ?? 0;
            return tierCount > 0 ? (
              <button
                type="button"
                onClick={() => setTieredPricingService(row)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
              >
                <Layers className="h-3 w-3" />
                {tierCount} tier{tierCount !== 1 ? "s" : ""}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTieredPricingService(row)}
                className="text-xs text-slate-400 transition hover:text-primary-500"
              >
                + Add tiers
              </button>
            );
          },
        },
        {
          header: "Tenants",
          key: "tenant_override_count",
          align: "center",
          render: (row: PricingRow) => (
            <span className="text-xs text-slate-500">
              {row.tenant_override_count ?? 0} override{(row.tenant_override_count ?? 0) !== 1 ? "s" : ""}
            </span>
          ),
        },
        {
          header: "",
          key: "actions",
          align: "right",
          render: (row: PricingRow) => (
            <button
              type="button"
              onClick={() => {
                setEditingAcfService(row);
                setAcfEditPrice(String(row.price_usd ?? ""));
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
              title="Edit pricing"
              aria-label="Edit pricing"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ),
        },
      ];
    }

    return [
      {
        header: "Product",
        key: "product_name",
        render: (row: PricingRow) => (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{row.product_name}</p>
              <p className="text-xs text-slate-500">
                {row.productable_type?.split("\\").pop() || "Product"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Provider",
        key: "provider",
        align: "center",
        render: (row: PricingRow) => <ProviderBadge provider={row.provider} />,
      },
      {
        header: "Region",
        key: "region",
        align: "center",
        render: (row: PricingRow) => (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {row.region || "Global"}
          </span>
        ),
      },
      {
        header: "AZ",
        key: "availability_zone",
        align: "center",
        render: (row: PricingRow) =>
          row.availability_zone ? (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {row.availability_zone}
            </span>
          ) : (
            <span className="text-xs text-slate-400">All</span>
          ),
      },
      {
        header: "Price",
        key: "price_usd",
        align: "right",
        render: (row: PricingRow) => {
          const price = row.display_price ?? row.price_usd;
          const currency = row.display_currency ?? row.currency_code ?? "USD";
          return (
            <div className="text-right">
              <span className="font-semibold text-slate-900">
                {formatCurrencyValue(price, currency)}
              </span>
              {row.display_currency && row.currency_code && row.display_currency !== row.currency_code && (
                <p className="text-xs text-slate-400">
                  {formatCurrencyValue(row.price_usd, row.currency_code)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        header: "",
        key: "actions",
        align: "right",
        render: (row: PricingRow) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => openEditPricing(row)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
              title="Edit pricing"
              aria-label="Edit pricing"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => openDeletePricing(row)}
              className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
              title="Remove pricing"
              aria-label="Remove pricing"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ),
      },
    ];
  }, [isColocationTab, isGlobalTab, editingAcfService, acfEditPrice, isAcfUpdating]);

  const actionButtons = isGlobalTab ? null : !isColocationTab ? (
    <div className="flex flex-wrap gap-2">
      <ModernButton
        onClick={handleExport}
        disabled={isExporting || !selectedRegion}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {isExporting ? "Exporting..." : "Export"}
      </ModernButton>
      <ModernButton
        onClick={() => setUploadModalOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Upload size={16} />
        Upload
      </ModernButton>
      <ModernButton
        onClick={() => {
          const params = new URLSearchParams();
          if (selectedRegion) params.set("region", selectedRegion);
          if (selectedAZ) params.set("az", selectedAZ);
          if (activeConfig?.productType) params.set("tab", activeConfig.productType);
          navigate(`/admin-dashboard/pricing/edit?${params.toString()}`);
        }}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Pencil size={16} />
        Edit All
      </ModernButton>
      <ModernButton
        onClick={() => navigate("/admin-dashboard/pricing/add")}
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus size={16} />
        Add pricing
      </ModernButton>
    </div>
  ) : null;

  const regionSelector = (
    <div className="flex flex-col gap-3 w-full sm:w-auto">
      <div className="w-full sm:w-auto">
        <label className="mb-2 block text-sm font-medium text-slate-600">Select Region</label>
        <select
          value={selectedRegion}
          onChange={(event) => handleRegionChange(event.target.value)}
          className="w-full min-w-[220px] rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRegionsFetching}
        >
          <option value="">All Regions</option>
          {isRegionsFetching ? (
            <option value="" disabled>
              Loading regions...
            </option>
          ) : (
            regionsList.map((region) => (
              <option key={region.code} value={region.code}>
                {getRegionOptionLabel(region)}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label className="mb-2 block text-sm font-medium text-slate-600">Availability Zone</label>
        <select
          value={selectedAZ}
          onChange={(event) => {
            setSelectedAZ(event.target.value);
            setPage(1);
          }}
          className="w-full min-w-[220px] rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!selectedRegion || isAZsFetching}
        >
          <option value="">All AZs</option>
          {isAZsFetching ? (
            <option value="" disabled>
              Loading availability zones...
            </option>
          ) : (
            (azList as Array<{ code: string; name?: string; provider?: string }>).map((az) => (
              <option key={az.code} value={az.code}>
                {az.name || az.code} ({az.provider})
              </option>
            ))
          )}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label className="mb-2 block text-sm font-medium text-slate-600">Currency</label>
        <select
          value={displayCurrency}
          onChange={(event) => {
            setDisplayCurrency(event.target.value);
            setPage(1);
          }}
          className="w-full min-w-[220px] rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const regionSelector_ = isGlobalTab ? (
    <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-3">
      <Globe className="h-4 w-4 text-purple-500" />
      <span className="text-sm font-medium text-purple-700">Global — not region-specific</span>
    </div>
  ) : regionSelector;

  const content = !isColocationTab ? (
    <ResourceDataExplorer
      title={activeConfig.tableTitle}
      description={activeConfig.tableDescription}
      columns={columns as React.ComponentProps<typeof ResourceDataExplorer>["columns"]}
      rows={filteredRows}
      loading={isGlobalTab ? isAcfFetching : (isRegionsFetching || isPricingFetching)}
      page={(meta?.current_page as number | undefined) ?? page}
      perPage={(meta?.per_page as number | undefined) ?? perPage}
      total={total}
      meta={meta}
      onPageChange={setPage}
      onPerPageChange={(next: number) => {
        setPerPage(next);
        setPage(1);
      }}
      searchValue={search}
      onSearch={handleSearch}
      toolbarSlot={null}
      selectable
      bulkActions={bulkActions}
      emptyState={{
        icon: (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
            {activeConfig.icon ? (
              <activeConfig.icon className="h-5 w-5" />
            ) : (
              <Package className="h-5 w-5" />
            )}
          </span>
        ),
        title: activeConfig.emptyTitle || "No pricing entries",
        description:
          activeConfig.emptyDescription ||
          "Add pricing data to unlock quoting workflows for this region.",
        action: (
          <ModernButton
            onClick={() => navigate("/admin-dashboard/pricing/add")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add pricing
          </ModernButton>
        ),
      }}
    />
  ) : (
    <ColocationSetting selectedRegion={selectedRegion} onMetricsChange={handleColocationSummary} />
  );

  return (
    <>
      <AdminPageShell
        contentClassName="space-y-8"
        description="Align pricing across compute, storage, networking, and rack services for every region."
      >
        <ResourceHero
          title={heroState.title}
          subtitle="Billing"
          description={heroState.description}
          metrics={heroState.metrics}
          accent="midnight"
          rightSlot={
            <div className="flex flex-col items-end gap-3">
              {regionSelector_}
              {actionButtons}
            </div>
          }
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <PricingSideMenu activeTab={activeTab} onTabChange={handleTabChange} items={menuItems} />
          <ModernCard className="flex-1 border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
            {(isGlobalTab ? acfError : error) && !isColocationTab ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
                Failed to load pricing catalogue: {(isGlobalTab ? acfError : error)?.message}
              </div>
            ) : (
              content
            )}
          </ModernCard>
        </div>
      </AdminPageShell>

      <UploadPricingFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
      <EditProductPricingModal
        isOpen={isEditPricingOpen}
        onClose={closeEditPricing}
        pricing={selectedPricing}
      />
      <DeleteProductPricingModal
        isOpen={isDeletePricingOpen}
        onClose={closeDeletePricing}
        pricing={selectedPricing}
      />
      <TieredPricingModal
        isOpen={!!tieredPricingService}
        onClose={() => setTieredPricingService(null)}
        service={tieredPricingService as unknown as { id: number; name: string; price_usd: number; pricing_tiers: never[]; unit_label?: string } | null}
      />
    </>
  );
}
