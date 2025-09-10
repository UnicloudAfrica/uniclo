import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Settings2,
  Loader2,
} from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import { useState } from "react";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import AddClientModal from "./clientComps/addClient";
import DeleteClientModal from "./clientComps/deleteClient";
import { useNavigate } from "react-router-dom";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";

const encodeId = (id) => {
  return encodeURIComponent(btoa(id));
};

const AdminClients = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isAddClientOpen, setAddClient] = useState(false);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddClient = () => setAddClient(true);
  const closeAddClient = () => setAddClient(false);

  const clientData = clients || [];

  const uniqueTenants = [
    { id: "", name: "All Tenants" },
    ...Array.from(new Set(clientData.map((item) => item.tenant_id)))
      .map((tenantId) => {
        const tenant = clientData.find(
          (item) => item.tenant_id === tenantId
        )?.tenant;
        return tenant ? { id: tenant.id, name: tenant.name } : null;
      })
      .filter(Boolean),
  ];

  const filteredData = clientData.filter((item) => {
    const lowerCaseSearchQuery = searchQuery.toLowerCase();
    const matchesSearch =
      (item.first_name &&
        item.first_name.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (item.last_name &&
        item.last_name.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (item.email && item.email.toLowerCase().includes(lowerCaseSearchQuery)) ||
      (item.phone && item.phone.toLowerCase().includes(lowerCaseSearchQuery));

    const matchesTenant =
      selectedTenantId === "" || item.tenant_id === selectedTenantId;

    return matchesSearch && matchesTenant;
  });

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
    const encodedId = encodeId(client.identifier);
    const clientFullName = encodeURIComponent(
      `${client.first_name} ${client.last_name}`
    );
    navigate(
      `/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`
    );
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setIsDeleteClientModalOpen(true);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  const onClientDeleteConfirm = () => {
    closeDeleteClientModal();
  };

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex flex-col lg:flex-row">
        <TenantClientsSideMenu />

        <div className="flex-1 bg-white rounded-lg shadow-sm p-4 lg:p-6 lg:w-[76%]">
          <button
            onClick={openAddClient}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
          >
            Add client
          </button>
          <div className="flex flex-col md:flex-row items-center justify-between mt-6 mb-6 gap-4 md:gap-0">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Search Name, Email, or Phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 px-4 py-2 bg-[#F5F5F5] rounded-[8px] border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#288DD1]"
                autoComplete="off" // Prevent autofill
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full md:w-auto px-4 py-2 bg-[#F5F5F5] rounded-[8px] border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#288DD1]"
              >
                {uniqueTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <button className="flex items-center gap-2 px-3 py-2 text-sm bg-[#F2F4F8] rounded-[8px] text-gray-600 hover:text-gray-900 transition-colors">
                <Settings2 className="w-4 h-4 text-[#555E67]" />
                Filter
              </button>
            </div>
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
                        S/N
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        NAME
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        EMAIL ADDRESS
                      </th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                      PHONE NUMBER
                    </th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        TENANT NAME
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#555E67] uppercase">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E8E6EA]">
                    {currentData.length > 0 ? (
                      currentData.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleViewDetails(item)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {item.first_name} {item.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {item.email}
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                          {item.phone}
                        </td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#575758] font-normal">
                            {item.tenant?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(item);
                                }}
                                className="text-[#288DD1] hover:text-[#1976D2] transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
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
                          colSpan="6"
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
                  currentData.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E8E6EA] rounded-[8px] p-4 mb-4 cursor-pointer"
                      onClick={() => handleViewDetails(item)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-[#1C1C1C]">
                          S/N: {(currentPage - 1) * itemsPerPage + index + 1}
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
                      {/* <p className="text-sm text-[#575758]">
                      Phone: {item.phone}
                    </p> */}
                      <p className="text-sm text-[#575758] mt-2">
                        Tenant: {item.tenant?.name || "N/A"}
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
              {filteredData.length > 0 && (
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
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
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
                        }
                      )}
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
        </div>
      </main>

      <AddClientModal isOpen={isAddClientOpen} onClose={closeAddClient} />
      <DeleteClientModal
        isOpen={isDeleteClientModalOpen}
        onClose={closeDeleteClientModal}
        client={selectedClient}
        onDeleteConfirm={onClientDeleteConfirm}
      />
    </>
  );
};

export default AdminClients;
