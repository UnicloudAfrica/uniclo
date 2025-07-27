import React, { useState } from "react";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import {
  Settings2,
  Eye,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthRedirect from "../../utils/authRedirect";
import AddClientModal from "./clientComps/addClient";
import DeleteClientModal from "./clientComps/deleteClient"; // Import the DeleteClientModal
import { useFetchClients } from "../../hooks/clientHooks";

export default function Clients() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setAddClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null); // Store the client object to be deleted

  const { isLoading: isAuthLoading } = useAuthRedirect();
  // Use refetch from useFetchClients to update the list after deletion
  const {
    data: clients,
    isFetching: isClientsFetching,
    refetch,
  } = useFetchClients();
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const openAddClient = () => setAddClient(true);
  const closeAddClient = () => setAddClient(false);

  // Functions to manage delete modal
  const openDeleteModal = (client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setClientToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleClientDeleted = () => {
    // This function is called after successful deletion from DeleteClientModal
    refetch(); // Refetch clients to update the list
  };

  const filteredClients = clients
    ? clients.filter(
        (client) =>
          client.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const currentClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const encodeId = (id) => {
    return encodeURIComponent(btoa(id));
  };

  const handleViewClient = (client) => {
    const encodedClientId = encodeId(client.identifier.toString());
    navigate(`/dashboard/clients/overview?id=${encodedClientId}`);
  };

  // This function now opens the delete confirmation modal
  const handleDeleteClient = (client) => {
    openDeleteModal(client);
  };

  if (isAuthLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8">
        <button
          onClick={openAddClient}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
        >
          Add client
        </button>
        <div className="flex items-center justify-between mt-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Name or Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 bg-[#F5F5F5] rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#288DD1]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {isClientsFetching ? (
          <div className="w-full text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto text-[#288DD1] animate-spin" />
            <p className="text-gray-600 mt-2">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="w-full text-center py-8 text-gray-600">
            {searchQuery ? (
              <p>No clients found matching "{searchQuery}".</p>
            ) : (
              <p>No clients available. Add a new client to get started.</p>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-[#E8E6EA]">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      CLIENT ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      EMAIL ADDRESS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      PHONE NUMBER
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      COUNTRY
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase tracking-wider">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E8E6EA]">
                  {currentClients.map((client, index) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {(index + 1).toString().padStart(2, "0")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {client.first_name} {client.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {client.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {client.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                        {client.country || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewClient(client)}
                            className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1 rounded-full hover:bg-gray-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(client)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                            title="Delete Client"
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

            <div className="md:hidden mt-6 space-y-4">
              {currentClients.map((client, index) => (
                <div
                  key={client.id}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-[#1C1C1C]">
                      Client ID: {(index + 1).toString().padStart(2, "0")}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewClient(client)}
                        className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1 rounded-full hover:bg-gray-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#575758]">
                    <span className="font-medium">Name:</span>{" "}
                    {client.first_name} {client.last_name}
                  </p>
                  <p className="text-sm text-[#575758]">
                    <span className="font-medium">Email:</span> {client.email}
                  </p>
                  <p className="text-sm text-[#575758]">
                    <span className="font-medium">Phone:</span>{" "}
                    {client.phone || "N/A"}
                  </p>
                  <p className="text-sm text-[#575758] mt-2">
                    <span className="font-medium">Country:</span>{" "}
                    {client.country || "N/A"}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center px-4 mt-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNumber
                            ? "bg-[#288DD1] text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                <span className="text-sm text-gray-700">of</span>

                <button
                  onClick={() => handlePageChange(totalPages)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-[#288DD1] text-white"
                      : "text-gray-700 bg-white border border-[#333333] hover:bg-gray-50"
                  }`}
                >
                  {totalPages}
                </button>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-[#333333] rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <AddClientModal isOpen={isAddClientOpen} onClose={closeAddClient} />
      {/* Delete Client Modal */}
      <DeleteClientModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        client={clientToDelete}
        onDeleteConfirm={handleClientDeleted}
      />
    </>
  );
}
