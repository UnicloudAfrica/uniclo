import QuickAccessNav from "../components/quickAccessNav";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton, ModernCard, StatusPill } from "../../shared/components/ui";
import ModernTable, { Column } from "../../shared/components/ui/ModernTable";
import {
  Loader2,
  Upload,
  Settings2,
  Users,
  Building,
  Package,
  HelpCircle,
  Eye,
  Edit,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import useAuthRedirect from "../../utils/adminAuthRedirect";
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

  // Placeholder data arrays until real data is connected
  const recentPartners: Partner[] = [];
  const recentClients: Client[] = [];

  const encodeId = (id: string | number) => encodeURIComponent(btoa(String(id)));

  const handleViewPartner = (partner: Partner) => {
    if (!partner?.id) return;
    const encodedId = encodeId(partner.id);
    const encodedName = encodeURIComponent(partner.name || "");
    navigate(`/admin-dashboard/partners/details?id=${encodedId}&name=${encodedName}`);
  };

  const handleEditPartner = (partner: Partner) => {
    if (!partner?.id) return;
    const encodedId = encodeId(partner.id);
    const encodedName = encodeURIComponent(partner.name || "");
    navigate(`/admin-dashboard/partners/details?id=${encodedId}&name=${encodedName}&edit=1`);
  };

  const handleViewClient = (client: Client) => {
    if (!client?.id) return;
    const encodedId = encodeId(client.id);
    const encodedName = encodeURIComponent(client.name || "");
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${encodedName}`);
  };

  const handleEditClient = (client: Client) => {
    if (!client?.id) return;
    const encodedId = encodeId(client.id);
    const encodedName = encodeURIComponent(client.name || "");
    navigate(`/admin-dashboard/clients/details?id=${encodedId}&name=${encodedName}&edit=1`);
  };

  const headerActions = (
    <div className="ui-action-row">
      <ModernButton variant="outline" size="sm">
        <Upload className="w-4 h-4" />
        Export
      </ModernButton>
      <ModernButton variant="outline" size="sm">
        <Settings2 className="w-4 h-4" />
        Filter
      </ModernButton>
    </div>
  );

  const partnerColumns: Column<Partner>[] = [
    { key: "id", header: "Partner ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone Number" },
    { key: "clients", header: "Number of Clients", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (_: unknown, partner: Partner) => (
        <div className="ui-table-actions">
          <ModernButton
            variant="ghost"
            size="xs"
            onClick={() => handleViewPartner(partner)}
            title="View Partner"
            aria-label={`View ${partner.name}`}
          >
            <Eye size={16} />
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="xs"
            onClick={() => handleEditPartner(partner)}
            title="Edit Partner"
            aria-label={`Edit ${partner.name}`}
          >
            <Edit size={16} />
          </ModernButton>
        </div>
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
        <div className="ui-table-actions">
          <ModernButton
            variant="ghost"
            size="xs"
            onClick={() => handleViewClient(client)}
            title="View Client"
            aria-label={`View ${client.name}`}
          >
            <Eye size={16} />
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="xs"
            onClick={() => handleEditClient(client)}
            title="Edit Client"
            aria-label={`Edit ${client.name}`}
          >
            <Edit size={16} />
          </ModernButton>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 text-[var(--theme-color)] animate-spin" />
      </div>
    );
  }

  return (
    <AdminPageShell
      title="Admin Overview"
      description="Monitor tenants, clients, and infrastructure health from a single view."
      actions={headerActions}
      contentClassName="ui-page-stack"
    >
      <div className="ui-metrics-grid">
        <ModernStatsCard
          title="Total Active Partners"
          value="0"
          icon={<Building />}
          color="primary"
          description="Partners registered in the system"
        />
        <ModernStatsCard
          title="Total Active Clients"
          value="0"
          icon={<Users />}
          color="success"
          description="Active client accounts"
        />
        <ModernStatsCard
          title="Total Modules"
          value="0"
          icon={<Package />}
          color="info"
          description="Available service modules"
        />
        <ModernStatsCard
          title="Pending Tickets"
          value="0"
          icon={<HelpCircle />}
          color="warning"
          description="Support tickets awaiting response"
        />
      </div>

      <QuickAccessNav />

      <ModernCard>
        <ModernTable
          data={recentPartners}
          columns={partnerColumns}
          title="Recent Partners"
          emptyMessage="No recent partners found."
          paginated={false}
          searchable={false}
        />
      </ModernCard>

      <ModernCard>
        <ModernTable
          data={recentClients}
          columns={clientColumns}
          title="Recent Clients"
          emptyMessage="No recent clients found."
          paginated={false}
          searchable={false}
        />
      </ModernCard>
    </AdminPageShell>
  );
}
