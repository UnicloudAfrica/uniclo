import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Network,
  Link,
  Shield,
  ArrowLeftRight,
  Zap,
  Globe,
  Route,
  Hash,
  Layers,
  Lock,
  GitMerge,
} from "lucide-react";

import { useProjectCapabilities } from "@/shared/hooks/resources/projectCapabilitiesHooks";
import VpcsContainer from "@/shared/components/infrastructure/containers/VpcsContainer";
import SubnetsContainer from "@/shared/components/infrastructure/containers/SubnetsContainer";
import SecurityGroupsContainer from "@/shared/components/infrastructure/containers/SecurityGroupsContainer";
import RouteTablesContainer from "@/shared/components/infrastructure/containers/RouteTablesContainer";
import ElasticIpsContainer from "@/shared/components/infrastructure/containers/ElasticIpsContainer";
import NetworkInterfacesContainer from "@/shared/components/infrastructure/containers/NetworkInterfacesContainer";
import NatGatewaysContainer from "@/shared/components/infrastructure/containers/NatGatewaysContainer";
import InternetGatewaysContainer from "@/shared/components/infrastructure/containers/InternetGatewaysContainer";
import NetworkAclsContainer from "@/shared/components/infrastructure/containers/NetworkAclsContainer";
import VpcPeeringContainer from "@/shared/components/infrastructure/containers/VpcPeeringContainer";
import LoadBalancersContainer from "@/shared/components/infrastructure/containers/LoadBalancersContainer";
import {
  ResourceCanvas,
  ResourceSplitLayout,
} from "@/shared/components/projects/details/ResourceLayout";

import {
  useCreateVpc,
  useDeleteVpc,
  useCreateSubnet,
  useDeleteSubnet,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
  useCreateRoute,
  useDeleteRoute,
  useCreateElasticIp,
  useDeleteElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
  useCreateInternetGateway,
  useDeleteInternetGateway,
  useAttachInternetGateway,
  useDetachInternetGateway,
  useNatGateways,
  useCreateNatGateway,
  useDeleteNatGateway,
  useNetworkAcls,
  useCreateNetworkAcl,
  useDeleteNetworkAcl,
  useVpcPeering,
  useCreateVpcPeering,
  useDeleteVpcPeering,
  useAcceptVpcPeering,
  useRejectVpcPeering,
  useAssociateRouteTable,
  useDisassociateRouteTable,
} from "@/shared/hooks/vpcInfraHooks";
import {
  useFetchElasticIps,
  useFetchIgws,
  useFetchRouteTables,
  useFetchSecurityGroups,
  useFetchSubnets,
  useFetchVpcs,
} from "@/shared/hooks/resources";
import {
  useFetchNetworkInterfaces,
  syncNetworkInterfacesFromProvider,
} from "@/hooks/adminHooks/networkHooks";
import { useLoadBalancers, useDeleteLoadBalancer } from "@/hooks/adminHooks/loadBalancerHooks";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  Vpc,
  Subnet,
  SecurityGroup,
  RouteTable,
  ElasticIp,
  NatGateway,
  InternetGateway,
  NetworkAcl,
  LoadBalancer,
  VpcPeeringConnection,
} from "@/shared/components/infrastructure/types";
import type { NetworkInterface } from "@/shared/components/infrastructure/NetworkInterfacesTable";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdaptedListHook<T = unknown> = (
  projectId: string,
  region?: string,
  options?: unknown
) => UseQueryResult<T[], Error>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdaptedListHook2Args<T = unknown> = (
  projectId: string,
  region: string,
  options?: unknown
) => UseQueryResult<T[], Error>;

interface NetworkingTabProps {
  project: unknown;
  resourceCounts?: {
    vpcs?: number;
    subnets?: number;
    security_groups?: number;
    route_tables?: number;
    elastic_ips?: number;
    network_interfaces?: number;
    nat_gateways?: number;
    internet_gateways?: number;
    network_acls?: number;
    vpc_peering?: number;
    load_balancers?: number;
  };
  initialResource?: string;
  onResourceChange?: (resourceId: string) => void;
}

