import React from "react";
import ProjectInstancesOverview from "./ProjectInstancesOverview";
import ProjectNetworkResourcesCard from "./ProjectNetworkResourcesCard";
import ProjectSetupProgressCard from "./ProjectSetupProgressCard";
import ProjectQuickActionsCard from "./ProjectQuickActionsCard";
import ProjectEdgeNetworkCard from "./ProjectEdgeNetworkCard";

interface InstanceStats {
  total: number;
  running: number;
  provisioning: number;
  paymentPending: number;
}

interface Instance {
  id?: string | number;
  identifier?: string;
  name?: string;
  status?: string;
  [key: string]: any;
}

interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
  inProgress?: boolean;
}

interface NetworkStatus {
  vpc: {
    configured: boolean;
    id?: string;
    name?: string;
  };
  internet_gateway: {
    configured: boolean;
    can_enable: boolean;
  };
  subnets: {
    configured: boolean;
    can_add: boolean;
  };
  security_groups: {
    configured: boolean;
    can_add: boolean;
  };
}

interface ProjectAdvancedViewProps {
  // Project Info
  projectId: string | number;
  projectIdentifier: string;
  resolvedProjectId?: string;

  // Instances (matching ProjectInstancesOverview)
  instanceStats: InstanceStats;
  recentInstances?: Instance[];
  projectInstances?: Instance[];
  onViewInstance: (instance: Instance) => void;
  onAddInstance: () => void;
  onViewAllInstances: () => void;
  canCreateInstances?: boolean;

  // Network
  networkStatus?: NetworkStatus | null;
  vpcCount?: number;
  subnetCount?: number;
  securityGroupCount?: number;
  onViewNetworkDetails?: () => void;
  onConfigureNetwork?: () => void;
  onEnableInternet?: () => void;

  // Setup Progress
  setupSteps?: SetupStep[];
  setupProgressPercent?: number;
  onSaveConfiguration?: () => void;
  isSavingConfig?: boolean;

  // Quick Actions
  onRefresh?: () => void;
  onManageMembers?: () => void;
  onOpenConsole?: () => void;
  isRefreshing?: boolean;

  // Edge Network
  edgeNetworkConnected?: boolean;
  edgeNetworkId?: string;
  edgeNetworkName?: string;
  onManageEdgeNetwork?: () => void;
}

const ProjectAdvancedView: React.FC<ProjectAdvancedViewProps> = ({
  projectId,
  projectIdentifier,
  resolvedProjectId,
  instanceStats,
  recentInstances = [],
  projectInstances = [],
  onViewInstance,
  onAddInstance,
  onViewAllInstances,
  canCreateInstances = true,
  networkStatus,
  vpcCount = 0,
  subnetCount = 0,
  securityGroupCount = 0,
  onViewNetworkDetails,
  onConfigureNetwork,
  onEnableInternet,
  setupSteps,
  setupProgressPercent,
  onSaveConfiguration,
  isSavingConfig = false,
  onRefresh,
  onManageMembers,
  onOpenConsole,
  isRefreshing = false,
  edgeNetworkConnected = false,
  edgeNetworkId,
  edgeNetworkName,
  onManageEdgeNetwork,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column - 40% on large screens */}
      <div className="lg:col-span-5 space-y-6">
        {/* Instances Overview */}
        <ProjectInstancesOverview
          instanceStats={instanceStats}
          recentInstances={recentInstances}
          projectInstances={projectInstances}
          onViewInstance={onViewInstance}
          onAddInstance={onAddInstance}
          onViewAllInstances={onViewAllInstances}
          canCreateInstances={canCreateInstances}
          resolvedProjectId={resolvedProjectId}
        />

        {/* Network Resources */}
        <ProjectNetworkResourcesCard
          networkStatus={networkStatus}
          vpcCount={vpcCount}
          subnetCount={subnetCount}
          securityGroupCount={securityGroupCount}
          onViewDetails={onViewNetworkDetails}
          onConfigureNetwork={onConfigureNetwork}
          onEnableInternet={onEnableInternet}
        />
      </div>

      {/* Middle Column - 35% on large screens */}
      <div className="lg:col-span-4">
        <ProjectSetupProgressCard
          steps={setupSteps}
          progressPercent={setupProgressPercent}
          onSaveConfiguration={onSaveConfiguration}
          isSaving={isSavingConfig}
        />
      </div>

      {/* Right Column - 25% on large screens */}
      <div className="lg:col-span-3 space-y-6">
        {/* Quick Actions */}
        <ProjectQuickActionsCard
          projectId={projectId}
          projectIdentifier={projectIdentifier}
          onRefresh={onRefresh}
          onManageMembers={onManageMembers}
          onOpenConsole={onOpenConsole}
          isRefreshing={isRefreshing}
        />

        {/* Edge Network */}
        <ProjectEdgeNetworkCard
          isConnected={edgeNetworkConnected}
          edgeNetworkId={edgeNetworkId}
          edgeNetworkName={edgeNetworkName}
          onManage={onManageEdgeNetwork}
        />
      </div>
    </div>
  );
};

export default ProjectAdvancedView;
