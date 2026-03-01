import { useState } from "react";
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
} from "lucide-react";
import ModernTable, { Column } from "../../shared/components/ui/ModernTable";
import { ModernCard } from "../../shared/components/ui";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton } from "../../shared/components/ui";
import AdminPageShell from "../components/AdminPageShell";
import { designTokens } from "../../styles/designTokens";
import DeleteRegionModal from "./regionComps/deleteRegion";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import useAuthRedirect from "../../utils/adminAuthRedirect";

interface RegionRecord {
  id?: string | number | null;
  code?: string;
  name?: string;
  provider?: string;
  country_code?: string;
  city?: string;
  status?: string;
  is_active?: boolean;
}

const AdminRegion = () => {
  const { isLoading } = useAuthRedirect();
  const { isFetching: isRegionsFetching, data: regionsData } = useFetchRegions();
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionRecord | null>(null);

  // Calculate region statistics
  const regionList: RegionRecord[] = Array.isArray(regionsData)
    ? (regionsData as RegionRecord[])
    : [];
  const uniqueCountries = new Set(
    regionList.map((region: RegionRecord) => region.country_code).filter(Boolean)
  );
  const uniqueProviders = new Set(
    regionList.map((region: RegionRecord) => region.provider).filter(Boolean)
  );
  const uniqueCities = new Set(
    regionList.map((region: RegionRecord) => region.city).filter(Boolean)
  );
  const activeRegionsCount = regionList.filter((region: RegionRecord) => region.is_active).length;

  const regionStats = {
    totalRegions: regionList.length,
    activeRegions: activeRegionsCount,
    uniqueCountries: uniqueCountries.size,
    uniqueProviders: uniqueProviders.size,
    uniqueCities: uniqueCities.size,
  };
  const openDeleteModal = (item: RegionRecord) => {
    setSelectedRegion(item);
    setDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedRegion(null);

    // Define columns for ModernTable
  };
  const columns: Column<RegionRecord>[] = [
    {
      key: "serialNumber",
      header: "S/N",
      render: (_value: unknown, _row: RegionRecord, index: number) => index + 1,
    },
    {
      key: "name",
      header: "Region Name",
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <MapPin size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{String(value || "—")}</span>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Server size={16} style={{ color: designTokens.colors.success[500] }} />
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: designTokens.colors.success[50],
              color: designTokens.colors.success[700],
            }}
          >
            {String(value || "—")}
          </span>
        </div>
      ),
    },
    {
      key: "country_code",
      header: "Country",
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Globe size={16} style={{ color: designTokens.colors.warning[500] }} />
          <span>{String(value || "—")}</span>
        </div>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          <Building size={16} style={{ color: designTokens.colors.neutral[500] }} />
          <span>{String(value || "—")}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value: unknown) => (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor:
              value === "healthy"
                ? designTokens.colors.success[50]
                : designTokens.colors.warning[50],
            color:
              value === "healthy"
                ? designTokens.colors.success[700]
                : designTokens.colors.warning[700],
          }}
        >
          <Activity size={14} />
          {String(value || "unknown")}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Active",
      render: (value: unknown) => (
        <span
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: value
              ? designTokens.colors.primary[50]
              : designTokens.colors.neutral[100],
            color: value ? designTokens.colors.primary[700] : designTokens.colors.neutral[700],
          }}
        >
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Eye size={16} />,
      label: "",
      onClick: (item: RegionRecord) =>
        (globalThis.window.location.href = `/admin-dashboard/regions/${item.code}`),
    },
    {
      icon: <Edit size={16} />,
      label: "",
      onClick: (item: RegionRecord) =>
        (globalThis.window.location.href = `/admin-dashboard/regions/${item.code}/edit`),
    },
    {
      icon: <Trash2 size={16} />,
      label: "",
      onClick: (item: RegionRecord) => openDeleteModal(item),
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

  return (
    <>
      <AdminPageShell
        title="Region Management"
        description="Manage cloud infrastructure regions and locations"
        breadcrumbs={[{ label: "Home", href: "/admin-dashboard" }, { label: "Regions" }]}
        actions={
          <Link to="/admin-dashboard/regions/create">
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
            onRowClick={(region: RegionRecord) =>
              (globalThis.window.location.href = `/admin-dashboard/regions/${region.code}`)
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
