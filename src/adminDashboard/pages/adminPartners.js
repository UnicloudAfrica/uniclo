import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye, // Imported Eye icon
  Trash2, // Imported Trash2 icon
  Settings2,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css"; // Import skeleton styles
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AddPartner from "../components/partnersComponent/addPartner";
import { useEffect, useState } from "react"; // Removed useRef as dropdown is gone
import useAuthRedirect from "../../utils/adminAuthRedirect";
import {
  useDeleteTenant,
  useFetchTenants,
} from "../../hooks/adminHooks/tenantHooks"; // Import useDeleteTenant
import { useNavigate } from "react-router-dom"; // Import useNavigate
import DeleteTenantModal from "./tenantComps/deleteTenant";

const AdminPartners = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  // Removed openDropdown, dropdownButtonRefs, dropdownPosition, dropdownContentRef as they are no longer needed
  const { isLoading } = useAuthRedirect();
  const [isAddPartnerOpen, setAddPartner] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();

  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false); // State for delete modal
  const [selectedTenantToDelete, setSelectedTenantToDelete] = useState(null); // State to hold tenant for deletion

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddPartner = () => setAddPartner(true);
  const closeAddPartner = () => setAddPartner(false);

  // Filter customers based on search query
  const filteredData = tenants
    ? tenants.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Function to encode the ID for URL
  const encodeId = (id) => {
    return encodeURIComponent(btoa(id));
  };

  // Handle navigation to details page
  const handleViewDetails = (item, event) => {
    event.stopPropagation(); // Prevent row click from firing if button is clicked
    const encodedId = encodeId(item.identifier);
    navigate(
      `/admin-dashboard/partners/details?id=${encodedId}&name=${encodeURIComponent(
        item.name
      )}`
    );
  };

  // Handle opening delete modal
  const handleDeleteClick = (item, event) => {
    event.stopPropagation(); // Prevent row click from firing if button is clicked
    setSelectedTenantToDelete(item);
    setIsDeleteTenantModalOpen(true);
  };

  // Removed useEffect for click outside as there's no dropdown
  useEffect(() => {
    // No dropdown to close, so this effect is no longer needed.
    // Keeping it here as a placeholder comment for clarity.
  }, []);

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
          onClick={openAddPartner}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
        >
          Add Partner
        </button>
        <div className="flex items-center justify-between mt-6 mb-6">
          <div className="relative">
            <input
              type="search"
              placeholder="Search Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 bg-[#F5F5F5] rounded-[8px] border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#288DD1]"
              autoComplete="off" // Prevent autofill
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
          {isTenantsFetching ? (
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PARTNER ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    EMAIL ADDRESS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PHONE NUMBER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    TYPE
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
                      <Skeleton width={80} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={120} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={150} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={100} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={50} height={20} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton width={30} height={20} />
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
                    PARTNER ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    NAME
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    EMAIL ADDRESS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    PHONE NUMBER
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E8E6EA]">
                {currentData.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() =>
                      handleViewDetails(item, { stopPropagation: () => {} })
                    } // Allow row click for navigation
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => handleViewDetails(item, e)}
                          className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(item, e)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Partner"
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
          {isTenantsFetching ? (
            Array.from({ length: itemsPerPage }).map((_, index) => (
              <div
                key={index}
                className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <Skeleton width={120} height={20} />
                  <Skeleton width={30} height={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={80} height={16} />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={120} height={16} />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={100} height={16} />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton width={80} height={16} />
                    <Skeleton width={50} height={16} />
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
            currentData.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  handleViewDetails(item, { stopPropagation: () => {} })
                } // Allow card click for navigation
                className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => handleViewDetails(item, e)}
                      className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(item, e)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete Partner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Partner ID:</span>
                    <span>{item.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{item.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span>{item.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span>{item.type}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isTenantsFetching && filteredData.length > 0 && (
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
      <AddPartner isOpen={isAddPartnerOpen} onClose={closeAddPartner} />
      <DeleteTenantModal
        isOpen={isDeleteTenantModalOpen}
        onClose={() => setIsDeleteTenantModalOpen(false)}
        tenantId={selectedTenantToDelete?.identifier}
        tenantName={selectedTenantToDelete?.name}
      />
    </>
  );
};

export default AdminPartners;
