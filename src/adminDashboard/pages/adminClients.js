import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Settings2,
  Loader2,
  User,
  Mail,
} from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import { useState, useMemo } from "react";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import AddClientModal from "./clientComps/addClient";
import DeleteClientModal from "./clientComps/deleteClient";
import { useNavigate } from "react-router-dom";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { designTokens } from "../../styles/designTokens";
import ModernTable from "../components/ModernTable";

const encodeId = (id) => {
  if (id === null || id === undefined) return "";
  return encodeURIComponent(btoa(id));
};

const AdminClients = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  // Define columns for ModernTable
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
        header: "Email Address",
        render: (value) => (
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-gray-500" />
            <span>{value}</span>
          </div>
        ),
      },
      {
        key: "tenant_name",
        header: "Tenant Name",
        render: (value, row) => row.tenant?.name || "N/A",
      },
    ],
    []
  );

  // Define actions for ModernTable
  const actions = [
    { icon: <Eye size={16} />, onClick: handleViewDetails },
    { icon: <Trash2 size={16} />, onClick: handleDeleteClient },
  ];

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

        <div className="flex-1 lg:w-[76%] space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Clients Management
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage and monitor your clients
              </p>
            </div>

            <button
              onClick={openAddClient}
              className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
            >
              Add client
            </button>
          </div>
          <ModernTable
            title="Clients List"
            data={clients || []}
            columns={columns}
            actions={actions}
            searchable={true}
            filterable={true}
            exportable={true}
            sortable={true}
            paginated={true}
            pageSize={itemsPerPage}
            loading={isClientsFetching}
            onRowClick={handleViewDetails}
            emptyMessage="No clients found."
          />
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
