import { useState } from "react";
import DetailedModules from "./detailsModules";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PartnerModules = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const data = [
    {
      id: 1,
      module: "Z2 Compute Instances",
      status: "Active",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 2,
      module: "Z4 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 3,
      module: "Z8 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 4,
      module: "Shared Storage",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 5,
      module: "Z4 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 6,
      module: "Z4 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 7,
      module: "Z4 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 8,
      module: "Z4 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 9,
      module: "Z4 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
    {
      id: 10,
      module: "Z4 Compute Instances",
      status: "Inactive",
      plan: "Business Tier",
      startDate: "April 13, 2025 - 2:45 PM",
      endDate: "May 13, 2025",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const currentData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const StatusBadge = ({ status }) => {
    const isActive = status === "Active";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive
            ? "bg-[#00BF6B14] text-[#00BF6B]"
            : "bg-[#EB417833] text-[#EB4178]"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px]">
        <table className="w-full ">
          <thead className="bg-[#F5F5F5] ">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                MODULE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                STATUS
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                PLAN
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                START DATE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                END DATE
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E8E6EA]">
            {currentData.map((item, index) => (
              <tr
                key={item.id}
                onClick={() => handleRowClick(item)}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                  {item.module}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                  {item.plan}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                  {item.startDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                  {item.endDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden mt-6">
        {currentData.map((item) => (
          <div
            key={item.id}
            onClick={() => handleRowClick(item)}
            className="border-b border-gray-200 py-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                {item.module}
              </h3>
              <StatusBadge status={item.status} />
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="font-medium">Plan:</span>
                <span>{item.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Start Date:</span>
                <span>{item.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">End Date:</span>
                <span>{item.endDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
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

      <DetailedModules
        selectedItem={selectedItem}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
    </>
  );
};

export default PartnerModules;
