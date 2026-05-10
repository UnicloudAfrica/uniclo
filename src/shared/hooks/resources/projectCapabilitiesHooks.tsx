/**
 * Project capability hooks + components.
 *
 * The backend exposes a per-project capability matrix at:
 *   GET /admin/v1/projects/{identifier}/capabilities
 *
 * The SPA reads this once when entering a project page and uses it to
 * decide which UI sections to render. This is how we avoid showing
 * "VPC Peering" / "Network ACL" / "Load Balancer" tabs on Nobus
 * projects (where those concepts don't exist) without breaking the
 * Zadara experience.
 *
 * Usage:
 *
 *   const { data: caps } = useProjectCapabilities(projectIdentifier);
 *   if (caps?.features?.supportsVpcPeering) {
 *     return <VpcPeeringTab />;
 *   }
 *
 * Or via the <ProviderGate> component:
 *
 *   <ProviderGate projectId={id} feature="supportsVpcPeering">
 *     <VpcPeeringTab />
 *   </ProviderGate>
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";

export interface ProjectCapabilities {
  /** Provider key, e.g. "zadara", "nobus", "openstack" */
  provider: string;
  /** Region code the project lives in */
  region: string;
  /**
   * Coarse-grained core capabilities. Mirrors the
   * `App\Cloud\Contracts\ProviderCapabilities` value object on the backend.
   */
  core: {
    compute: boolean;
    network: boolean;
    storage: boolean;
    discovery?: boolean;
    identity?: boolean;
  };
  /**
   * Fine-grained feature flags. Values are TRUE only when the project's
   * provider can actually perform the operation. Used to show/hide
   * specific UI sections — VPC Peering, Network ACLs, Load Balancers,
   * NAT Gateways, etc.
   */
  features: Record<string, boolean>;
  /** Set when the backend couldn't resolve the driver — UI should degrade gracefully. */
  _warning?: string;
}

interface ApiEnvelope<T> {
  data: T;
}

/**
 * Fetch capability matrix for a project. Cached for the session — these
 * don't change at runtime. Stale time is effectively forever.
 */
export const useProjectCapabilities = (projectIdentifier: string | null | undefined) => {
  const { adminApi } = useApiContext();

  return useQuery({
    queryKey: ["project-capabilities", projectIdentifier],
    queryFn: async () => {
      if (!projectIdentifier) {
        return null;
      }
      const res = (await adminApi.get(
        `/projects/${projectIdentifier}/capabilities`
      )) as ApiEnvelope<ProjectCapabilities>;
      return res.data;
    },
    enabled: Boolean(projectIdentifier),
    // Capabilities are static per provider+region — only refetch on
    // hard reload. 1-hour stale time is more than enough.
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
};

interface ProviderGateProps {
  projectId: string | null | undefined;
  /**
   * The feature flag key (matches `features` map on the backend).
   * Common values:
   *   supportsVpc, supportsSubnets, supportsSecurityGroups,
   *   supportsInternetGateway, supportsRouteTables, supportsNatGateway,
   *   supportsElasticIp, supportsFloatingIp, supportsKeypairs,
   *   supportsVolumes, supportsSnapshots, supportsInstances,
   *   supportsLoadBalancer, supportsVpcPeering, supportsNetworkAcl,
   *   supportsVpcEndpoints, supportsAutoScaling
   */
  feature: string;
  /** Render this when feature is supported. */
  children: React.ReactNode;
  /** Render this when feature is NOT supported. Default: nothing. */
  fallback?: React.ReactNode;
  /**
   * What to do while capabilities are loading. Default: render `children`
   * optimistically — better UX than a flash of nothing for users on the
   * common (Zadara) provider that supports everything.
   */
  loading?: "show" | "hide" | React.ReactNode;
}

/**
 * Conditional renderer that shows children only when the project's
 * provider supports a given feature. Use this to hide tabs/buttons/
 * sections that don't apply to the current provider.
 *
 * @example
 *   <ProviderGate projectId={project.identifier} feature="supportsVpcPeering">
 *     <NavLink to="vpc-peering">VPC Peering</NavLink>
 *   </ProviderGate>
 */
export const ProviderGate: React.FC<ProviderGateProps> = ({
  projectId,
  feature,
  children,
  fallback = null,
  loading = "show",
}) => {
  const { data, isLoading } = useProjectCapabilities(projectId);

  if (isLoading) {
    if (loading === "show") return <>{children}</>;
    if (loading === "hide") return <>{fallback}</>;
    return <>{loading}</>;
  }

  // No data → defensive: show children (better to over-show than to
  // hide a working feature because of a network blip).
  if (!data) {
    return <>{children}</>;
  }

  const supported = Boolean(data.features?.[feature]);
  return <>{supported ? children : fallback}</>;
};

/**
 * Hook variant for imperative checks inside component bodies — useful
 * when the gate logic is more complex than a single boolean.
 *
 * @example
 *   const supportsLB = useProviderSupports(projectId, "supportsLoadBalancer");
 *   const supportsPeering = useProviderSupports(projectId, "supportsVpcPeering");
 */
export const useProviderSupports = (
  projectIdentifier: string | null | undefined,
  feature: string
): boolean | undefined => {
  const { data } = useProjectCapabilities(projectIdentifier);
  if (!data) return undefined;
  return Boolean(data.features?.[feature]);
};
