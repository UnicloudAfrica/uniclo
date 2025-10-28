<<<<<<< HEAD
import React, { useState, useMemo } from "react";
=======
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  UserCog,
  Plus,
  Trash2,
  SquarePen,
  Loader2,
} from "lucide-react";
>>>>>>> b587e2a (web)
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import { useFetchAdmins } from "../../hooks/adminHooks/adminHooks";
<<<<<<< HEAD
import { SquarePen, Trash2, Loader2, User, Mail, Phone } from "lucide-react";
import { AddAdminModal } from "./adminComps/addAdmin";
import { EditAdminModal } from "./adminComps/editAdmin";
import { DeleteAdminModal } from "./adminComps/deleteAdmin";
import ModernTable from "../components/ModernTable";
import { designTokens } from "../../styles/designTokens";
=======
import { EditAdminModal } from "./adminComps/editAdmin";
import { DeleteAdminModal } from "./adminComps/deleteAdmin";
>>>>>>> b587e2a (web)

export default function AdminUsers() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const navigate = useNavigate();

  const { data: adminUsers = [], isFetching: isUsersFetching } = useFetchAdmins();

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleAddAdmin = () => navigate("/admin-dashboard/admin-users/create");
  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowEditAdminModal(true);
  };
  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteAdminModal(true);
  };

  const closeEditAdminModal = () => {
    setShowEditAdminModal(false);
    setSelectedAdmin(null);
  };
  const closeDeleteAdminModal = () => {
    setShowDeleteAdminModal(false);
    setSelectedAdmin(null);
  };

<<<<<<< HEAD
  const columns = useMemo(
    () => [
      {
        key: "serialNumber",
        header: "S/N",
        render: (value, row, index, currentPage, pageSize) =>
          (currentPage - 1) * pageSize + index + 1,
      },
      {
        key: "first_name",
        header: "Name",
        render: (value, row) => (
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            <span className="font-medium">
              {row.first_name} {row.last_name}
            </span>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        render: (value) => (
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-gray-500" />
            <span>{value}</span>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        render: (value) => (
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-gray-500" />
            <span>{value}</span>
          </div>
        ),
      },
    ],
    []
  );

  const actions = [
    { icon: <SquarePen size={16} />, onClick: handleEditAdmin },
    { icon: <Trash2 size={16} />, onClick: handleDeleteAdmin },
  ];
=======
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
              <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                <button
                  onClick={() => handleEditAdmin(admin)}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-[#288DD1] hover:bg-gray-50"
                  title="Edit Admin"
                >
                  <SquarePen className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteAdmin(admin)}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-red-600 hover:bg-red-50"
                  title="Delete Admin"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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
>>>>>>> b587e2a (web)

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
<<<<<<< HEAD
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Admin Users
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage platform administrators
              </p>
            </div>
            <button
              onClick={handleAddAdmin}
              className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
            >
              Add Admin
            </button>
          </div>

          <ModernTable
            title="Admin Users List"
            data={adminUsers || []}
            columns={columns}
            actions={actions}
            searchable={true}
            filterable={true}
            exportable={true}
            sortable={true}
            paginated={true}
            loading={isUsersFetching}
            emptyMessage="No admin users found."
=======
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
>>>>>>> b587e2a (web)
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

      <EditAdminModal
        isOpen={showEditAdminModal}
        onClose={closeEditAdminModal}
        admin={selectedAdmin}
      />
      <DeleteAdminModal
        isOpen={showDeleteAdminModal}
        onClose={closeDeleteAdminModal}
        admin={selectedAdmin}
      />
    </>
  );
}
