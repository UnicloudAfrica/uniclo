import { useState } from "react";
import DetailedModules from "./detailsModules";
import { ModernTable } from "@/shared/components";

interface ModuleRow {
  id: number;
  module: string;
  status: string;
  plan: string;
  startDate: string;
  endDate: string;
}

const ClientModules = () => {
  const [selectedItem, setSelectedItem] = useState<ModuleRow | null>(null);
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

  const handleRowClick = (item: ModuleRow) => {
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
      render: (val: string) => <span className="text-[var(--theme-text-color)]">{val}</span>,
    },
    {
      key: "status",
      header: "STATUS",
      render: (val: string) => {
        const isActive = val === "Active";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              isActive
                ? "bg-[rgb(var(--theme-success-500) / 0.08)] text-[rgb(var(--theme-success-500))]"
                : "bg-[rgb(var(--theme-danger-500) / 0.2)] text-[rgb(var(--theme-danger-500))]"
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
      render: (val: string) => <span className="text-[var(--theme-text-color)]">{val}</span>,
    },
    {
      key: "startDate",
      header: "START DATE",
      render: (val: string) => <span className="text-[var(--theme-text-color)]">{val}</span>,
    },
    {
      key: "endDate",
      header: "END DATE",
      render: (val: string) => <span className="text-[var(--theme-text-color)]">{val}</span>,
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
