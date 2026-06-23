import React from "react";
import { Eye, Loader2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFetchSubTenantByTenantID } from "@/hooks/adminHooks/tenantHooks";
import { ModernButton } from "@/shared/components/ui";
import ModernTable, { Column } from "@/shared/components/ui/ModernTable";
import MobileRecordCards from "@/shared/components/ui/MobileRecordCards";

const accent = "var(--theme-color)";

const encodeId = (id: string | number) => {
  return encodeURIComponent(btoa(String(id)));
};

interface PartnerClientsProps {
  tenantId?: string;
}

interface PartnerClientRecord {
  id?: string | number;
  identifier?: string | number;
  name?: string;
  email?: string;
}

const PartnerClients: React.FC<PartnerClientsProps> = ({ tenantId }) => {
  const navigate = useNavigate();
  const { data: partnerClientsData, isFetching: isClientsFetching } = useFetchSubTenantByTenantID(
    tenantId as string
  );

  const clientData: PartnerClientRecord[] = Array.isArray(partnerClientsData)
    ? (partnerClientsData as PartnerClientRecord[])
    : [];

  const handleViewDetails = (client: PartnerClientRecord) => {
    const identifier = client.id ?? client.identifier;
    if (identifier === undefined || identifier === null) {
      return;
    }
    const encodedId = encodeId(identifier);
    const clientFullName = encodeURIComponent(`${client.name || ""}`.trim() || "Unknown Client");
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`);
  };

  const columns: Column<PartnerClientRecord>[] = [
    {
      key: "sn",
      header: "S/N",
      render: (_: unknown, __: PartnerClientRecord, index: number) => index + 1,
    },
    {
      key: "name",
      header: "NAME",
      render: (_: unknown, item: PartnerClientRecord) => (
        <span className="block min-w-0 break-words text-sm font-medium text-gray-900 dark:text-white">
          {item.name || "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "EMAIL ADDRESS",
      render: (_: unknown, item: PartnerClientRecord) => (
        <span className="block min-w-0 break-all text-sm text-gray-600 dark:text-gray-300">
          {item.email || "—"}
        </span>
      ),
    },
    {
      key: "action",
      header: "ACTION",
      render: (_: unknown, item: PartnerClientRecord) => (
        <ModernButton
          variant="ghost"
          size="sm"
          className="gap-2 text-xs"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            handleViewDetails(item);
          }}
        >
          <Eye className="h-4 w-4 shrink-0" />
          View
        </ModernButton>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--theme-color-10)", color: accent }}
        >
          <Users size={16} />
        </span>
        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">Clients</h3>
      </div>

      {isClientsFetching ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: accent }} />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading clients...</p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden w-full max-w-full overflow-x-auto sm:block">
            <ModernTable
              data={clientData}
              columns={columns}
              onRowClick={handleViewDetails}
              paginated={true}
              pageSize={10}
              searchable={true}
              searchKeys={["name", "email"]}
              emptyMessage="No clients found."
            />
          </div>

          {/* Mobile: one card per row */}
          <div className="sm:hidden">
            <MobileRecordCards<PartnerClientRecord>
              rows={clientData}
              getKey={(item, index) => item.id ?? item.identifier ?? index}
              onRowClick={handleViewDetails}
              title={(item) => item.name || "—"}
              titleWrap="break-words"
              fields={[
                {
                  label: "Email",
                  wrap: "break-all",
                  render: (item) => item.email || "—",
                },
              ]}
              action={(item) => (
                <ModernButton
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleViewDetails(item);
                  }}
                >
                  <Eye className="h-4 w-4 shrink-0" />
                  View
                </ModernButton>
              )}
              emptyMessage="No clients found."
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PartnerClients;
