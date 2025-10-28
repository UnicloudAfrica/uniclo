import React, { useState } from "react";
import QuickAccessNav from "../components/quickAccessNav";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
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
import useAuthRedirect from "../../utils/adminAuthRedirect";
import AdminPageShell from "../components/AdminPageShell";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";

export default function AdminDashboard() {
  const { isLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Placeholder data arrays until real data is connected
  const recentPartners = [];
  const recentClients = [];

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

  const metrics = [
    {
      label: "Total Active Partners",
      value: "0",
    },
    {
      label: "Total Active Clients",
      value: "0",
    },
    { label: "Total Modules", value: "0" },
    { label: "Pending Tickets", value: "0" },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
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
            trend="neutral"
            description="Partners registered in the system"
          />
          <ModernStatsCard
            title="Total Active Clients"
            value="0"
            icon={<Users />}
            color="success"
            trend="neutral"
            description="Active client accounts"
          />
          <ModernStatsCard
            title="Total Modules"
            value="0"
            icon={<Package />}
            color="info"
            trend="neutral"
            description="Available service modules"
          />
          <ModernStatsCard
            title="Pending Tickets"
            value="0"
            icon={<HelpCircle />}
            color="warning"
            trend="neutral"
            description="Support tickets awaiting response"
          />
        </div>

        <QuickAccessNav />

        <ModernCard>
          <ModernTable
            title="Recent Partners"
            data={recentPartners}
            columns={[
              { key: "id", header: "Partner ID" },
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone Number" },
              { key: "clients", header: "Number of Clients" },
            ]}
            actions={[
              {
                label: "View",
                icon: <Eye size={16} />,
                onClick: (partner) => console.log("View partner:", partner),
              },
              {
                label: "Edit",
                icon: <Edit size={16} />,
                onClick: (partner) => console.log("Edit partner:", partner),
              },
            ]}
            searchable
            exportable
            paginated
            pageSize={5}
            emptyMessage="No recent partners found."
          />
        </ModernCard>

        <ModernCard>
          <ModernTable
            title="Recent Clients"
            data={recentClients}
            columns={[
              { key: "id", header: "Client ID" },
              { key: "name", header: "Name" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Phone Number" },
              {
                key: "module",
                header: "Current Module",
                render: (value) => (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {value}
                  </span>
                ),
              },
            ]}
            actions={[
              {
                label: "View",
                icon: <Eye size={16} />,
                onClick: (client) => console.log("View client:", client),
              },
              {
                label: "Edit",
                icon: <Edit size={16} />,
                onClick: (client) => console.log("Edit client:", client),
              },
            ]}
            searchable
            exportable
            paginated
            pageSize={5}
            emptyMessage="No recent clients found."
          />
        </ModernCard>
      </AdminPageShell>
    </>
  );
}
