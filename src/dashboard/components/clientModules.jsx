import { useState } from "react";
import DetailedModules from "./detailsModules";
import { ModernTable } from "../../shared/components";

const ClientModules = () => {
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
  ];

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const columns = [
    {
      key: "module",
      header: "MODULE",
      render: (val) => <span className="text-[#575758]">{val}</span>,
    },
    {
      key: "status",
      header: "STATUS",
      render: (val) => {
        const isActive = val === "Active";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              isActive ? "bg-[#00BF6B14] text-[#00BF6B]" : "bg-[#EB417833] text-[#EB4178]"
            }`}
          >
            {val}
          </span>
        );
      },
    },
    {
      key: "plan",
      header: "PLAN",
      render: (val) => <span className="text-[#575758]">{val}</span>,
    },
    {
      key: "startDate",
      header: "START DATE",
      render: (val) => <span className="text-[#575758]">{val}</span>,
    },
    {
      key: "endDate",
      header: "END DATE",
      render: (val) => <span className="text-[#575758]">{val}</span>,
    },
  ];

  return (
    <>
      <ModernTable
        data={data}
        columns={columns}
        onRowClick={handleRowClick}
        searchable={true}
        searchPlaceholder="Search modules..."
        searchKeys={["module", "plan", "status"]}
        paginated={true}
        pageSize={10}
        filterable={false}
        exportable={false}
        emptyMessage="No modules found."
      />

      <DetailedModules
        selectedItem={selectedItem}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
    </>
  );
};

export default ClientModules;
