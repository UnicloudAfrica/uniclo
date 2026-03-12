/**
 * InfrastructureVisualization.types.ts
 *
 * Shared types for the infrastructure visualization component system.
 */
import type { ResourceTypeId } from "./resourceExplanations";

// ---------------------------------------------------------------------------
// View Modes
// ---------------------------------------------------------------------------

export type ViewMode = "building" | "layered" | "infographic";

// ---------------------------------------------------------------------------
// Props for the top-level InfrastructureVisualization component
// ---------------------------------------------------------------------------

export interface InfraVizProps {
  // Infrastructure arrays
  vpcs: Array<{ id?: string | number; name?: string }>;
  subnets: Array<{ id?: string | number; name?: string; cidr?: string }>;
  igws: Array<{
    id?: string | number;
    name?: string;
    state?: string;
    status?: string;
    provider_resource_id?: string;
  }>;
  instances: Array<{ id?: string | number; name?: string; status?: string }>;

  // Aggregate counts
  resourceCounts: {
    vpcs: number;
    subnets: number;
    security_groups: number;
    route_tables?: number;
    elastic_ips?: number;
    network_interfaces?: number;
    nat_gateways?: number;
    network_acls?: number;
    vpc_peering?: number;
    internet_gateways?: number;
    load_balancers?: number;
    [key: string]: number | undefined;
  };

  instanceStats: {
    total: number;
    running: number;
    stopped: number;
    provisioning?: number;
  };

  networkStatus?: {
    vpc?: { configured: boolean; id?: string; name?: string };
    internet_gateway?: { configured: boolean; can_enable?: boolean };
    subnets?: { configured: boolean };
    security_groups?: { configured: boolean };
  };

  // State
  activeStepId?: string;
  isProvisioning?: boolean;

  // Cloud provider (e.g. "zadara" or "nobus") – used to filter unsupported resources
  provider?: string;

  // Callback when user clicks "Go to resource" in explanation panel
  onResourceClick?: (resourceType: ResourceTypeId) => void;
}

// ---------------------------------------------------------------------------
// Selected Resource
// ---------------------------------------------------------------------------

export interface SelectedResource {
  typeId: ResourceTypeId;
  instanceId?: string | number;
}

// ---------------------------------------------------------------------------
// Props for each individual view component
// ---------------------------------------------------------------------------

export interface ViewProps {
  data: InfraVizProps;
  selectedResource: SelectedResource | null;
  onSelectResource: (resource: SelectedResource | null) => void;
  highlightedTypes: ResourceTypeId[];
}
