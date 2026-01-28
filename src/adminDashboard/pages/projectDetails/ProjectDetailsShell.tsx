import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  Users,
  Network,
  Database,
  Shield,
  Settings,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react";

import ResourceHeader from "./ResourceHeader";
import TeamTab from "./TeamTab";
import NetworkingTab from "./NetworkingTab";
import ComputeTab from "./ComputeTab";
import { ModernButton } from "../../../shared/components/ui";
import ProjectDetailsOverview from "../../../shared/components/projects/details/ProjectDetailsOverview";
import ToastUtils from "../../../utils/toastUtil";

interface ProjectDetailsShellProps {
  project: any;
  projectInstances: any[];
  allProjectUsers: any[];
  cloudPolicies: any[];
  resourceCounts: any;
  infraStatusData: any;
  networkData: any;
  instanceStats: any;
  canCreateInstances?: boolean;
  setupSteps: any[];
  setupProgressPercent: number;
  isProjectStatusFetching: boolean;
  isSyncingInfrastructure: boolean;
  syncInfrastructure: (payload: any) => void;
  assignPolicy: any;
  revokePolicy: any;
  handleUserAction: (user: any, actionKey: string) => Promise<void>;
  handleGenericAction: (params: any) => Promise<any>;
  refetchProjectDetails: () => Promise<any>;
  refetchProjectStatus: () => Promise<any>;
  isAssigningPolicy: boolean;
  isRevokingPolicy: boolean;
  setIsMemberModalOpen: (open: boolean) => void;
  handleInviteSubmit: (e: React.FormEvent) => Promise<void>;
  inviteForm: any;
  setInviteForm: (form: any) => void;
  formatMemberName: (user: any) => string;
  requiredActions?: any[];
  onRequiredAction?: (action: any, item: any) => void;
}

