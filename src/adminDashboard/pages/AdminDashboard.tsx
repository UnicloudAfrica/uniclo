import { Activity, Building, Database, FolderKanban, MapPin, Package, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useAuthRedirect from "@/utils/adminAuthRedirect";
import {
  ModernButton,
  ModernCard,
  ModernStatsCard,
  StatusPill,
  DashboardSkeleton,
} from "@/shared/components/ui";
import ModernTable, { Column } from "@/shared/components/ui/ModernTable";
import { CommandCenterHero } from "@/shared/components/dashboard";
import { useFetchPurchasedInstances } from "@/shared/hooks/resources/instanceHooks";
import { useFetchProjects } from "@/shared/hooks/resources/projectHooks";
import {
  summarizeInstances,
  type InstanceLike,
} from "@/shared/components/instances/instanceStatus";
import useAuthStore from "@/stores/authStore";
import AdminPageShell from "../components/AdminPageShell";

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  clients: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  module: string;
}

export default function AdminDashboard() {
  const { isLoading } = useAuthRedirect();
  const navigate = useNavigate();
  const adminUser = useAuthStore((state) => state.user);

  // Real fleet + project counts. The instances endpoint returns the whole
  // fleet when per_page is 0 (BaseInstanceController only paginates when
  // per_page > 0); useFetchProjects returns the full { data, meta } envelope.
  const { data: instancesResponse } = useFetchPurchasedInstances({ per_page: 0 });
  const fleet = summarizeInstances(
    (Array.isArray((instancesResponse as { data?: unknown })?.data)
      ? (instancesResponse as { data?: unknown[] }).data
      : []) as InstanceLike[]
  );

  const { data: projectsResponse } = useFetchProjects();
  const projectResp = projectsResponse as { data?: unknown[]; meta?: { total?: number } } | undefined;
  const projectCount =
    projectResp?.meta?.total ??
    (Array.isArray(projectResp?.data) ? projectResp.data.length : 0);

  const recentPartners: Partner[] = [];
  const recentClients: Client[] = [];

  const adminFirstName =
    typeof adminUser?.name === "string" ? adminUser.name.split(" ")[0] || "Admin" : "Admin";

  const encodeId = (id: string | number) => encodeURIComponent(btoa(String(id)));

  const handleViewPartner = (partner: Partner) => {
    if (!partner?.id) return;
    const encodedId = encodeId(partner.id);
    const encodedName = encodeURIComponent(partner.name || "");
    navigate(`/admin-dashboard/partners/details?id=${encodedId}&name=${encodedName}`);
  };

  const handleViewClient = (client: Client) => {
    if (!client?.id) return;
    const encodedId = encodeId(client.id);
    const encodedName = encodeURIComponent(client.name || "");
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${encodedName}`);
  };

  const partnerColumns: Column<Partner>[] = [
    { key: "id", header: "Partner ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone Number" },
    { key: "clients", header: "Clients", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (_: unknown, partner: Partner) => (
        <ModernButton
          variant="ghost"
          size="xs"
          onClick={() => handleViewPartner(partner)}
          aria-label={`View ${partner.name}`}
        >
          View
        </ModernButton>
      ),
    },
  ];

  const clientColumns: Column<Client>[] = [
    { key: "id", header: "Client ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone Number" },
    {
      key: "module",
      header: "Current Module",
      sortable: true,
      render: (_: unknown, client: Client) => <StatusPill tone="info" label={client.module} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: unknown, client: Client) => (
        <ModernButton
          variant="ghost"
          size="xs"
          onClick={() => handleViewClient(client)}
          aria-label={`View ${client.name}`}
        >
          View
        </ModernButton>
      ),
    },
  ];

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AdminPageShell
      title="Dashboard"
      description="Sovereign · billed in naira · deployed in-region across Africa"
      contentClassName="ui-page-stack"
    >
      {/* Command Center Hero */}
      <CommandCenterHero
        greetingName={adminFirstName}
        description={
          <>
            Monitor tenants, partners, and infrastructure health from a single command center —
            billed in naira, deployed in-region across Africa.
          </>
        }
        actions={[
          {
            label: "Launch instance",
            onClick: () => navigate("/admin-dashboard/create-instance"),
            variant: "primary",
          },
          {
            label: "Create project",
            onClick: () => navigate("/admin-dashboard/projects"),
            variant: "secondary",
          },
        ]}
        chips={[
          { label: "Region", value: "Lagos · NG-1", icon: <MapPin size={12} /> },
          { label: "Instances", value: String(fleet.total), icon: <Server size={12} /> },
          { label: "Projects", value: String(projectCount), icon: <FolderKanban size={12} /> },
        ]}
      />

      {/* Stats grid — real counts from the instances + projects endpoints */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModernStatsCard
          title="Total instances"
          value={fleet.total.toLocaleString()}
          description={`${fleet.running} running`}
          icon={<Server size={24} />}
          color="info"
        />
        <ModernStatsCard
          title="Active"
          value={fleet.running.toLocaleString()}
          description={fleet.provisioning ? `${fleet.provisioning} provisioning` : "All healthy"}
          icon={<Activity size={24} />}
          color="success"
        />
        <ModernStatsCard
          title="Provisioning"
          value={fleet.provisioning.toLocaleString()}
          description={fleet.provisioning ? "Being built now" : "None in progress"}
          icon={<Database size={24} />}
          color="warning"
        />
        <ModernStatsCard
          title="Projects"
          value={projectCount.toLocaleString()}
          description="Across all regions"
          icon={<FolderKanban size={24} />}
          color="primary"
        />
      </div>

      {/* Partner / client tables */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ModernCard>
          <ModernTable
            data={recentPartners}
            columns={partnerColumns}
            title={
              <span className="flex items-center gap-2">
                <Building size={16} aria-hidden="true" />
                Recent partners
              </span>
            }
            emptyMessage="No recent partners found."
            paginated={false}
            searchable={false}
          />
        </ModernCard>

        <ModernCard>
          <ModernTable
            data={recentClients}
            columns={clientColumns}
            title={
              <span className="flex items-center gap-2">
                <Package size={16} aria-hidden="true" />
                Recent clients
              </span>
            }
            emptyMessage="No recent clients found."
            paginated={false}
            searchable={false}
          />
        </ModernCard>
      </div>

      {/* Footer activity hint */}
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-[color:var(--theme-muted-color)]">
        <Database size={12} aria-hidden="true" />
        Real-time updates · Collaboration ready · Enhanced monitoring
      </div>
    </AdminPageShell>
  );
}
