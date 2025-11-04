import React, { useState } from "react";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import { Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";
import ClientActiveTab from "../components/clientActiveTab";
import DetailedTransaction from "../components/transactionDetails";
import { useFetchClientTransactions } from "../../hooks/clientHooks/transactionHooks";
import ClientPageShell from "../components/ClientPageShell";

export default function ClientPaymentHistory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { data: transactions = [], isFetching: isTransactionsFetching } =
    useFetchClientTransactions();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const currentData = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

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

  const headerActions = (
    <button className="flex items-center gap-2 rounded-full bg-[#F2F4F8] px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
      <Settings2 className="h-4 w-4 text-[#555E67]" />
      <span>Filter</span>
    </button>
  );

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <DetailedTransaction
        selectedItem={selectedTransaction}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
      <ClientPageShell
        title="Payment History"
        description="Review your billing transactions and download detailed receipts."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Billing" },
          { label: "Payment History" },
        ]}
        actions={headerActions}
        contentWrapper="div"
        contentClassName="space-y-6"
      >
        <div className="hidden overflow-x-auto rounded-[12px] md:block">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  DATE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  DESCRIPTION
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  AMOUNT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  PAYMENT METHOD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  STATUS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {isTransactionsFetching ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      ₦{item.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.payment_gateway}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openModal(item)}
                        className="text-[--theme-color] hover:text-[--secondary-color] text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-[#575758]"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 md:hidden">
          {isTransactionsFetching ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white border border-[#E8E6EA] rounded-[8px] p-4 mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E8E6EA]">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : currentData.length > 0 ? (
            currentData.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E8E6EA] rounded-[8px] p-4 mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#1C1C1C]">
                    {item.description}
                  </h3>
                  <StatusBadge status={item.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#555E67]">Date:</span>
                    <span className="text-[#575758]">
                      {formatDate(item.updated_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#555E67]">Amount:</span>
                    <span className="text-[#575758]">
                      ₦{item.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#555E67]">
                      Payment Method:
                    </span>
                    <span className="text-[#575758]">
                      {item.payment_gateway}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E8E6EA]">
                    <span className="font-medium text-[#555E67]">Details:</span>
                    <button
                      onClick={() => openModal(item)}
                      className="text-[--theme-color] hover:text-[--secondary-color] text-sm font-medium transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-[#575758] p-4">
              No transactions found
            </div>
          )}
        </div>

        {!isTransactionsFetching && transactions.length > 0 && (
          <div className="mt-6 flex items-center justify-center px-4 py-3">
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
                          ? "bg-[--theme-color] text-white"
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
                    ? "bg-[--theme-color] text-white"
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
      </ClientPageShell>
    </>
  );
}
