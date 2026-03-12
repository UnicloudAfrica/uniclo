import { useCallback, useEffect, useState } from "react";
import { useFetchNetworks, useFetchNetworkInterfaces } from "@/hooks/adminHooks/networkHooks";
import { useFetchKeyPairs } from "@/shared/hooks/keyPairsHooks";
import { useFetchSecurityGroups } from "@/shared/hooks/resources/securityGroupHooks";
import { useFetchSubnets } from "@/shared/hooks/resources/subnetHooks";
import { useFetchIgws } from "@/shared/hooks/resources/igwHooks";
import { useFetchRouteTables } from "@/shared/hooks/resources/routeTableHooks";
import { useFetchElasticIps } from "@/shared/hooks/resources/eipHooks";
import { useFetchVpcs } from "@/shared/hooks/resources/vpcHooks";
import { useNatGateways, useNetworkAcls, useVpcPeering } from "@/shared/hooks/vpcInfraHooks";
import { useLoadBalancers } from "@/hooks/adminHooks/loadBalancerHooks";

// Infrastructure status component shape
interface InfraComponent {
  count?: number;
  status?: string;
}

interface UseResourceDataFetchingParams {
  project: Record<string, any> | undefined;
  infraComponents: Record<string, InfraComponent>;
  getInfraCount: (key: string) => number | undefined;
}

export interface ResourceDataFetchingResult {
  resourceCounts: Record<string, number>;
  updateResourceCount: (resource: string, count: number) => void;
}

export function useResourceDataFetching({
  project,
  infraComponents: _infraComponents,
  getInfraCount,
}: UseResourceDataFetchingParams): ResourceDataFetchingResult {
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});

  const updateResourceCount = useCallback((resource: string, count: number) => {
    setResourceCounts((prev) => {
      if (prev[resource] === count) {
        return prev;
      }
      return { ...prev, [resource]: count };
    });
  }, []);

  // Reset resource counts when project changes
  const projectId = project?.identifier || project?.id;
  useEffect(() => {
    setResourceCounts({});
  }, [projectId]);

  const { data: networksData } = useFetchNetworks(project?.identifier, project?.region, {
    enabled: Boolean(project?.identifier && project?.region),
  });

  const { data: keyPairsData } = useFetchKeyPairs(
    project?.identifier || project?.id,
    project?.region,
    {
      enabled: Boolean((project?.identifier || project?.id) && project?.region),
    }
  );
  const { data: securityGroupsData } = useFetchSecurityGroups(
    {
      projectId: project?.identifier,
      region: project?.region,
      extra: { refresh: true },
    },
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: subnetsData } = useFetchSubnets(
    {
      projectId: project?.identifier,
      region: project?.region,
      extra: { refresh: true },
    },
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: igwsData } = useFetchIgws(
    {
      projectId: project?.identifier,
      region: project?.region,
      extra: { refresh: true },
    },
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: routeTablesData } = useFetchRouteTables(
    {
      projectId: project?.identifier,
      region: project?.region,
      extra: { refresh: true },
    },
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: networkInterfacesData } = useFetchNetworkInterfaces(
    project?.identifier,
    project?.region,
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: elasticIpsData } = useFetchElasticIps(
    {
      projectId: project?.identifier,
      region: project?.region,
      extra: { refresh: true },
    },
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: vpcsData } = useFetchVpcs(
    {
      projectId: project?.identifier,
      region: project?.region,
      extra: { refresh: true },
    },
    { enabled: Boolean(project?.identifier && project?.region) }
  );
  const { data: natGatewaysData } = useNatGateways(project?.identifier);
  const { data: networkAclsData } = useNetworkAcls(project?.identifier);
  const { data: vpcPeeringData } = useVpcPeering(project?.identifier);
  const { data: loadBalancersData } = useLoadBalancers(project?.identifier);

  useEffect(() => {
    if (Array.isArray(networksData)) {
      updateResourceCount("networks", networksData.length);
    }
  }, [networksData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(vpcsData)) {
      updateResourceCount("vpcs", vpcsData.length);
    } else {
      const vpcCount = getInfraCount("vpc");
      if (vpcCount !== undefined) {
        updateResourceCount("vpcs", vpcCount);
      }
    }
  }, [vpcsData, getInfraCount, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(keyPairsData)) {
      updateResourceCount("keyPairs", keyPairsData.length);
      updateResourceCount("key_pairs", keyPairsData.length);
    }
  }, [keyPairsData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(securityGroupsData)) {
      updateResourceCount("security_groups", securityGroupsData.length);
    } else {
      const sgCount = getInfraCount("security_groups");
      if (sgCount !== undefined) updateResourceCount("security_groups", sgCount);
    }
  }, [securityGroupsData, getInfraCount, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(subnetsData)) {
      updateResourceCount("subnets", subnetsData.length);
    } else {
      const subnetCount = getInfraCount("subnets");
      if (subnetCount !== undefined) updateResourceCount("subnets", subnetCount);
    }
  }, [subnetsData, getInfraCount, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(igwsData)) {
      updateResourceCount("internet_gateways", igwsData.length);
    }
  }, [igwsData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(routeTablesData)) {
      updateResourceCount("routeTables", routeTablesData.length);
      updateResourceCount("route_tables", routeTablesData.length);
    }
  }, [routeTablesData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(networkInterfacesData)) {
      updateResourceCount("enis", networkInterfacesData.length);
      updateResourceCount("network_interfaces", networkInterfacesData.length);
    }
  }, [networkInterfacesData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(elasticIpsData)) {
      updateResourceCount("eips", elasticIpsData.length);
      updateResourceCount("elastic_ips", elasticIpsData.length);
    }
  }, [elasticIpsData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(natGatewaysData)) {
      updateResourceCount("nat_gateways", natGatewaysData.length);
    }
  }, [natGatewaysData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(networkAclsData)) {
      updateResourceCount("network_acls", networkAclsData.length);
    }
  }, [networkAclsData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(vpcPeeringData)) {
      updateResourceCount("vpc_peering", vpcPeeringData.length);
    }
  }, [vpcPeeringData, updateResourceCount]);

  useEffect(() => {
    if (Array.isArray(loadBalancersData)) {
      updateResourceCount("load_balancers", loadBalancersData.length);
    }
  }, [loadBalancersData, updateResourceCount]);

  return {
    resourceCounts,
    updateResourceCount,
  };
}
