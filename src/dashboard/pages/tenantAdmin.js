import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { useFetchTenantAdmins } from "../../hooks/adminUserHooks";
import { Loader2, SquarePen, Trash2 } from "lucide-react";
import { AddTenantAdminModal } from "./adminComps/addAdmin";
import { EditAdminModal } from "./adminComps/editAdmin";
import { DeleteAdminModal } from "./adminComps/deleteAdmin";

export default function TenantAdmin() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const { data: adminUsers, isFetching: isUsersFetching } =
    useFetchTenantAdmins();

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

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleAddAdmin}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
          >
            Add Admin
          </button>
        </div>

        {isUsersFetching ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
            <p className="ml-3 text-gray-600">Loading admin users...</p>
          </div>
        ) : adminUsers && adminUsers.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#F2F2F2]">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      First Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Last Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Phone
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminUsers.map((admin) => (
                    <tr key={admin.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.first_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.last_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.email || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="text-[#288DD1] hover:text-[#1976D2] mr-3"
                          title="Edit Admin"
                        >
                          <SquarePen className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          className="text-red-600 hover:text-red-900"
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

            {/* Mobile Card View */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {adminUsers.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-md font-semibold text-gray-800">
                      {admin.first_name || "N/A"} {admin.middle_name || ""}{" "}
                      {admin.last_name || "N/A"}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="text-[#288DD1] hover:text-[#1976D2]"
                        title="Edit Admin"
                      >
                        <SquarePen className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Admin"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span>{" "}
                    {admin.email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span>{" "}
                    {admin.phone || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500">
            No admin users found.
          </div>
        )}
      </main>
      <AddTenantAdminModal
        isOpen={showAddAdminModal}
        onClose={closeAddAdminModal}
      />
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
