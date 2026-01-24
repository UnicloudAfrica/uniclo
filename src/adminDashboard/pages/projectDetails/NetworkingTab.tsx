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

import VpcsContainer from "../../../shared/components/infrastructure/containers/VpcsContainer";
import SubnetsContainer from "../../../shared/components/infrastructure/containers/SubnetsContainer";
import SecurityGroupsContainer from "../../../shared/components/infrastructure/containers/SecurityGroupsContainer";
import RouteTablesContainer from "../../../shared/components/infrastructure/containers/RouteTablesContainer";
import ElasticIpsContainer from "../../../shared/components/infrastructure/containers/ElasticIpsContainer";
import NetworkInterfacesContainer from "../../../shared/components/infrastructure/containers/NetworkInterfacesContainer";
import NatGatewaysContainer from "../../../shared/components/infrastructure/containers/NatGatewaysContainer";
import InternetGatewaysContainer from "../../../shared/components/infrastructure/containers/InternetGatewaysContainer";
import NetworkAclsContainer from "../../../shared/components/infrastructure/containers/NetworkAclsContainer";
import VpcPeeringContainer from "../../../shared/components/infrastructure/containers/VpcPeeringContainer";
import LoadBalancersContainer from "../../../shared/components/infrastructure/containers/LoadBalancersContainer";
import {
  ResourceCanvas,
  ResourceSplitLayout,
} from "../../../shared/components/projects/details/ResourceLayout";

import {
  useVpcs,
  useCreateVpc,
  useDeleteVpc,
  useSubnets,
  useCreateSubnet,
  useDeleteSubnet,
  useSecurityGroups,
  useCreateSecurityGroup,
  useDeleteSecurityGroup,
  useRouteTables,
  useCreateRoute,
  useDeleteRoute,
  useElasticIps,
  useCreateElasticIp,
  useDeleteElasticIp,
  useAssociateElasticIp,
  useDisassociateElasticIp,
  useInternetGateways,
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
} from "../../../hooks/adminHooks/vpcInfraHooks";
import {
  useFetchNetworkInterfaces,
  syncNetworkInterfacesFromProvider,
} from "../../../hooks/adminHooks/networkHooks";
import {
  useLoadBalancers,
  useDeleteLoadBalancer,
} from "../../../hooks/adminHooks/loadBalancerHooks";

interface NetworkingTabProps {
  project: any;
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

