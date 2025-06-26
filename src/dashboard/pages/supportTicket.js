import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import {
  Settings2,
  MoreHorizontal,
  EyeIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StartModalConversation from "../components/startConversationModal";
import TicketDrawer from "../components/ticketDrawer";
import useAuthRedirect from "../../utils/authRedirect";

export default function SupportTicket() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isStartConvoOpen, setStartConvo] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuthRedirect();

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
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
    setTimeout(() => setSelectedTicket(null), 300); // Sync with animation duration
  };

  const data = [
    {
      id: "TC-191",
      subject: "Issue with provisioning",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "-",
      priority: "In-progress",
    },
    {
      id: "TC-192",
      subject: "Billing not reflecting",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-193",
      subject: "Z2 Compute Instances",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-194",
      subject: "Shared Storage",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-195",
      subject: "Z4 Compute Instances",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-196",
      subject: "Z4 Compute Instances",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-197",
      subject: "Z4 Compute Instances",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-198",
      subject: "Z4 Compute Instances",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-199",
      subject: "Z4 Compute Instances",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
    {
      id: "TC-200",
      subject: "Z4 Compute Instances",
      dateCreated: "April 13, 2025 - 2:45 PM",
      dateUpdated: "May 13, 2025",
      priority: "Closed",
    },
  ];

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const PriorityBadge = ({ priority }) => {
    const isInProgress = priority === "In-progress";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isInProgress
            ? "bg-[#00BF6B14] text-[#00BF6B]"
            : "bg-[#EB417833] text-[#EB4178]"
        }`}
      >
        {priority}
      </span>
    );
  };

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
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base"
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

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
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
                  PRIORITY
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
                    {item.dateCreated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                    {item.dateUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PriorityBadge priority={item.priority} />
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
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6 space-y-4">
          {currentData.map((item) => (
            <div key={item.id} className="border-b border-gray-200 py-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-[#1C1C1C]">
                  {item.id}
                </h3>
                <PriorityBadge priority={item.priority} />
              </div>
              <p className="text-sm text-[#575758]">{item.subject}</p>
              <div className="text-sm text-[#575758] mt-2">
                <span>Created: {item.dateCreated}</span>
                <br />
                <span>Updated: {item.dateUpdated}</span>
              </div>
              <button className="text-[#288DD1] mt-2 hover:text-[#1976D2] transition-colors">
                <EyeIcon
                  onClick={() => openTicketDrawer(item)}
                  className="w-4 h-4"
                />
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center px-4 py-3 mt-6">
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
