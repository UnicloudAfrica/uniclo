import React, { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DeleteClientModal from "../pages/clientComps/deleteClient";
import EditClientModal from "../pages/clientComps/editClient";

const OverviewClient = ({ client, onClientUpdated }) => {
  // Add onClientUpdated prop for refetching
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for Edit Modal
  const [clientToEdit, setClientToEdit] = useState(null); // State to hold client data for editing
  const navigate = useNavigate();

  if (!client) {
    return <div className="text-gray-600">No client data available.</div>;
  }

  const openDeleteModal = (clientData) => {
    setClientToDelete(clientData);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setClientToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleClientDeletedAndNavigate = () => {
    closeDeleteModal();
    navigate("/dashboard/clients"); // Navigate back to clients list after deletion
  };

  const openEditModal = (clientData) => {
    setClientToEdit(clientData);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setClientToEdit(null);
    setIsEditModalOpen(false);
  };

  const handleClientUpdated = () => {
    closeEditModal();
    if (onClientUpdated) {
      onClientUpdated(); // Trigger refetch in parent component (ClientsOverview)
    }
  };

  return (
    <div className="flex flex-col-reverse md:flex-row">
      <div className="flex-1 md:px-8">
        <div className="w-full md:max-w-2xl">
          {/* Header */}
          <div className="pb-4 border-b border-[#EDEFF6] mb-4 flex justify-between items-center">
            <div>
              <div className="flex space-x-2 items-center mb-2.5">
                <div className="text-base font-medium text-[#575758]">ID:</div>
                <div className="text-base font-medium text-[#575758]">
                  #{client.id}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-base font-medium text-[#575758]">
                  Status:
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                    client.verified
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.verified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => openEditModal(client)} // Open Edit Modal
                className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1 rounded-full hover:bg-gray-100"
                title="Edit Client"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => openDeleteModal(client)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                title="Delete Client"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">Name:</div>
              <div className="text-base font-medium text-[#575758]">
                {client.first_name}{" "}
                {client.middle_name ? client.middle_name + " " : ""}
                {client.last_name}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Email Address:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.email}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Phone Number:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.phone || "N/A"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Country:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.country || "N/A"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">State:</div>
              <div className="text-base font-medium text-[#575758]">
                {client.state || "N/A"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">City:</div>
              <div className="text-base font-medium text-[#575758]">
                {client.city || "N/A"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Address:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.address || "N/A"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Zip Code:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.zip_code || "N/A"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Force Password Reset:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.force_password_reset ? "Required" : "Not Required"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Created At:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.created_at
                  ? new Date(client.created_at).toLocaleString()
                  : "N/A"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-base font-light text-[#575758]">
                Last Updated:
              </div>
              <div className="text-base font-medium text-[#575758]">
                {client.updated_at
                  ? new Date(client.updated_at).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Client Modal */}
      <DeleteClientModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        client={clientToDelete}
        onDeleteConfirm={handleClientDeletedAndNavigate}
      />

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        clientData={clientToEdit}
        onClientUpdated={handleClientUpdated}
      />
    </div>
  );
};

export default OverviewClient;
