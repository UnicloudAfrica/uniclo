// @ts-nocheck
import React, { useState } from "react";
import DetailedModules from "./detailsModules";
import ModernTable from "../../../shared/components/ui/ModernTable";

interface ClientModulesProps {
  client?: any; // Added prop for future use if needed, though currently using static data
}

const ClientModules: React.FC<ClientModulesProps> = () => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
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

  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status === "Active";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive ? "bg-[#00BF6B14] text-[#00BF6B]" : "bg-[#EB417833] text-[#EB4178]"
        }`}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: "module",
      header: "MODULE",
      className: "text-[#575758] font-normal",
    },
    {
      key: "status",
      header: "STATUS",
      render: (val: string) => <StatusBadge status={val} />,
    },
    {
      key: "plan",
      header: "PLAN",
      className: "text-[#575758] font-normal",
    },
    {
      key: "startDate",
      header: "START DATE",
      className: "text-[#575758] font-normal",
    },
    {
      key: "endDate",
      header: "END DATE",
      className: "text-[#575758] font-normal",
    },
  ];

  return (
    <>
      <div className="mt-6">
        <ModernTable
          data={data}
          columns={columns}
          onRowClick={handleRowClick}
          paginated={true}
          pageSize={10}
          searchable={false}
        />
      </div>

      <DetailedModules
        selectedItem={selectedItem}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
    </>
  );
};

export default ClientModules;
