import React from "react";
import ComputeResourcesCard from "./ComputeResourcesCard";
import NetworkConfigurationCard from "./NetworkConfigurationCard";
import AdvancedQuickActionsCard from "./AdvancedQuickActionsCard";
import SetupProgressCard from "./SetupProgressCard";
import ResourceSummaryCard from "./ResourceSummaryCard";
import ProjectDetailsHero from "./ProjectDetailsHero";

// TypeScript interfaces for reusability across Admin/Tenant/Client
export interface ProjectData {
  id: string;
  identifier: string;
  name: string;
  status: string;
  region?: string;
  region_name?: string;
  provider?: string;
  created_at?: string;
  mode?: string;
  vpc_enabled_at?: string;
}

export interface InstanceStats {
  total: number;
  running: number;
  stopped: number;
  provisioning?: number;
}

export interface ResourceCounts {
  vpcs: number;
  subnets: number;
  security_groups: number;
  key_pairs?: number;
  route_tables?: number;
  elastic_ips?: number;
  network_interfaces?: number;
  nat_gateways?: number;
  network_acls?: number;
  vpc_peering?: number;
  internet_gateways?: number;
  load_balancers?: number;
  users?: number;
}

export interface IGWDetails {
  id?: string;
  name?: string;
  external_id?: string;
  state?: string;
  created_at?: string;
}

export interface NetworkStatus {
  vpc?: { configured: boolean; id?: string; name?: string };
  internet_gateway?: { configured: boolean; can_enable?: boolean; details?: IGWDetails | null };
  subnets?: { configured: boolean };
  security_groups?: { configured: boolean };
}

export interface SetupStep {
  id: string;
  label: string;
  status: "completed" | "pending" | "not_started" | "failed";
  description?: string;
  updated_at?: string;
}

import ProjectTopologyGraph from "./ProjectTopologyGraph";

export interface ProjectUnifiedViewProps {
  // Core data
  project: ProjectData;
  instanceStats: InstanceStats;
  resourceCounts: ResourceCounts;
  canCreateInstances?: boolean;
  networkStatus?: NetworkStatus;
  setupSteps?: SetupStep[];
  setupProgressPercent?: number;

  // Infrastructure Data for Graph
  vpcs?: any[];
  subnets?: any[];
  igws?: any[];
  instances?: any[];

  // Edge network
  edgeNetworkConnected?: boolean;
  edgeNetworkName?: string;

  // Callbacks ...
  onAddInstance: () => void;
  onEnableInternet: () => Promise<void>;
  onManageMembers: () => void;
  onSyncResources: () => void;
  onViewNetworkDetails?: () => void;
  onCompleteSetup?: () => void;
  onViewAllResources?: () => void;
  onViewKeyPairs?: () => void;
  onViewRouteTables?: () => void;
  onViewElasticIps?: () => void;
  onViewNetworkInterfaces?: () => void;
  onViewSubnets?: () => void;
  onViewSecurityGroups?: () => void;
  onViewVpcs?: () => void;
  onViewNatGateways?: () => void;
  onViewNetworkAcls?: () => void;
  onViewVpcPeering?: () => void;
  onViewInternetGateways?: () => void;
  onViewLoadBalancers?: () => void;
  onViewUsers?: () => void;

  // Loading states ...
  isEnablingInternet?: boolean;
  isProvisioning?: boolean;
  isSyncing?: boolean;
  isLoading?: boolean;

  // Feature flags ...
  showMemberManagement?: boolean;
  showSyncButton?: boolean;
  showHero?: boolean;
}

