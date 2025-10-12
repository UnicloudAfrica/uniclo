import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminActiveTab from "../components/adminActiveTab";
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
import { ChevronDown, Loader2, DollarSign, TrendingUp, Package, Globe, Plus, Upload, Download } from "lucide-react";
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
  const openAddProductPricing = () => setAddProductPricing(true);
  const closeAddProductPricing = () => setAddProductPricing(false);

  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const openUploadModal = () => setUploadModalOpen(true);
  const closeUploadModal = () => setUploadModalOpen(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleRegionChange = (regionCode) => {
    setSelectedRegion(regionCode);
  };

  // Refetch pricing when region changes
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

  // Map product names to pricing data
  const pricingWithNames = pricing?.map((item) => ({
    ...item,
    name:
      products?.find((p) => p.id === item.productable_id)?.name || "Unnamed",
  }));

  // Calculate pricing statistics
  const pricingStats = {
    totalProducts: pricingWithNames?.length || 0,
    averagePrice: pricingWithNames?.length > 0 
      ? (pricingWithNames.reduce((sum, item) => sum + parseFloat(item.price_usd || 0), 0) / pricingWithNames.length).toFixed(2)
      : 0,
    highestPrice: pricingWithNames?.length > 0 
      ? Math.max(...pricingWithNames.map(item => parseFloat(item.price_usd || 0))).toFixed(2)
      : 0,
    uniqueRegions: [...new Set(pricingWithNames?.map(item => item.region))].length || 0
  };

  // Define columns for ModernTable
  const columns = [
    {
      key: 'product_name',
      header: 'Product Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Package size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'price_usd',
      header: 'Price (USD)',
      render: (value) => (
        <div className="flex items-center gap-2">
          <DollarSign size={16} style={{ color: designTokens.colors.success[500] }} />
          <span 
            className="font-semibold"
            style={{ color: designTokens.colors.success[700] }}
          >
            ${parseFloat(value).toFixed(2) || "N/A"}
          </span>
        </div>
      )
    },
    {
      key: 'region',
      header: 'Region',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Globe size={16} style={{ color: designTokens.colors.neutral[500] }} />
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: designTokens.colors.primary[50],
              color: designTokens.colors.primary[700]
            }}
          >
            {value}
          </span>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main 
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
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
                    color: designTokens.colors.neutral[900]
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
          </div>

          {/* Pricing Management Interface */}
          <div className="w-full flex flex-col lg:flex-row gap-6">
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
                loading={isRegionsFetching || isPricingFetching || isProductsFetching}
                emptyMessage={
                  error 
                    ? "Error loading pricing data. Please try again."
                    : `No pricing data found${selectedRegion ? " for this region" : ""}. Add pricing configurations to get started.`
                }
              />
            </ModernCard>
          </div>
        </div>
      </main>
      <AddProductPricing
        isOpen={isAddProductPricingOpen}
        onClose={closeAddProductPricing}
      />
      <UploadPricingFileModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
      />
    </>
  );
}
