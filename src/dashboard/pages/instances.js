import React, { useState, useEffect } from "react";
import CartFloat from "../components/cartFloat";
import Headbar from "../components/headbar";
import ActiveTab from "../components/activeTab";
import Sidebar from "../components/sidebar";
import AddInstanceModal from "../components/addInstanace";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useFetchInstanceRequests } from "../../hooks/instancesHook";

export default function Instances() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddInstancesOpen, setAddInstances] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [instanceCount, setInstanceCount] = useState(0);
  const itemsPerPage = 10;
  const maxInstances = 20;

  const { data: instancesResponse, isFetching: isInstancesFetching } =
    useFetchInstanceRequests({ page: currentPage, per_page: itemsPerPage });

  const instances = instancesResponse?.data || [];
  const totalPages = instancesResponse?.meta?.last_page || 1;
  const totalInstances = instancesResponse?.meta?.total || 0;

  useEffect(() => {
    setInstanceCount(totalInstances);
  }, [totalInstances]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openAddInstances = () => setAddInstances(true);
  const closeAddInstances = () => setAddInstances(false);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (item) => {
    const encodedId = encodeURIComponent(btoa(item.identifier));
    const instanceName = item.name;
    window.location.href = `/dashboard/instances/details?id=${encodedId}&name=${instanceName}`;
  };

  if (isInstancesFetching) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-[#288DD1] mt-2">Loading instances...</p>
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
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="flex items-center justify-between">
          <button
            onClick={openAddInstances}
            disabled={instanceCount >= maxInstances}
            className={`rounded-[30px] py-3 px-9 text-white font-normal text-base mt-5 transition-colors ${
              instanceCount >= maxInstances
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#288DD1] hover:bg-[#1976D2]"
            }`}
          >
            Add Instances
          </button>
          <div className="text-base font-normal text-[#288DD1]">
            Instances Used: {instanceCount} / {maxInstances}
          </div>
        </div>

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
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  EBS Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Operating System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E8E6EA]">
              {instances.length > 0 ? (
                instances.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.ebs_volume?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                      {item.os_image?.name || "N/A"}
                    </td>
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
                          e.stopPropagation();
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
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No instances found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden mt-6 space-y-4">
          {instances.length > 0 ? (
            instances.map((item) => (
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
                  <div className="flex justify-between">
                    <span className="font-medium">EBS Volume:</span>
                    <span>{item.ebs_volume?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">OS:</span>
                    <span>{item.os_image?.name || "N/A"}</span>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
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

      <AddInstanceModal
        isOpen={isAddInstancesOpen}
        onClose={closeAddInstances}
      />
    </>
  );
}
