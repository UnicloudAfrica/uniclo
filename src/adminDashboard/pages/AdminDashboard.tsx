import {
  Building,
  Database,
  HardDrive,
  HelpCircle,
  MapPin,
  Package,
  Server,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import useAuthRedirect from "@/utils/adminAuthRedirect";
import { ModernButton, ModernCard, StatusPill, DashboardSkeleton } from "@/shared/components/ui";
import ModernTable, { Column } from "@/shared/components/ui/ModernTable";
import {
  CommandCenterHero,
  MiniSparklineStatCard,
  StorageForecastBanner,
} from "@/shared/components/dashboard";
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

const SAMPLE_INSTANCES_TREND = [22, 24, 26, 25, 28, 30, 33, 35, 36, 37, 38];
const SAMPLE_STORAGE_TREND = [9.1, 9.4, 9.8, 10.3, 10.7, 11.1, 11.5, 11.8, 12.0, 12.2, 12.4];
const SAMPLE_SPEND_TREND = [320, 312, 305, 298, 295, 292, 289, 287, 286, 285, 284];
const SAMPLE_TICKETS_TREND = [4, 5, 5, 6, 4, 3, 3, 2, 2, 2, 2];

export default function AdminDashboard() {
  const { isLoading } = useAuthRedirect();
  const navigate = useNavigate();
  const adminUser = useAuthStore((state) => state.user);

  const recentPartners: Partner[] = [];
  const recentClients: Client[] = [];

  const adminFirstName =
    typeof adminUser?.name === "string"
      ? adminUser.name.split(" ")[0] || "Admin"
      : "Admin";

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
      description="Sovereign · billed in naira · Lagos NG-1"
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
          { label: "Naira spend (mo)", value: "₦284,500", icon: <Wallet size={12} /> },
          { label: "Trial credits", value: "₦12,500", icon: <Sparkles size={12} /> },
          { label: "Support tier", value: "Premium", icon: <ShieldCheck size={12} /> },
        ]}
      />

      {/* Storage forecast banner */}
      <StorageForecastBanner
        tone="info"
        message={
          <>
            <strong>Storage forecast:</strong> Silo bucket{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[12px]">
              archive-q1
            </code>{" "}
            reaches 80% capacity in <strong>~14 days</strong> at current pace.
          </>
        }
        action={{
          label: "View forecast",
          onClick: () => navigate("/admin-dashboard/object-storage"),
        }}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniSparklineStatCard
          title="Active instances"
          value="38"
          delta="+5"
          trend="up"
          series={SAMPLE_INSTANCES_TREND}
          icon={<Server size={16} />}
          description={`vs ${SAMPLE_INSTANCES_TREND[0]} last month`}
          onClick={() => navigate("/admin-dashboard/instances")}
        />
        <MiniSparklineStatCard
          title="Storage used"
          value="12.4 TB"
          delta="+1.2 TB"
          trend="up"
          series={SAMPLE_STORAGE_TREND}
          icon={<HardDrive size={16} />}
          description="Across 18 buckets"
          onClick={() => navigate("/admin-dashboard/object-storage")}
        />
        <MiniSparklineStatCard
          title="Naira spend (mo)"
          value="₦284,500"
          delta="-4%"
          trend="down"
          goodWhenUp={false}
          series={SAMPLE_SPEND_TREND}
          icon={<Wallet size={16} />}
          description="Trending down — nice!"
          onClick={() => navigate("/admin-dashboard/billing")}
        />
        <MiniSparklineStatCard
          title="Open tickets"
          value="2"
          trend="flat"
          series={SAMPLE_TICKETS_TREND}
          icon={<HelpCircle size={16} />}
          description="Both responded to within SLA"
          onClick={() => navigate("/admin-dashboard/tickets")}
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
