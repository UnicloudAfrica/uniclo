import React, { useState } from "react";
import QuickAccessNav from "../components/quickAccessNav";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  MoreVertical,
  Settings2,
  Upload,
  Users,
  Building,
  Package,
  HelpCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import useAuthRedirect from "../../utils/adminAuthRedirect";
import AdminPageShell from "../components/AdminPageShell";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";

export default function AdminDashboard() {
  const { isLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Empty data arrays to show "No data found"

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

  // Original data for reference if needed later
  const metrics = [
    {
      label: "Total Active Partners",
      value: "0",
      // upward: "0",
    },
    {
      label: "Total Active Clients",
      value: "0",
      // downward: "0",
    },
    { label: "Total Modules", value: "0" },
    { label: "Pending Tickets", value: "0" },
  ];
  const toggleMobileMenu = () =>
    setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  /*
    
    const recentPartners = [
    {
      id: "PTL-001",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "20",
    },
    {
      id: "PTL-002",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "2",
    },
    {
      id: "PTL-003",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "15",
    },
    {
      id: "PTL-004",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "4",
    },
    {
      id: "PTL-005",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      clients: "1",
    },
  ];

  const toggleMobileMenu = () =>
    setIsMobileMenuOpen((previous) => !previous);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const recentClients = [
    {
      id: "CTL-001",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      module: "Current Module",
    },
    {
      id: "CTL-002",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      module: "Z4 Compute Instances",
    },
    {
      id: "CTL-003",
      name: "Sumo Partners",
      email: "email@gmail.com",
      phone: "081112233",
      module: "Z6 Compute Instances",
    },
  ];
  */

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
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
            icon={<Building width={20} height={20} />}
            color="primary"
            trend="neutral"
            description="Partners registered in the system"
          />
          <ModernStatsCard
            title="Total Active Clients"
            value="0"
            icon={<Users width={20} height={20} />}
            color="primary"
            trend="neutral"
            description="Active client accounts"
          />
          <ModernStatsCard
            title="Total Modules"
            value="0"
            icon={<Package width={20} height={20} />}
            color="primary"
            trend="neutral"
            description="Available service modules"
          />
          <ModernStatsCard
            title="Pending Tickets"
            value="0"
            icon={<HelpCircle width={20} height={20} />}
            color="primary"
            trend="neutral"
            description="Support tickets awaiting response"
          />
        </div>

      <QuickAccessNav />

<<<<<<< HEAD
        {/* Recent Partners Table */}
        <div className="mb-8">
          <ModernTable
            title="Recent Partners"
            data={recentPartners}
            columns={[
              {
                key: "id",
                header: "Partner ID",
              },
              {
                key: "name",
                header: "Name",
              },
              {
                key: "email",
                header: "Email",
              },
              {
                key: "phone",
                header: "Phone Number",
              },
              {
                key: "clients",
                header: "Number of Clients",
              },
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
            searchable={true}
            exportable={true}
            paginated={true}
            pageSize={5}
            emptyMessage="No recent partners found."
          />
        </div>

        {/* Recent Clients Table */}
        <div className="w-full">
          <ModernTable
            title="Recent Clients"
            data={recentClients}
            columns={[
              {
                key: "id",
                header: "Client ID",
              },
              {
                key: "name",
                header: "Name",
              },
              {
                key: "email",
                header: "Email",
              },
              {
                key: "phone",
                header: "Phone Number",
              },
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
            searchable={true}
            exportable={true}
            paginated={true}
            pageSize={5}
            emptyMessage="No recent clients found."
          />
        </div>
      </main>
=======
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
>>>>>>> b587e2a (web)
    </>
  );
}
