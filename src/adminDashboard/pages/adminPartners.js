import React, { useState, useMemo } from "react";
import {
  Loader2,
  Plus,
  Users,
  Building2,
  Phone,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import ModernButton from "../components/ModernButton";
import ModernCard from "../components/ModernCard";
import TableActionButtons from "../components/TableActionButtons";
import BulkSelectionBar from "../components/BulkSelectionBar";
import ModernStatsCard from "../components/ModernStatsCard";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import SortableTableHeader from "../components/SortableTableHeader";
import BulkActionsDropdown from "../components/BulkActionsDropdown";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useNavigate } from "react-router-dom";
import DeleteTenantModal from "./tenantComps/deleteTenant";
import EditTenantModal from "./tenantComps/editTenant";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import AdminPageShell from "../components/AdminPageShell";

const encodeId = (id) => encodeURIComponent(btoa(id));

const companyTypeMap = {
  RC: "Limited Liability Company",
  BN: "Business Name",
  IT: "Incorporated Trustees",
  LL: "Limited Liability",
  LLP: "Limited Liability Partnership",
  Other: "Other",
};

const formatCompanyType = (type) => companyTypeMap[type] || "Unknown";

const AdminPartners = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: tenants = [], isFetching: isTenantsFetching } = useFetchTenants();
  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false);
  const [selectedTenantToDelete, setSelectedTenantToDelete] = useState(null);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [selectedTenantToEdit, setSelectedTenantToEdit] = useState(null);
  const [selectedTenants, setSelectedTenants] = useState([]);

  // Search, pagination, and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleViewDetails = (item) => {
    const encodedId = encodeId(item.identifier);
    navigate(`/admin-dashboard/partners/details?id=${encodedId}&name=${encodeURIComponent(
      item.name
    )}`);
  };

  const handleDeleteClick = (item) => {
    setSelectedTenantToDelete(item);
    setIsDeleteTenantModalOpen(true);
  };

  const handleEditClick = (item) => {
    setSelectedTenantToEdit(item);
    setIsEditTenantModalOpen(true);
  };

  // Bulk selection handlers
  const handleSelectTenant = (tenantId) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTenants.length === paginatedData.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(paginatedData.map((tenant) => tenant.identifier));
    }
  };

  const handleClearSelection = () => {
    setSelectedTenants([]);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedTenants.length} partner(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("DELETE", "/tenants/bulk-delete", {
        tenant_ids: selectedTenants,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully deleted ${selectedTenants.length} partner(s)`);
      setSelectedTenants([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to delete partners");
      console.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async (format = 'csv') => {
    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      const response = await adminSilentApi("POST", "/tenants/bulk-export", {
        tenant_ids: selectedTenants,
        format: format,
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `partners_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully exported ${selectedTenants.length} partner(s)`);
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to export partners");
      console.error("Bulk export error:", error);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!window.confirm(`Duplicate ${selectedTenants.length} partner(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/tenants/bulk-duplicate", {
        tenant_ids: selectedTenants,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully duplicated ${selectedTenants.length} partner(s)`);
      setSelectedTenants([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate partners");
      console.error("Bulk duplicate error:", error);
    }
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedTenants.length} partner(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/tenants/bulk-archive", {
        tenant_ids: selectedTenants,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully archived ${selectedTenants.length} partner(s)`);
      setSelectedTenants([]);
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive partners");
      console.error("Bulk archive error:", error);
    }
  };

  // Single item operations
  const handleDuplicateTenant = async (tenant) => {
    if (!window.confirm(`Duplicate ${tenant.name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/tenants/${tenant.identifier}/duplicate`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Partner duplicated successfully");
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate partner");
      console.error("Duplicate error:", error);
    }
  };

  const handleArchiveTenant = async (tenant) => {
    if (!window.confirm(`Archive ${tenant.name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/tenants/${tenant.identifier}/archive`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Partner archived successfully");
      window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive partner");
      console.error("Archive error:", error);
    }
  };

  // Search, filter, sort, and paginate data
  const filteredAndSortedData = useMemo(() => {
    let filtered = tenants;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tenant) =>
        tenant.name?.toLowerCase().includes(query) ||
        tenant.email?.toLowerCase().includes(query) ||
        tenant.phone?.toLowerCase().includes(query) ||
        tenant.type?.toLowerCase().includes(query) ||
        tenant.industry?.toLowerCase().includes(query)
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
  }, [tenants, searchQuery, sortConfig]);

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
  const totalPartners = tenants.length;
  const activePartners = tenants.filter((tenant) => tenant.status === "active").length;
  const companyTypes = {
    RC: tenants.filter((t) => t.company_type === "RC").length,
    BN: tenants.filter((t) => t.company_type === "BN").length,
    IT: tenants.filter((t) => t.company_type === "IT").length,
    Other: tenants.filter((t) => !["RC", "BN", "IT"].includes(t.company_type)).length,
  };

  const headerActions = (
    <ModernButton
      variant="primary"
      onClick={() => navigate("/admin-dashboard/partners/create")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Partner
    </ModernButton>
  );

  const tableColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'industry', label: 'Industry', sortable: true },
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
            title="Partners"
            description="Manage partner organizations and their details"
            icon={Building2}
            actions={headerActions}
          >
            <TenantClientsSideMenu activeTab="partners" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <ModernStatsCard
                title="Total Partners"
                value={totalPartners}
                icon={<Building2 />}
                trend={{ value: 8, isPositive: true }}
                color="primary"
              />
              <ModernStatsCard
                title="Active Partners"
                value={activePartners}
                icon={<Users />}
                color="success"
              />
              <ModernStatsCard
                title="Company Types"
                value={`${companyTypes.RC} RC, ${companyTypes.BN} BN`}
                icon={<Phone />}
                color="info"
              />
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search partners by name, email, type, or industry..."
                isLoading={isTenantsFetching}
                className="w-full sm:w-96"
              />

              {selectedTenants.length > 0 && (
                <BulkActionsDropdown
                  selectedCount={selectedTenants.length}
                  actions={bulkActions}
                />
              )}
            </div>

            {/* Bulk Selection Bar */}
            {selectedTenants.length > 0 && (
              <BulkSelectionBar
                selectedCount={selectedTenants.length}
                onClearSelection={handleClearSelection}
                onBulkDelete={handleBulkDelete}
                onBulkExport={() => handleBulkExport('csv')}
                onBulkDuplicate={handleBulkDuplicate}
                onBulkArchive={handleBulkArchive}
              />
            )}

            {/* Table */}
            <ModernCard>
              {isTenantsFetching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : paginatedData.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No partners found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery ? "Try adjusting your search" : "Get started by creating a new partner"}
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
                        {paginatedData.map((tenant) => (
                          <tr
                            key={tenant.identifier}
                            className={`hover:bg-gray-50 transition-colors ${tenant.deleted_at ? "opacity-50 bg-red-50" : ""
                              }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedTenants.includes(tenant.identifier)}
                                onChange={() => handleSelectTenant(tenant.identifier)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tenant.name || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCompanyType(tenant.type) || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tenant.industry || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tenant.email || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tenant.phone || "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${tenant.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {tenant.status || "active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {tenant.created_at
                                ? new Date(tenant.created_at).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <TableActionButtons
                                onView={() => handleViewDetails(tenant)}
                                onEdit={() => handleEditClick(tenant)}
                                onDelete={() => handleDeleteClick(tenant)}
                                onDuplicate={() => handleDuplicateTenant(tenant)}
                                onArchive={() => handleArchiveTenant(tenant)}
                                showView
                                showEdit
                                showDelete={!tenant.deleted_at}
                                showDuplicate
                                showArchive={!tenant.archived}
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

      {/* Modals */}
      {isDeleteTenantModalOpen && selectedTenantToDelete && (
        <DeleteTenantModal
          isOpen={isDeleteTenantModalOpen}
          onClose={() => {
            setIsDeleteTenantModalOpen(false);
            setSelectedTenantToDelete(null);
          }}
          tenantDetails={selectedTenantToDelete}
        />
      )}

      {isEditTenantModalOpen && selectedTenantToEdit && (
        <EditTenantModal
          isOpen={isEditTenantModalOpen}
          onClose={() => {
            setIsEditTenantModalOpen(false);
            setSelectedTenantToEdit(null);
          }}
          partnerDetails={selectedTenantToEdit}
        />
      )}
    </div>
  );
};

export default AdminPartners;
