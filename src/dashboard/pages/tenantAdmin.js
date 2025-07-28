import React, { useState } from "react";
import { Loader2, SquarePen, Trash2, Eye } from "lucide-react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { useFetchTenantAdmins } from "../../hooks/adminUserHooks";
import { AddTenantAdminModal } from "./adminComps/addAdmin";
import { EditAdminModal } from "./adminComps/editAdmin";
import { DeleteAdminModal } from "./adminComps/deleteAdmin";
import { ViewAdminModal } from "./adminComps/viewAdmin";

export default function TenantAdmin() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showDeleteAdminModal, setShowDeleteAdminModal] = useState(false);
  const [showViewAdminModal, setShowViewAdminModal] = useState(false);
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

  const handleViewAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowViewAdminModal(true);
  };

  const closeAddAdminModal = () => {
    setShowAddAdminModal(false);
  };

  const closeEditAdminModal = () => {
    setShowEditAdminModal(false);
    setSelectedAdmin(null);
  };

  const closeDeleteAdminModal = () => {
    setShowDeleteAdminModal(false);
    setSelectedAdmin(null);
  };

  const closeViewAdminModal = () => {
    setShowViewAdminModal(false);
    setSelectedAdmin(null);
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
            Invite Admin
          </button>
        </div>

        {isUsersFetching ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
            <p className="ml-3 text-gray-600">Loading admin users...</p>
          </div>
        ) : adminUsers && adminUsers.length > 0 ? (
          <>
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#F2F2F2]">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        First Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Expired
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                              admin.pivot?.is_accepted
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {admin.pivot?.is_accepted
                              ? "Accepted"
                              : "Not Accepted"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                              admin.pivot?.is_expired
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {admin.pivot?.is_expired
                              ? "Expired"
                              : "Not Expired"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => handleViewAdmin(admin)}
                              className="text-[#288DD1] hover:text-[#1976D2]"
                              title="View Admin"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditAdmin(admin)}
                              className="text-[#288DD1] hover:text-[#1976D2]"
                              title="Edit Admin"
                            >
                              <SquarePen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
                        onClick={() => handleViewAdmin(admin)}
                        className="text-[#288DD1] hover:text-[#1976D2]"
                        title="View Admin"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="text-[#288DD1] hover:text-[#1976D2]"
                        title="Edit Admin"
                      >
                        <SquarePen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Admin"
                      >
                        <Trash2 className="w-4 h-4" />
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
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Status:</span>{" "}
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                          admin.pivot?.is_accepted
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {admin.pivot?.is_accepted ? "Accepted" : "Not Accepted"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Expired:</span>{" "}
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                          admin.pivot?.is_expired
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {admin.pivot?.is_expired ? "Expired" : "Not Expired"}
                      </span>
                    </p>
                  </div>
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
      <ViewAdminModal
        isOpen={showViewAdminModal}
        onClose={closeViewAdminModal}
        admin={selectedAdmin}
      />
    </>
  );
}
