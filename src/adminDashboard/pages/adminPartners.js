import {
  Loader2,
  Eye,
  Trash2,
  Plus,
  Users,
  Building2,
  Phone,
<<<<<<< HEAD
  Calendar,
=======
>>>>>>> b587e2a (web)
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import ModernTable from "../components/ModernTable";
import ModernButton from "../components/ModernButton";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import { useState } from "react";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useNavigate } from "react-router-dom";
import DeleteTenantModal from "./tenantComps/deleteTenant";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { designTokens } from "../../styles/designTokens";
import AdminPageShell from "../components/AdminPageShell";

const encodeId = (id) => encodeURIComponent(btoa(id));

const companyTypeMap = {
  RC: "Limited Liability Company",
  BN: "Business Name",
  IT: "Incorporated Trustees",
  LL: "Limited Liability",
  LLP: "Limited Liability Partnership",
  Other: "Other",
};

const formatCompanyType = (type) => companyTypeMap[type] || "Unknown";

const AdminPartners = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: tenants = [], isFetching: isTenantsFetching } =
    useFetchTenants();
  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false);
  const [selectedTenantToDelete, setSelectedTenantToDelete] = useState(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleViewDetails = (item) => {
    const encodedId = encodeId(item.identifier);
    navigate(`/admin-dashboard/partners/details?id=${encodedId}&name=${encodeURIComponent(
      item.name
    )}`);
  };

  const handleDeleteClick = (item) => {
    setSelectedTenantToDelete(item);
    setIsDeleteTenantModalOpen(true);
  };

  const totalPartners = tenants.length;
<<<<<<< HEAD
  const activePartners = tenants.filter(
    (tenant) => tenant.status === "active"
  ).length;
=======
  const activePartners = tenants.filter((tenant) => tenant.status === "active").length;
>>>>>>> b587e2a (web)
  const companyTypes = {
    RC: tenants.filter((t) => t.company_type === "RC").length,
    BN: tenants.filter((t) => t.company_type === "BN").length,
    IT: tenants.filter((t) => t.company_type === "IT").length,
<<<<<<< HEAD
    Other: tenants.filter((t) => !["RC", "BN", "IT"].includes(t.company_type))
      .length,
=======
    Other: tenants.filter((t) => !["RC", "BN", "IT"].includes(t.company_type)).length,
>>>>>>> b587e2a (web)
  };

  const columns = [
    {
      key: "serialNumber",
      header: "S/N",
<<<<<<< HEAD
      render: (value, row, index, currentPage, pageSize) =>
        (currentPage - 1) * pageSize + index + 1,
=======
      render: (value, row, index) => index + 1,
>>>>>>> b587e2a (web)
    },
    {
      key: "id",
      header: "Partner ID",
    },
    {
      key: "name",
      header: "Name",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building2
            size={16}
            style={{ color: designTokens.colors.primary[500] }}
          />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone Number",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone
            size={14}
            style={{ color: designTokens.colors.neutral[500] }}
          />
          {value}
        </div>
      ),
    },
    {
      key: "company_type",
      header: "Type",
      render: (value) => (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: designTokens.colors.primary[50],
            color: designTokens.colors.primary[700],
          }}
        >
          {formatCompanyType(value)}
        </span>
      ),
    },
  ];

  const actions = [
    {
      icon: <Eye size={16} />,
      label: "",
      onClick: handleViewDetails,
    },
    {
      icon: <Trash2 size={16} />,
      label: "",
      onClick: handleDeleteClick,
    },
  ];

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2
          className="w-12 animate-spin"
          style={{ color: designTokens.colors.primary[500] }}
        />
      </div>
    );
  }

  const headerActions = (
    <ModernButton
      onClick={() => navigate("/admin-dashboard/partners/create")}
      className="flex items-center gap-2"
    >
      <Plus size={18} />
      Add Partner
    </ModernButton>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
<<<<<<< HEAD
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] bg-[#FAFAFA] lg:w-[80%] min-h-full p-6 md:p-8 flex flex-col lg:flex-row">
=======
      <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <AdminPageShell
        title="Partners Management"
        description="Manage and monitor your business partners"
        actions={headerActions}
        contentClassName="space-y-6"
      >
>>>>>>> b587e2a (web)
        <TenantClientsSideMenu />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModernStatsCard
            title="Total Partners"
            value={totalPartners}
            icon={<Users size={24} />}
            change={12}
            trend="up"
            color="primary"
          />
          <ModernStatsCard
            title="Active Partners"
            value={activePartners}
            icon={<Building2 size={24} />}
            change={8}
            trend="up"
            color="success"
          />
          <ModernStatsCard
            title="LLC Companies"
            value={companyTypes.RC}
            icon={<Building2 size={24} />}
            color="info"
          />
          <ModernStatsCard
            title="Business Names"
            value={companyTypes.BN}
            icon={<Building2 size={24} />}
            color="warning"
          />
        </div>

        <ModernCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
<<<<<<< HEAD
              <h1
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Partners Management
              </h1>
              <p
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage and monitor your business partners
              </p>
            </div>

            <button
              onClick={openAddPartner}
              className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base "
            >
              Add Partner
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Partners"
              value={totalPartners}
              icon={<Users width={20} height={20} />}
              change={12}
              trend="up"
              color="primary"
            />
            <ModernStatsCard
              title="Active Partners"
              value={activePartners}
              icon={<Building2 width={20} height={20} />}
              change={8}
              trend="up"
              color="primary"
            />
            <ModernStatsCard
              title="LLC Companies"
              value={companyTypes.RC}
              icon={<Building2 width={20} height={20} />}
              color="primary"
            />
            <ModernStatsCard
              title="Business Names"
              value={companyTypes.BN}
              icon={<Building2 width={20} height={20} />}
              color="primary"
            />
          </div>

          {/* Partners Table */}

          <ModernTable
            title="Partners List"
            data={tenants}
            columns={columns}
            actions={actions}
            searchable={true}
            filterable={true}
            exportable={true}
            sortable={true}
=======
              <h2 className="text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                Partner Directory
              </h2>
              <p className="text-sm mt-1" style={{ color: designTokens.colors.neutral[600] }}>
                View partner details, track activity, and manage lifecycle.
              </p>
            </div>
            <div className="flex gap-2">
              <ModernButton variant="outline" size="sm">
                Export Data
              </ModernButton>
              <ModernButton variant="outline" size="sm">
                Refresh
              </ModernButton>
            </div>
          </div>
          <ModernTable
            data={tenants}
            columns={columns}
            actions={actions}
            searchable
            filterable
            exportable
            sortable
>>>>>>> b587e2a (web)
            loading={isTenantsFetching}
            onRowClick={handleViewDetails}
            emptyMessage="No partners found"
          />
<<<<<<< HEAD
        </div>
      </main>
      <AddPartner isOpen={isAddPartnerOpen} onClose={closeAddPartner} />
=======
        </ModernCard>
      </AdminPageShell>
>>>>>>> b587e2a (web)
      <DeleteTenantModal
        isOpen={isDeleteTenantModalOpen}
        onClose={() => setIsDeleteTenantModalOpen(false)}
        tenantId={selectedTenantToDelete?.identifier}
        tenantName={selectedTenantToDelete?.name}
      />
    </>
  );
};

export default AdminPartners;