  // Adapters to match shared container interfaces
  const useVpcsAdapter = (projectId: string) => {
    const query = useVpcs(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useSubnetsAdapter = (projectId: string) => {
    const query = useSubnets(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useSecurityGroupsAdapter = (projectId: string) => {
    const query = useSecurityGroups(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useRouteTablesAdapter = (projectId: string) => {
    const query = useRouteTables(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useElasticIpsAdapter = (projectId: string) => {
    const query = useElasticIps(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useFetchNetworkInterfacesAdapter = (projectId: string, region: string) => {
    const query = useFetchNetworkInterfaces(projectId, region);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useNatGatewaysAdapter = (projectId: string) => {
    const query = useNatGateways(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useInternetGatewaysAdapter = (projectId: string) => {
    const query = useInternetGateways(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useNetworkAclsAdapter = (projectId: string) => {
    const query = useNetworkAcls(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useVpcPeeringAdapter = (projectId: string) => {
    const query = useVpcPeering(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  const useLoadBalancersAdapter = (projectId: string) => {
    const query = useLoadBalancers(projectId);
    return { data: (query.data as any) || [], isLoading: query.isLoading, refetch: query.refetch };
  };

  useEffect(() => {
    if (initialResource && initialResource !== activeResource) {
      setActiveResource(initialResource);
    }
  }, [initialResource, activeResource]);

  const resources = useMemo(
    () => [
      {
        id: "vpcs",
        label: "VPCs",
        icon: Network,
        category: "Core",
        description: "Virtual networks for isolated project traffic",
        count: resourceCounts?.vpcs ?? 0,
      },
      {
        id: "subnets",
        label: "Subnets",
        icon: Hash,
        category: "Core",
        description: "Segments within VPCs for workload placement",
        count: resourceCounts?.subnets ?? 0,
      },
      {
        id: "routes",
        label: "Route Tables",
        icon: Route,
        category: "Core",
        description: "Routing rules between subnets and gateways",
        count: resourceCounts?.route_tables ?? 0,
      },
      {
        id: "sgs",
        label: "Security Groups",
        icon: Shield,
        category: "Core",
        description: "Instance-level firewall rules",
        count: resourceCounts?.security_groups ?? 0,
      },
      {
        id: "igw",
        label: "Internet Gateways",
        icon: Globe,
        category: "Connectivity",
        description: "Public ingress and egress for VPCs",
        count: resourceCounts?.internet_gateways ?? 0,
      },
      {
        id: "nat",
        label: "NAT Gateways",
        icon: Zap,
        category: "Connectivity",
        description: "Outbound access for private subnets",
        count: resourceCounts?.nat_gateways ?? 0,
      },
      {
        id: "eips",
        label: "Elastic IPs",
        icon: Link,
        category: "Connectivity",
        description: "Static public IP addresses",
        count: resourceCounts?.elastic_ips ?? 0,
      },
      {
        id: "enis",
        label: "Network Interfaces",
        icon: ArrowLeftRight,
        category: "Connectivity",
        description: "Virtual NICs attached to instances",
        count: resourceCounts?.network_interfaces ?? 0,
      },
      {
        id: "peering",
        label: "VPC Peering",
        icon: GitMerge,
        category: "Connectivity",
        description: "Private connectivity across VPCs",
        count: resourceCounts?.vpc_peering ?? 0,
      },
      {
        id: "lbs",
        label: "Load Balancers",
        icon: Layers,
        category: "Connectivity",
        description: "Distribute traffic across instances",
        count: resourceCounts?.load_balancers ?? 0,
      },
      {
        id: "acls",
        label: "Network ACLs",
        icon: Lock,
        category: "Security",
        description: "Subnet-level stateless filters",
        count: resourceCounts?.network_acls ?? 0,
      },
    ],
    [resourceCounts]
  );

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
      wrapper: ({ children, headerActions }: any) => (
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
              useList: useVpcsAdapter,
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
              useList: useSubnetsAdapter,
              useCreate: useCreateSubnet,
              useDelete: useDeleteSubnet,
              useVpcs: useVpcsAdapter,
            }}
          />
        );
      case "sgs":
        return (
          <SecurityGroupsContainer
            {...commonProps}
            hooks={{
              useList: useSecurityGroupsAdapter,
              useCreate: useCreateSecurityGroup,
              useDelete: useDeleteSecurityGroup,
              useVpcs: useVpcsAdapter,
            }}
            onNavigateToRules={(sg: any) =>
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
              useList: useRouteTablesAdapter,
              useSubnets: useSubnetsAdapter,
              useInternetGateways: useInternetGatewaysAdapter,
              useNatGateways: useNatGatewaysAdapter,
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
              useList: useElasticIpsAdapter,
              useCreate: useCreateElasticIp,
              useDelete: useDeleteElasticIp,
              useAssociate: useAssociateElasticIp,
              useDisassociate: useDisassociateElasticIp,
            }}
          />
        );
      case "enis":
        return (
          <NetworkInterfacesContainer
            {...commonProps}
            hooks={{
              useList: useFetchNetworkInterfacesAdapter,
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
              useList: useNatGatewaysAdapter,
              useCreate: useCreateNatGateway,
              useDelete: useDeleteNatGateway,
            }}
          />
        );
      case "igw":
        return (
          <InternetGatewaysContainer
            {...commonProps}
            hooks={{
              useList: useInternetGatewaysAdapter,
              useVpcs: useVpcsAdapter,
              useCreate: useCreateInternetGateway,
              useDelete: useDeleteInternetGateway,
              useAttach: useAttachInternetGateway,
              useDetach: useDetachInternetGateway,
            }}
          />
        );
      case "acls":
        return (
          <NetworkAclsContainer
            {...commonProps}
            hooks={{
              useList: useNetworkAclsAdapter,
              useVpcs: useVpcsAdapter,
              useCreate: useCreateNetworkAcl,
              useDelete: useDeleteNetworkAcl,
            }}
            onManageRules={(acl: any) =>
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
              useList: useVpcPeeringAdapter,
              useVpcs: useVpcsAdapter,
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
              useList: useLoadBalancersAdapter,
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
