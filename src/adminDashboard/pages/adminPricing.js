import React, { useState, useEffect, useMemo } from "react";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernTable from "../components/ModernTable";
import ModernButton from "../components/ModernButton";
import PricingSideMenu from "../components/pricingSideMenu";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import {
  useFetchProductPricing,
  useExportProductPricingTemplate,
} from "../../hooks/adminHooks/adminproductPricingHook";
import { useFetchProducts } from "../../hooks/adminHooks/adminProductHooks";
import {
  ChevronDown,
  Loader2,
  DollarSign,
  TrendingUp,
  Package,
  Globe,
  Plus,
  Upload,
  Download,
} from "lucide-react";
import AddProductPricing from "./productPricingComps/addProductPricing";
import ToastUtils from "../../utils/toastUtil";
import UploadPricingFileModal from "./productPricingComps/uploadPricingFile";
import { designTokens } from "../../styles/designTokens";

export default function AdminPricing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const {
    isFetching: isPricingFetching,
    data: pricing,
    error,
    refetch,
  } = useFetchProductPricing(selectedRegion, { enabled: !isRegionsFetching });
  const { isFetching: isProductsFetching, data: products } = useFetchProducts();
  const { mutate: exportTemplate, isPending: isExporting } =
    useExportProductPricingTemplate();

  const [isAddProductPricingOpen, setAddProductPricing] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleRegionChange = (regionCode) => {
    setSelectedRegion(regionCode);
  };

  useEffect(() => {
    if (!isRegionsFetching) {
      refetch();
    }
  }, [selectedRegion, isRegionsFetching, refetch]);

  const handleExport = () => {
    if (!selectedRegion) {
      ToastUtils.warning("Please select a region before exporting.");
      return;
    }
    exportTemplate(selectedRegion, {
      onSuccess: () => ToastUtils.success("Template exported successfully!"),
    });
  };

  const pricingWithNames = useMemo(
    () =>
      pricing?.map((item) => ({
        ...item,
        name: products?.find((p) => p.id === item.productable_id)?.name || "Unnamed",
      })) || [],
    [pricing, products]
  );

  const pricingStats = {
<<<<<<< HEAD
    totalProducts: pricingWithNames?.length || 0,
    averagePrice:
      pricingWithNames?.length > 0
=======
    totalProducts: pricingWithNames.length,
    averagePrice:
      pricingWithNames.length > 0
>>>>>>> b587e2a (web)
        ? (
            pricingWithNames.reduce(
              (sum, item) => sum + parseFloat(item.price_usd || 0),
              0
            ) / pricingWithNames.length
          ).toFixed(2)
        : 0,
    highestPrice:
<<<<<<< HEAD
      pricingWithNames?.length > 0
=======
      pricingWithNames.length > 0
>>>>>>> b587e2a (web)
        ? Math.max(
            ...pricingWithNames.map((item) => parseFloat(item.price_usd || 0))
          ).toFixed(2)
        : 0,
<<<<<<< HEAD
    uniqueRegions:
      [...new Set(pricingWithNames?.map((item) => item.region))].length || 0,
=======
    uniqueRegions: [...new Set(pricingWithNames.map((item) => item.region))].length || 0,
>>>>>>> b587e2a (web)
  };

  const columns = [
    {
      key: "product_name",
      header: "Product Name",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Package
            size={16}
            style={{ color: designTokens.colors.primary[500] }}
          />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "price_usd",
      header: "Price (USD)",
      render: (value) => (
        <div className="flex items-center gap-2">
<<<<<<< HEAD
          <DollarSign
            size={16}
            style={{ color: designTokens.colors.success[500] }}
          />
          <span
            className="font-semibold"
            style={{ color: designTokens.colors.success[700] }}
          >
=======
          <DollarSign size={16} style={{ color: designTokens.colors.success[500] }} />
          <span className="font-semibold" style={{ color: designTokens.colors.success[700] }}>
>>>>>>> b587e2a (web)
            ${parseFloat(value).toFixed(2) || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (value) => (
        <div className="flex items-center gap-2">
<<<<<<< HEAD
          <Globe
            size={16}
            style={{ color: designTokens.colors.neutral[500] }}
          />
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
=======
          <Globe size={16} style={{ color: designTokens.colors.neutral[500] }} />
          <span
            className="rounded-full px-2 py-1 text-xs font-medium"
>>>>>>> b587e2a (web)
            style={{
              backgroundColor: designTokens.colors.primary[50],
              color: designTokens.colors.primary[700],
            }}
          >
            {value}
          </span>
        </div>
      ),
    },
  ];

  const actionButtons = (
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
        onClick={() => setAddProductPricing(true)}
        size="sm"
        className="flex items-center gap-2"
      >
        <Plus size={16} />
        Add Pricing
      </ModernButton>
    </div>
  );

  const regionSelector = (
    <div className="w-full sm:w-auto">
      <label
        className="mb-2 block text-sm font-medium"
        style={{ color: designTokens.colors.neutral[700] }}
      >
        Select Region
      </label>
      <div className="relative">
        <select
          value={selectedRegion}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="w-full appearance-none rounded-lg border px-4 py-2 pr-8"
          style={{
            backgroundColor: designTokens.colors.neutral[0],
            borderColor: designTokens.colors.neutral[300],
            color: designTokens.colors.neutral[900],
            minWidth: "220px",
          }}
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
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: designTokens.colors.neutral[400] }}
        />
      </div>
    </div>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
<<<<<<< HEAD
      <AdminActiveTab />
      <main
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] bg-[#fafafa] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Pricing Management
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Configure and manage product pricing across regions
              </p>
            </div>

            {/* Region Selector */}
            <div className="relative w-full max-w-[200px]">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Select Region
              </label>
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="appearance-none w-full px-4 py-2 pr-8 rounded-lg border"
                  style={{
                    backgroundColor: designTokens.colors.neutral[0],
                    borderColor: designTokens.colors.neutral[300],
                    color: designTokens.colors.neutral[900],
                  }}
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
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: designTokens.colors.neutral[400] }}
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Products"
              value={pricingStats.totalProducts}
              icon={<Package width={20} height={20} />}
              color="primary"
              description="Products with pricing"
            />
            <ModernStatsCard
              title="Average Price"
              value={`$${pricingStats.averagePrice}`}
              icon={<DollarSign width={20} height={20} />}
              color="primary"
              description="Average USD price"
            />
            <ModernStatsCard
              title="Highest Price"
              value={`$${pricingStats.highestPrice}`}
              icon={<TrendingUp width={20} height={20} />}
              color="primary"
              description="Maximum product price"
            />
            <ModernStatsCard
              title="Regions"
              value={pricingStats.uniqueRegions}
              icon={<Globe width={20} height={20} />}
              color="primary"
              description="Regions covered"
            />
          </div>

          {/* Pricing Management Interface */}
          <div className="w-full flex flex-col lg:flex-row">
            <PricingSideMenu />
            <ModernCard className="flex-1 lg:w-[76%]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: designTokens.colors.neutral[900] }}
                  >
                    Platform Pricing
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{ color: designTokens.colors.neutral[600] }}
                  >
                    Manage product pricing configurations
                  </p>
                </div>
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
                    onClick={openUploadModal}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Upload
                  </ModernButton>
                  <ModernButton
                    onClick={openAddProductPricing}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Pricing
                  </ModernButton>
                </div>
              </div>
              <ModernTable
                title="Pricing Configuration"
                data={pricingWithNames || []}
                columns={columns}
                searchable={true}
                filterable={true}
                exportable={true}
                sortable={true}
                loading={
                  isRegionsFetching || isPricingFetching || isProductsFetching
                }
                emptyMessage={
                  error
                    ? "Error loading pricing data. Please try again."
                    : `No pricing data found${
                        selectedRegion ? " for this region" : ""
                      }. Add pricing configurations to get started.`
                }
              />
            </ModernCard>
          </div>
