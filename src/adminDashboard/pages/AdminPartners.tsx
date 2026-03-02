import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Users, Building2, Phone } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ModernButton } from "../../shared/components/ui";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { TableActionButtons } from "../../shared/components/tables";
import ModernTable, { type Column } from "../../shared/components/ui/ModernTable";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import adminFileApi from "../../index/admin/fileapi";
import DeleteTenantModal from "./tenantComps/DeleteTenant";
import EditTenantModal from "./tenantComps/EditTenant";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import logger from "../../utils/logger";

const encodeId = (id: string) => encodeURIComponent(btoa(id));
const decodeId = (encodedId: string) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch {
    return null;
  }
};

interface PartnerTenant {
  id?: string | number | null;
  identifier?: string;
  name?: string;
  company_type?: string | null;
  industry?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  created_at?: string | null;
  deleted_at?: string | null;
  archived?: boolean;
}

const companyTypeMap: Record<string, string> = {
  RC: "Limited Liability Company",
  BN: "Business Name",
  IT: "Incorporated Trustees",
  LL: "Limited Liability",
  LLP: "Limited Liability Partnership",
  Other: "Other",
};

const formatCompanyType = (type?: string | null) => {
  if (!type) {
    return "Unknown";
  }

  return companyTypeMap[type] || "Unknown";
};

