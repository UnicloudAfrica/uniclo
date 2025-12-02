import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Settings2,
  Loader2,
  Users,
  ShieldCheck,
  Building2,
  UserPlus,
  Plus,
  SquarePen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import DeleteClientModal from "./clientComps/deleteClient";
import EditClientModal from "./clientComps/editClient";
import TableActionButtons from "../components/TableActionButtons";
import BulkSelectionBar from "../components/BulkSelectionBar";
import SortableTableHeader from "../components/SortableTableHeader";
import BulkActionsDropdown from "../components/BulkActionsDropdown";

const encodeId = (id) => encodeURIComponent(btoa(id));

const AdminClients = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  const clientData = clients || [];

  const uniqueTenants = [
    { id: "", name: "All Tenants" },
    ...Array.from(new Set(clientData.map((item) => item.tenant_id)))
      .map((tenantId) => {
        const tenant = clientData.find((item) => item.tenant_id === tenantId)?.tenant;
        return tenant ? { id: tenant.id, name: tenant.name } : null;
      })
      .filter(Boolean),
  ];

  const filteredData = clientData.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (item.first_name && item.first_name.toLowerCase().includes(query)) ||
      (item.last_name && item.last_name.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.phone && item.phone.toLowerCase().includes(query));

    const matchesTenant = selectedTenantId === "" || item.tenant_id === selectedTenantId;

    return matchesSearch && matchesTenant;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalClients = clientData.length;
  const activeClients = clientData.filter(
    (client) => client.status === "active" || client.is_active
  ).length;
  const tenantCount = Math.max(uniqueTenants.length - 1, 0);
  const pendingClients = clientData.filter((client) => client.status === "pending").length;

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

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewDetails = (client) => {
    const encodedId = encodeId(client.identifier);
    const clientFullName = encodeURIComponent(`${client.first_name} ${client.last_name}`);
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsEditClientModalOpen(true);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setIsDeleteClientModalOpen(true);
  };

  const closeEditClientModal = () => {
    setIsEditClientModalOpen(false);
    setSelectedClient(null);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  const onClientDeleteConfirm = () => {
    closeDeleteClientModal();
  };

  // Bulk selection handlers
  const handleSelectClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === currentData.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(currentData.map((client) => client.identifier));
    }
  };

  const handleClearSelection = () => {
    setSelectedClients([]);
  };

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
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to delete clients");
      console.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async (format = 'csv') => {
    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      const response = await adminSilentApi("POST", "/clients/bulk-export", {
        client_ids: selectedClients,
        format: format,
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clients_${Date.now()}.${format}`);
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

  // Single item operations
  const handleDuplicateClient = async (client) => {
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

  const handleArchiveClient = async (client) => {
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

  // Sorting handler
  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  // Bulk actions configuration
  const bulkActions = [
    {
      key: 'export-csv',
      label: 'Export as CSV',
      onClick: () => handleBulkExport('csv'),
    },
    {
      key: 'export-excel',
      label: 'Export as Excel',
      onClick: () => handleBulkExport('xlsx'),
    },
    {
      key: 'duplicate',
      label: 'Duplicate',
      onClick: handleBulkDuplicate,
    },
    {
      key: 'archive',
      label: 'Archive',
      onClick: handleBulkArchive,
    },
    {
      key: 'delete',
      label: 'Delete',
      variant: 'danger',
      onClick: handleBulkDelete,
    },
  ];

  const tableColumns = [
    { key: 'first_name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email Address', sortable: true },
    { key: 'tenant_name', label: 'Tenant Name', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false },
  ];

  const filterBar = (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="w-full md:flex-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Search Clients</label>
        <input
          type="text"
          placeholder="Search name, email, or phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#288DD1]/40"
          autoComplete="off"
        />
      </div>
      <div className="w-full md:w-60">
        <label className="text-xs font-semibold text-gray-500 uppercase">Tenant Filter</label>
        <select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#288DD1]/40"
        >
          {uniqueTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const tableContent = isClientsFetching ? (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
      <p className="ml-3 text-gray-600">Loading clients...</p>
    </div>
  ) : (
    <>
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full">
          <SortableTableHeader
            columns={[
              { key: 'select', label: '', sortable: false },
              { key: 'sn', label: 'S/N', sortable: false },
              ...tableColumns
            ]}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          <tbody className="bg-white divide-y divide-gray-100">
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(item.identifier)}
                      onChange={() => handleSelectClient(item.identifier)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.first_name} {item.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.tenant?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right">
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
                      itemName={`${item.first_name} ${item.last_name}`}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden grid grid-cols-1 gap-4">
        {currentData.length > 0 ? (
          currentData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.first_name} {item.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{item.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tenant: {item.tenant?.name || "N/A"}
                  </p>
                </div>
                <div className="flex gap-2">
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
                    itemName={`${item.first_name} ${item.last_name}`}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-gray-500">
            No clients found.
          </div>
        )}
      </div>
    </>
  );

  const pagination = filteredData.length > 0 && (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-full border border-gray-200 text-gray-500 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-full border border-gray-200 text-gray-500 disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} -
        {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
      </p>
    </div>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
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

        {/* Bulk Actions Dropdown */}
        {selectedClients.length > 0 && (
          <div className="flex justify-end mb-4">
            <BulkActionsDropdown
              selectedCount={selectedClients.length}
              actions={bulkActions}
            />
          </div>
        )}

        <ModernCard>
          {filterBar}
          <div className="mt-6 space-y-6">
            {tableContent}
            {pagination}
          </div>
        </ModernCard>
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

      <BulkSelectionBar
        selectedCount={selectedClients.length}
        onDelete={handleBulkDelete}
        onClear={handleClearSelection}
        itemType="client"
        showExport={false}
      />
    </>
  );
};

export default AdminClients;
