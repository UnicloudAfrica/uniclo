5; // @ts-nocheck
import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, Server, Plus, Activity, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import { ModernStatsCard, ModernButton, ModernCard } from "../../shared/components/ui";
import { useFetchClients } from "../../hooks/clientHooks";
import { useFetchTenantProjects } from "../../hooks/tenantHooks/projectHooks";

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch Data
  const { data: clients, isLoading: clientsLoading } = useFetchClients();
  const { data: projects, isLoading: projectsLoading } = useFetchTenantProjects();

  // Calculate Stats
  const clientCount = clients?.length || 0;
  const projectCount = projects?.length || 0;

  // Calculate active instances across all projects
  const activeInstancesCount =
    projects?.reduce((acc: number, project: any) => {
      return acc + (project.instances_count || 0);
    }, 0) || 0;

  const quickActions = [
    {
      title: "Add Client",
      description: "Invite a new client to your workspace.",
      icon: <Users size={20} />,
      action: () => navigate("/dashboard/clients/new"),
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Create Project",
      description: "Start a new cloud project.",
      icon: <Server size={20} />,
      action: () => navigate("/dashboard/projects/create"),
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Deploy Instance",
      description: "Launch a new compute instance.",
      icon: <Zap size={20} />,
      action: () => navigate("/dashboard/create-instance"),
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <TenantPageShell
      title="Dashboard"
      description="Overview of your cloud resources and client activities."
      contentClassName="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ModernStatsCard
          title="Total Clients"
          value={clientCount}
          icon={<Users size={24} />}
          trend="neutral"
          color="primary"
          loading={clientsLoading}
        />
        <ModernStatsCard
          title="Active Projects"
          value={projectCount}
          icon={<Server size={24} />}
          trend="neutral"
          color="info"
          loading={projectsLoading}
        />
        <ModernStatsCard
          title="Running Instances"
          value={activeInstancesCount}
          icon={<Activity size={24} />}
          trend="neutral"
          color="success"
          loading={projectsLoading}
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <ModernCard
              key={index}
              className="group cursor-pointer hover:border-blue-200 transition-all duration-200 hover:shadow-md"
              onClick={action.action}
              noPadding
            >
              <div className="p-6 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${action.bg} ${action.color}`}>{action.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all"
                />
              </div>
            </ModernCard>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder (Future Expansion) */}
      {/* 
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <ModernButton variant="ghost" size="sm" onClick={() => navigate('/dashboard/clients')}>View All</ModernButton>
        </div>
        <ModernCard>
             <div className="p-8 text-center text-gray-500 text-sm">
                Activity feed coming soon.
             </div>
        </ModernCard>
      </div> 
      */}
    </TenantPageShell>
  );
};

export default Dashboard;