const ProjectDetailsShell: React.FC<ProjectDetailsShellProps> = ({
  project,
  projectInstances,
  allProjectUsers,
  cloudPolicies,
  resourceCounts,
  infraStatusData,
  networkData,
  instanceStats,
  canCreateInstances = true,
  setupSteps,
  setupProgressPercent,
  isProjectStatusFetching,
  isSyncingInfrastructure,
  syncInfrastructure,
  assignPolicy,
  revokePolicy,
  handleUserAction,
  handleGenericAction,
  refetchProjectDetails,
  refetchProjectStatus,
  isAssigningPolicy,
  isRevokingPolicy,
  setIsMemberModalOpen,
  handleInviteSubmit,
  inviteForm,
  setInviteForm,
  formatMemberName,
  requiredActions,
  onRequiredAction,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeNetworkingResource, setActiveNetworkingResource] = useState("vpcs");
  const [activeComputeSubView, setActiveComputeSubView] = useState<"instances" | "keypairs">(
    "instances"
  );

  const resourceHeaderStats = useMemo(() => {
    return {
      vCPUs: resourceCounts.vcpus || 0,
      ram: "4 GiB", // Simplified: needs to be derived from instances or metadata
      volumes: resourceCounts.volumes || 0,
      images: resourceCounts.images || 0,
      snapshots: resourceCounts.snapshots || 0,
      ipPoolUsed: 7, // Mocked for now to match UI blueprint
      ipPoolTotal: 124,
    };
  }, [resourceCounts]);

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "compute", label: "Compute", icon: Activity },
    { id: "networking", label: "Networking", icon: Network },
    { id: "storage", label: "Storage", icon: Database },
    { id: "team", label: "Identity & Access", icon: Users },
    { id: "limits", label: "Limits", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)]">
      <ResourceHeader project={project} resourceStats={resourceHeaderStats} />

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-[1600px] mx-auto">
          {activeTab === "overview" && (
            <ProjectDetailsOverview
              requiredActions={requiredActions}
              onRequiredAction={onRequiredAction}
              unifiedViewProps={{
                project,
                instanceStats,
                resourceCounts,
                canCreateInstances,
                networkStatus: networkData,
                setupSteps,
                setupProgressPercent,
                instances: projectInstances,
                showMemberManagement: true,
                showSyncButton: true,
                onAddInstance: () => {
                  setActiveComputeSubView("instances");
                  setActiveTab("compute");
                },
                onEnableInternet: async () => {
                  ToastUtils.info("Internet Gateway management from shell");
                },
                onManageMembers: () => setActiveTab("team"),
                onViewNetworkDetails: () => {
                  setActiveNetworkingResource("vpcs");
                  setActiveTab("networking");
                },
                onViewAllResources: () => {
                  setActiveNetworkingResource("vpcs");
                  setActiveTab("networking");
                },
                onViewKeyPairs: () => {
                  setActiveComputeSubView("keypairs");
                  setActiveTab("compute");
                },
                onViewRouteTables: () => {
                  setActiveNetworkingResource("routes");
                  setActiveTab("networking");
                },
                onViewElasticIps: () => {
                  setActiveNetworkingResource("eips");
                  setActiveTab("networking");
                },
                onViewNetworkInterfaces: () => {
                  setActiveNetworkingResource("enis");
                  setActiveTab("networking");
                },
                onSyncResources: () => syncInfrastructure({ projectId: project?.identifier }),
                onViewUsers: () => setActiveTab("team"),
                onViewSubnets: () => {
                  setActiveNetworkingResource("subnets");
                  setActiveTab("networking");
                },
                onViewSecurityGroups: () => {
                  setActiveNetworkingResource("sgs");
                  setActiveTab("networking");
                },
                onViewVpcs: () => {
                  setActiveNetworkingResource("vpcs");
                  setActiveTab("networking");
                },
                onViewNatGateways: () => {
                  setActiveNetworkingResource("nat");
                  setActiveTab("networking");
                },
                onViewInternetGateways: () => {
                  setActiveNetworkingResource("igw");
                  setActiveTab("networking");
                },
                onViewNetworkAcls: () => {
                  setActiveNetworkingResource("acls");
                  setActiveTab("networking");
                },
                onViewVpcPeering: () => {
                  setActiveNetworkingResource("peering");
                  setActiveTab("networking");
                },
                onViewLoadBalancers: () => {
                  setActiveNetworkingResource("lbs");
                  setActiveTab("networking");
                },
              }}
            />
          )}

          {activeTab === "compute" && (
            <ComputeTab
              project={project}
              initialSubView={activeComputeSubView}
              onSubViewChange={setActiveComputeSubView}
            />
          )}

          {activeTab === "team" && (
            <TeamTab
              project={project}
              allProjectUsers={allProjectUsers}
              cloudPolicies={cloudPolicies}
              assignPolicy={assignPolicy}
              revokePolicy={revokePolicy}
              handleUserAction={handleUserAction}
              refetchProjectDetails={refetchProjectDetails}
              refetchProjectStatus={refetchProjectStatus}
              isAssigningPolicy={isAssigningPolicy}
              isRevokingPolicy={isRevokingPolicy}
              setIsMemberModalOpen={setIsMemberModalOpen}
              formatMemberName={formatMemberName}
              handleInviteSubmit={handleInviteSubmit}
              inviteForm={inviteForm}
              setInviteForm={setInviteForm}
            />
          )}

          {activeTab === "networking" && (
            <NetworkingTab
              project={project}
              resourceCounts={resourceCounts}
              initialResource={activeNetworkingResource}
              onResourceChange={setActiveNetworkingResource}
            />
          )}

          {/* Placeholder Tabs */}
          {!["overview", "team", "networking"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                <LayoutDashboard className="text-gray-300" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-gray-500 text-sm max-w-md text-center">
                We're currently refactoring this module into the unified view. Check back soon for
                Zadara-style management controls!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailsShell;
