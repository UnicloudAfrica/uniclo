import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { Pencil, Trash2 } from "lucide-react"; // Import icons
import { EditClientModal } from "../../pages/clientComps/editClient";
import DeleteClientModal from "../../pages/clientComps/deleteClient";

// Function to encode the ID for URL
const encodeId = (id) => {
  return encodeURIComponent(btoa(id));
};

const OverviewClient = ({ client }) => {
  const navigate = useNavigate();
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null); // To store client data for modals

  const handleViewTenantDetails = (tenantIdentifier, tenantName) => {
    if (tenantIdentifier) {
      const encodedTenantId = encodeId(tenantIdentifier); // Use identifier for encoding
      const encodedTenantName = encodeURIComponent(tenantName);
      navigate(
        `/admin-dashboard/partners/details?id=${encodedTenantId}&name=${encodedTenantName}`
      );
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Handlers for opening and closing modals
  const openEditClientModal = (clientData) => {
    setSelectedClient(clientData);
    setIsEditClientModalOpen(true);
  };

  const closeEditClientModal = () => {
    setIsEditClientModalOpen(false);
    setSelectedClient(null);
  };

  const openDeleteClientModal = (clientData) => {
    setSelectedClient(clientData);
    setIsDeleteClientModalOpen(true);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  // Pass-through functions for parent component's handlers
  const onClientEditSave = (updatedClient) => {
    // onEditClient(updatedClient);
    closeEditClientModal();
  };

  const onClientDeleteConfirm = (clientId) => {
    // onDeleteClient(clientId);
    closeDeleteClientModal();
  };

  if (!client) {
    return (
      <div className="text-center text-gray-500 py-8">
        No client data available.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row">
        {/* Main Content */}
        <div className="flex-1 md:px-8">
          <div className="w-full md:max-w-2xl">
            {/* Header */}
            <div className="pb-4 border-b border-[#EDEFF6] mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <div className="text-base font-medium text-[#575758]">ID:</div>
                <div className="text-base font-medium text-[#575758]">
                  #{client.identifier || "N/A"}
                </div>
              </div>
              <div className="text-right flex justify-between items-center">
                <div className="text-base font-medium text-[#575758]">
                  Status:
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.verified === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {client.verified === 1 ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">Name:</div>
                <div className="text-base font-medium text-[#575758]">
                  {client.first_name || "N/A"}{" "}
                  {client.middle_name ? `${client.middle_name} ` : ""}
                  {client.last_name || "N/A"}
                </div>
              </div>
              <div className="text-right flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Email Address:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  {client.email || "N/A"}
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

              {/* New: Address */}
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Address:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  {client.address || "N/A"}
                </div>
              </div>

              {/* New: Zip */}
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Zip Code:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  {client.zip || "N/A"}
                </div>
              </div>

              {/* New: Country */}
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Country:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  {client.country || "N/A"}
                </div>
              </div>

              {/* New: City */}
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">City:</div>
                <div className="text-base font-medium text-[#575758]">
                  {client.city || "N/A"}
                </div>
              </div>

              {/* New: State */}
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  State:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  {client.state || "N/A"}
                </div>
              </div>

              {/* Tenant Name with click handler */}
              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Tenant Name:
                </div>
                <button
                  onClick={() =>
                    handleViewTenantDetails(
                      client.tenant?.identifier, // Use tenant identifier
                      client.tenant?.name
                    )
                  }
                  className="text-base font-medium text-[#288DD1] hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed"
                  disabled={!client.tenant?.identifier}
                >
                  {client.tenant?.name || "N/A"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-base font-light text-[#575758]">
                  Created At:
                </div>
                <div className="text-base font-medium text-[#575758]">
                  {formatDateTime(client.created_at)}
                </div>
              </div>
            </div>

            {/* Edit and Delete Icons */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => openEditClientModal(client)}
                className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                title="Edit Client"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => openDeleteClientModal(client)}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Delete Client"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Client Modal */}
      {isEditClientModalOpen && selectedClient && (
        <EditClientModal
          client={client}
          onClose={closeEditClientModal}
          onSave={onClientEditSave} // Propagate save to parent
        />
      )}

      {/* Delete Client Modal */}
      <DeleteClientModal
        isOpen={isDeleteClientModalOpen}
        onClose={closeDeleteClientModal}
        client={client}
        onDeleteConfirm={onClientDeleteConfirm}
      />
    </>
  );
};

export default OverviewClient;
