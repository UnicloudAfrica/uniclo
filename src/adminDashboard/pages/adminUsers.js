import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  UserCog,
  Plus,
  Loader2,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import { useFetchAdmins } from "../../hooks/adminHooks/adminHooks";
import { DeleteAdminModal } from "./adminComps/deleteAdmin";
import TableActionButtons from "../components/TableActionButtons";
import BulkSelectionBar from "../components/BulkSelectionBar";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import SortableTableHeader from "../components/SortableTableHeader";
import BulkActionsDropdown from "../components/BulkActionsDropdown";

export default function AdminUsers() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedAdmins, setSelectedAdmins] = useState([]);

  // Search, pagination, and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

  const navigate = useNavigate();

  const { data: adminUsers = [], isFetching: isUsersFetching } = useFetchAdmins();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleAddAdmin = () => navigate("/admin-dashboard/admin-users/create");

  const encodeId = (id) => {
    try {
      return encodeURIComponent(btoa(String(id)));
    } catch (error) {
      console.error("Failed to encode admin id", error);
      return null;
    }
  };

  const handleViewAdmin = (admin) => {
    const encodedId = admin?.identifier ? encodeId(admin.identifier) : null;
    if (!encodedId) return;
    navigate(`/admin-dashboard/admin-users/${encodedId}`);
  };

  const handleEditAdmin = (admin) => {
    const encodedId = admin?.identifier ? encodeId(admin.identifier) : null;
    if (!encodedId) return;
    navigate(`/admin-dashboard/admin-users/${encodedId}/edit`);
  };

  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteAdminModal(true);
  };

  const closeDeleteAdminModal = () => {
    setShowDeleteAdminModal(false);
    setSelectedAdmin(null);
  };

  // Bulk selection handlers
  const handleSelectAdmin = (adminId) => {
    setSelectedAdmins((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAdmins.length === paginatedData.length) {
      setSelectedAdmins([]);
    } else {
      setSelectedAdmins(paginatedData.map((admin) => admin.identifier));
    }
  };

  const handleClearSelection = () => {
    setSelectedAdmins([]);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedAdmins.length} admin(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("DELETE", "/admins/bulk-delete", {
        admin_ids: selectedAdmins,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully deleted ${selectedAdmins.length} admin(s)`);
      setSelectedAdmins([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to delete admins");
      console.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async (format = 'csv') => {
    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      const response = await adminSilentApi("POST", "/admins/bulk-export", {
        admin_ids: selectedAdmins,
        format: format,
      }, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admins_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully exported ${selectedAdmins.length} admin(s)`);
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to export admins");
      console.error("Bulk export error:", error);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!window.confirm(`Duplicate ${selectedAdmins.length} admin(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/admins/bulk-duplicate", {
        admin_ids: selectedAdmins,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully duplicated ${selectedAdmins.length} admin(s)`);
      setSelectedAdmins([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate admins");
      console.error("Bulk duplicate error:", error);
    }
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedAdmins.length} admin(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/admins/bulk-archive", {
        admin_ids: selectedAdmins,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully archived ${selectedAdmins.length} admin(s)`);
      setSelectedAdmins([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive admins");
      console.error("Bulk archive error:", error);
    }
  };

  // Single item operations
  const handleDuplicateAdmin = async (admin) => {
    if (!window.confirm(`Duplicate ${admin.first_name} ${admin.last_name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/admins/${admin.identifier}/duplicate`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Admin duplicated successfully");
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate admin");
      console.error("Duplicate error:", error);
    }
  };

  const handleArchiveAdmin = async (admin) => {
    if (!window.confirm(`Archive ${admin.first_name} ${admin.last_name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/admins/${admin.identifier}/archive`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Admin archived successfully");
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive admin");
      console.error("Archive error:", error);
    }
  };

  // Search, filter, sort, and paginate data
  const filteredAndSortedData = useMemo(() => {
    let filtered = adminUsers;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((admin) =>
        admin.first_name?.toLowerCase().includes(query) ||
        admin.last_name?.toLowerCase().includes(query) ||
        admin.email?.toLowerCase().includes(query) ||
        admin.phone?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
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

    return sorted;
  }, [adminUsers, searchQuery, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
  };

  // Stats
  const totalAdmins = adminUsers.length;
  const activeAdmins = adminUsers.filter((admin) => admin.status === "active" || !admin.status).length;
  const verifiedAdmins = adminUsers.filter((admin) => admin.email_verified_at).length;

  const headerActions = (
    <ModernButton
      variant="primary"
      onClick={handleAddAdmin}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Admin
    </ModernButton>
  );

  const tableColumns = [
    { key: 'first_name', label: 'First Name', sortable: true },
    { key: 'last_name', label: 'Last Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false },
  ];

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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={closeMobileMenu}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeadbar toggleMobileMenu={toggleMobileMenu} />

        <main className="flex-1 overflow-y-auto">
          <AdminPageShell
            title="Admin Users"
            description="Manage system administrators and their permissions"
            icon={Users}
            actions={headerActions}
          >
            <TenantClientsSideMenu activeTab="admin-users" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <ModernStatsCard
                title="Total Admins"
                value={totalAdmins}
                icon={<Users />}
                trend={{ value: 12, isPositive: true }}
                color="primary"
              />
              <ModernStatsCard
                title="Active Admins"
                value={activeAdmins}
                icon={<ShieldCheck />}
                color="success"
              />
              <ModernStatsCard
                title="Verified Admins"
                value={verifiedAdmins}
                icon={<UserCog />}
                color="info"
              />
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search admins by name, email, or phone..."
                isLoading={isUsersFetching}
                className="w-full sm:w-96"
              />

              {selectedAdmins.length > 0 && (
                <BulkActionsDropdown
                  selectedCount={selectedAdmins.length}
                  actions={bulkActions}
                />
              )}
            </div>

            {/* Bulk Selection Bar */}
            {selectedAdmins.length > 0 && (
              <BulkSelectionBar
                selectedCount={selectedAdmins.length}
                onClearSelection={handleClearSelection}
                onBulkDelete={handleBulkDelete}
                onBulkExport={() => handleBulkExport('csv')}
                onBulkDuplicate={handleBulkDuplicate}
                onBulkArchive={handleBulkArchive}
              />
            )}

            {/* Table */}
            <ModernCard>
              {isUsersFetching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No admins found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? "Try adjusting your search" : "Get started by creating a new admin"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <SortableTableHeader
                        columns={tableColumns}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {paginatedData.map((admin) => (
                          <tr
                            key={admin.identifier}
                            className={`hover:bg-gray-50 transition-colors ${admin.deleted_at ? "opacity-50 bg-red-50" : ""
                              }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedAdmins.includes(admin.identifier)}
                                onChange={() => handleSelectAdmin(admin.identifier)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {admin.first_name || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {admin.last_name || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {admin.email || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {admin.phone || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${admin.status === "active" || !admin.status
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {admin.status || "active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {admin.created_at
                                ? new Date(admin.created_at).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <TableActionButtons
                                onView={() => handleViewAdmin(admin)}
                                onEdit={() => handleEditAdmin(admin)}
                                onDelete={() => handleDeleteAdmin(admin)}
                                onDuplicate={() => handleDuplicateAdmin(admin)}
                                onArchive={() => handleArchiveAdmin(admin)}
                                showView
                                showEdit
                                showDelete={!admin.deleted_at}
                                showDuplicate
                                showArchive={!admin.archived}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 border-t border-gray-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredAndSortedData.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </div>
                </>
              )}
            </ModernCard>
          </AdminPageShell>
        </main>
      </div>

      {/* Delete Modal */}
      {showDeleteAdminModal && selectedAdmin && (
        <DeleteAdminModal
          isOpen={showDeleteAdminModal}
          onClose={closeDeleteAdminModal}
          adminDetails={selectedAdmin}
        />
      )}
    </div>
  );
}
