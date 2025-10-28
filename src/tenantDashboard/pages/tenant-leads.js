import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Sidebar from "../components/clientSidebar";
import HeaderBar from "../components/clientHeadbar";
import BreadcrumbNav from "../components/clientAciveTab";
import {
  useFetchLeads,
  useFetchLeadStats,
} from "../../hooks/tenantHooks/leadsHook";
import CreateLead from "./leadComps/createLead";

const formatCreatedAt = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const encodeId = (id) => {
  return encodeURIComponent(btoa(id));
};

// Helper function to format the status string for display
const formatStatusForDisplay = (status) => {
  return status.replace(/_/g, " ");
};

export default function TenantLeads() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const contentRef = useRef(null);
  const [isCreateLeadsModalVisible, setCreateLeadsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("leads");

  // Dummy tenant data for consistency
  const tenantData = {
    name: "Your Organization",
    logo: "", // You can add a logo path here
    color: "#288DD1",
  };

  const openCreateLead = () => setCreateLeadsModal(true);
  const closeCreateLead = () => setCreateLeadsModal(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const { data: leads, isFetching: isLeadsFetching } = useFetchLeads();
  const { data: leadStats, isFetching: isLeadStatsFetching } =
    useFetchLeadStats();

  const totalPages = Math.ceil((leads?.length || 0) / itemsPerPage);
  const currentLeads = leads?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const getStatusColorClass = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "proposal_sent":
        return "bg-indigo-100 text-indigo-800";
      case "negotiating":
        return "bg-purple-100 text-purple-800";
      case "closed_won":
        return "bg-emerald-100 text-emerald-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Sidebar
        tenantData={tenantData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <HeaderBar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
      <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
      <main
        ref={contentRef}
        className="dashboard-content-shell p-6 md:p-8 overflow-y-auto"
      >
        <div className="">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Leads</h2>

          {isLeadStatsFetching ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="flex-1 p-4 w-full rounded-[12px] bg-[#288DD10D] border border-[#288dd12d]">
                <p className="text-xs text-[#676767] capitalize">Total Leads</p>
                <div className="flex items-center mt-4 space-x-1.5">
                  <p className="text-lg md:text-2xl font-medium text-[#3272CA]">
                    {leadStats?.message?.leads || 0}
                  </p>
                </div>
              </div>
              {leadStats?.message?.leads_by_status &&
                Object.keys(leadStats?.message.leads_by_status).map(
                  (status, index) => (
                    <div
                      key={index}
                      className="flex-1 p-4 w-full rounded-[12px] bg-[#288DD10D] border border-[#288dd12d]"
                    >
                      <p className="text-xs text-[#676767] capitalize">
                        {formatStatusForDisplay(status)} Leads
                      </p>
                      <div className="flex items-center mt-4 space-x-1.5">
                        <p className="text-lg md:text-2xl font-medium text-[#3272CA]">
                          {leadStats?.message.leads_by_status[status]}
                        </p>
                      </div>
                    </div>
                  )
                )}
            </div>
          )}

          <button
            onClick={openCreateLead}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base mb-6"
          >
            Create New Lead
          </button>

          {isLeadsFetching ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
                {currentLeads && currentLeads.length > 0 ? (
                  <table className="min-w-full bg-white">
                    <thead className="bg-[#F5F5F5]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          Lead Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E6EA]">
                      {currentLeads.map((lead, index) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {(currentPage - 1) * itemsPerPage + index + 1}.
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {lead.first_name} {lead.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {lead.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal capitalize">
                            {lead.lead_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal capitalize">
                            <span
                              className={`py-1 px-3 rounded-full text-xs font-medium ${getStatusColorClass(
                                lead.status
                              )}`}
                            >
                              {formatStatusForDisplay(lead.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal capitalize">
                            {lead.source}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {formatCreatedAt(lead.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <Link
                              to={`/tenant-dashboard/leads/details?name=${encodeURIComponent(
                                `${lead.first_name} ${lead.last_name}`
                              )}&id=${encodeId(lead.id)}`}
                              className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    No leads found.
                  </p>
                )}
              </div>

              <div className="md:hidden mt-6 space-y-4">
                {currentLeads && currentLeads.length > 0 ? (
                  currentLeads.map((lead, index) => (
                    <div
                      key={lead.id}
                      className="border-b border-gray-200 py-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-[#1C1C1C]">
                          {lead.first_name} {lead.last_name}
                        </h3>
                        <span
                          className={`py-1 px-3 rounded-full text-xs font-medium capitalize ${getStatusColorClass(
                            lead.status
                          )}`}
                        >
                          {formatStatusForDisplay(lead.status)}
                        </span>
                      </div>
                      <p className="text-sm text-[#575758]">
                        Index: {(currentPage - 1) * itemsPerPage + index + 1}.
                      </p>
                      <p className="text-sm text-[#575758]">
                        Email: {lead.email}
                      </p>
                      <p className="text-sm text-[#575758]">
                        Lead Type:{" "}
                        <span className="capitalize">{lead.lead_type}</span>
                      </p>
                      <p className="text-sm text-[#575758]">
                        Source:{" "}
                        <span className="capitalize">{lead.source}</span>
                      </p>
                      <p className="text-sm text-[#575758]">
                        Created: {formatCreatedAt(lead.created_at)}
                      </p>
                      <div className="mt-4 text-right">
                        <Link
                          to={`/tenant-dashboard/leads/details?name=${encodeURIComponent(
                            `${lead.first_name} ${lead.last_name}`
                          )}&id=${encodeId(lead.id)}`}
                          className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] text-sm font-medium hover:bg-[#1976D2] transition-colors"
                        >
                          View More
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    No leads found.
                  </p>
                )}
              </div>

              {totalPages > 1 && (
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
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                        }
                      )}
                    </div>

                    {totalPages > 5 && (
                      <span className="text-sm text-gray-700">of</span>
                    )}

                    {totalPages > 5 && (
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? "bg-[#288DD1] text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {totalPages}
                      </button>
                    )}

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
            </>
          )}
        </div>

        {/* Create Lead Modal */}
        {isCreateLeadsModalVisible && <CreateLead onClose={closeCreateLead} />}
      </main>
    </>
  );
}