import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  Package,
  Globe,
  DollarSign,
  Zap,
  Wifi,
  HardDrive,
  Database,
  Cpu,
  Cable,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import ResourceHero from "../components/ResourceHero";
import ResourceDataExplorer from "../components/ResourceDataExplorer";
import PricingSideMenu from "../components/pricingSideMenu";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchCountries } from "../../hooks/resource";
import { useFetchProducts } from "../../hooks/adminHooks/adminProductHooks";
import EditProduct from "./productComps/editProduct";
import DeleteProduct from "./productComps/deleteProduct";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import ToastUtils from "../../utils/toastUtil";

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `$${Number(value).toFixed(2)}`;
};

const matchesProductType = (rawType, productType) => {
  if (!productType) return true;
  if (!rawType) return false;
  const normalized = String(rawType).toLowerCase();
  const target = productType.toLowerCase();
  return (
    normalized === target ||
    normalized.endsWith(target) ||
    normalized.includes(`${target}_`) ||
    normalized.includes(`\\${target}`) ||
    normalized.includes(`/${target}`)
  );
};

const deriveProductStats = (rows) => {
  const total = rows.length;
  if (!total) {
    return {
      total: 0,
      active: 0,
      regionCount: 0,
    };
  }
  const regionSet = new Set(rows.map((item) => item.region || "Global"));
  const activeCount = rows.filter(
    (item) => (item.status || "").toLowerCase() === "active"
  ).length;
  return {
    total,
    active: activeCount,
    regionCount: regionSet.size,
  };
};

