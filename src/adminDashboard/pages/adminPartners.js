import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css"; // Import skeleton styles
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AddPartner from "../components/partnersComponent/addPartner";
import { useFetchCustomers } from "../../hooks/adminHooks/customerHooks";
import useAuthRedirect from "../../utils/adminAuthRedirect";

const AdminPartners = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const { isLoading } = useAuthRedirect();
  const [isAddPartnerOpen, setAddPartner] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: customers, isFetching: isCustomersFetching } =
    useFetchCustomers();

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
  const filteredData = customers
    ? customers.filter((item) =>
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

  const toggleDropdown = (itemId) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  const handleDropdownAction = (action, itemId) => {
    console.log(`${action} for ${itemId}`);
    closeDropdown();
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
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <button
          onClick={openAddPartner}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base"
        >
          Add Partner
        </button>
        <div className="flex items-center justify-between mt-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 bg-[#F5F5F5] rounded-[8px]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
          {isCustomersFetching ? (
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
                    NUMBER OF CLIENTS
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
                    NUMBER OF CLIENTS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E8E6EA]">
                {currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
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
                      {item.clients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="relative"
                        ref={openDropdown === item.id ? dropdownRef : null}
                      >
                        <button
                          onClick={() => toggleDropdown(item.id)}
                          className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openDropdown === item.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              onClick={() =>
                                handleDropdownAction("View Details", item.id)
                              }
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() =>
                                handleDropdownAction("Suspend Client", item.id)
                              }
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              Suspend Partner
                            </button>
                          </div>
                        )}
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
          {isCustomersFetching ? (
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
                className="border-b border-gray-200 py-4 px-4 bg-white rounded-[12px] mb-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.name}
                  </h3>
                  <div
                    className="relative"
                    ref={openDropdown === item.id ? dropdownRef : null}
                  >
                    <button
                      onClick={() => toggleDropdown(item.id)}
                      className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openDropdown === item.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <button
                          onClick={() =>
                            handleDropdownAction("View Details", item.id)
                          }
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() =>
                            handleDropdownAction("Suspend Client", item.id)
                          }
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Suspend Partner
                        </button>
                      </div>
                    )}
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
                    <span className="font-medium">Clients:</span>
                    <span>{item.clients}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isCustomersFetching && filteredData.length > 0 && (
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
    </>
  );
};

export default AdminPartners;
