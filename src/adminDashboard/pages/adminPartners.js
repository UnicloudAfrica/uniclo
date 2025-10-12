// src/components/admin/AdminPartners.jsx
import {
  Loader2,
  Eye,
  Trash2,
  Plus,
  Users,
  Building2,
  Phone,
  Calendar
} from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import ModernTable from "../components/ModernTable";
import ModernButton from "../components/ModernButton";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import AddPartner from "../components/partnersComponent/addPartner";
import { useState } from "react";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useNavigate } from "react-router-dom";
import DeleteTenantModal from "./tenantComps/deleteTenant";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { designTokens } from "../../styles/designTokens";

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
  const [isAddPartnerOpen, setAddPartner] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: tenants = [], isFetching: isTenantsFetching } = useFetchTenants();
  const [isDeleteTenantModalOpen, setIsDeleteTenantModalOpen] = useState(false);
  const [selectedTenantToDelete, setSelectedTenantToDelete] = useState(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openAddPartner = () => setAddPartner(true);
  const closeAddPartner = () => setAddPartner(false);

  const handleViewDetails = (item) => {
    const encodedId = encodeId(item.identifier);
    navigate(
      `/admin-dashboard/partners/details?id=${encodedId}&name=${encodeURIComponent(
        item.name
      )}`
    );
  };

  const handleDeleteClick = (item) => {
    setSelectedTenantToDelete(item);
    setIsDeleteTenantModalOpen(true);
  };

  // Stats calculations
  const totalPartners = tenants.length;
  const activePartners = tenants.filter(tenant => tenant.status === 'active').length;
  const companyTypes = {
    RC: tenants.filter(t => t.company_type === 'RC').length,
    BN: tenants.filter(t => t.company_type === 'BN').length,
    IT: tenants.filter(t => t.company_type === 'IT').length,
    Other: tenants.filter(t => !['RC', 'BN', 'IT'].includes(t.company_type)).length
  };

  // Define columns for ModernTable
  const columns = [
    {
      key: 'serialNumber',
      header: 'S/N',
      render: (value, row, index) => index + 1
    },
    {
      key: 'id',
      header: 'Partner ID'
    },
    {
      key: 'name',
      header: 'Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone size={14} style={{ color: designTokens.colors.neutral[500] }} />
          {value}
        </div>
      )
    },
    {
      key: 'company_type',
      header: 'Type',
      render: (value) => (
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: designTokens.colors.primary[50],
            color: designTokens.colors.primary[700]
          }}
        >
          {formatCompanyType(value)}
        </span>
      )
    }
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Eye size={16} />,
      label: '',
      onClick: handleViewDetails
    },
    {
      icon: <Trash2 size={16} />,
      label: '',
      onClick: handleDeleteClick
    }
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

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main 
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8 flex flex-col lg:flex-row"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <TenantClientsSideMenu />

        <div className="flex-1 lg:w-[76%] space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
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
            <ModernButton
              onClick={openAddPartner}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              Add Partner
            </ModernButton>
          </div>

          {/* Stats Cards */}
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

          {/* Partners Table */}
          <ModernCard>
            <ModernTable
              title="Partners List"
              data={tenants}
              columns={columns}
              actions={actions}
              searchable={true}
              filterable={true}
              exportable={true}
              sortable={true}
              loading={isTenantsFetching}
              onRowClick={handleViewDetails}
              emptyMessage="No partners found"
            />
          </ModernCard>


        </div>
      </main>
      <AddPartner isOpen={isAddPartnerOpen} onClose={closeAddPartner} />
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