const NetworkingTab: React.FC<NetworkingTabProps> = ({
  project,
  resourceCounts,
  initialResource,
  onResourceChange,
}) => {
  const [activeResource, setActiveResource] = useState(initialResource || "vpcs");
  const navigate = useNavigate();

  const projectId = project?.identifier;
  const region = project?.region;

  // Normalize a query result into a simple { data[], isLoading, isFetching, refetch } shape
  const adaptQuery = (query: {
    data: unknown;
    isLoading: boolean;
    isFetching?: boolean;
    refetch: () => void;
  }) => ({
    data: Array.isArray(query.data) ? query.data : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching ?? query.isLoading,
    refetch: query.refetch,
  });

  const normalizeProviderListItem = <T extends Record<string, unknown>>(item: T) => {
    const localId = item.id == null ? "" : String(item.id);
    const providerId =
      item.provider_resource_id == null ? localId : String(item.provider_resource_id);

    return {
      ...item,
      id: providerId || localId,
      local_id: localId || undefined,
      provider_resource_id: providerId || localId,
    };
  };

  const adaptMappedQuery = <T extends Record<string, unknown>>(
    query: { data: unknown; isLoading: boolean; isFetching?: boolean; refetch: () => void },
    mapper: (item: T) => Record<string, unknown> = normalizeProviderListItem
  ) => ({
    data: Array.isArray(query.data)
      ? query.data.map((item) => (item && typeof item === "object" ? mapper(item as T) : item))
      : [],
    isLoading: query.isLoading,
    isFetching: query.isFetching ?? query.isLoading,
    refetch: query.refetch,
  });

  const buildSharedListParams = (pid: string, resourceRegion?: string) => ({
    projectId: pid,
    region: resourceRegion ?? region,
    extra: { refresh: true },
  });

  function useVpcsAdapter(pid: string, resourceRegion?: string, options?: { enabled?: boolean }) {
    return adaptMappedQuery(
      useFetchVpcs(buildSharedListParams(pid, resourceRegion), {
        enabled: options?.enabled ?? Boolean(pid && (resourceRegion ?? region)),
      })
    );
  }

  function useSubnetsAdapter(
    pid: string,
    resourceRegion?: string,
    options?: { enabled?: boolean }
  ) {
    return adaptMappedQuery(
      useFetchSubnets(buildSharedListParams(pid, resourceRegion), {
        enabled: options?.enabled ?? Boolean(pid && (resourceRegion ?? region)),
      })
    );
  }

  function useSecurityGroupsAdapter(
    pid: string,
    resourceRegion?: string,
    options?: { enabled?: boolean }
  ) {
    return adaptMappedQuery(
      useFetchSecurityGroups(buildSharedListParams(pid, resourceRegion), {
        enabled: options?.enabled ?? Boolean(pid && (resourceRegion ?? region)),
      })
    );
  }

  function useRouteTablesAdapter(
    pid: string,
    resourceRegion?: string,
    options?: { enabled?: boolean }
  ) {
    return adaptMappedQuery(
      useFetchRouteTables(buildSharedListParams(pid, resourceRegion), {
        enabled: options?.enabled ?? Boolean(pid && (resourceRegion ?? region)),
      })
    );
  }

  function useElasticIpsAdapter(
    pid: string,
    resourceRegion?: string,
    options?: { enabled?: boolean }
  ) {
    return adaptMappedQuery(
      useFetchElasticIps(buildSharedListParams(pid, resourceRegion), {
        enabled: options?.enabled ?? Boolean(pid && (resourceRegion ?? region)),
      })
    );
  }

  function useFetchNetworkInterfacesAdapter(pid: string, r: string) {
    return adaptQuery(useFetchNetworkInterfaces(pid, r));
  }

  function useNatGatewaysAdapter(pid: string) {
    return adaptQuery(useNatGateways(pid));
  }

  function useInternetGatewaysAdapter(
    pid: string,
    resourceRegion?: string,
    options?: { enabled?: boolean }
  ) {
    return adaptMappedQuery(
      useFetchIgws(buildSharedListParams(pid, resourceRegion), {
        enabled: options?.enabled ?? Boolean(pid && (resourceRegion ?? region)),
      })
    );
  }

  function useNetworkAclsAdapter(pid: string) {
    return adaptQuery(useNetworkAcls(pid));
  }

  function useVpcPeeringAdapter(pid: string) {
    return adaptQuery(useVpcPeering(pid));
  }

  function useLoadBalancersAdapter(pid: string) {
    return adaptQuery(useLoadBalancers(pid));
  }

  useEffect(() => {
    if (initialResource && initialResource !== activeResource) {
      setActiveResource(initialResource);
    }
  }, [initialResource, activeResource]);

  // Resource catalog. The `capability` key maps each resource to the
  // backend capability flag (see ProjectCapabilitiesController). Items
  // whose capability is false for the current project's provider are
  // filtered out below — that's how Nobus projects don't see VPC Peering,
  // NAT Gateway, Network ACL, Load Balancer tabs (Nobus has no equivalent).
  const allResources = useMemo(
    () => [
      {
        id: "vpcs",
        label: "VPCs",
        icon: Network,
        category: "Core",
        description: "Your isolated virtual network",
        count: resourceCounts?.vpcs ?? 0,
        capability: "supportsVpc",
      },
      {
        id: "subnets",
        label: "Subnets",
        icon: Hash,
        category: "Core",
        description: "Network segments within your VPC",
        count: resourceCounts?.subnets ?? 0,
        capability: "supportsSubnets",
      },
      {
        id: "routes",
        label: "Route Tables",
        icon: Route,
        category: "Core",
        description: "Traffic routing rules between networks",
        count: resourceCounts?.route_tables ?? 0,
        capability: "supportsRouteTables",
      },
      {
        id: "sgs",
        label: "Security Groups",
        icon: Shield,
        category: "Core",
        description: "Firewall rules for your servers",
        count: resourceCounts?.security_groups ?? 0,
        capability: "supportsSecurityGroups",
      },
      {
        id: "igw",
        label: "Internet Gateways",
        icon: Globe,
        category: "Connectivity",
        description: "Connect your VPC to the internet",
        count: resourceCounts?.internet_gateways ?? 0,
        capability: "supportsInternetGateway",
      },
      {
        id: "nat",
        label: "NAT Gateways",
        icon: Zap,
        category: "Connectivity",
        description: "Let private servers access the internet",
        count: resourceCounts?.nat_gateways ?? 0,
        capability: "supportsNatGateway",
      },
      {
        id: "eips",
        label: "Elastic IPs",
        icon: Link,
        category: "Connectivity",
        description: "Static public IP addresses for your resources",
        count: resourceCounts?.elastic_ips ?? 0,
        capability: "supportsElasticIp",
      },
      {
        id: "enis",
        label: "Network Interfaces",
        icon: ArrowLeftRight,
        category: "Connectivity",
        description: "Virtual network cards attached to instances",
        count: resourceCounts?.network_interfaces ?? 0,
        capability: "supportsNetworkInterfaces",
      },
      {
        id: "peering",
        label: "VPC Peering",
        icon: GitMerge,
        category: "Connectivity",
        description: "Connect two VPCs together privately",
        count: resourceCounts?.vpc_peering ?? 0,
        capability: "supportsVpcPeering",
      },
      {
        id: "lbs",
        label: "Load Balancers",
        icon: Layers,
        category: "Connectivity",
        description: "Distribute traffic across multiple servers",
        count: resourceCounts?.load_balancers ?? 0,
        capability: "supportsLoadBalancer",
      },
      {
        id: "acls",
        label: "Network ACLs",
        icon: Lock,
        category: "Security",
        description: "Subnet-level firewall rules",
        count: resourceCounts?.network_acls ?? 0,
        capability: "supportsNetworkAcl",
      },
    ],
    [resourceCounts]
  );

  // Filter out resources unsupported by this project's provider.
  // While capabilities are loading, show everything (better UX than a
  // flash of partial nav). Once loaded, hide the unsupported ones.
  const { data: capabilities } = useProjectCapabilities(projectId);
  const resources = useMemo(() => {
    if (!capabilities) return allResources;
    return allResources.filter((r) => capabilities.features?.[r.capability] !== false);
  }, [allResources, capabilities]);

  const activeResourceConfig = resources.find((resource) => resource.id === activeResource);

  const handleSelectResource = (resourceId: string) => {
    setActiveResource(resourceId);
    onResourceChange?.(resourceId);
  };

  const renderResource = () => {
    const commonProps = {
      hierarchy: "admin" as const,
      projectId,
      region,
      wrapper: ({
        children,
        headerActions,
      }: {
        children: React.ReactNode;
        headerActions?: React.ReactNode;
      }) => (
        <ResourceCanvas
          icon={activeResourceConfig?.icon || Network}
          title={activeResourceConfig?.label || "Resources"}
          description={activeResourceConfig?.description || "Manage project connectivity"}
          count={activeResourceConfig?.count}
          actions={headerActions}
        >
          {children}
        </ResourceCanvas>
      ),
    };

    switch (activeResource) {
      case "vpcs":
        return (
          <VpcsContainer
            {...commonProps}
            hooks={{
              useList: useVpcsAdapter as AdaptedListHook<Vpc>,
              useCreate: useCreateVpc,
              useDelete: useDeleteVpc,
            }}
          />
        );
      case "subnets":
        return (
          <SubnetsContainer
            {...commonProps}
            hooks={{
              useList: useSubnetsAdapter as AdaptedListHook<Subnet>,
              useCreate: useCreateSubnet,
              useDelete: useDeleteSubnet,
              useVpcs: useVpcsAdapter as AdaptedListHook<Vpc>,
            }}
          />
        );
      case "sgs":
        return (
          <SecurityGroupsContainer
            {...commonProps}
            hooks={{
              useList: useSecurityGroupsAdapter as AdaptedListHook<SecurityGroup>,
              useCreate: useCreateSecurityGroup as unknown, // mutation payload shape mismatch (description optional vs required)
              useDelete: useDeleteSecurityGroup,
              useVpcs: useVpcsAdapter as AdaptedListHook<Vpc>,
            }}
            onNavigateToRules={(sg) =>
              navigate(
                `/admin-dashboard/infrastructure/security-group-rules?project=${projectId}&region=${region}&sg=${sg.id}&name=${encodeURIComponent(sg.name || "Security Group")}`
              )
            }
          />
        );
      case "routes":
        return (
          <RouteTablesContainer
            {...commonProps}
            hooks={{
              useList: useRouteTablesAdapter as AdaptedListHook<RouteTable>,
              useSubnets: useSubnetsAdapter as AdaptedListHook<Subnet>,
              useInternetGateways: useInternetGatewaysAdapter as AdaptedListHook<InternetGateway>,
              useNatGateways: useNatGatewaysAdapter as AdaptedListHook<NatGateway>,
              useCreate: useCreateRoute,
              useDelete: useDeleteRoute,
              useAssociate: useAssociateRouteTable,
              useDisassociate: useDisassociateRouteTable,
            }}
          />
        );
      case "eips":
        return (
          <ElasticIpsContainer
            {...commonProps}
            hooks={{
              useList: useElasticIpsAdapter as AdaptedListHook<ElasticIp>,
              useCreate: useCreateElasticIp as unknown,
              useDelete: useDeleteElasticIp,
              useAssociate: useAssociateElasticIp as unknown,
              useDisassociate: useDisassociateElasticIp,
            }}
          />
        );
      case "enis":
        return (
          <NetworkInterfacesContainer
            {...commonProps}
            hooks={{
              useList: useFetchNetworkInterfacesAdapter as AdaptedListHook2Args<NetworkInterface>,
              onSync: projectId
                ? () =>
                    syncNetworkInterfacesFromProvider({
                      project_id: projectId,
                      region,
                    })
                : undefined,
            }}
          />
        );
      case "nat":
        return (
          <NatGatewaysContainer
            {...commonProps}
            hooks={{
              useList: useNatGatewaysAdapter as AdaptedListHook<NatGateway>,
              useCreate: useCreateNatGateway as unknown,
              useDelete: useDeleteNatGateway,
            }}
          />
        );
      case "igw":
        return (
          <InternetGatewaysContainer
            {...commonProps}
            hooks={{
              useList: useInternetGatewaysAdapter as AdaptedListHook<InternetGateway>,
              useVpcs: useVpcsAdapter as AdaptedListHook<Vpc>,
              useCreate: useCreateInternetGateway as unknown,
              useDelete: useDeleteInternetGateway as unknown,
              useAttach: useAttachInternetGateway as unknown,
              useDetach: useDetachInternetGateway as unknown,
            }}
          />
        );
      case "acls":
        return (
          <NetworkAclsContainer
            {...commonProps}
            hooks={{
              useList: useNetworkAclsAdapter as AdaptedListHook<NetworkAcl>,
              useVpcs: useVpcsAdapter as AdaptedListHook<Vpc>,
              useCreate: useCreateNetworkAcl,
              useDelete: useDeleteNetworkAcl,
            }}
            onManageRules={(acl) =>
              navigate(
                `/admin-dashboard/infrastructure/network-acl-rules?project=${projectId}&region=${region}&acl=${acl.id}&name=${encodeURIComponent(acl.name || "ACL")}`
              )
            }
          />
        );
      case "peering":
        return (
          <VpcPeeringContainer
            {...commonProps}
            hooks={{
              useList: useVpcPeeringAdapter as unknown as (
                projectId: string,
                region?: string
              ) => {
                data: VpcPeeringConnection[];
                isLoading: boolean;
                isFetching?: boolean;
                refetch: () => void;
              },
              useVpcs: useVpcsAdapter as unknown as (
                projectId: string,
                region?: string
              ) => { data: Vpc[] },
              useCreate: useCreateVpcPeering,
              useAccept: useAcceptVpcPeering,
              useReject: useRejectVpcPeering,
              useDelete: useDeleteVpcPeering,
            }}
          />
        );
      case "lbs":
        return (
          <LoadBalancersContainer
            {...commonProps}
            hooks={{
              useList: useLoadBalancersAdapter as unknown as (
                projectId: string,
                region?: string
              ) => {
                data: LoadBalancer[];
                isLoading: boolean;
                isFetching?: boolean;
                refetch: () => void;
              },
              useDelete: useDeleteLoadBalancer,
            }}
          />
        );
      default:
        return (
          <ResourceCanvas
            title="Resource View"
            description="Select a resource to manage its configuration."
          >
            <div className="py-16 text-center text-gray-500">
              View for {activeResource} is under construction.
            </div>
          </ResourceCanvas>
        );
    }
  };

  return (
    <ResourceSplitLayout
      navTitle="Networking Resources"
      items={resources}
      activeId={activeResource}
      onSelect={handleSelectResource}
    >
      {renderResource()}
    </ResourceSplitLayout>
  );
};

export default NetworkingTab;
