import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import {
  Settings2,
  EyeIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import StartModalConversation from "../components/startConversationModal";
import TicketDrawer from "../components/ticketDrawer";
import useAuthRedirect from "../../utils/authRedirect";
import { useFetchSupportMessages } from "../../hooks/supportHook";

export default function SupportTicket() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isStartConvoOpen, setStartConvo] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading: isAuthLoading } = useAuthRedirect();
  const { data: supportTickets, isFetching: isSupportTicketsFetching } =
    useFetchSupportMessages();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openConvo = () => setStartConvo(true);
  const closeConvo = () => setStartConvo(false);

  const openTicketDrawer = (ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const closeTicketDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedTicket(null), 300);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const totalPages = Math.ceil((supportTickets?.length || 0) / itemsPerPage);
  const currentData =
    supportTickets?.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ) || [];

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isAuthLoading || isSupportTicketsFetching) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex items-center justify-center flex-col">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Loading support tickets...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <button
          onClick={openConvo}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Start new conversation
        </button>
        <div className="flex items-center justify-between mt-6">
          <h2 className="text-base font-medium text-[#1C1C1C]">
            Ticket History
          </h2>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
          {currentData.length > 0 ? (
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    TICKET ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    SUBJECT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    DATE CREATED
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                    DATE UPDATED
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
                {currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.status === "open"
                            ? "bg-[#00BF6B14] text-[#00BF6B]" // Green for open
                            : "bg-[#EB417833] text-[#EB4178]" // Red for closed (or other status)
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-[#288DD1] hover:text-[#1976D2] transition-colors">
                        <EyeIcon
                          onClick={() => openTicketDrawer(item)}
                          className="w-4 h-4"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No support tickets found.
            </div>
          )}
        </div>

        <div className="md:hidden mt-6 space-y-4">
          {currentData.length > 0 ? (
            currentData.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-[12px] shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-[#1C1C1C]">
                    {item.id}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === "open"
                        ? "bg-[#00BF6B14] text-[#00BF6B]"
                        : "bg-[#EB417833] text-[#EB4178]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-[#575758] font-medium">
                  {item.subject}
                </p>
                <div className="text-xs text-gray-600 mt-2">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>{formatDate(item.updated_at)}</span>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button className="text-[#288DD1] hover:text-[#1976D2] transition-colors">
                    <EyeIcon
                      onClick={() => openTicketDrawer(item)}
                      className="w-5 h-5"
                    />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
              No support tickets found.
            </div>
          )}
        </div>

        {supportTickets?.length > 0 && (
          <div className="flex items-center justify-center px-4 py-3 mt-6 bg-white rounded-b-[12px] border-t border-gray-200">
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
      <StartModalConversation isOpen={isStartConvoOpen} onClose={closeConvo} />
      <TicketDrawer
        isOpen={isDrawerOpen}
        onClose={closeTicketDrawer}
        ticket={selectedTicket}
      />
    </>
  );
}
