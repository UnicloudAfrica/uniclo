import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  UserCog,
  Plus,
  Trash2,
  SquarePen,
  Eye,
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

export default function AdminUsers() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
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

  const totalAdmins = adminUsers.length;
  const activeAdmins = adminUsers.filter((admin) => admin.status === "active").length;
  const roleCount = new Set(adminUsers.map((admin) => admin.role || "Unknown")).size;
  const pendingInvites = adminUsers.filter((admin) => admin.status === "pending").length;

  const headerActions = (
    <ModernButton onClick={handleAddAdmin} className="flex items-center gap-2">
      <Plus size={18} />
      Add Admin
    </ModernButton>
  );

  const tableContent = isUsersFetching ? (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
      <p className="ml-3 text-gray-600">Loading admin users...</p>
    </div>
  ) : adminUsers.length > 0 ? (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              First Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Last Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Role
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {adminUsers.map((admin) => (
            <tr key={admin.id}>
              <td className="px-6 py-4 text-sm text-gray-900">{admin.first_name || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{admin.last_name || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{admin.phone || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{admin.email || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{admin.role || "N/A"}</td>
              <td className="px-6 py-4 text-sm font-medium">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => handleViewAdmin(admin)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#288DD1] hover:text-[#288DD1]"
                    title="View Admin"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditAdmin(admin)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#288DD1] hover:text-[#288DD1]"
                    title="Edit Admin"
                  >
                    <SquarePen className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(admin)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-400 hover:text-red-700"
                    title="Delete Admin"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-500">
      No admin users found.
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
        title="Admin Users"
        description="Manage platform administrators, roles, and access."
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <ModernStatsCard
            title="Total Admins"
            value={totalAdmins}
            icon={<Users size={24} />}
            change={3}
            trend="up"
            color="primary"
          />
          <ModernStatsCard
            title="Active Admins"
            value={activeAdmins}
            icon={<ShieldCheck size={24} />}
            color="success"
          />
          <ModernStatsCard
            title="Roles"
            value={roleCount}
            icon={<UserCog size={24} />}
            color="info"
          />
          <ModernStatsCard
            title="Pending Invites"
            value={pendingInvites}
            icon={<Plus size={24} />}
            color="warning"
          />
        </div>

        <ModernCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Admin Directory</h2>
              <p className="text-sm text-gray-500">
                View and manage administrative access across the platform.
              </p>
            </div>
          </div>
          {tableContent}
        </ModernCard>
      </AdminPageShell>
      <DeleteAdminModal
        isOpen={showDeleteAdminModal}
        onClose={closeDeleteAdminModal}
        admin={selectedAdmin}
      />
    </>
  );
}
