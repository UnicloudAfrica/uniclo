// @ts-nocheck
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ShieldCheck, UserCog, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import ModernTable from "../../shared/components/ui/ModernTable";
import { useFetchAdmins } from "../../hooks/adminHooks/adminHooks";
// @ts-ignore
import { DeleteAdminModal } from "./adminComps/deleteAdmin";
import { TableActionButtons } from "../../shared/components/tables";
import ToastUtils from "../../utils/toastUtil";

interface AdminUser {
  identifier: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  email_verified_at: string | null;
  deleted_at?: string | null;
  archived?: boolean;
}

export default function AdminUsers() {
  const [showDeleteAdminModal, setShowDeleteAdminModal] = React.useState(false);
  const [selectedAdmin, setSelectedAdmin] = React.useState<AdminUser | null>(null);

  const navigate = useNavigate();
  const { data: adminUsers = [], isFetching: isUsersFetching } = useFetchAdmins();

  const handleAddAdmin = () => navigate("/admin-dashboard/admin-users/create");

  const encodeId = (id: string) => {
    try {
      return encodeURIComponent(btoa(String(id)));
    } catch (error) {
      console.error("Failed to encode admin id", error);
      return null;
    }
  };

  const handleViewAdmin = (admin: AdminUser) => {
    const encodedId = admin?.identifier ? encodeId(admin.identifier) : null;
    if (!encodedId) return;
    navigate(`/admin-dashboard/admin-users/${encodedId}`);
  };

  const handleEditAdmin = (admin: AdminUser) => {
    const encodedId = admin?.identifier ? encodeId(admin.identifier) : null;
    if (!encodedId) return;
    navigate(`/admin-dashboard/admin-users/${encodedId}/edit`);
  };

  const handleDeleteAdmin = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setShowDeleteAdminModal(true);
  };

  const closeDeleteAdminModal = () => {
    setShowDeleteAdminModal(false);
    setSelectedAdmin(null);
  };

  // Bulk operations using ModernTable's selection
  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!window.confirm(`Delete ${selectedIds.length} admin(s)?`)) return;

    try {
      // @ts-ignore
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("DELETE", "/admins/bulk-delete", {
        admin_ids: selectedIds,
      });

      ToastUtils.success(`Successfully deleted ${selectedIds.length} admin(s)`);
      window.location.reload();
    } catch (error) {
      ToastUtils.error("Failed to delete admins");
      console.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async (selectedIds: string[], format = "csv") => {
    try {
      // @ts-ignore
      const { adminSilentApi } = await import("../../index/admin/api");
      const response = await adminSilentApi(
        "POST",
        "/admins/bulk-export",
        {
          admin_ids: selectedIds,
          format: format,
        },
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `admins_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      ToastUtils.success(`Successfully exported ${selectedIds.length} admin(s)`);
    } catch (error) {
      ToastUtils.error("Failed to export admins");
      console.error("Bulk export error:", error);
    }
  };

  const handleBulkDuplicate = async (selectedIds: string[]) => {
    if (!window.confirm(`Duplicate ${selectedIds.length} admin(s)?`)) return;

    try {
      // @ts-ignore
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/admins/bulk-duplicate", {
        admin_ids: selectedIds,
      });

      ToastUtils.success(`Successfully duplicated ${selectedIds.length} admin(s)`);
      window.location.reload();
    } catch (error) {
      ToastUtils.error("Failed to duplicate admins");
      console.error("Bulk duplicate error:", error);
    }
  };

  const handleBulkArchive = async (selectedIds: string[]) => {
    if (!window.confirm(`Archive ${selectedIds.length} admin(s)?`)) return;

    try {
      // @ts-ignore
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/admins/bulk-archive", {
        admin_ids: selectedIds,
      });

      ToastUtils.success(`Successfully archived ${selectedIds.length} admin(s)`);
      window.location.reload();
    } catch (error) {
      ToastUtils.error("Failed to archive admins");
      console.error("Bulk archive error:", error);
    }
  };

  // Single item operations
  const handleDuplicateAdmin = async (admin: AdminUser) => {
    if (!window.confirm(`Duplicate ${admin.first_name} ${admin.last_name}?`)) return;

    try {
      // @ts-ignore
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/admins/${admin.identifier}/duplicate`);

      ToastUtils.success("Admin duplicated successfully");
      window.location.reload();
    } catch (error) {
      ToastUtils.error("Failed to duplicate admin");
      console.error("Duplicate error:", error);
    }
  };

  const handleArchiveAdmin = async (admin: AdminUser) => {
    if (!window.confirm(`Archive ${admin.first_name} ${admin.last_name}?`)) return;

    try {
      // @ts-ignore
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/admins/${admin.identifier}/archive`);

      ToastUtils.success("Admin archived successfully");
      window.location.reload();
    } catch (error) {
      ToastUtils.error("Failed to archive admin");
      console.error("Archive error:", error);
    }
  };

  // Transform data for ModernTable (needs 'id' property)
  const tableData = useMemo(() => {
    return adminUsers.map((admin: AdminUser) => ({
      ...admin,
      id: admin.identifier, // Map identifier to id for ModernTable
    }));
  }, [adminUsers]);

  // Stats
  const totalAdmins = adminUsers.length;
  const activeAdmins = adminUsers.filter(
    (admin: AdminUser) => admin.status === "active" || !admin.status
  ).length;
  const verifiedAdmins = adminUsers.filter((admin: AdminUser) => admin.email_verified_at).length;

  const headerActions = (
    <ModernButton variant="primary" onClick={handleAddAdmin} className="flex items-center gap-2">
      <Plus size={18} />
      Add Admin
    </ModernButton>
  );

  const columns = [
    {
      key: "first_name",
      header: "First Name",
      sortable: true,
      render: (value: string) => <span className="font-medium text-gray-900">{value || "—"}</span>,
    },
    {
      key: "last_name",
      header: "Last Name",
      sortable: true,
      render: (value: string) => <span className="text-gray-500">{value || "—"}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (value: string) => <span className="text-gray-500">{value || "—"}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      sortable: true,
      render: (value: string) => <span className="text-gray-500">{value || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            value === "active" || !value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value || "active"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-500">{value ? new Date(value).toLocaleDateString() : "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (_: any, admin: AdminUser) => (
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
      ),
    },
  ];

  const bulkActions = [
    {
      label: "Export CSV",
      onClick: (selectedIds: string[]) => handleBulkExport(selectedIds, "csv"),
    },
    {
      label: "Export Excel",
      onClick: (selectedIds: string[]) => handleBulkExport(selectedIds, "xlsx"),
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
      variant: "danger" as const,
      onClick: handleBulkDelete,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeadbar />

        <main className="flex-1 overflow-y-auto">
          <AdminPageShell
            title="Admin Users"
            description="Manage system administrators and their permissions"
            icon={Users as any}
            actions={headerActions}
          >
            <TenantClientsSideMenu activeTab="admin-users" {...({} as any)} />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <ModernStatsCard
                title="Total Admins"
                value={totalAdmins}
                icon={<Users />}
                trend={{ value: 12, isPositive: true } as any}
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

            {/* Table */}
            <ModernTable
              data={tableData}
              columns={columns as any}
              title="Admins List"
              searchable
              searchKeys={["first_name", "last_name", "email", "phone"]}
              selectable
              bulkActions={bulkActions}
              loading={isUsersFetching}
              emptyMessage="No admins found"
            />
          </AdminPageShell>
        </main>
      </div>

      {/* Delete Modal */}
      {showDeleteAdminModal && selectedAdmin && (
        <DeleteAdminModal
          isOpen={showDeleteAdminModal}
          onClose={closeDeleteAdminModal}
          admin={selectedAdmin as any}
        />
      )}
    </div>
  );
}
