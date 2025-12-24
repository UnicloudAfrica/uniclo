import React from "react";
import ComputeResourcesCard from "./ComputeResourcesCard";
import NetworkConfigurationCard from "./NetworkConfigurationCard";
import AdvancedQuickActionsCard from "./AdvancedQuickActionsCard";
import SetupProgressCard from "./SetupProgressCard";
import ResourceSummaryCard from "./ResourceSummaryCard";

interface SetupStep {
  id: string;
  label: string;
  status: "completed" | "pending" | "not_started";
  description?: string;
}

interface AdvancedTabLayoutProps {
  // Compute
  totalInstances: number;
  runningInstances: number;
  stoppedInstances: number;
  onAddInstance: () => void;

  // Network
  vpcCount: number;
  subnetCount: number;
  securityGroupCount: number;
  hasInternetGateway: boolean;
  onEnableInternet: () => void;
  onViewNetworkDetails?: () => void;
  isEnablingInternet?: boolean;

  // Quick Actions
  onManageMembers: () => void;
  onSyncResources: () => void;
  edgeNetworkConnected: boolean;
  edgeNetworkName?: string;
  isSyncing?: boolean;

  // Setup Progress
  setupSteps?: SetupStep[];
  setupProgressPercent?: number;
  onCompleteSetup?: () => void;

  // Resource Summary
  keyPairs: number;
  routeTables: number;
  elasticIps: number;
  networkInterfaces: number;
  onViewAllResources?: () => void;
}

const AdvancedTabLayout: React.FC<AdvancedTabLayoutProps> = ({
  totalInstances,
  runningInstances,
  stoppedInstances,
  onAddInstance,
  vpcCount,
  subnetCount,
  securityGroupCount,
  hasInternetGateway,
  onEnableInternet,
  onViewNetworkDetails,
  isEnablingInternet,
  onManageMembers,
  onSyncResources,
  edgeNetworkConnected,
  edgeNetworkName,
  isSyncing,
  setupSteps,
  setupProgressPercent,
  onCompleteSetup,
  keyPairs,
  routeTables,
  elasticIps,
  networkInterfaces,
  onViewAllResources,
}) => {
  return (
    <div className="space-y-6">
      {/* Row 1 - Three Equal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ComputeResourcesCard
          totalInstances={totalInstances}
          runningInstances={runningInstances}
          stoppedInstances={stoppedInstances}
          onAddInstance={onAddInstance}
        />

        <NetworkConfigurationCard
          vpcCount={vpcCount}
          subnetCount={subnetCount}
          securityGroupCount={securityGroupCount}
          hasInternetGateway={hasInternetGateway}
          onEnableInternet={onEnableInternet}
          onViewDetails={onViewNetworkDetails}
          isEnabling={isEnablingInternet}
        />

        <AdvancedQuickActionsCard
          onManageMembers={onManageMembers}
          onSyncResources={onSyncResources}
          edgeNetworkConnected={edgeNetworkConnected}
          edgeNetworkName={edgeNetworkName}
          isSyncing={isSyncing}
        />
      </div>

      {/* Row 2 - Setup Progress (60%) + Resource Summary (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SetupProgressCard
            steps={setupSteps || []}
            progressPercent={setupProgressPercent}
            onCompleteSetup={onCompleteSetup}
          />
        </div>

        <div className="lg:col-span-2">
          <ResourceSummaryCard
            keyPairs={keyPairs}
            routeTables={routeTables}
            elasticIps={elasticIps}
            networkInterfaces={networkInterfaces}
            onViewAll={onViewAllResources}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedTabLayout;
