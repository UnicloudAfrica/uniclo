import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  Activity,
  ChevronRight
} from "lucide-react";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import { designTokens } from "../../styles/designTokens";
import DeleteRegionModal from "./regionComps/deleteRegion";
import {
  useFetchRegions,
  useDeleteRegion,
} from "../../hooks/adminHooks/regionHooks";
import useAuthRedirect from "../../utils/adminAuthRedirect";

const AdminRegion = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isLoading } = useAuthRedirect();
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Calculate region statistics
  const regionList = Array.isArray(regions) ? regions : [];
  const uniqueCountries = new Set(
    regionList.map((region) => region.country_code).filter(Boolean)
  );
  const uniqueProviders = new Set(
    regionList.map((region) => region.provider).filter(Boolean)
  );
  const uniqueCities = new Set(
    regionList.map((region) => region.city).filter(Boolean)
  );
  const activeRegionsCount = regionList.filter(
    (region) => region.is_active
  ).length;

  const regionStats = {
    totalRegions: regionList.length,
    activeRegions: activeRegionsCount,
    uniqueCountries: uniqueCountries.size,
    uniqueProviders: uniqueProviders.size,
    uniqueCities: uniqueCities.size,
  };

  const openDeleteModal = (item) => {
    setSelectedRegion(item);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedRegion(null);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
          <Server
            size={16}
            style={{ color: designTokens.colors.success[500] }}
          />
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: designTokens.colors.success[50],
              color: designTokens.colors.success[700],
            }}
          >
            {value}
          </span>
        </div>
      ),
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
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor:
              value === 'healthy'
                ? designTokens.colors.success[50]
                : designTokens.colors.warning[50],
            color:
              value === 'healthy'
                ? designTokens.colors.success[700]
                : designTokens.colors.warning[700],
          }}
        >
          <Activity size={14} />
          {value || 'unknown'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Active',
      render: (value) => (
        <span
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: value
              ? designTokens.colors.primary[50]
              : designTokens.colors.neutral[100],
            color: value
              ? designTokens.colors.primary[700]
              : designTokens.colors.neutral[700],
          }}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Eye size={16} />,
      label: '',
      onClick: (item) => window.location.href = `/admin-dashboard/regions/${item.code}`
    },
    {
      icon: <Edit size={16} />,
      label: '',
      onClick: (item) => window.location.href = `/admin-dashboard/regions/${item.code}/edit`
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
      <AdminPageShell
        title="Region Management"
        description="Manage cloud infrastructure regions and locations"
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Regions" },
        ]}
        actions={
          <Link to="/admin-dashboard/region-approvals/create">
            <ModernButton className="flex items-center gap-2">
              <Plus size={18} />
              Add Region
            </ModernButton>
          </Link>
        }
      >
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
            title="Active Regions"
            value={regionStats.activeRegions}
            icon={<Activity size={24} />}
            color="success"
            description="Currently enabled"
          />
          <ModernStatsCard
            title="Countries"
            value={regionStats.uniqueCountries}
            icon={<Globe size={24} />}
            color="warning"
            description="Geographic coverage"
          />
          <ModernStatsCard
            title="Locations"
            value={regionStats.uniqueCities}
            icon={<Building size={24} />}
            color="info"
            description="Active cities"
          />
        </div>

        <ModernCard>
          <ModernTable
            title={`Infrastructure Regions · Providers: ${regionStats.uniqueProviders}`}
            data={regionList}
            columns={columns}
            actions={actions}
            searchable={true}
            filterable={true}
            exportable={true}
            sortable={true}
            loading={isRegionsFetching}
            onRowClick={(region) =>
              (window.location.href = `/admin-dashboard/regions/${region.code}`)
            }
            emptyMessage="No regions configured. Add regions to manage your infrastructure."
          />
        </ModernCard>
      </AdminPageShell>

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
