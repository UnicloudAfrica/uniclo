import React, { useState } from "react";
import {
  Loader2,
  Eye,
  Trash2,
  Edit,
  Plus,
  Globe,
  MapPin,
  Building,
  Server,
  Activity
} from "lucide-react";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import AdminHeadbar from "../components/adminHeadbar";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import { designTokens } from "../../styles/designTokens";
import AddRegionModal from "./regionComps/addRegion";
import DeleteRegionModal from "./regionComps/deleteRegion";
import {
  useFetchRegions,
  useDeleteRegion,
} from "../../hooks/adminHooks/regionHooks";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import EditRegionModal from "./regionComps/editRegion";
import ViewRegionModal from "./regionComps/viewRegion";

const AdminRegion = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuthRedirect();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Calculate region statistics
  const regionStats = {
    totalRegions: regions?.length || 0,
    uniqueCountries: [...new Set(regions?.map(r => r.country_code))].length || 0,
    uniqueProviders: [...new Set(regions?.map(r => r.provider))].length || 0,
    activeCities: [...new Set(regions?.map(r => r.city))].length || 0
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openViewModal = (item) => {
    setSelectedRegion(item);
    setViewModalOpen(true);
  };
  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedRegion(null);
  };
  const openEditModal = (item) => {
    setSelectedRegion(item);
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedRegion(null);
  };
  const openDeleteModal = (item) => {
    setSelectedRegion(item);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedRegion(null);
  };

  // Define columns for ModernTable
  const columns = [
    {
      key: 'serialNumber',
      header: 'S/N',
      render: (value, row, index) => index + 1
    },
    {
      key: 'name',
      header: 'Region Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Server size={16} style={{ color: designTokens.colors.success[500] }} />
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: designTokens.colors.success[50],
              color: designTokens.colors.success[700]
            }}
          >
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'country_code',
      header: 'Country',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Globe size={16} style={{ color: designTokens.colors.warning[500] }} />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'city',
      header: 'City',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building size={16} style={{ color: designTokens.colors.neutral[500] }} />
          <span>{value}</span>
        </div>
      )
    }
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Eye size={16} />,
      label: '',
      onClick: (item) => openViewModal(item)
    },
    {
      icon: <Edit size={16} />,
      label: '',
      onClick: (item) => openEditModal(item)
    },
    {
      icon: <Trash2 size={16} />,
      label: '',
      onClick: (item) => openDeleteModal(item)
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
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Region Management
              </h1>
              <p 
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage cloud infrastructure regions and locations
              </p>
            </div>
            <ModernButton
              onClick={openCreateModal}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              Add Region
            </ModernButton>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Regions"
              value={regionStats.totalRegions}
              icon={<MapPin size={24} />}
              change={2}
              trend="up"
              color="primary"
              description="Available regions"
            />
            <ModernStatsCard
              title="Countries"
              value={regionStats.uniqueCountries}
              icon={<Globe size={24} />}
              color="success"
              description="Geographic coverage"
            />
            <ModernStatsCard
              title="Providers"
              value={regionStats.uniqueProviders}
              icon={<Server size={24} />}
              color="warning"
              description="Infrastructure partners"
            />
            <ModernStatsCard
              title="Cities"
              value={regionStats.activeCities}
              icon={<Building size={24} />}
              color="info"
              description="Active locations"
            />
          </div>

          {/* Regions Table */}
          <ModernCard>
            <ModernTable
              title="Infrastructure Regions"
              data={regions || []}
              columns={columns}
              actions={actions}
              searchable={true}
              filterable={true}
              exportable={true}
              sortable={true}
              loading={isRegionsFetching}
              onRowClick={(region) => openViewModal(region)}
              emptyMessage="No regions configured. Add regions to manage your infrastructure."
            />
          </ModernCard>

        </div>

      </main>

      <AddRegionModal isOpen={isCreateModalOpen} onClose={closeCreateModal} />
      <ViewRegionModal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        region={selectedRegion}
      />
      <EditRegionModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        region={selectedRegion}
      />
      <DeleteRegionModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        regionId={selectedRegion?.id}
        regionName={selectedRegion?.name}
      />
    </>
  );
};

export default AdminRegion;
