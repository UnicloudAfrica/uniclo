// @ts-nocheck
import React, { useMemo, useState } from "react";
import {
  Users,
  ShieldCheck,
  Building2,
  UserPlus,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ModernStatsCard from "../ui/ModernStatsCard";
import ModernTable from "../ui/ModernTable";
import { TableActionButtons } from "../tables";
import { useFetchClients as useAdminFetchClients } from "../../../hooks/adminHooks/clientHooks";
import { useFetchClients as useTenantFetchClients } from "../../../hooks/clientHooks";
import ClientDeleteModal from "./ClientDeleteModal";
import ClientEditModal from "./ClientEditModal";
import PromoteClientModal from "../../../adminDashboard/pages/clientComps/PromoteClientModal";
import adminSilentApi from "../../../index/admin/silent";
import tenantSilentApi from "../../../index/tenant/silentTenant";
import ToastUtil from "../../../utils/toastUtil";

const encodeId = (id) => encodeURIComponent(btoa(id));
const resolveClientId = (client) => client?.identifier || client?.id || client?.uuid || "";

const ClientsManagement = ({ context = "admin" }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isPromoteClientModalOpen, setIsPromoteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);

  const adminClientsQuery = useAdminFetchClients({ enabled: context === "admin" });
  const tenantClientsQuery = useTenantFetchClients(null, { enabled: context === "tenant" });

  const clients = context === "tenant" ? tenantClientsQuery.data : adminClientsQuery.data;
  const isFetching = context === "tenant" ? tenantClientsQuery.isFetching : adminClientsQuery.isFetching;

  const clientData = useMemo(() => clients || [], [clients]);

  const uniqueTenants = useMemo(() => {
    if (context !== "admin") return [];

    return [
      { id: "", name: "All Tenants" },
      ...Array.from(new Set(clientData.map((item) => item.tenant_id)))
        .map((tenantId) => {
          const tenant = clientData.find((item) => item.tenant_id === tenantId)?.tenant;
          return tenant ? { id: tenant.id, name: tenant.name } : null;
        })
        .filter(Boolean),
    ];
  }, [clientData, context]);

  const totalClients = clientData.length;
  const activeClients = clientData.filter(
    (client) => client.status === "active" || client.is_active
  ).length;
  const tenantCount = context === "admin" ? Math.max(uniqueTenants.length - 1, 0) : 1;
  const pendingClients = clientData.filter((client) => client.status === "pending").length;


  const handleViewDetails = (client) => {
    if (context === "admin") {
      const encodedId = encodeId(client.identifier || client.id);
      const clientFullName = encodeURIComponent(`${client.first_name} ${client.last_name}`);
      navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`);
      return;
    }

    const identifier = resolveClientId(client);
    if (identifier) {
      navigate(`/dashboard/clients/${identifier}`);
    }
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsEditClientModalOpen(true);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setIsDeleteClientModalOpen(true);
  };

  const handlePromoteClient = (client) => {
    if (context !== "admin") return;
    setSelectedClient(client);
    setIsPromoteClientModalOpen(true);
  };

  const closeEditClientModal = () => {
    setIsEditClientModalOpen(false);
    setSelectedClient(null);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  const closePromoteClientModal = () => {
    setIsPromoteClientModalOpen(false);
    setSelectedClient(null);
  };

  const apiClient = context === "admin" ? adminSilentApi : tenantSilentApi;

  const refreshClients = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedClients.length} client(s)?`)) return;

    try {
      await apiClient("DELETE", "/clients/bulk-delete", {
        client_ids: selectedClients,
      });
      ToastUtil.success(`Successfully deleted ${selectedClients.length} client(s)`);
      setSelectedClients([]);
      refreshClients();
    } catch (error) {
      ToastUtil.error("Failed to delete clients");
      console.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async (format = "csv") => {
    try {
      const response = await apiClient(
        "POST",
        "/clients/bulk-export",
        {
          client_ids: selectedClients,
          format,
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `clients_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      ToastUtil.success(`Successfully exported ${selectedClients.length} client(s)`);
    } catch (error) {
      ToastUtil.error("Failed to export clients");
      console.error("Bulk export error:", error);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!window.confirm(`Duplicate ${selectedClients.length} client(s)?`)) return;

    try {
      await apiClient("POST", "/clients/bulk-duplicate", {
        client_ids: selectedClients,
      });

      ToastUtil.success(`Successfully duplicated ${selectedClients.length} client(s)`);
      setSelectedClients([]);
      refreshClients();
    } catch (error) {
      ToastUtil.error("Failed to duplicate clients");
      console.error("Bulk duplicate error:", error);
    }
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedClients.length} client(s)?`)) return;

    try {
      await apiClient("POST", "/clients/bulk-archive", {
        client_ids: selectedClients,
      });

      ToastUtil.success(`Successfully archived ${selectedClients.length} client(s)`);
      setSelectedClients([]);
      refreshClients();
    } catch (error) {
      ToastUtil.error("Failed to archive clients");
      console.error("Bulk archive error:", error);
    }
  };

  const handleDuplicateClient = async (client) => {
    if (!window.confirm(`Duplicate ${client.first_name} ${client.last_name}?`)) return;

    try {
      await apiClient("POST", `/clients/${client.identifier || client.id}/duplicate`);
      ToastUtil.success("Client duplicated successfully");
      refreshClients();
    } catch (error) {
      ToastUtil.error("Failed to duplicate client");
      console.error("Duplicate error:", error);
    }
  };

  const handleArchiveClient = async (client) => {
    if (!window.confirm(`Archive ${client.first_name} ${client.last_name}?`)) return;

    try {
      await apiClient("POST", `/clients/${client.identifier || client.id}/archive`);
      ToastUtil.success("Client archived successfully");
      refreshClients();
    } catch (error) {
      ToastUtil.error("Failed to archive client");
      console.error("Archive error:", error);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (_value, item) => (
        <div className="font-medium text-gray-900">
          {item.first_name} {item.last_name}
        </div>
      ),
      sortable: true,
    },
    {
      key: "email",
      header: "Email Address",
      render: (_value, item) => <div className="text-gray-600">{item.email}</div>,
      sortable: true,
    },
    ...(context === "admin"
      ? [
          {
            key: "tenant_name",
            header: "Tenant Name",
            render: (_value, item) => (
              <div className="text-gray-600">{item.tenant?.name || "N/A"}</div>
            ),
            sortable: true,
          },
        ]
      : []),
    {
      key: "created_at",
      header: "Created",
      render: (_value, item) => (
        <div className="text-gray-600">
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
        </div>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value, item) => (
        <div className="flex justify-end">
          <TableActionButtons
            onView={() => handleViewDetails(item)}
            onEdit={() => handleEditClient(item)}
            onDelete={() => handleDeleteClient(item)}
            onDuplicate={() => handleDuplicateClient(item)}
            onArchive={() => handleArchiveClient(item)}
            showView
            showEdit
            showDelete={!item.deleted_at}
            showDuplicate
            showArchive={!item.archived}
            customActions={
              context === "admin" && !item.tenant_id
                ? [
                    {
                      label: "Promote to tenant",
                      icon: <ArrowUpRight className="h-4 w-4" />,
                      onClick: () => handlePromoteClient(item),
                    },
                  ]
                : []
            }
            itemName={`${item.first_name} ${item.last_name}`}
          />
        </div>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    if (context !== "admin") return clientData;
    if (!selectedTenantId) return clientData;
    return clientData.filter((item) => String(item.tenant_id) === String(selectedTenantId));
  }, [clientData, selectedTenantId, context]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <ModernStatsCard
          title="Total Clients"
          value={totalClients}
          icon={<Users size={24} />}
          change={4}
          trend="up"
          color="primary"
        />
        <ModernStatsCard
          title="Active Clients"
          value={activeClients}
          icon={<ShieldCheck size={24} />}
          change={2}
          trend="up"
          color="success"
        />
        <ModernStatsCard
          title={context === "admin" ? "Tenants" : "Workspace"}
          value={tenantCount}
          icon={<Building2 size={24} />}
          color="info"
        />
        <ModernStatsCard
          title="Pending Invites"
          value={pendingClients}
          icon={<UserPlus size={24} />}
          color="warning"
        />
      </div>

      <ModernTable
        data={filteredData}
        columns={columns}
        loading={isFetching}
        searchPlaceholder="Search name, email, or phone..."
        searchKeys={["first_name", "last_name", "email", "phone"]}
        selectable
        onSelectionChange={setSelectedClients}
        bulkActions={[
          {
            label: "Export as CSV",
            onClick: () => handleBulkExport("csv"),
          },
          {
            label: "Export as Excel",
            onClick: () => handleBulkExport("xlsx"),
          },
          {
            label: "Duplicate",
            onClick: handleBulkDuplicate,
          },
          {
            label: "Archive",
            onClick: handleBulkArchive,
          },
          {
            label: "Delete",
            onClick: handleBulkDelete,
            variant: "danger",
          },
        ]}
        filterSlot={
          context === "admin" ? (
            <div className="w-full md:w-60">
              <div className="relative">
                <Filter
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {uniqueTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null
        }
      />

      {isEditClientModalOpen && (
        <ClientEditModal
          context={context}
          client={selectedClient}
          onClose={closeEditClientModal}
          onClientUpdated={closeEditClientModal}
        />
      )}

      <ClientDeleteModal
        context={context}
        isOpen={isDeleteClientModalOpen}
        onClose={closeDeleteClientModal}
        client={selectedClient}
        onDeleteConfirm={closeDeleteClientModal}
      />

      {context === "admin" && (
        <PromoteClientModal
          isOpen={isPromoteClientModalOpen}
          onClose={closePromoteClientModal}
          client={selectedClient}
          onPromoted={() => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
          }}
        />
      )}
    </>
  );
};

export default ClientsManagement;