=======
      <AdminPageShell
        title="Pricing Management"
        description="Configure and manage product pricing across regions."
        actions={actionButtons}
        subHeaderContent={regionSelector}
        contentClassName="space-y-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ModernStatsCard
            title="Total Products"
            value={pricingStats.totalProducts}
            icon={<Package size={24} />}
            color="primary"
            description="Products with pricing"
          />
          <ModernStatsCard
            title="Average Price"
            value={`$${pricingStats.averagePrice}`}
            icon={<DollarSign size={24} />}
            color="success"
            description="Average USD price"
          />
          <ModernStatsCard
            title="Highest Price"
            value={`$${pricingStats.highestPrice}`}
            icon={<TrendingUp size={24} />}
            color="warning"
            description="Maximum product price"
          />
          <ModernStatsCard
            title="Regions"
            value={pricingStats.uniqueRegions}
            icon={<Globe size={24} />}
            color="info"
            description="Regions covered"
          />
>>>>>>> b587e2a (web)
        </div>

        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <PricingSideMenu />
          <ModernCard className="flex-1 lg:w-[76%]">
            <ModernTable
              title="Pricing Configuration"
              data={pricingWithNames}
              columns={columns}
              searchable
              filterable
              exportable
              sortable
              loading={isRegionsFetching || isPricingFetching || isProductsFetching}
              emptyMessage={
                error
                  ? "Error loading pricing data. Please try again."
                  : `No pricing data found${
                      selectedRegion ? " for this region" : ""
                    }. Add pricing configurations to get started.`
              }
            />
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
    </>
  );
}
