import React, { useState, useMemo } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchAdmins } from "../../hooks/adminHooks/adminHooks";
import { SquarePen, Trash2, Loader2, User, Mail, Phone } from "lucide-react";
import { AddAdminModal } from "./adminComps/addAdmin";
import { EditAdminModal } from "./adminComps/editAdmin";
import { DeleteAdminModal } from "./adminComps/deleteAdmin";
import ModernTable from "../components/ModernTable";
import { designTokens } from "../../styles/designTokens";

export default function AdminUsers() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null); // To hold the admin being edited/deleted

  const { data: adminUsers, isFetching: isUsersFetching } = useFetchAdmins();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleAddAdmin = () => {
    setShowAddAdminModal(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowEditAdminModal(true);
  };

  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteAdminModal(true);
  };

  const closeAddAdminModal = () => {
    setShowAddAdminModal(false);
  };

  const closeEditAdminModal = () => {
    setShowEditAdminModal(false);
    setSelectedAdmin(null); // Clear selected admin
  };

  const closeDeleteAdminModal = () => {
    setShowDeleteAdminModal(false);
    setSelectedAdmin(null); // Clear selected admin
  };

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

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
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
          />
        </div>
      </main>

      {/* Modals */}
      <AddAdminModal isOpen={showAddAdminModal} onClose={closeAddAdminModal} />
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
