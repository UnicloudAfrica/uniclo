import {
  ArrowLeftRight,
  GitMerge,
  Globe,
  Hash,
  Layers,
  Link,
  Lock,
  Network,
  Route,
  Shield,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ResourceNavItem } from "./ResourceLayout";
import type { ResourceCounts } from "./ProjectUnifiedView";

export type NetworkingResourceId =
  | "vpcs"
  | "subnets"
  | "routes"
  | "sgs"
  | "igw"
  | "nat"
  | "eips"
  | "enis"
  | "peering"
  | "lbs"
  | "acls";

export interface NetworkingResourceDefinition {
  id: NetworkingResourceId;
  label: string;
  icon: LucideIcon;
  category: string;
  description: string;
}

export const NETWORKING_RESOURCE_DEFS: NetworkingResourceDefinition[] = [
  {
    id: "vpcs",
    label: "VPCs",
    icon: Network,
    category: "Core",
    description: "Virtual networks for isolated project traffic",
  },
  {
    id: "subnets",
    label: "Subnets",
    icon: Hash,
    category: "Core",
    description: "Segments within VPCs for workload placement",
  },
  {
    id: "routes",
    label: "Route Tables",
    icon: Route,
    category: "Core",
    description: "Routing rules between subnets and gateways",
  },
  {
    id: "sgs",
    label: "Security Groups",
    icon: Shield,
    category: "Core",
    description: "Instance-level firewall rules",
  },
  {
    id: "igw",
    label: "Internet Gateways",
    icon: Globe,
    category: "Connectivity",
    description: "Public ingress and egress for VPCs",
  },
  {
    id: "nat",
    label: "NAT Gateways",
    icon: Zap,
    category: "Connectivity",
    description: "Outbound access for private subnets",
  },
  {
    id: "eips",
    label: "Elastic IPs",
    icon: Link,
    category: "Connectivity",
    description: "Static public IP addresses",
  },
  {
    id: "enis",
    label: "Network Interfaces",
    icon: ArrowLeftRight,
    category: "Connectivity",
    description: "Virtual NICs attached to instances",
  },
  {
    id: "peering",
    label: "VPC Peering",
    icon: GitMerge,
    category: "Connectivity",
    description: "Private connectivity across VPCs",
  },
  {
    id: "lbs",
    label: "Load Balancers",
    icon: Layers,
    category: "Connectivity",
    description: "Distribute traffic across instances",
  },
  {
    id: "acls",
    label: "Network ACLs",
    icon: Lock,
    category: "Security",
    description: "Subnet-level stateless filters",
  },
];

const COUNT_KEY_MAP: Record<NetworkingResourceId, keyof ResourceCounts> = {
  vpcs: "vpcs",
  subnets: "subnets",
  routes: "route_tables",
  sgs: "security_groups",
  igw: "internet_gateways",
  nat: "nat_gateways",
  eips: "elastic_ips",
  enis: "network_interfaces",
  peering: "vpc_peering",
  lbs: "load_balancers",
  acls: "network_acls",
};

export const getNetworkingResourceMeta = (id: string): NetworkingResourceDefinition | undefined => {
  return NETWORKING_RESOURCE_DEFS.find((item) => item.id === id);
};

export const buildNetworkingItems = (counts: ResourceCounts): ResourceNavItem[] => {
  return NETWORKING_RESOURCE_DEFS.map((item) => ({
    ...item,
    count: counts[COUNT_KEY_MAP[item.id]] as number | undefined,
  }));
};