const ProjectUnifiedView: React.FC<ProjectUnifiedViewProps> = ({
  project,
  instanceStats,
  resourceCounts,
  canCreateInstances = true,
  networkStatus,
  setupSteps,
  setupProgressPercent,
  vpcs = [],
  subnets = [],
  igws = [],
  instances = [],
  edgeNetworkConnected = false,
  edgeNetworkName,
  onAddInstance,
  onEnableInternet,
  onManageMembers,
  onSyncResources,
  onViewNetworkDetails,
  onCompleteSetup,
  onViewAllResources,
  onViewKeyPairs,
  onViewRouteTables,
  onViewElasticIps,
  onViewNetworkInterfaces,
  onViewSubnets,
  onViewSecurityGroups,
  onViewVpcs,
  onViewNatGateways,
  onViewNetworkAcls,
  onViewVpcPeering,
  onViewInternetGateways,
  onViewLoadBalancers,
  onViewUsers,
  isEnablingInternet = false,
  isProvisioning = false,
  isSyncing = false,
  isLoading = false,
  showMemberManagement = true,
  showSyncButton = true,
  showHero = true,
}) => {
  const fallbackIgw = Array.isArray(igws) && igws.length > 0 ? igws[0] : null;
  const fallbackIgwDetails = fallbackIgw
    ? {
        id: fallbackIgw.id ?? fallbackIgw.provider_resource_id,
        name: fallbackIgw.name ?? fallbackIgw.label,
        external_id: fallbackIgw.provider_resource_id ?? fallbackIgw.external_id,
        state: fallbackIgw.state ?? fallbackIgw.status,
        created_at: fallbackIgw.created_at,
      }
    : null;

  const hasInternetGateway =
    Boolean(networkStatus?.internet_gateway?.configured) ||
    Boolean(fallbackIgw) ||
    (typeof resourceCounts.internet_gateways === "number" && resourceCounts.internet_gateways > 0);

  const igwDetails = networkStatus?.internet_gateway?.details ?? fallbackIgwDetails;

  const activeStep = setupSteps?.find((s) => s.status === "pending");

  return (
    <div className="space-y-6">
      {/* Row 1 - Three Equal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ComputeResourcesCard
          totalInstances={instanceStats.total}
          runningInstances={instanceStats.running}
          stoppedInstances={instanceStats.stopped}
          onAddInstance={onAddInstance}
          isLoading={isLoading}
          canCreateInstances={canCreateInstances}
        />

        <NetworkConfigurationCard
          vpcCount={resourceCounts.vpcs}
          subnetCount={resourceCounts.subnets}
          securityGroupCount={resourceCounts.security_groups}
          hasInternetGateway={hasInternetGateway}
          igwDetails={igwDetails}
          onEnableInternet={onEnableInternet}
          onViewDetails={onViewNetworkDetails}
          isEnabling={isEnablingInternet}
        />

        <AdvancedQuickActionsCard
          onManageMembers={showMemberManagement ? onManageMembers : () => {}}
          onSyncResources={showSyncButton ? onSyncResources : () => {}}
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
            isLoading={isProvisioning}
          />
        </div>

        <div className="lg:col-span-2">
          <ResourceSummaryCard
            vpcs={resourceCounts.vpcs || 0}
            subnets={resourceCounts.subnets || 0}
            securityGroups={resourceCounts.security_groups || 0}
            keyPairs={resourceCounts.key_pairs || 0}
            routeTables={resourceCounts.route_tables || 0}
            elasticIps={resourceCounts.elastic_ips || 0}
            networkInterfaces={resourceCounts.network_interfaces || 0}
            natGateways={resourceCounts.nat_gateways || 0}
            networkAcls={resourceCounts.network_acls || 0}
            vpcPeering={resourceCounts.vpc_peering || 0}
            internetGateways={resourceCounts.internet_gateways || 0}
            loadBalancers={resourceCounts.load_balancers || 0}
            users={resourceCounts.users || 0}
            onViewAll={onViewAllResources}
            onViewVpcs={onViewVpcs}
            onViewSubnets={onViewSubnets}
            onViewSecurityGroups={onViewSecurityGroups}
            onViewKeyPairs={onViewKeyPairs}
            onViewRouteTables={onViewRouteTables}
            onViewElasticIps={onViewElasticIps}
            onViewNetworkInterfaces={onViewNetworkInterfaces}
            onViewNatGateways={onViewNatGateways}
            onViewNetworkAcls={onViewNetworkAcls}
            onViewVpcPeering={onViewVpcPeering}
            onViewInternetGateways={onViewInternetGateways}
            onViewLoadBalancers={onViewLoadBalancers}
            onViewUsers={onViewUsers}
          />
        </div>
      </div>

      {/* Row 3 - Interactive Topology (Wide) */}
      <div className="grid grid-cols-1 gap-6">
        <ProjectTopologyGraph
          vpc={vpcs[0]}
          subnets={subnets}
          igw={igws[0]}
          instances={instances}
          activeStepId={activeStep?.id}
        />
      </div>
    </div>
  );
};

export default ProjectUnifiedView;
