import {
  ChevronLeft,
  ChevronRight,
  Eye, // Import Eye icon
  Trash2, // Import Trash2 icon
  Settings2,
  Loader2,
} from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import { useEffect, useRef, useState } from "react";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import AddClientModal from "./clientComps/addClient";
// import DeleteClientModal from "./clientComps/deleteClient";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const AdminClients = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddClientOpen, setAddClient] = useState(false);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false); // State for delete modal
  const [selectedClient, setSelectedClient] = useState(null); // State to hold client for deletion
  // State to control mobile menu visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  // Function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Function to close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddClient = () => setAddClient(true);
  const closeAddClient = () => setAddClient(false);

  // Use the fetched clients data, default to empty array if not available yet
  const clientData = clients || [];

  const filteredData = clientData.filter(
    (item) =>
      item.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewDetails = (client) => {
    // Navigate to a client details page. Replace with your actual route.
    // For now, a placeholder navigation or alert.
    alert(
      `Viewing details for client: ${client.first_name} ${client.last_name}`
    );
    // navigate(`/admin/clients/${client.id}`);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setIsDeleteClientModalOpen(true);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null); // Clear selected client on close
  };

  const onClientDeleteConfirm = () => {
    // This function will be called from DeleteClientModal after confirmation
    // In a real app, you would trigger the actual delete API call here
    console.log("Client deletion confirmed for:", selectedClient.id);
    // After successful deletion, you might want to refetch clients or update the list
    // For now, just close the modal.
    closeDeleteClientModal();
    // You might want to trigger a refetch of clients here
    // queryClient.invalidateQueries(['clients']); // Assuming react-query
  };

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
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
              placeholder="Search Name, Email, or Phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 px-4 py-2 bg-[#F5F5F5] rounded-[8px] border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#288DD1]"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
            <Settings2 className="w-4 h-4 text-[#555E67]" />
            Filter
          </button>
        </div>

        {isClientsFetching ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
            <p className="ml-2 text-gray-600">Loading clients...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto mt-6 rounded-[12px] border border-gray-200">
              <table className="w-full">
                <thead className="bg-[#F5F5F5]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      CLIENT ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      NAME
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      EMAIL ADDRESS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      PHONE NUMBER
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E8E6EA]">
                  {currentData.length > 0 ? (
                    currentData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.first_name} {item.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click if any parent row has a click handler
                                handleViewDetails(item);
                              }}
                              className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent row click
                                handleDeleteClient(item);
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete Client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No clients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden mt-6 space-y-4">
              {currentData.length > 0 ? (
                currentData.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#E8E6EA] rounded-[8px] p-4 mb-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-[#1C1C1C]">
                        {item.id}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(item);
                          }}
                          className="text-[#288DD1] hover:text-[#1976D2] transition-colors p-1"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(item);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Delete Client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-[#575758]">
                      Name: {item.first_name} {item.last_name}
                    </p>
                    <p className="text-sm text-[#575758]">
                      Email: {item.email}
                    </p>
                    <p className="text-sm text-[#575758]">
                      Phone: {item.phone}
                    </p>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-[8px] shadow-sm p-4 text-center text-gray-500">
                  No clients found.
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && ( // Only show pagination if there's data after filtering
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
            )}
          </>
        )}
      </main>

      <AddClientModal isOpen={isAddClientOpen} onClose={closeAddClient} />
      {/* <DeleteClientModal
        isOpen={isDeleteClientModalOpen}
        onClose={closeDeleteClientModal}
        client={selectedClient}
        onDeleteConfirm={onClientDeleteConfirm}
      /> */}
    </>
  );
};

export default AdminClients;
