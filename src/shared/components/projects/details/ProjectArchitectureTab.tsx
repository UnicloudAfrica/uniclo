import React from "react";
import { Layers } from "lucide-react";
import { InfrastructureVisualization } from "./infrastructure-viz";
import type { ProjectUnifiedViewProps } from "./ProjectUnifiedView";
import type { ResourceTypeId } from "./infrastructure-viz";

export interface ProjectArchitectureTabProps {
  /**
   * Same shape `ProjectDetailsOverview` already builds via
   * `useProjectDetailsAdapter` — we just forward what's needed for the viz so
   * the dedicated Architecture tab and the embedded Overview viz stay in sync.
   */
  unifiedViewProps: ProjectUnifiedViewProps;
}

/**
 * Dedicated Architecture tab — promotes the existing rich
 * `InfrastructureVisualization` (used inside `ProjectUnifiedView` on the
 * Overview tab) to a top-level focal view so users land on the project graph
 * without having to scroll past alerts and getting-started cards first.
 *
 * The visualization itself already supports three view modes (building
 * metaphor / layered diagram / infographic cards), a click-to-explain
 * resource panel, and live status from `instanceStats` + `resourceCounts` +
 * `networkStatus`. Re-use, don't reimplement — this tab is just the focal
 * frame.
 */
const ProjectArchitectureTab: React.FC<ProjectArchitectureTabProps> = ({ unifiedViewProps }) => {
  const {
    project,
    vpcs = [],
    subnets = [],
    igws = [],
    instances = [],
    resourceCounts,
    instanceStats,
    networkStatus,
    isProvisioning = false,
    onViewVpcs,
    onViewSubnets,
    onViewSecurityGroups,
    onViewRouteTables,
    onViewElasticIps,
    onViewNetworkInterfaces,
    onViewNatGateways,
    onViewInternetGateways,
    onViewNetworkAcls,
    onViewVpcPeering,
    onViewLoadBalancers,
  } = unifiedViewProps;

  // Click → jump to the matching resource list. Keeps the "click anything to
  // drill in" flow consistent with how the Overview viz behaves.
  const handleResourceClick = (typeId: ResourceTypeId) => {
    const handlers: Record<string, (() => void) | undefined> = {
      vpcs: onViewVpcs,
      subnets: onViewSubnets,
      security_groups: onViewSecurityGroups,
      route_tables: onViewRouteTables,
      elastic_ips: onViewElasticIps,
      network_interfaces: onViewNetworkInterfaces,
      nat_gateways: onViewNatGateways,
      internet_gateways: onViewInternetGateways,
      network_acls: onViewNetworkAcls,
      vpc_peering: onViewVpcPeering,
      load_balancers: onViewLoadBalancers,
    };
    handlers[typeId]?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Layers className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Project Architecture</h3>
          <p className="mt-1 text-xs text-gray-500">
            Visual map of every resource in this project — VPCs, subnets, instances, gateways,
            load balancers, and how they connect. Click a resource to learn what it does and
            jump to its management screen. Switch view modes with the toggle in the top-right of
            the canvas.
          </p>
        </div>
      </div>

      <InfrastructureVisualization
        providerFeatures={project.provider_features}
        vpcs={vpcs}
        subnets={subnets}
        igws={igws}
        instances={instances}
        resourceCounts={resourceCounts}
        instanceStats={instanceStats}
        networkStatus={networkStatus}
        isProvisioning={isProvisioning}
        onResourceClick={handleResourceClick}
      />
    </div>
  );
};

export default ProjectArchitectureTab;
