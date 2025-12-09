// @ts-nocheck
import React from "react";
import { Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFetchSubTenantByTenantID } from "../../../hooks/adminHooks/tenantHooks";
import { ModernButton } from "../../../shared/components/ui";
import ModernTable from "../../../shared/components/ui/ModernTable";

const encodeId = (id: string) => {
  return encodeURIComponent(btoa(id));
};

interface PartnerClientsProps {
  tenantId?: string;
}

const PartnerClients: React.FC<PartnerClientsProps> = ({ tenantId }: any) => {
  const navigate = useNavigate();
  const { data: partnerClients, isFetching: isClientsFetching } =
    useFetchSubTenantByTenantID(tenantId);

  const clientData = partnerClients || [];

  const handleViewDetails = (client: any) => {
    const encodedId = encodeId(client.id || client.identifier);
    const clientFullName = encodeURIComponent(`${client.name || ""}`.trim() || "Unknown Client");
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`);
  };

  const columns = [
    {
      key: "sn",
      header: "S/N",
      render: (_: any, __: any, index: number) => index + 1,
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
      render: (_: any, item: any) => (
        <ModernButton
          variant="ghost"
          size="sm"
          className="gap-2 text-xs"
          onClick={(e) => {
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
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
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
