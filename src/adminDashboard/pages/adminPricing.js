import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell";
import ModernButton from "../components/ModernButton";
import PricingSideMenu from "../components/pricingSideMenu";
import ColocationSetting from "./inventoryComponents/colocation";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import {
  useFetchProductPricing,
  useExportProductPricingTemplate,
} from "../../hooks/adminHooks/adminproductPricingHook";
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
} from "lucide-react";
import AddProductPricing from "./productPricingComps/addProductPricing";
import EditProductPricingModal from "./productPricingComps/editProductPricing";
import DeleteProductPricingModal from "./productPricingComps/deleteProductPricing";
import ToastUtils from "../../utils/toastUtil";
import UploadPricingFileModal from "./productPricingComps/uploadPricingFile";
import ResourceHero from "../components/ResourceHero";
import ResourceDataExplorer from "../components/ResourceDataExplorer";
import ModernCard from "../components/ModernCard";

const formatCurrency = (value) =>
  typeof value === "number" || value
    ? `$${Number(value || 0).toFixed(2)}`
    : "—";

const computeStats = (rows) => {
  const total = rows.length;
  if (!total) {
    return { total: 0, average: 0, highest: 0, uniqueRegions: 0 };
  }

  const prices = rows.map((item) => Number(item.price_usd || 0));
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const highest = Math.max(...prices);
  const uniqueRegions = new Set(
    rows.map((item) => item.region || "global")
  ).size;

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
    name: "Bandwidth Pricing",
    caption: "Network throughput",
    productType: "bandwidth",
    heroTitle: "Bandwidth pricing",
    heroDescription:
      "Tune network throughput tiers so regional rates stay competitive and profitable.",
    tableTitle: "Bandwidth pricing catalogue",
    tableDescription:
      "Review committed data rate SKUs and their monthly pricing per region.",
    icon: Wifi,
    metrics: (stats) => [
      {
        label: "Throughput tiers",
        value: stats.total,
        description: "Active bandwidth SKUs",
        icon: <Wifi className="h-5 w-5" />,
      },
      {
        label: "Avg monthly price",
        value: formatCurrency(stats.average),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Premium tier",
        value: formatCurrency(stats.highest),
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
    name: "OS Images Pricing",
    caption: "Golden templates",
    productType: "os_image",
    heroTitle: "Operating system pricing",
    heroDescription:
      "Keep golden image licensing aligned with vendor requirements across each region.",
    tableTitle: "OS image pricing",
    tableDescription:
      "Monitor licence costs for curated operating system templates.",
    icon: HardDrive,
    metrics: (stats) => [
      {
        label: "Licensed templates",
        value: stats.total,
        description: "Priced OS images",
        icon: <HardDrive className="h-5 w-5" />,
      },
      {
        label: "Average licence",
        value: formatCurrency(stats.average),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest licence",
        value: formatCurrency(stats.highest),
        description: "Premium image cost",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No OS image pricing",
    emptyDescription:
      "Add OS licensing to unlock image provisioning and ensure compliance.",
  },
  {
    id: "volumes",
    name: "Volumes Pricing",
    caption: "Performance tiers",
    productType: "volume_type",
    heroTitle: "Volume pricing",
    heroDescription:
      "Manage block storage tiers and ensure throughput pricing stays predictable.",
    tableTitle: "Volume pricing",
    tableDescription:
      "Review block storage profiles and their configured price points.",
    icon: Database,
    metrics: (stats) => [
      {
        label: "Volume profiles",
        value: stats.total,
        description: "Priced storage tiers",
        icon: <Database className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrency(stats.average),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrency(stats.highest),
        description: "Premium storage tier",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No volume pricing",
    emptyDescription:
      "Define pricing for volume profiles to support storage provisioning flows.",
  },
  {
    id: "object-storage",
    name: "Object Storage Pricing",
    caption: "S3-compatible",
    productType: "object_storage_configuration",
    heroTitle: "Object storage pricing",
    heroDescription:
      "Manage object storage rates so S3-compatible workloads are billed consistently.",
    tableTitle: "Object storage pricing",
    tableDescription:
      "Review per-GB-month pricing for object storage across each region.",
    icon: HardDrive,
    metrics: (stats) => [
      {
        label: "Storage SKUs",
        value: stats.total,
        description: "Priced object storage entries",
        icon: <HardDrive className="h-5 w-5" />,
      },
      {
        label: "Avg GB-month",
        value: formatCurrency(stats.average),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest rate",
        value: formatCurrency(stats.highest),
        description: "Premium storage tier",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No object storage pricing",
    emptyDescription:
      "Set per-GB prices so tenants can consume object storage with transparent billing.",
  },
  {
    id: "compute",
    name: "Compute Pricing",
    caption: "Instance classes",
    productType: "compute_instance",
    heroTitle: "Compute pricing",
    heroDescription:
      "Balance instance class pricing across CPU and memory mixes for each data centre.",
    tableTitle: "Compute pricing",
    tableDescription:
      "Track compute classes and their per-instance pricing across regions.",
    icon: Cpu,
    metrics: (stats) => [
      {
        label: "Instance classes",
        value: stats.total,
        description: "Priced compute profiles",
        icon: <Cpu className="h-5 w-5" />,
      },
      {
        label: "Average hourly rate",
        value: formatCurrency(stats.average),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Top rate",
        value: formatCurrency(stats.highest),
        description: "Highest compute SKU",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No compute pricing",
    emptyDescription:
      "Add compute instance pricing so tenants can size workloads accurately.",
  },
  {
    id: "floating-ips",
    name: "Floating IPs Pricing",
    caption: "Public connectivity",
    productType: "ip",
    heroTitle: "Floating IP pricing",
    heroDescription:
      "Keep public IP pricing aligned with carrier costs across every footprint.",
    tableTitle: "Floating IP pricing",
    tableDescription:
      "Manage routable IP pools and the rates exposed to tenants.",
    icon: Globe,
    metrics: (stats) => [
      {
        label: "IP pools",
        value: stats.total,
        description: "Priced floating IP SKUs",
        icon: <Globe className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrency(stats.average),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrency(stats.highest),
        description: "Premium IP tier",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No floating IP pricing",
    emptyDescription:
      "Price floating IP pools so tenants can expose workloads externally.",
  },
  {
    id: "cross-connects",
    name: "Cross Connects Pricing",
    caption: "Partner links",
    productType: "cross_connect",
    heroTitle: "Cross connect pricing",
    heroDescription:
      "Align partner cross connect pricing with carrier agreements per metro.",
    tableTitle: "Cross connect pricing",
    tableDescription:
      "Review carrier cross connect offers and their monthly pricing.",
    icon: Cable,
    metrics: (stats) => [
      {
        label: "Cross connect SKUs",
        value: stats.total,
        description: "Priced partner links",
        icon: <Cable className="h-5 w-5" />,
      },
      {
        label: "Average price",
        value: formatCurrency(stats.average),
        description: "Across selected region",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        label: "Highest price",
        value: formatCurrency(stats.highest),
        description: "Premium cross connect",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No cross connect pricing",
    emptyDescription:
      "Create cross connect pricing so private links can be ordered.",
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

const TAB_MAP = PRICING_TAB_CONFIG.reduce((acc, tab) => {
  acc[tab.id] = tab;
  return acc;
}, {});

const DEFAULT_TAB_ID = PRICING_TAB_CONFIG[0].id;

export default function AdminPricing({ initialTab = DEFAULT_TAB_ID }) {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTabId = TAB_MAP[initialTab]?.id || DEFAULT_TAB_ID;

  const [activeTab, setActiveTab] = useState(initialTabId);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
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

  const [isAddProductPricingOpen, setAddProductPricing] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [isEditPricingOpen, setEditPricingOpen] = useState(false);
  const [isDeletePricingOpen, setDeletePricingOpen] = useState(false);

  const activeConfig =
    TAB_MAP[activeTab] ?? TAB_MAP[DEFAULT_TAB_ID] ?? PRICING_TAB_CONFIG[0];
  const isColocationTab = Boolean(activeConfig?.isColocation);

  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
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
      productType: isColocationTab ? "" : activeConfig?.productType,
    },
    {
      enabled: !isRegionsFetching && !isColocationTab,
      keepPreviousData: true,
    }
  );
  const { mutate: exportTemplate, isPending: isExporting } =
    useExportProductPricingTemplate();

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
    if (!isRegionsFetching && regions?.length && !selectedRegion) {
      setSelectedRegion(regions[0].code);
    }
  }, [isRegionsFetching, regions, selectedRegion]);

  const pricingRows = useMemo(() => {
    if (isColocationTab) return [];
    const rows = pricingData?.data ?? [];
    return rows.map((item) => ({
      ...item,
      product_name: item.product_name || item.name || "Unnamed product",
    }));
  }, [pricingData, isColocationTab]);

  const matchesProductType = useCallback((value, productType) => {
    if (!productType) return true;
    if (!value) return false;
    const normalized = String(value).toLowerCase();
    const target = productType.toLowerCase();
    return (
      normalized === target ||
      normalized.endsWith(target) ||
      normalized.includes(`${target}_`) ||
      normalized.includes(`\\${target}`) ||
      normalized.includes(`/${target}`)
    );
  }, []);

  const filteredRows = useMemo(() => {
    if (isColocationTab) return [];
    if (!activeConfig?.productType) return pricingRows;
    return pricingRows.filter((row) =>
      matchesProductType(row.productable_type, activeConfig.productType)
    );
  }, [pricingRows, activeConfig, matchesProductType, isColocationTab]);

  const meta = !isColocationTab ? pricingData?.meta ?? null : null;
  const total = !isColocationTab ? filteredRows.length : 0;

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
        ? activeConfig.metrics(pricingStats)
        : [];

    setHeroState({
      title: activeConfig.heroTitle,
      description: activeConfig.heroDescription,
      metrics,
    });
  }, [activeConfig, pricingStats, isColocationTab]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleRegionChange = (regionCode) => {
    setSelectedRegion(regionCode);
    setPage(1);
  };

  const handleSearch = useCallback((value) => {
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

  const handleTabChange = (tabId) => {
    if (!TAB_MAP[tabId] || tabId === activeTab) return;
    setActiveTab(tabId);
    const params = new URLSearchParams(location.search);
    params.set("tab", tabId);
    navigate({ search: params.toString() }, { replace: true });
  };

  const handleColocationSummary = useCallback(
    (payload) => {
      if (!isColocationTab) return;
      setHeroState((prev) => ({
        title: activeConfig.heroTitle,
        description: payload?.description ?? prev.description,
        metrics: Array.isArray(payload?.metrics) ? payload.metrics : prev.metrics,
      }));
    },
    [activeConfig, isColocationTab]
  );

  const openEditPricing = (pricing) => {
    setSelectedPricing(pricing);
    setEditPricingOpen(true);
  };

  const openDeletePricing = (pricing) => {
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

  const columns = useMemo(() => {
    if (isColocationTab) return [];
    return [
      {
        header: "Product",
        key: "product_name",
        render: (row) => (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
              <Package className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {row.product_name}
              </p>
              <p className="text-xs text-slate-500">
                {row.productable_type?.split("\\").pop() || "Product"}
              </p>
            </div>
          </div>
        ),
      },
      {
        header: "Region",
        key: "region",
        align: "center",
        render: (row) => (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {row.region || "Global"}
          </span>
        ),
      },
      {
        header: "Price (USD)",
        key: "price_usd",
        align: "right",
        render: (row) => (
          <span className="font-semibold text-slate-900">
            {formatCurrency(row.price_usd)}
          </span>
        ),
      },
      {
        header: "",
        key: "actions",
        align: "right",
        render: (row) => (
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
  }, [isColocationTab]);

  const actionButtons =
    !isColocationTab ? (
      <div className="flex flex-wrap gap-2">
        <ModernButton
          onClick={handleExport}
          disabled={isExporting || !selectedRegion}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
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
          onClick={() => setAddProductPricing(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add pricing
        </ModernButton>
      </div>
    ) : null;

  const regionSelector = (
    <div className="w-full sm:w-auto">
      <label className="mb-2 block text-sm font-medium text-slate-600">
        Select Region
      </label>
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
          regions?.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))
        )}
      </select>
    </div>
  );

  const content = !isColocationTab ? (
    <ResourceDataExplorer
      title={activeConfig.tableTitle}
      description={activeConfig.tableDescription}
      columns={columns}
        rows={pricingRows}
        rows={filteredRows}
        loading={isRegionsFetching || isPricingFetching}
        page={meta?.current_page ?? page}
        perPage={meta?.per_page ?? perPage}
        total={total}
      meta={meta}
      onPageChange={setPage}
      onPerPageChange={(next) => {
        setPerPage(next);
        setPage(1);
      }}
      searchValue={search}
      onSearch={handleSearch}
      toolbarSlot={null}
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
            onClick={() => setAddProductPricing(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add pricing
          </ModernButton>
        ),
      }}
    />
  ) : (
    <ColocationSetting
      selectedRegion={selectedRegion}
      onMetricsChange={handleColocationSummary}
    />
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
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
              {regionSelector}
              {actionButtons}
            </div>
          }
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <PricingSideMenu
            activeTab={activeTab}
            onTabChange={handleTabChange}
            items={menuItems}
          />
          <ModernCard className="flex-1 border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
            {error && !isColocationTab ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-600">
                Failed to load pricing catalogue: {error.message}
              </div>
            ) : (
              content
            )}
          </ModernCard>
        </div>
      </AdminPageShell>

      <AddProductPricing
        isOpen={isAddProductPricingOpen}
        onClose={() => setAddProductPricing(false)}
      />
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
    </>
  );
}
