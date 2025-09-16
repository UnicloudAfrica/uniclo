import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings2,
  ChevronDown,
  Edit,
  Trash2,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchCountries } from "../../hooks/resource";
import {
  useFetchProducts,
  useUpdateProduct,
  useDeleteProduct,
} from "../../hooks/adminHooks/adminProductHooks";
import AddProduct from "./productComps/addProduct";
import EditProduct from "./productComps/editProduct";
import DeleteProduct from "./productComps/deleteProduct";
import useAuthRedirect from "../../utils/adminAuthRedirect";

export default function AdminProducts() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [isAddProductOpen, setAddProduct] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isLoading } = useAuthRedirect();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { isFetching: isCountriesFetching, data: countries } =
    useFetchCountries();
  const {
    isFetching: isProductsFetching,
    data: products,
    error,
  } = useFetchProducts(selectedCountryCode, selectedProvider, {
    enabled: Boolean(!isRegionsFetching && !isCountriesFetching),
  });

  const itemsPerPage = 10;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openAddProduct = () => setAddProduct(true);
  const closeAddProduct = () => setAddProduct(false);

  const openEditModal = (item) => {
    if (item && typeof item === "object" && item.id && item.name) {
      setSelectedProduct(item);
      setEditModalOpen(true);
    } else {
      console.error("Invalid item for edit:", item);
    }
  };

  const closeEditModal = () => {
    console.log("Closing Edit Modal, selectedProduct:", selectedProduct);
    setEditModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 0); // Delay clearing to avoid race condition
  };

  const openDeleteModal = (item) => {
    if (item && typeof item === "object" && item.id && item.name) {
      setSelectedProduct(item);
      setDeleteModalOpen(true);
    } else {
      console.error("Invalid item for delete:", item);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 0); // Delay clearing to avoid race condition
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

  // Validate and filter products
  const filteredData = products
    ? products.filter(
        (item) =>
          item &&
          typeof item === "object" &&
          item.id &&
          item.name &&
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  console.log("Products:", products, "Filtered Data:", filteredData);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Log state changes for debugging
  useEffect(() => {
    console.log(
      "State Update - selectedProduct:",
      selectedProduct,
      "isEditModalOpen:",
      isEditModalOpen,
      "isDeleteModalOpen:",
      isDeleteModalOpen
    );
  }, [selectedProduct, isEditModalOpen, isDeleteModalOpen]);

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
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
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="flex items-center w-full justify-between mb-6">
          <button
            onClick={openAddProduct}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          >
            Add Product
          </button>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-[200px]">
              <select
                value={selectedCountryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-[#288DD1] focus:border-[#288DD1] text-sm"
                disabled={isCountriesFetching}
              >
                <option value="">Select Country</option>
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
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="relative w-full max-w-[200px]">
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md focus:outline-none focus:ring-2 focus:ring-[#288DD1] focus:border-[#288DD1] text-sm"
                disabled={
                  isRegionsFetching ||
                  (selectedCountryCode &&
                    regions?.every(
                      (r) => r.country_code !== selectedCountryCode
                    ))
                }
              >
                <option value="">Select Region</option>
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
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <input
              type="search"
              placeholder="Search Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 bg-[#F5F5F5] rounded-[8px] border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#288DD1]"
              autoComplete="off"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
          {isProductsFetching || isRegionsFetching || isCountriesFetching ? (
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    S/N
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PRODUCT TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PROVIDER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E8E6EA]">
                {Array.from({ length: itemsPerPage }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={50} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={100} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={80} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={80} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={60} height={20} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-lg font-medium">
                No data available
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    S/N
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PRODUCT TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PROVIDER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E8E6EA]">
                {currentData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {formatProductType(item.productable_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.provider || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
                          className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                          title="Edit Product"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(item);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Product"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6 space-y-4">
          {isProductsFetching || isRegionsFetching || isCountriesFetching ? (
            Array.from({ length: itemsPerPage }).map((_, index) => (
              <div
                key={index}
                className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <Skeleton width={120} height={20} />
                  <Skeleton width={60} height={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={100} height={16} />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={80} height={16} />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={80} height={16} />
                  </div>
                </div>
              </div>
            ))
          ) : filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 text-lg font-medium">
                No data available
              </p>
            </div>
          ) : (
            currentData.map((item, index) => (
              <div
                key={item.id}
                className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    S/N: {(currentPage - 1) * itemsPerPage + index + 1}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                      }}
                      className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                      title="Edit Product"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(item);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete Product"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{formatProductType(item.productable_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Provider:</span>
                    <span>{item.provider || "N/A"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!(isProductsFetching || isRegionsFetching || isCountriesFetching) &&
          filteredData.length > 0 && (
            <div className="flex items-center justify-center px-4 mt-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNumber
                            ? "bg-[#288DD1] text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                <span className="text-sm text-gray-700">of</span>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-[#288DD1] text-white"
                      : "text-gray-700 bg-white border border-[#333333] hover:bg-gray-50"
                  }`}
                >
                  {totalPages}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
      </main>

      <AddProduct isOpen={isAddProductOpen} onClose={closeAddProduct} />
      {isEditModalOpen && selectedProduct && selectedProduct.id && (
        <EditProduct
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          product={selectedProduct}
        />
      )}
      {isDeleteModalOpen && selectedProduct && selectedProduct.id && (
        <DeleteProduct
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
        />
      )}
    </>
  );
}
