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
<<<<<<< HEAD
    compute_instance: filteredData.filter(
      (p) => p.productable_type === "compute_instance"
    ).length,
    cross_connect: filteredData.filter(
      (p) => p.productable_type === "cross_connect"
    ).length,
    os_image: filteredData.filter((p) => p.productable_type === "os_image")
      .length,
    bandwidth: filteredData.filter((p) => p.productable_type === "bandwidth")
      .length,
    other: filteredData.filter(
      (p) =>
        ![
          "compute_instance",
          "cross_connect",
          "os_image",
          "bandwidth",
        ].includes(p.productable_type)
    ).length,
  };

  const providers = [
    ...new Set(filteredData.map((p) => p.provider).filter(Boolean)),
  ];
  const uniqueProviders = providers.length;
=======
    compute_instance: filteredData.filter((p) => p.productable_type === "compute_instance").length,
    cross_connect: filteredData.filter((p) => p.productable_type === "cross_connect").length,
    os_image: filteredData.filter((p) => p.productable_type === "os_image").length,
    bandwidth: filteredData.filter((p) => p.productable_type === "bandwidth").length,
    other: filteredData.filter((p) =>
      !["compute_instance", "cross_connect", "os_image", "bandwidth"].includes(
        p.productable_type
      )
    ).length,
  };

  const providers = [...new Set(filteredData.map((p) => p.provider).filter(Boolean))];
>>>>>>> b587e2a (web)

  const columns = [
    {
      key: "serialNumber",
      header: "S/N",
      render: (value, row, index) => index + 1,
    },
    {
      key: "name",
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
      key: "productable_type",
      header: "Type",
      render: (value) => {
        const typeConfig = {
          compute_instance: {
            icon: Server,
            color: designTokens.colors.primary[500],
          },
          cross_connect: {
            icon: Globe,
            color: designTokens.colors.success[500],
          },
          os_image: { icon: Activity, color: designTokens.colors.warning[500] },
          bandwidth: { icon: Zap, color: designTokens.colors.error[500] },
          default: { icon: Package, color: designTokens.colors.neutral[500] },
        };
        const config = typeConfig[value] || typeConfig.default;
        const Icon = config.icon;
<<<<<<< HEAD

=======
>>>>>>> b587e2a (web)
        return (
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: config.color }} />
            <span
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${config.color}15`,
                color: config.color,
              }}
            >
              {formatProductType(value)}
            </span>
          </div>
        );
      },
    },
    {
      key: "provider",
      header: "Provider",
      render: (value) => (
        <div className="flex items-center gap-2">
<<<<<<< HEAD
          <Globe
            size={16}
            style={{ color: designTokens.colors.neutral[500] }}
          />
=======
          <Globe size={16} style={{ color: designTokens.colors.neutral[500] }} />
>>>>>>> b587e2a (web)
          <span>{value || "N/A"}</span>
        </div>
      ),
    },
  ];

  const actions = [
    {
      icon: <Edit size={16} />,
<<<<<<< HEAD
      label: "",
=======
      label: "Edit",
>>>>>>> b587e2a (web)
      onClick: (item) => openEditModal(item),
    },
    {
      icon: <Trash2 size={16} />,
<<<<<<< HEAD
      label: "",
=======
      label: "Delete",
>>>>>>> b587e2a (web)
      onClick: (item) => openDeleteModal(item),
    },
  ];

  if (isLoading) {
    return (
<<<<<<< HEAD
      <div className="w-full h-svh flex items-center justify-center">
=======
      <div className="flex h-svh w-full items-center justify-center">
>>>>>>> b587e2a (web)
        <Loader2
          className="w-12 animate-spin"
          style={{ color: designTokens.colors.primary[500] }}
        />
      </div>
    );
  }

  const headerActions = (
    <ModernButton
      onClick={() => navigate("/admin-dashboard/products/add")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Product
    </ModernButton>
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
                Product Management
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage cloud service products and configurations
              </p>
            </div>

            <button
              onClick={() => navigate("/admin-dashboard/products/add")}
              className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
            >
              Add Product
            </button>
          </div>

          {/* Filter Controls */}
          <ModernCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: designTokens.colors.neutral[700] }}
                >
                  Country Filter
                </label>
                <div className="relative">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="appearance-none w-full px-4 py-2 pr-8 rounded-lg border"
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
                        <option key={country.iso2} value={country.iso2}>
                          {country.name}
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

              <div className="relative">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: designTokens.colors.neutral[700] }}
                >
                  Region Filter
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
                    disabled={
                      isRegionsFetching ||
                      (selectedCountryCode &&
                        regions?.every(
                          (r) => r.country_code !== selectedCountryCode
                        ))
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    style={{ color: designTokens.colors.neutral[400] }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: designTokens.colors.neutral[700] }}
                >
                  Search Products
                </label>
                <ModernInput
                  type="search"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
=======
      <AdminPageShell
        title="Product Management"
        description="Manage cloud service products and configurations."
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <ModernCard>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Country Filter
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
                      <option key={country.iso2} value={country.iso2}>
                        {country.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: designTokens.colors.neutral[400] }}
>>>>>>> b587e2a (web)
                />
              </div>
            </div>

<<<<<<< HEAD
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Products"
              value={totalProducts}
              icon={<Package width={20} height={20} />}
              change={5}
              trend="up"
              color="primary"
              description="Available products"
            />
            <ModernStatsCard
              title="Compute Instances"
              value={productTypes.compute_instance}
              icon={<Server width={20} height={20} />}
              color="primary"
              description="Server products"
            />
            <ModernStatsCard
              title="Network Services"
              value={productTypes.cross_connect + productTypes.bandwidth}
              icon={<Globe width={20} height={20} />}
              color="primary"
              description="Network products"
            />
            <ModernStatsCard
              title="Providers"
              value={uniqueProviders}
              icon={<Activity width={20} height={20} />}
              color="primary"
              description="Service providers"
            />
=======
            <div className="relative">
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Region Filter
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
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: designTokens.colors.neutral[400] }}
                />
              </div>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Search Products
              </label>
              <ModernInput
                type="search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
>>>>>>> b587e2a (web)
          </div>
        </ModernCard>

<<<<<<< HEAD
          {/* Products Table */}

          <ModernTable
            title="Products Catalog"
            data={filteredData}
            columns={columns}
            actions={actions}
            searchable={false}
            filterable={false}
            exportable={true}
            sortable={true}
            loading={
              isProductsFetching || isRegionsFetching || isCountriesFetching
            }
            emptyMessage="No products found. Try adjusting your filters."
=======
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
>>>>>>> b587e2a (web)
          />
        </div>

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