const PRODUCT_TAB_CONFIG = [
  {
    id: "bandwidth",
    name: "Bandwidth",
    caption: "Network throughput",
    productType: "bandwidth",
    heroTitle: "Bandwidth catalogue",
    heroDescription:
      "Manage network throughput profiles so quoting and provisioning stay aligned with carrier costs.",
    tableTitle: "Bandwidth products",
    tableDescription:
      "Review committed bandwidth tiers and confirm they are available for provisioning.",
    icon: Wifi,
    metrics: (stats) => [
      {
        label: "Throughput tiers",
        value: stats.total,
        description: "Available bandwidth SKUs",
        icon: <Wifi className="h-5 w-5" />,
      },
      {
        label: "Active listings",
        value: stats.active,
        description: "Currently enabled products",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        label: "Regions covered",
        value: stats.regionCount,
        description: "Regional availability",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No bandwidth products",
    emptyDescription:
      "Add bandwidth SKUs so tenants can request the throughput they need.",
  },
  {
    id: "os-images",
    name: "OS Images",
    caption: "Golden templates",
    productType: "os_image",
    heroTitle: "Operating system catalogue",
    heroDescription:
      "Keep golden images ready for provisioning and ensure licensing stays organised per region.",
    tableTitle: "OS image products",
    tableDescription:
      "Monitor curated operating system templates exposed to provisioning flows.",
    icon: HardDrive,
    metrics: (stats) => [
      {
        label: "Templates",
        value: stats.total,
        description: "Available OS images",
        icon: <HardDrive className="h-5 w-5" />,
      },
      {
        label: "Active listings",
        value: stats.active,
        description: "Templates ready for builds",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        label: "Regions covered",
        value: stats.regionCount,
        description: "Regional availability",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No OS image products",
    emptyDescription:
      "Import or create OS image entries so provisioning can target the correct templates.",
  },
  {
    id: "volumes",
    name: "Volumes",
    caption: "Performance tiers",
    productType: "volume_type",
    heroTitle: "Volume catalogue",
    heroDescription:
      "Oversee block storage profiles and ensure capacity is mapped across regions.",
    tableTitle: "Volume products",
    tableDescription:
      "Review block storage options exposed to tenants and provisioning workflows.",
    icon: Database,
    metrics: (stats) => [
      {
        label: "Volume profiles",
        value: stats.total,
        description: "Storage SKUs",
        icon: <Database className="h-5 w-5" />,
      },
      {
        label: "Active listings",
        value: stats.active,
        description: "Enabled storage tiers",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        label: "Regions covered",
        value: stats.regionCount,
        description: "Where this tier is offered",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No volume products",
    emptyDescription:
      "Add block storage tiers so workloads can be provisioned against the correct volume types.",
  },
  {
    id: "object-storage",
    name: "Object Storage",
    caption: "S3-compatible",
    productType: "object_storage_configuration",
    heroTitle: "Object storage catalogue",
    heroDescription:
      "Track S3-compatible storage availability, pricing, and quotas across regions.",
    tableTitle: "Object storage products",
    tableDescription:
      "Review regional object storage SKUs and confirm pricing aligns with provider costs.",
    icon: HardDrive,
    metrics: (stats) => [
      {
        label: "Storage SKUs",
        value: stats.total,
        description: "Available object storage entries",
        icon: <HardDrive className="h-5 w-5" />,
      },
      {
        label: "Active listings",
        value: stats.active,
        description: "Provisionable storage tiers",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        label: "Regions covered",
        value: stats.regionCount,
        description: "Regional availability",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No object storage products",
    emptyDescription:
      "Add object storage SKUs so tenants can provision and manage bucket-based storage.",
  },
  {
    id: "compute",
    name: "Compute",
    caption: "Instance classes",
    productType: "compute_instance",
    heroTitle: "Compute catalogue",
    heroDescription:
      "Curate compute classes that balance CPU, memory, and storage to meet tenant requirements.",
    tableTitle: "Compute products",
    tableDescription:
      "Inspect compute SKUs and confirm they are available for tenant workloads.",
    icon: Cpu,
    metrics: (stats) => [
      {
        label: "Instance classes",
        value: stats.total,
        description: "Compute SKUs",
        icon: <Cpu className="h-5 w-5" />,
      },
      {
        label: "Active listings",
        value: stats.active,
        description: "Provisionable compute products",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        label: "Regions covered",
        value: stats.regionCount,
        description: "Regional availability",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No compute products",
    emptyDescription:
      "Create compute SKUs to keep provisioning pipelines aligned with hardware availability.",
  },
  {
    id: "floating-ips",
    name: "Floating IPs",
    caption: "Public connectivity",
    productType: "ip",
    heroTitle: "Floating IP catalogue",
    heroDescription:
      "Track routable IP pools and ensure pricing and provisioning visibility stay consistent.",
    tableTitle: "Floating IP products",
    tableDescription:
      "Review floating IP pools exposed to tenant networking workflows.",
    icon: Globe,
    metrics: (stats) => [
      {
        label: "IP pools",
        value: stats.total,
        description: "Floating IP SKUs",
        icon: <Globe className="h-5 w-5" />,
      },
      {
        label: "Active listings",
        value: stats.active,
        description: "Pools ready for allocation",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        label: "Regions covered",
        value: stats.regionCount,
        description: "Where pools are exposed",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No floating IP products",
    emptyDescription:
      "Add floating IP pools so public connectivity can be provisioned for workloads.",
  },
  {
    id: "cross-connects",
    name: "Cross Connects",
    caption: "Partner links",
    productType: "cross_connect",
    heroTitle: "Cross connect catalogue",
    heroDescription:
      "Monitor private connectivity offerings and make sure partnerships stay visible to teams.",
    tableTitle: "Cross connect products",
    tableDescription:
      "Review carrier cross connect SKUs and their availability.",
    icon: Cable,
    metrics: (stats) => [
      {
        label: "Cross connect SKUs",
        value: stats.total,
        description: "Partner links",
        icon: <Cable className="h-5 w-5" />,
      },
      {
        label: "Active listings",
        value: stats.active,
        description: "Provisionable links",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        label: "Regions covered",
        value: stats.regionCount,
        description: "Metro availability",
        icon: <Globe className="h-5 w-5" />,
      },
    ],
    emptyTitle: "No cross connect products",
    emptyDescription:
      "Add cross connect SKUs so tenants can order dedicated partner connectivity.",
  },
];

const TAB_MAP = PRODUCT_TAB_CONFIG.reduce((acc, tab) => {
  acc[tab.id] = tab;
  return acc;
}, {});

const DEFAULT_TAB_ID = PRODUCT_TAB_CONFIG[0].id;

export default function AdminProducts({ initialTab = DEFAULT_TAB_ID }) {
  const location = useLocation();
  const navigate = useNavigate();

  const initialTabId = TAB_MAP[initialTab]?.id || DEFAULT_TAB_ID;

  const [activeTab, setActiveTab] = useState(initialTabId);
  const [heroState, setHeroState] = useState(() => {
    const config = TAB_MAP[initialTabId];
    return {
      title: config.heroTitle,
      description: config.heroDescription,
      metrics: [],
    };
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { isLoading } = useAuthRedirect();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { isFetching: isCountriesFetching, data: countries } =
    useFetchCountries();

  const activeConfig =
    TAB_MAP[activeTab] ?? TAB_MAP[DEFAULT_TAB_ID] ?? PRODUCT_TAB_CONFIG[0];

  const {
    isFetching: isProductsFetching,
    data: products,
    refetch,
  } = useFetchProducts(selectedCountryCode, "", {
    enabled: Boolean(!isRegionsFetching && !isCountriesFetching),
    productType: activeConfig.productType,
  });

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
    setPage(1);
  }, [activeConfig]);

  const normalizedProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const filteredByType = useMemo(
    () =>
      normalizedProducts.filter((item) =>
        matchesProductType(item.productable_type, activeConfig.productType)
      ),
    [normalizedProducts, activeConfig]
  );

  const filteredByRegion = useMemo(() => {
    if (!selectedRegion) return filteredByType;
    return filteredByType.filter(
      (item) => (item.region || "").toLowerCase() === selectedRegion.toLowerCase()
    );
  }, [filteredByType, selectedRegion]);

  const searchedRows = useMemo(() => {
    if (!searchQuery.trim()) return filteredByRegion;
    const query = searchQuery.trim().toLowerCase();
    return filteredByRegion.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const identifier = (item.identifier || "").toLowerCase();
      return (
        name.includes(query) ||
        identifier.includes(query) ||
        (item.region || "").toLowerCase().includes(query)
      );
    });
  }, [filteredByRegion, searchQuery]);

  const productStats = useMemo(
    () => deriveProductStats(searchedRows),
    [searchedRows]
  );

  useEffect(() => {
    const metrics =
      typeof activeConfig.metrics === "function"
        ? activeConfig.metrics(productStats)
        : [];
    setHeroState((prev) => ({
      ...prev,
      metrics,
    }));
  }, [activeConfig, productStats]);

  const total = searchedRows.length;

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(total / perPage) || 1);
    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [page, perPage, total]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return searchedRows.slice(start, start + perPage);
  }, [searchedRows, page, perPage]);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleCountryChange = (countryCode) => {
    setSelectedCountryCode(countryCode);
    setSelectedRegion("");
    setPage(1);
  };

  const handleRegionChange = (regionCode) => {
    setSelectedRegion(regionCode);
    setPage(1);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleTabChange = (tabId) => {
    if (!TAB_MAP[tabId] || tabId === activeTab) return;
    setActiveTab(tabId);
    const params = new URLSearchParams(location.search);
    params.set("tab", tabId);
    navigate({ search: params.toString() }, { replace: true });
  };

  const openEditModal = (product) => {
    if (product && product.id) {
      setSelectedProduct(product);
      setEditModalOpen(true);
    } else {
      ToastUtils.error("Unable to open product for editing.");
    }
  };

  const openDeleteModal = (product) => {
    if (product && product.id) {
      setSelectedProduct(product);
      setDeleteModalOpen(true);
    } else {
      ToastUtils.error("Unable to open product for deletion.");
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedProduct(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const columns = [
    {
      header: "Product",
      key: "name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
            <Package className="h-4 w-4" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              {row.name || "Unnamed product"}
            </p>
            <p className="text-xs text-slate-500">
              {row.identifier
                ? `${row.identifier} · ${row.productable_type}`
                : row.productable_type}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Provider",
      key: "provider",
      align: "center",
      render: (row) => (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {row.provider || "Platform"}
        </span>
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
      header: "Price",
      key: "price",
      align: "right",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
          <DollarSign className="h-3.5 w-3.5 text-slate-400" />
          {formatCurrency(row.price)}
        </span>
      ),
    },
    {
      header: "Status",
      key: "status",
      align: "center",
      render: (row) => {
        const statusLabel = (row.status || "inactive").toLowerCase();
        const isActive = statusLabel === "active";
        return (
          <span
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
              isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            <Zap className="h-3.5 w-3.5" />
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      header: "",
      key: "actions",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary-200 hover:text-primary-600"
            title="Edit product"
            aria-label="Edit product"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(row)}
            className="inline-flex items-center justify-center rounded-full border border-red-200 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-50"
            title="Remove product"
            aria-label="Remove product"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const addProductButton = (
    <ModernButton
      onClick={() => navigate("/admin-dashboard/products/add")}
      className="flex items-center gap-2"
    >
      <Plus size={16} />
      Add product
    </ModernButton>
  );

  const filterControls = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-600">
          Country
        </label>
        <div className="relative">
          <select
            value={selectedCountryCode}
            onChange={(event) => handleCountryChange(event.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isCountriesFetching}
          >
            <option value="">
              {isCountriesFetching ? "Loading countries..." : "All countries"}
            </option>
            {countries?.map((country, index) => {
              const key =
                (country.iso2 || country.code || country.id || country.name || index).toString();
              const value = (country.code || country.iso2 || "").toString();

              return (
                <option key={key} value={value}>
                  {country.name || value}
                </option>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-600">
          Region
        </label>
        <div className="relative">
          <select
            value={selectedRegion}
            onChange={(event) => handleRegionChange(event.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isRegionsFetching}
          >
            <option value="">
              {isRegionsFetching ? "Loading regions..." : "All regions"}
            </option>
            {regions?.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#288DD1]" />
      </div>
    );
  }

  const isLoadingData =
    isRegionsFetching || isCountriesFetching || isProductsFetching;

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        contentClassName="space-y-8"
        description="Maintain platform products across regions and keep provisioning catalogues aligned."
      >
        <ResourceHero
          title={heroState.title}
          subtitle="Products"
          description={heroState.description}
          metrics={heroState.metrics}
          accent="midnight"
          rightSlot={addProductButton}
        />

        <div className="flex flex-col gap-6 lg:flex-row">
          <PricingSideMenu
            activeTab={activeTab}
            onTabChange={handleTabChange}
            items={PRODUCT_TAB_CONFIG.map(({ id, name, caption, icon }) => ({
              id,
              name,
              caption,
              icon,
            }))}
          />

          <ModernCard className="flex-1 space-y-6 border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
            {filterControls}

            <ResourceDataExplorer
              title={activeConfig.tableTitle}
              description={activeConfig.tableDescription}
              columns={columns}
              rows={paginatedRows}
              loading={isLoadingData}
              page={page}
              perPage={perPage}
              total={total}
              onPageChange={setPage}
              onPerPageChange={(next) => {
                setPerPage(next);
                setPage(1);
              }}
              searchValue={searchQuery}
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
                title: activeConfig.emptyTitle || "No products found",
                description:
                  activeConfig.emptyDescription ||
                  "Add new products to populate this catalogue.",
                action: addProductButton,
              }}
            />
          </ModernCard>
        </div>
      </AdminPageShell>

      <EditProduct
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        product={selectedProduct}
        onUpdated={refetch}
      />
      <DeleteProduct
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        productId={selectedProduct?.id}
        productName={selectedProduct?.name}
        refetch={refetch}
      />
    </>
  );
}
