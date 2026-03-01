import { useState } from "react";
import DetailedModules from "./DetailedModules"; // Note: File import was DetailedModules, check casing. Step 4303 shows "./DetailedModules".
import ModernTable, { Column } from "../../../shared/components/ui/ModernTable";

interface PartnerModulesProps {
  tenantId?: string;
}

interface PartnerModuleRow {
  id: number;
  module: string;
  status: string;
  plan: string;
  startDate: string;
  endDate: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
        isActive
          ? "bg-[rgb(var(--theme-success-500) / 0.08)] text-[rgb(var(--theme-success-500))]"
          : "bg-[rgb(var(--theme-danger-500) / 0.2)] text-[rgb(var(--theme-danger-500))]"
      }`}
    >
      {status}
    </span>
  );
};

const PartnerModules: React.FC<PartnerModulesProps> = () => {
  const [selectedItem, setSelectedItem] = useState<PartnerModuleRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const data: PartnerModuleRow[] = [
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

  const handleRowClick = (item: PartnerModuleRow) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const columns: Column<PartnerModuleRow>[] = [
    {
      key: "module",
      header: "MODULE",
    },
    {
      key: "status",
      header: "STATUS",
      render: (_: unknown, row: PartnerModuleRow) => <StatusBadge status={row.status} />,
    },
    {
      key: "plan",
      header: "PLAN",
    },
    {
      key: "startDate",
      header: "START DATE",
    },
    {
      key: "endDate",
      header: "END DATE",
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

export default PartnerModules;
