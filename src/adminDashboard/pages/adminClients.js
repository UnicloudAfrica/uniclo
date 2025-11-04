import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Settings2,
  Loader2,
  Users,
  ShieldCheck,
  Building2,
  UserPlus,
  Plus,
  SquarePen,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import DeleteClientModal from "./clientComps/deleteClient";
import EditClientModal from "./clientComps/editClient";

const encodeId = (id) => encodeURIComponent(btoa(id));

const AdminClients = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  const clientData = clients || [];

  const uniqueTenants = [
    { id: "", name: "All Tenants" },
    ...Array.from(new Set(clientData.map((item) => item.tenant_id)))
      .map((tenantId) => {
        const tenant = clientData.find((item) => item.tenant_id === tenantId)?.tenant;
        return tenant ? { id: tenant.id, name: tenant.name } : null;
      })
      .filter(Boolean),
  ];

  const filteredData = clientData.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (item.first_name && item.first_name.toLowerCase().includes(query)) ||
      (item.last_name && item.last_name.toLowerCase().includes(query)) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.phone && item.phone.toLowerCase().includes(query));

    const matchesTenant = selectedTenantId === "" || item.tenant_id === selectedTenantId;

    return matchesSearch && matchesTenant;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalClients = clientData.length;
  const activeClients = clientData.filter(
    (client) => client.status === "active" || client.is_active
  ).length;
  const tenantCount = Math.max(uniqueTenants.length - 1, 0);
  const pendingClients = clientData.filter((client) => client.status === "pending").length;

  const headerActions = (
    <ModernButton
      onClick={() => navigate("/admin-dashboard/clients/create")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Client
    </ModernButton>
  );

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewDetails = (client) => {
    const encodedId = encodeId(client.identifier);
    const clientFullName = encodeURIComponent(`${client.first_name} ${client.last_name}`);
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${clientFullName}`);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsEditClientModalOpen(true);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setIsDeleteClientModalOpen(true);
  };

  const closeEditClientModal = () => {
    setIsEditClientModalOpen(false);
    setSelectedClient(null);
  };

  const closeDeleteClientModal = () => {
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  const onClientDeleteConfirm = () => {
    closeDeleteClientModal();
  };

  const filterBar = (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="w-full md:flex-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Search Clients</label>
        <input
          type="text"
          placeholder="Search name, email, or phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#288DD1]/40"
          autoComplete="off"
        />
      </div>
      <div className="w-full md:w-60">
        <label className="text-xs font-semibold text-gray-500 uppercase">Tenant Filter</label>
        <select
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#288DD1]/40"
        >
          {uniqueTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <ModernButton variant="outline" size="sm" className="flex items-center gap-2">
        <Settings2 className="w-4 h-4" />
        Advanced Filters
      </ModernButton>
    </div>
  );

  const tableContent = isClientsFetching ? (
    <div className="flex justify-center items-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
      <p className="ml-3 text-gray-600">Loading clients...</p>
    </div>
  ) : (
    <>
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                S/N
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tenant Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.first_name} {item.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.tenant?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <ModernButton
                        variant="primary"
                        size="sm"
                        className="gap-2 text-xs"
                        onClick={() => handleEditClient(item)}
                      >
                        <SquarePen className="h-4 w-4" />
                        Edit
                      </ModernButton>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs"
                        onClick={() => handleViewDetails(item)}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </ModernButton>
                      <ModernButton
                        variant="danger"
                        size="sm"
                        className="gap-2 text-xs"
                        onClick={() => handleDeleteClient(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </ModernButton>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden grid grid-cols-1 gap-4">
        {currentData.length > 0 ? (
          currentData.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.first_name} {item.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{item.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tenant: {item.tenant?.name || "N/A"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ModernButton
                    variant="primary"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleEditClient(item)}
                  >
                    <SquarePen className="h-4 w-4" />
                    Edit
                  </ModernButton>
                  <ModernButton
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleViewDetails(item)}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </ModernButton>
                  <ModernButton
                    variant="danger"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => handleDeleteClient(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </ModernButton>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-gray-500">
            No clients found.
          </div>
        )}
      </div>
    </>
  );

  const pagination = filteredData.length > 0 && (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-full border border-gray-200 text-gray-500 disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-full border border-gray-200 text-gray-500 disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-500">
        Showing {(currentPage - 1) * itemsPerPage + 1} -
        {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
      </p>
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
        title="Clients Management"
        description="Manage client accounts, tenant assignments, and contacts."
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <ModernStatsCard
            title="Total Clients"
            value={totalClients}
            icon={<Users size={24} />}
            change={4}
            trend="up"
            color="primary"
          />
          <ModernStatsCard
            title="Active Clients"
            value={activeClients}
            icon={<ShieldCheck size={24} />}
            change={2}
            trend="up"
            color="success"
          />
          <ModernStatsCard
            title="Tenants"
            value={tenantCount}
            icon={<Building2 size={24} />}
            color="info"
          />
          <ModernStatsCard
            title="Pending Invites"
            value={pendingClients}
            icon={<UserPlus size={24} />}
            color="warning"
          />
        </div>

        <ModernCard>
          {filterBar}
          <div className="mt-6 space-y-6">
            {tableContent}
            {pagination}
          </div>
        </ModernCard>
      </AdminPageShell>

      {isEditClientModalOpen && (
        <EditClientModal
          client={selectedClient}
          onClose={closeEditClientModal}
          onClientUpdated={closeEditClientModal}
        />
      )}

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
