// @ts-nocheck
import React, { useState, useMemo } from "react";
import {
  Users,
  ShieldCheck,
  Building2,
  UserPlus,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton } from "../../shared/components/ui";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import DeleteClientModal from "./clientComps/DeleteClient";
import { EditClientModal } from "./clientComps/EditClient";
import PromoteClientModal from "./clientComps/PromoteClientModal";
import { TableActionButtons } from "../../shared/components/tables";
import ModernTable from "../../shared/components/ui/ModernTable";

const encodeId = (id: string) => encodeURIComponent(btoa(id));

const AdminClients = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isPromoteClientModalOpen, setIsPromoteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  const clientData = useMemo(() => clients || [], [clients]);

  const uniqueTenants = useMemo(() => {
    return [
      { id: "", name: "All Tenants" },
      ...Array.from(new Set(clientData.map((item: any) => item.tenant_id)))
        .map((tenantId: any) => {
          const tenant = clientData.find((item: any) => item.tenant_id === tenantId)?.tenant;
          return tenant ? { id: tenant.id, name: tenant.name } : null;
        })
        .filter(Boolean),
    ];
  }, [clientData]);

  // Stats
  const totalClients = clientData.length;
  const activeClients = clientData.filter(
    (client: any) => client.status === "active" || client.is_active
  ).length;
  const tenantCount = Math.max(uniqueTenants.length - 1, 0);
  const pendingClients = clientData.filter((client: any) => client.status === "pending").length;

  const headerActions = (
    <ModernButton
      variant="primary"
      onClick={() => navigate("/admin-dashboard/clients/create")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Client
    </ModernButton>
  );

  const handleViewDetails = (client: any) => {
    const encodedId = encodeId(client.identifier);
    const clientFullName = encodeURIComponent(`${client.first_name} ${client.last_name}`);
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`);
  };

  const handleEditClient = (client: any) => {
    setSelectedClient(client);
    setIsEditClientModalOpen(true);
  };

  const handleDeleteClient = (client: any) => {
    setSelectedClient(client);
    setIsDeleteClientModalOpen(true);
  };

  const handlePromoteClient = (client: any) => {
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

  const onClientDeleteConfirm = () => {
    closeDeleteClientModal();
    // Refetch logic is handled by react-query invalidation in the hook usually,
    // or we can force refetch if needed, but standard hook usage handles it.
  };

  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedClients.length} client(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("DELETE", "/clients/bulk-delete", {
        client_ids: selectedClients,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully deleted ${selectedClients.length} client(s)`);
      setSelectedClients([]);
      window.location.reload(); // Simple reload for now
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to delete clients");
      console.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async (format = "csv") => {
    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      const response = await adminSilentApi(
        "POST",
        "/clients/bulk-export",
        {
          client_ids: selectedClients,
          format: format,
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

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully exported ${selectedClients.length} client(s)`);
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to export clients");
      console.error("Bulk export error:", error);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!window.confirm(`Duplicate ${selectedClients.length} client(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/clients/bulk-duplicate", {
        client_ids: selectedClients,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully duplicated ${selectedClients.length} client(s)`);
      setSelectedClients([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate clients");
      console.error("Bulk duplicate error:", error);
    }
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedClients.length} client(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/clients/bulk-archive", {
        client_ids: selectedClients,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully archived ${selectedClients.length} client(s)`);
      setSelectedClients([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive clients");
      console.error("Bulk archive error:", error);
    }
  };

  const handleDuplicateClient = async (client: any) => {
    if (!window.confirm(`Duplicate ${client.first_name} ${client.last_name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/clients/${client.identifier}/duplicate`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Client duplicated successfully");
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate client");
      console.error("Duplicate error:", error);
    }
  };

  const handleArchiveClient = async (client: any) => {
    if (!window.confirm(`Archive ${client.first_name} ${client.last_name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/clients/${client.identifier}/archive`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Client archived successfully");
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive client");
      console.error("Archive error:", error);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (item: any) => (
        <div className="font-medium text-gray-900">
          {item.first_name} {item.last_name}
        </div>
      ),
      sortable: true,
    },
    {
      key: "email",
      header: "Email Address",
      render: (item: any) => <div className="text-gray-600">{item.email}</div>,
      sortable: true,
    },
    {
      key: "tenant_name",
      header: "Tenant Name",
      render: (item: any) => <div className="text-gray-600">{item.tenant?.name || "N/A"}</div>,
      sortable: true,
    },
    {
      key: "created_at",
      header: "Created",
      render: (item: any) => (
        <div className="text-gray-600">
          {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
        </div>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: any) => (
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
              item.tenant_id
                ? []
                : [
                    {
                      label: "Promote to tenant",
                      icon: <ArrowUpRight className="h-4 w-4" />,
                      onClick: () => handlePromoteClient(item),
                    },
                  ]
            }
            itemName={`${item.first_name} ${item.last_name}`}
          />
        </div>
      ),
    },
  ];

  // Filter logic
  const filteredData = useMemo(() => {
    if (!selectedTenantId) return clientData;
    return clientData.filter((item: any) => String(item.tenant_id) === String(selectedTenantId));
  }, [clientData, selectedTenantId]);

  return (
    <>
      <AdminPageShell
        title="Clients Management"
        description="Manage client accounts, tenant assignments, and contacts."
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />

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
            title="Tenants"
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
          loading={isClientsFetching}
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
                  {uniqueTenants.map((tenant: any) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        />
      </AdminPageShell>

      {isEditClientModalOpen && (
        <EditClientModal
          client={selectedClient}
          onClose={closeEditClientModal}
          onClientUpdated={closeEditClientModal}
        />
      )}

      <DeleteClientModal
        isOpen={isDeleteClientModalOpen}
        onClose={closeDeleteClientModal}
        client={selectedClient}
        onDeleteConfirm={onClientDeleteConfirm}
      />

      <PromoteClientModal
        isOpen={isPromoteClientModalOpen}
        onClose={closePromoteClientModal}
        client={selectedClient}
        onPromoted={() => {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }}
      />
    </>
  );
};

export default AdminClients;
