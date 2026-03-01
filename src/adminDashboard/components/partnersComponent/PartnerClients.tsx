import React from "react";
import { Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFetchSubTenantByTenantID } from "../../../hooks/adminHooks/tenantHooks";
import { ModernButton } from "../../../shared/components/ui";
import ModernTable, { Column } from "../../../shared/components/ui/ModernTable";

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
  const { data: partnerClientsData, isFetching: isClientsFetching } =
    useFetchSubTenantByTenantID(tenantId);

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
    },
    {
      key: "email",
      header: "EMAIL ADDRESS",
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
          <Eye className="h-4 w-4" />
          View
        </ModernButton>
      ),
    },
  ];

  return (
    <div className="font-Outfit">
      {isClientsFetching ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-color)]" />
          <p className="ml-2 text-gray-600">Loading clients...</p>
        </div>
      ) : (
        <div className="mt-6">
          <ModernTable
            data={clientData}
            columns={columns}
            onRowClick={handleViewDetails}
            paginated={true}
            pageSize={10}
            searchable={true}
            searchKeys={["name", "email"]}
            emptyMessage="No clients found."
            className="rounded-[12px] border border-gray-200"
          />
        </div>
      )}
    </div>
  );
};

export default PartnerClients;
