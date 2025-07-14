import React, { useState } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import ActiveTab from "../components/activeTab";
import Sidebar from "../components/sidebar";
import AddInstanceModal from "../components/addInstanace"; // Corrected component name if it was addInstanace
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useFetchInstanceRequests } from "../../hooks/instancesHook";

export default function Instances() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddInstancesOpen, setAddInstances] = useState(false);
  const { data: instances, isFetching: isInstancesFetching } =
    useFetchInstanceRequests();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddInstances = () => setAddInstances(true);
  const closeAddInstances = () => setAddInstances(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Calculate totalPages based on the actual instances length, handling null/undefined data
  const totalPages = Math.ceil((instances?.length || 0) / itemsPerPage);

  const currentData =
    instances?.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ) || []; // Ensure currentData is an array even if instances is null/undefined

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    // Add modal logic or navigation to instance details if needed
    // alert(`Clicked on instance: ${item.name}`);
  };

  // Loading state
  if (isInstancesFetching) {
    return (
      <>
        <CartFloat />
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700 mt-2">Loading instances...</p>
        </main>
      </>
    );
  }

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
          {/* <h2 className="text-base font-medium text-[#1C1C1C]">
            Compute Instances
          </h2> */}
          {/* <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            Quick Start
          </button> */}
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
                  Instance Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  vCPUs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  RAM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Disk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Operating System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  HA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.compute_instance?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.compute_instance?.vcpus || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.compute_instance?.memory_gib
                        ? `${item.compute_instance.memory_gib}GB`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.storage_size_gb
                        ? `${item.storage_size_gb} GiB`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.os_image?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.ha === true
                        ? "Yes"
                        : item.ha === false
                        ? "No"
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.user?.name || item.user_id || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.project?.name || item.project_id || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          item.status === "Running"
                            ? "bg-green-100 text-green-800"
                            : item.status === "Stopped"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800" // For "payment_pending" or other statuses
                        }`}
                      >
                        {item.status?.replace(/_/g, " ") || "N/A"}{" "}
                        {/* Replace underscores for better display */}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="10"
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
          {currentData.length > 0 ? (
            currentData.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRowClick(item)}
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
                        : "bg-orange-100 text-orange-800" // For "payment_pending" or other statuses
                    }`}
                  >
                    {item.status?.replace(/_/g, " ") || "N/A"}{" "}
                    {/* Replace underscores for better display */}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Instance Type:</span>
                    <span>{item.compute_instance?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">vCPUs:</span>
                    <span>{item.compute_instance?.vcpus || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">RAM:</span>
                    <span>
                      {item.compute_instance?.memory_gib
                        ? `${item.compute_instance.memory_gib}GB`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Disk:</span>
                    <span>
                      {item.storage_size_gb
                        ? `${item.storage_size_gb} GiB`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">OS:</span>
                    <span>{item.os_image?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">HA:</span>
                    <span>
                      {item.ha === true
                        ? "Yes"
                        : item.ha === false
                        ? "No"
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">User:</span>
                    <span>{item.user?.name || item.user_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Account:</span>
                    <span>
                      {item.project?.name || item.project_id || "N/A"}
                    </span>
                  </div>
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
        {instances?.length > 0 && ( // Only show pagination if there are instances
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

      <AddInstanceModal
        isOpen={isAddInstancesOpen}
        onClose={closeAddInstances}
      />
    </>
  );
}
