import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  Package,
  Server,
  Globe,
  Activity,
  Zap,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import ModernInput from "../components/ModernInput";
import PricingSideMenu from "../components/pricingSideMenu";
import { designTokens } from "../../styles/designTokens";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchCountries } from "../../hooks/resource";
import { useFetchProducts } from "../../hooks/adminHooks/adminProductHooks";
import EditProduct from "./productComps/editProduct";
import DeleteProduct from "./productComps/deleteProduct";
import useAuthRedirect from "../../utils/adminAuthRedirect";

export default function AdminProducts() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const navigate = useNavigate();
  const { isLoading } = useAuthRedirect();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { isFetching: isCountriesFetching, data: countries } = useFetchCountries();
  const {
    isFetching: isProductsFetching,
    data: products,
    refetch,
  } = useFetchProducts(selectedCountryCode, selectedProvider, {
    enabled: Boolean(!isRegionsFetching && !isCountriesFetching),
  });

  useEffect(() => {
    if (
      selectedRegion &&
      regions &&
      regions.length > 0
    ) {
      const region = regions.find((r) => r.code === selectedRegion);
      setSelectedProvider(region ? region.provider : "");
    }
  }, [selectedRegion, regions]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const openEditModal = (item) => {
    if (item && typeof item === "object" && item.id && item.name) {
      setSelectedProduct(item);
      setEditModalOpen(true);
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 0);
  };

  const openDeleteModal = (item) => {
    if (item && typeof item === "object" && item.id && item.name) {
      setSelectedProduct(item);
      setDeleteModalOpen(true);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 0);
  };

  const handleCountryChange = (countryCode) => {
    setSelectedCountryCode(countryCode);
    setSelectedRegion("");
    setSelectedProvider("");
  };

  const handleRegionChange = (regionCode) => {
    setSelectedRegion(regionCode);
    const region = regions?.find((r) => r.code === regionCode);
    setSelectedProvider(region ? region.provider : "");
  };

  const formatProductType = (type) => {
    const typeMap = {
      compute_instance: "Compute Instance",
      cross_connect: "Cross Connect",
      os_image: "OS Image",
      bandwidth: "Bandwidth",
      ip: "IP",
      volume_type: "Volume Type",
    };
    return typeMap[type] || type;
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter(
      (item) =>
        item &&
        item.id &&
        item.name &&
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const totalProducts = filteredData.length;
  const productTypes = {
    compute_instance: filteredData.filter((p) => p.productable_type === "compute_instance").length,
    cross_connect: filteredData.filter((p) => p.productable_type === "cross_connect").length,
    os_image: filteredData.filter((p) => p.productable_type === "os_image").length,
    bandwidth: filteredData.filter((p) => p.productable_type === "bandwidth").length,
    ip: filteredData.filter((p) => p.productable_type === "ip").length,
    volume_type: filteredData.filter((p) => p.productable_type === "volume_type").length,
  };

  const providers = [
    ...new Set(filteredData.map((item) => item.provider).filter(Boolean)),
  ];

  const columns = [
    {
      key: "name",
      header: "Product Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Package size={18} style={{ color: designTokens.colors.primary[500] }} />
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">
              {formatProductType(row.productable_type)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Server size={16} className="text-gray-400" />
          {value || "Not specified"}
        </span>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
          <Globe size={16} className="text-gray-400" />
          {value || "Not specified"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (value) => (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
          <Activity size={16} className="text-green-500" />
          {value ? `$${parseFloat(value).toFixed(2)}` : "N/A"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
            value === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600",
          ].join(" ")}
        >
          <Zap size={14} />
          {value || "inactive"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      icon: <Edit size={16} />,
      label: "Edit",
      onClick: openEditModal,
    },
    {
      icon: <Trash2 size={16} />,
      label: "Delete",
      onClick: openDeleteModal,
    },
  ];

  const headerActions = (
    <ModernButton
      onClick={() => navigate("/admin-dashboard/products/add")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Product
    </ModernButton>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#288DD1]" />
      </div>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Product Catalog"
        description="Manage infrastructure products and track availability across regions."
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <ModernCard className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            <div className="w-full lg:w-64">
              <PricingSideMenu />
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ModernStatsCard
                title="Total Products"
                value={totalProducts}
                icon={<Package size={24} />}
                change={5}
                trend="up"
                color="primary"
                description="Available products"
              />
              <ModernStatsCard
                title="Compute Instances"
                value={productTypes.compute_instance}
                icon={<Server size={24} />}
                color="success"
                description="Server products"
              />
              <ModernStatsCard
                title="Network Services"
                value={productTypes.cross_connect + productTypes.bandwidth}
                icon={<Globe size={24} />}
                color="warning"
                description="Network products"
              />
              <ModernStatsCard
                title="Providers"
                value={providers.length}
                icon={<Activity size={24} />}
                color="info"
                description="Service providers"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Country
              </label>
              <div className="relative">
                <select
                  value={selectedCountryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full appearance-none rounded-lg border px-4 py-2 pr-8"
                  style={{
                    backgroundColor: designTokens.colors.neutral[0],
                    borderColor: designTokens.colors.neutral[300],
                    color: designTokens.colors.neutral[900],
                  }}
                  disabled={isCountriesFetching}
                >
                  <option value="">All Countries</option>
                  {isCountriesFetching ? (
                    <option value="" disabled>
                      Loading countries...
                    </option>
                  ) : (
                    countries?.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Region
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
                  }}
                  disabled={
                    isRegionsFetching ||
                    (selectedCountryCode &&
                      regions?.every((r) => r.country_code !== selectedCountryCode))
                  }
                >
                  <option value="">All Regions</option>
                  {isRegionsFetching ? (
                    <option value="" disabled>
                      Loading regions...
                    </option>
                  ) : (
                    regions
                      ?.filter(
                        (region) =>
                          !selectedCountryCode ||
                          region.country_code === selectedCountryCode
                      )
                      .map((region) => (
                        <option key={region.code} value={region.code}>
                          {region.name}
                        </option>
                      ))
                  )}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Search Products
              </label>
              <ModernInput
                type="search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </ModernCard>

        <ModernCard>
          <ModernTable
            title="Products Catalog"
            data={filteredData}
            columns={columns}
            actions={actions}
            searchable={false}
            filterable={false}
            exportable
            sortable
            loading={isProductsFetching || isRegionsFetching || isCountriesFetching}
            emptyMessage="No products found. Try adjusting your filters."
          />
        </ModernCard>
      </AdminPageShell>

      {isEditModalOpen && selectedProduct?.id && (
        <EditProduct
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          product={selectedProduct}
        />
      )}
      {isDeleteModalOpen && selectedProduct?.id && (
        <DeleteProduct
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          refetch={refetch}
        />
      )}
    </>
  );
}