const AdminPartners = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useAuthRedirect();
  const { data: tenantsData = [], isFetching: isTenantsFetching } = useFetchTenants();
  const tenants = useMemo<PartnerTenant[]>(
    () => (Array.isArray(tenantsData) ? (tenantsData as PartnerTenant[]) : []),
    [tenantsData]
  );
  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false);
  const [selectedTenantToDelete, setSelectedTenantToDelete] = useState<PartnerTenant | null>(null);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [selectedTenantToEdit, setSelectedTenantToEdit] = useState<PartnerTenant | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (!editId || isTenantsFetching) return;

    const decodedId = decodeId(editId);
    if (!decodedId) return;

    const match = tenants.find(
      (tenant) => String(tenant.identifier ?? tenant.id) === String(decodedId)
    );

    if (match) {
      setSelectedTenantToEdit(match);
      setIsEditTenantModalOpen(true);
    }

    params.delete("edit");
    navigate(`${location.pathname}${params.toString() ? `?${params}` : ""}`, { replace: true });
  }, [location.search, isTenantsFetching, navigate, tenants, location.pathname]);

  const handleViewDetails = (item: PartnerTenant) => {
    const identifier = item.identifier ?? (item.id ? String(item.id) : "");
    if (!identifier) return;
    const encodedId = encodeId(identifier);
    navigate(
      `/admin-dashboard/partners/details?id=${encodedId}&name=${encodeURIComponent(item.name ?? "")}`
    );
  };

  const handleDeleteClick = (item: PartnerTenant) => {
    setSelectedTenantToDelete(item);
    setIsDeleteTenantModalOpen(true);
  };

  const handleEditClick = (item: PartnerTenant) => {
    setSelectedTenantToEdit(item);
    setIsEditTenantModalOpen(true);
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!globalThis.window.confirm(`Delete ${selectedTenants.length} partner(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("DELETE", "/tenants/bulk-delete", {
        tenant_ids: selectedTenants,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully deleted ${selectedTenants.length} partner(s)`);
      setSelectedTenants([]);
      globalThis.window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to delete partners");
      logger.error("Bulk delete error:", error);
    }
  };

  const handleBulkExport = async (format = "csv") => {
    try {
      const response = await adminFileApi<ArrayBuffer>("POST", "/tenants/bulk-export", {
        tenant_ids: selectedTenants,
        format,
      });

      const buffer =
        response instanceof ArrayBuffer
          ? response
          : new TextEncoder().encode(String(response)).buffer;
      const url = globalThis.window.URL.createObjectURL(new Blob([buffer]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `partners_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully exported ${selectedTenants.length} partner(s)`);
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to export partners");
      logger.error("Bulk export error:", error);
    }
  };

  const handleBulkDuplicate = async () => {
    if (!globalThis.window.confirm(`Duplicate ${selectedTenants.length} partner(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/tenants/bulk-duplicate", {
        tenant_ids: selectedTenants,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully duplicated ${selectedTenants.length} partner(s)`);
      setSelectedTenants([]);
      globalThis.window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate partners");
      logger.error("Bulk duplicate error:", error);
    }
  };

  const handleBulkArchive = async () => {
    if (!globalThis.window.confirm(`Archive ${selectedTenants.length} partner(s)?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", "/tenants/bulk-archive", {
        tenant_ids: selectedTenants,
      });

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success(`Successfully archived ${selectedTenants.length} partner(s)`);
      setSelectedTenants([]);
      globalThis.window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive partners");
      logger.error("Bulk archive error:", error);
    }
  };

  // Single item operations
  const handleDuplicateTenant = async (tenant: PartnerTenant) => {
    if (!tenant.identifier) return;
    if (!globalThis.window.confirm(`Duplicate ${tenant.name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/tenants/${tenant.identifier}/duplicate`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Partner duplicated successfully");
      globalThis.window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to duplicate partner");
      logger.error("Duplicate error:", error);
    }
  };

  const handleArchiveTenant = async (tenant: PartnerTenant) => {
    if (!tenant.identifier) return;
    if (!globalThis.window.confirm(`Archive ${tenant.name}?`)) return;

    try {
      const { adminSilentApi } = await import("../../index/admin/api");
      await adminSilentApi("POST", `/tenants/${tenant.identifier}/archive`);

      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.success("Partner archived successfully");
      globalThis.window.location.reload();
    } catch (error) {
      const ToastUtil = (await import("../../utils/toastUtil")).default;
      ToastUtil.error("Failed to archive partner");
      logger.error("Archive error:", error);
    }
  };

  // Stats
  const totalPartners = tenants.length;
  const activePartners = tenants.filter((tenant) => tenant.status === "active").length;
  const companyTypes = {
    RC: tenants.filter((tenant) => tenant.company_type === "RC").length,
    BN: tenants.filter((tenant) => tenant.company_type === "BN").length,
    IT: tenants.filter((tenant) => tenant.company_type === "IT").length,
    Other: tenants.filter((tenant) => !["RC", "BN", "IT"].includes(tenant.company_type ?? ""))
      .length,
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

  const columns: Column<PartnerTenant>[] = [
    {
      key: "name",
      header: "Name",
      render: ((value: string | null | undefined) => (
        <div className="font-medium text-gray-900">{value || "—"}</div>
      )) as any,
      sortable: true,
    },
    {
      key: "company_type",
      header: "Type",
      render: ((value: string | null | undefined) => (
        <div className="text-gray-500">{formatCompanyType(value)}</div>
      )) as any,
      sortable: true,
    },
    {
      key: "industry",
      header: "Industry",
      render: ((value: string | null | undefined) => (
        <div className="text-gray-500">{value || "—"}</div>
      )) as any,
      sortable: true,
    },
    {
      key: "email",
      header: "Email",
      render: ((value: string | null | undefined) => (
        <div className="text-gray-500">{value || "—"}</div>
      )) as any,
      sortable: true,
    },
    {
      key: "phone",
      header: "Phone",
      render: ((value: string | null | undefined) => (
        <div className="text-gray-500">{value || "—"}</div>
      )) as any,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      render: ((value: string | null | undefined) => (
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            value === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value || "active"}
        </span>
      )) as any,
      sortable: true,
    },
    {
      key: "created_at",
      header: "Created",
      render: ((value: string | null | undefined) => (
        <div className="text-gray-500">{value ? new Date(value).toLocaleDateString() : "—"}</div>
      )) as any,
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      render: (_value, item) => (
        <div className="flex justify-end">
          <TableActionButtons
            onView={() => handleViewDetails(item)}
            onEdit={() => handleEditClick(item)}
            onDelete={() => handleDeleteClick(item)}
            onDuplicate={() => handleDuplicateTenant(item)}
            onArchive={() => handleArchiveTenant(item)}
            showView
            showEdit
            showDelete={!item.deleted_at}
            showDuplicate
            showArchive={!item.archived}
            itemName={item.name ?? "partner"}
          />
        </div>
      ),
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
    <>
      <AdminPageShell
        title="Partners"
        description="Manage partner organizations and their details"
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ModernStatsCard
            title="Total Partners"
            value={totalPartners}
            icon={<Building2 size={24} />}
            trend="up"
            change={8}
            color="primary"
          />
          <ModernStatsCard
            title="Active Partners"
            value={activePartners}
            icon={<Users size={24} />}
            color="success"
          />
          <ModernStatsCard
            title="Company Types"
            value={`${companyTypes.RC} RC, ${companyTypes.BN} BN`}
            icon={<Phone size={24} />}
            color="info"
          />
        </div>

        <ModernTable<PartnerTenant>
          data={tenants}
          columns={columns}
          loading={isTenantsFetching}
          searchPlaceholder="Search partners by name, email, type, or industry..."
          searchKeys={["name", "email", "type", "industry", "phone"]}
          selectable
          onSelectionChange={setSelectedTenants}
          bulkActions={[
            {
              label: "Export as CSV",
              variant: "outline",
              onClick: () => handleBulkExport("csv"),
            },
            {
              label: "Export as Excel",
              variant: "outline",
              onClick: () => handleBulkExport("xlsx"),
            },
            {
              label: "Duplicate",
              variant: "outline",
              onClick: handleBulkDuplicate,
            },
            {
              label: "Archive",
              variant: "outline",
              onClick: handleBulkArchive,
            },
            {
              label: "Delete",
              variant: "outlineDanger",
              onClick: handleBulkDelete,
            },
          ]}
        />
      </AdminPageShell>

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
    </>
  );
};

export default AdminPartners;
