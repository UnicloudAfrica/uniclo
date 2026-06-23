import { useState } from "react";
import { Boxes } from "lucide-react";
import DetailedModules from "./DetailedModules"; // Note: File import was DetailedModules, check casing. Step 4303 shows "./DetailedModules".
import ModernTable, { Column } from "@/shared/components/ui/ModernTable";
import MobileRecordCards from "@/shared/components/ui/MobileRecordCards";

const accent = "var(--theme-color)";

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
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
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
      render: (_: unknown, row: PartnerModuleRow) => (
        <span className="block min-w-0 break-words text-sm font-medium text-gray-900 dark:text-white">
          {row.module}
        </span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (_: unknown, row: PartnerModuleRow) => <StatusBadge status={row.status} />,
    },
    {
      key: "plan",
      header: "PLAN",
      render: (_: unknown, row: PartnerModuleRow) => (
        <span className="block min-w-0 break-words text-sm text-gray-600 dark:text-gray-300">
          {row.plan}
        </span>
      ),
    },
    {
      key: "startDate",
      header: "START DATE",
      render: (_: unknown, row: PartnerModuleRow) => (
        <span className="block whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
          {row.startDate}
        </span>
      ),
    },
    {
      key: "endDate",
      header: "END DATE",
      render: (_: unknown, row: PartnerModuleRow) => (
        <span className="block whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
          {row.endDate}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--theme-color-10)", color: accent }}
          >
            <Boxes size={16} />
          </span>
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">Modules</h3>
        </div>

        {/* Desktop / tablet: table */}
        <div className="hidden w-full max-w-full overflow-x-auto sm:block">
          <ModernTable
            data={data}
            columns={columns}
            onRowClick={handleRowClick}
            paginated={true}
            pageSize={10}
            searchable={false}
          />
        </div>

        {/* Mobile: one card per row */}
        <div className="sm:hidden">
          <MobileRecordCards<PartnerModuleRow>
            rows={data}
            getKey={(row) => row.id}
            onRowClick={handleRowClick}
            title={(row) => row.module}
            titleWrap="break-words"
            status={(row) => <StatusBadge status={row.status} />}
            fields={[
              { label: "Plan", render: (row) => row.plan },
              { label: "Start Date", render: (row) => row.startDate },
              { label: "End Date", render: (row) => row.endDate },
            ]}
          />
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
