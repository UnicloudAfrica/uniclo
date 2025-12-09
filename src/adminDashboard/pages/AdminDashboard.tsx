// @ts-nocheck
import React from "react";
import QuickAccessNav from "../components/quickAccessNav";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import ModernTable from "../../shared/components/ui/ModernTable";
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
// @ts-ignore
import useAuthRedirect from "../../utils/adminAuthRedirect";
import AdminPageShell from "../components/AdminPageShell";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";

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

  // Placeholder data arrays until real data is connected
  const recentPartners: Partner[] = [];
  const recentClients: Client[] = [];

  const headerActions = (
    <div className="flex gap-2">
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

  const partnerColumns = [
    { key: "id", header: "Partner ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone Number" },
    { key: "clients", header: "Number of Clients", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, partner: Partner) => (
        <div className="flex gap-2">
          <button
            onClick={() => console.log("View partner:", partner)}
            title="View Partner"
            className="text-slate-500 hover:text-blue-600"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => console.log("Edit partner:", partner)}
            title="Edit Partner"
            className="text-slate-500 hover:text-blue-600"
          >
            <Edit size={16} />
          </button>
        </div>
      ),
    },
  ];

  const clientColumns = [
    { key: "id", header: "Client ID", sortable: true },
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "phone", header: "Phone Number" },
    {
      key: "module",
      header: "Current Module",
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, client: Client) => (
        <div className="flex gap-2">
          <button
            onClick={() => console.log("View client:", client)}
            title="View Client"
            className="text-slate-500 hover:text-blue-600"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => console.log("Edit client:", client)}
            title="Edit Client"
            className="text-slate-500 hover:text-blue-600"
          >
            <Edit size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Admin Overview"
        description="Monitor tenants, clients, and infrastructure health from a single view."
        actions={headerActions}
        contentClassName="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernStatsCard
            title="Total Active Partners"
            value="0"
            icon={<Building />}
            color="primary"
            trend={{ value: 0, isPositive: true } as any}
            description="Partners registered in the system"
          />
          <ModernStatsCard
            title="Total Active Clients"
            value="0"
            icon={<Users />}
            color="success"
            trend={{ value: 0, isPositive: true } as any}
            description="Active client accounts"
          />
          <ModernStatsCard
            title="Total Modules"
            value="0"
            icon={<Package />}
            color="info"
            trend={{ value: 0, isPositive: true } as any}
            description="Available service modules"
          />
          <ModernStatsCard
            title="Pending Tickets"
            value="0"
            icon={<HelpCircle />}
            color="warning"
            trend={{ value: 0, isPositive: true } as any}
            description="Support tickets awaiting response"
          />
        </div>

        <QuickAccessNav />

        <ModernCard>
          <ModernTable
            data={recentPartners}
            columns={partnerColumns as any}
            title="Recent Partners"
            emptyMessage="No recent partners found."
            paginated={false}
            searchable={false}
          />
        </ModernCard>

        <ModernCard>
          <ModernTable
            data={recentClients}
            columns={clientColumns as any}
            title="Recent Clients"
            emptyMessage="No recent clients found."
            paginated={false}
            searchable={false}
          />
        </ModernCard>
      </AdminPageShell>
    </>
  );
}
