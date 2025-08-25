import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useFetchInstanceRequests } from "../../hooks/adminHooks/instancesHook";
import AddAdminInstance from "./instanceComp/addInstance";

export default function AdminInstances() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddInstancesOpen, setAddInstances] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // This will be passed as per_page to the API

  // Fetch instances using the useFetchInstanceRequests hook with pagination parameters
  const { data: instancesResponse, isFetching: isInstancesFetching } =
    useFetchInstanceRequests({ page: currentPage, per_page: itemsPerPage });

  // Extract the actual instance data from the 'data' property of the response
  const instances = instancesResponse?.data || [];
  // Extract pagination metadata from the 'meta' property of the response
  const totalPages = instancesResponse?.meta?.last_page || 1;
  const totalInstances = instancesResponse?.meta?.total || 0;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddInstances = () => setAddInstances(true);
  const closeAddInstances = () => setAddInstances(false);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (item) => {
    // Encode the ID using btoa then encodeURIComponent
    const encodedId = encodeURIComponent(btoa(item.identifier));
    const instanceName = item.name; // No need to encode name as per request

    // Navigate to the instance details page
    window.location.href = `/admin-dashboard/instances/details?id=${encodedId}&name=${instanceName}`;
  };

  // Loading state
  if (isInstancesFetching) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Loading instances...</p>
        </main>
      </>
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
        <div className="flex items-center justify-between">
          {/* Quick Start button removed as per previous instructions */}
        </div>

        <button
          onClick={openAddInstances}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base mt-5 hover:bg-[#1976D2] transition-colors"
        >
          Add Instances
        </button>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
          <table className="w-full">
            <thead className="bg-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Disk
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  EBS Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Operating System
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Action
                </th>{" "}
                {/* New Action column header */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {instances.length > 0 ? (
                instances.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)} // Row click for navigation
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.storage_size_gb
                        ? `${item.storage_size_gb} GiB`
                        : "N/A"}
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.ebs_volume?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.os_image?.name || "N/A"}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          item.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Stopped"
                            ? "bg-red-100 text-red-800"
                            : item.status === "spawning"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {item.status?.replace(/_/g, " ") || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click from firing
                          handleRowClick(item);
                        }}
                        className="text-[#288DD1] hover:underline text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6" // Updated colspan
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No instances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden mt-6 space-y-4">
          {instances.length > 0 ? (
            instances.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)} // Row click for navigation
                className="bg-white rounded-[12px] shadow-sm p-4 cursor-pointer border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      item.status === "Running"
                        ? "bg-green-100 text-green-800"
                        : item.status === "Stopped"
                        ? "bg-red-100 text-red-800"
                        : item.status === "spawning"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {item.status?.replace(/_/g, " ") || "N/A"}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Disk:</span>
                    <span>
                      {item.storage_size_gb
                        ? `${item.storage_size_gb} GiB`
                        : "N/A"}
                    </span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="font-medium">EBS Volume:</span>
                    <span>{item.ebs_volume?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">OS:</span>
                    <span>{item.os_image?.name || "N/A"}</span>
                  </div> */}
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row click from firing
                      handleRowClick(item);
                    }}
                    className="text-[#288DD1] hover:underline text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[12px] shadow-sm p-4 text-center text-gray-500">
              No instances found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalInstances > 0 && (
          <div className="flex items-center justify-center px-4 py-3 border-t border-gray-200 bg-white rounded-b-[12px] mt-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700">{currentPage}</span>
              <span className="text-sm text-gray-700">of</span>
              <span className="text-sm text-gray-700">{totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <AddAdminInstance
        isOpen={isAddInstancesOpen}
        onClose={closeAddInstances}
      />
    </>
  );
}
