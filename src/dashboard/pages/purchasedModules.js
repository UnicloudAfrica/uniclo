import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { Filter, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import useAuthRedirect from "../../utils/authRedirect";
import { useFetchPurchasedInstances } from "../../hooks/instancesHook";
import { useNavigate } from "react-router-dom"; // Import useNavigate

export default function PurchasedModules() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuthRedirect();

  const {
    data: fetchedInstances = { data: [], meta: {} },
    isFetching: isInstancesFetching,
  } = useFetchPurchasedInstances();
  const navigate = useNavigate(); // Initialize navigate hook

  // Extract instances array and meta object for easier access
  const instances = fetchedInstances.data;
  const meta = fetchedInstances.meta;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Pagination states and logic now rely on meta data
  const currentPage = meta.current_page || 1;
  const totalPages = meta.last_page || 1;
  const itemsPerPage = meta.per_page || 10; // Use per_page from meta if available

  // currentData is now directly the instances array from the API response
  const currentData = instances;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      console.log("Navigating to page:", page);
    }
  };

  const handleRowClick = (item) => {
    // Encode the ID using btoa then encodeURIComponent
    const encodedId = encodeURIComponent(btoa(item.identifier));
    const instanceName = item.name;

    // Navigate to the instance details page
    navigate(
      `/dashboard/instances/details?id=${encodedId}&name=${instanceName}`
    );
  };

  // Status badge for instance status
  const StatusBadge = ({ status }) => {
    const baseClass =
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize";
    let styleClass = "";
    switch (status) {
      case "Running":
        styleClass = "bg-green-100 text-green-800";
        break;
      case "Stopped":
        styleClass = "bg-red-100 text-red-800";
        break;
      case "spawning":
        styleClass = "bg-blue-100 text-blue-800";
        break;
      case "payment_pending":
        styleClass = "bg-orange-100 text-orange-800";
        break;
      default:
        styleClass = "bg-gray-100 text-gray-600";
    }
    return (
      <span className={`${baseClass} ${styleClass}`}>
        {status?.replace(/_/g, " ")}
      </span>
    );
  };

  // Credentials badge
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
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  };

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
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );

  const MobileSkeleton = () => (
    <div className="md:hidden mt-6 space-y-4">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="border-b border-gray-200 py-4 animate-pulse bg-white rounded-[12px] shadow-sm p-4"
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
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1C1C1C]">
            Purchased Instances History
          </h2>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {isInstancesFetching ? (
          <>
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Instance Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Disk Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      OS Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Status
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Credentials
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Creation Date
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Next Billing Date
                    </th> */}
                  </tr>
                </thead>
                <TableSkeleton />
              </table>
            </div>
            <MobileSkeleton />
          </>
        ) : instances.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <p className="text-lg font-medium text-[#575758]">
              No purchased instances found.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Instance Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Disk Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      OS Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Status
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Credentials
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Creation Date
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      Next Billing Date
                    </th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E8E6EA]">
                  {currentData.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {item.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {item.storage_size_gb
                          ? `${item.storage_size_gb} GiB`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {item.os_image?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        <CredentialsBadge credentials={item.credentials} />
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {formatDate(item.created_at)}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {formatDate(item.next_billing_date)}
                      </td> */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden mt-6 space-y-4">
              {currentData.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="bg-white rounded-[12px] shadow-sm p-4 cursor-pointer border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {item.name || "N/A"}
                    </h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Disk Size:</span>
                      <span>
                        {item.storage_size_gb
                          ? `${item.storage_size_gb} GiB`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">OS Image:</span>
                      <span>{item.os_image?.name || "N/A"}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="font-medium">Credentials:</span>
                      <CredentialsBadge credentials={item.credentials} />
                    </div> */}
                    <div className="flex justify-between">
                      <span className="font-medium">Creation Date:</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="font-medium">Next Billing Date:</span>
                      <span>{formatDate(item.next_billing_date)}</span>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {instances.length > 0 && (
              <div className="flex items-center justify-center px-4 py-3 mt-6">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {/* Render page numbers based on meta links for more robust pagination */}
                    {meta.links?.map((link, index) => {
                      // Skip 'Previous' and 'Next' labels for direct page buttons
                      if (
                        link.label === "&laquo; Previous" ||
                        link.label === "Next &raquo;"
                      ) {
                        return null;
                      }

                      const pageNumber = parseInt(link.label);
                      if (isNaN(pageNumber)) return null; // Handle cases where label is not a number

                      return (
                        <button
                          key={index} // Use index as key if pageNumber isn't unique across all links
                          onClick={() => handlePageChange(pageNumber)}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            link.active
                              ? "bg-[#288DD1] text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Use meta.total for "of X" display if needed, or remove if not part of design */}
                  {/* <span className="text-sm text-gray-700">of {totalPages}</span> */}

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
      </main>
    </>
  );
}
