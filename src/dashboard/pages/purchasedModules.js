import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { Filter, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import DetailedModules from "../components/detailsModules";
import CartFloat from "../components/cartFloat";
import useAuthRedirect from "../../utils/authRedirect";
import { useFetchModules } from "../../hooks/modulesHook";

export default function PurchasedModules() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuthRedirect();
  const { data: modules = [], isFetching: isModulesFetching } =
    useFetchModules();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(modules.length / itemsPerPage);

  const currentData = modules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const StatusBadge = ({ status }) => {
    const baseClass =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize";

    const statusStyles = {
      successful: "bg-[#00BF6B14] text-[#00BF6B]", // green
      failed: "bg-[#EB417833] text-[#EB4178]", // red
      pending: "bg-[#F5A62333] text-[#F5A623]", // amber/orange
    };

    const styleClass = statusStyles[status] || "bg-gray-100 text-gray-600";

    return <span className={`${baseClass} ${styleClass}`}>{status}</span>;
  };

  const CredentialsBadge = ({ credentials }) => {
    const isReady = credentials !== null;
    const displayText = isReady ? "Ready" : "Not Ready";

    return (
      <span
        className={`inline-flex items-center px-2.5 capitalize py-1 rounded-full text-xs font-medium ${
          isReady
            ? "bg-[#00BF6B14] text-[#00BF6B]"
            : "bg-[#EB417833] text-[#EB4178]"
        }`}
      >
        {displayText}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(isDateOnly
        ? {}
        : { hour: "numeric", minute: "2-digit", hour12: true }),
    };

    return date
      .toLocaleString("en-US", options)
      .replace(/,([^,]*)$/, isDateOnly ? "$1" : " -$1");
  };

  // Skeleton component for desktop table rows
  const TableSkeleton = () => (
    <tbody className="bg-white divide-y divide-[#E8E6EA]">
      {[...Array(5)].map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );

  // Skeleton component for mobile cards
  const MobileSkeleton = () => (
    <div className="md:hidden mt-6 space-y-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="border-b border-gray-200 py-4 animate-pulse"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <CartFloat />
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1C1C1C]">
            Modules History
          </h2>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  MODULE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Credentials
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  START DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Next BILLING DATE
                </th>
              </tr>
            </thead>
            {isModulesFetching ? (
              <TableSkeleton />
            ) : (
              <tbody className="bg-white divide-y divide-[#E8E6EA]">
                {currentData.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.productable.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      <CredentialsBadge credentials={item.credentials} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {formatDate(
                        item?.subscription_item?.subscription?.created_at
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {formatDate(
                        item?.subscription_item?.subscription?.next_billing_date
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        {/* Mobile Cards */}
        {isModulesFetching ? (
          <MobileSkeleton />
        ) : (
          <div className="md:hidden mt-6">
            {currentData.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="border-b border-gray-200 py-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    {item.productable.name}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Credentials:</span>
                    <CredentialsBadge credentials={item.credentials} />
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Start Date:</span>
                    <span>
                      {formatDate(
                        item?.subscription_item?.subscription?.created_at
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Next Billing Date:</span>
                    <span>
                      {formatDate(
                        item?.subscription_item?.subscription?.next_billing_date
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isModulesFetching && (
          <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <DetailedModules
        selectedItem={selectedItem}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
    </>
  );
}
