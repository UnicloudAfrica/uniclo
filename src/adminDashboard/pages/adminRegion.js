import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Trash2,
  Settings2,
  Edit,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AddRegionModal from "./regionComps/addRegion";
import DeleteRegionModal from "./regionComps/deleteRegion";
import {
  useFetchRegions,
  useDeleteRegion,
} from "../../hooks/adminHooks/regionHooks";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import EditRegionModal from "./regionComps/editRegion";
import ViewRegionModal from "./regionComps/viewRegion";

const AdminRegion = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoading } = useAuthRedirect();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  const itemsPerPage = 10;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openViewModal = (item) => {
    setSelectedRegion(item);
    setViewModalOpen(true);
  };
  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedRegion(null);
  };
  const openEditModal = (item) => {
    setSelectedRegion(item);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedRegion(null);
  };
  const openDeleteModal = (item) => {
    setSelectedRegion(item);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedRegion(null);
  };

  const filteredData = regions
    ? regions.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

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
        <button
          onClick={openCreateModal}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base"
        >
          Add Region
        </button>
        <div className="flex items-center justify-between mt-6 mb-6">
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
          {isRegionsFetching ? (
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    S/N
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PROVIDER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    COUNTRY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    CITY
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
                      <Skeleton width={100} height={20} />
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
                    PROVIDER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    COUNTRY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    CITY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E8E6EA]">
                {currentData.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => openViewModal(item)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.country_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewModal(item);
                          }}
                          className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                          title="View Details"
                          aria-label={`View details for ${item.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
                          className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                          title="Edit Region"
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
                          title="Delete Region"
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
          {isRegionsFetching ? (
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
                    <Skeleton width={100} height={16} />
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
                onClick={() => openViewModal(item)}
                className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2 cursor-pointer"
                role="button"
                aria-label={`View details for ${item.name}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    S/N: {(currentPage - 1) * itemsPerPage + index + 1}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openViewModal(item);
                      }}
                      className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                      title="View Details"
                      aria-label={`View details for ${item.name}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(item);
                      }}
                      className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                      title="Edit Region"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(item);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete Region"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Provider:</span>
                    <span>{item.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Country:</span>
                    <span>{item.country_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">City:</span>
                    <span>{item.city}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isRegionsFetching && filteredData.length > 0 && (
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

      <AddRegionModal isOpen={isCreateModalOpen} onClose={closeCreateModal} />
      <ViewRegionModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        region={selectedRegion}
      />
      <EditRegionModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        region={selectedRegion}
      />
      <DeleteRegionModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        regionId={selectedRegion?.id}
        regionName={selectedRegion?.name}
      />
    </>
  );
};

export default AdminRegion;
