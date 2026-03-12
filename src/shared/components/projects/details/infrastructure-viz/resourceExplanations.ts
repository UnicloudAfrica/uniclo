/**
 * resourceExplanations.ts
 *
 * Static data model for all 12 cloud infrastructure resource types.
 * Each entry provides plain-English explanations, building metaphors,
 * key facts, layer grouping, and related resources.
 *
 * Reuses icon/color mapping from ResourceSummaryCard for visual consistency.
 */
import {
  Layers,
  Network,
  Shield,
  Route,
  Globe,
  Cable,
  Globe2,
  ShieldCheck,
  GitMerge,
  Zap,
  Server,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isFeatureSupported } from "@/utils/featureGating";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResourceTypeId =
  | "vpcs"
  | "subnets"
  | "security_groups"
  | "route_tables"
  | "elastic_ips"
  | "network_interfaces"
  | "nat_gateways"
  | "internet_gateways"
  | "network_acls"
  | "vpc_peering"
  | "load_balancers"
  | "instances";

export type InfraLayer = "connectivity" | "network" | "security" | "compute";

export interface ResourceExplanation {
  id: ResourceTypeId;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  explanation: string;
  buildingMetaphor: string;
  keyFacts: string[];
  layer: InfraLayer;
  relatedResources: ResourceTypeId[];
}

// ---------------------------------------------------------------------------
// Resource Explanations
// ---------------------------------------------------------------------------

export const RESOURCE_EXPLANATIONS: Record<ResourceTypeId, ResourceExplanation> = {
  vpcs: {
    id: "vpcs",
    label: "Virtual Private Clouds",
    icon: Layers,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    explanation:
      "A VPC is your own private section of the cloud, completely isolated from other users. " +
      "Think of it as renting an entire office building where only you control who enters and what happens inside. " +
      "Every resource you create (servers, databases, etc.) lives inside a VPC. " +
      "You define the IP address range and network rules.",
    buildingMetaphor:
      "This is like the entire office building. It has its own address, its own lobby, " +
      "and its own security desk. Nobody from outside can wander in without permission.",
    keyFacts: [
      "Each VPC has its own IP address range (CIDR block)",
      "Resources in different VPCs are isolated by default",
      "You typically have one VPC per project or environment",
    ],
    layer: "network",
    relatedResources: ["subnets", "internet_gateways", "route_tables", "security_groups"],
  },

  subnets: {
    id: "subnets",
    label: "Subnets",
    icon: Network,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
    explanation:
      "A subnet is a smaller network segment inside your VPC. " +
      "You split your VPC into subnets to organize resources and control traffic flow. " +
      "Some subnets are 'public' (can reach the internet) and others are 'private' (internal only). " +
      "Each subnet lives in a specific availability zone for reliability.",
    buildingMetaphor:
      "This is like a floor in your building. The ground floor (public subnet) has a front door " +
      "to the street, while upper floors (private subnets) can only be reached via internal elevators.",
    keyFacts: [
      "Each subnet gets a subset of the VPC's IP range",
      "Public subnets route traffic through an Internet Gateway",
      "Private subnets use NAT Gateways for outbound-only internet",
    ],
    layer: "network",
    relatedResources: ["vpcs", "route_tables", "network_acls", "nat_gateways"],
  },

  security_groups: {
    id: "security_groups",
    label: "Security Groups",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-50",
    explanation:
      "A security group acts as a virtual firewall for your instances. " +
      "It controls which traffic is allowed in (inbound) and out (outbound). " +
      "Rules are defined by protocol, port, and source/destination. " +
      "By default, all inbound traffic is blocked and all outbound is allowed.",
    buildingMetaphor:
      "This is like the security guard at each room's door. They check everyone's badge " +
      "and only let in visitors on the approved list. Different rooms can have different guards with different rules.",
    keyFacts: [
      "Stateful: if you allow inbound traffic, the response is automatically allowed out",
      "You can reference other security groups as sources",
      "Changes take effect immediately without restarting instances",
    ],
    layer: "security",
    relatedResources: ["instances", "network_interfaces", "load_balancers"],
  },

  route_tables: {
    id: "route_tables",
    label: "Route Tables",
    icon: Route,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    explanation:
      "A route table contains rules that determine where network traffic is directed. " +
      "Each subnet is associated with a route table that tells it how to reach other networks. " +
      "For example, one rule might say 'send internet traffic to the Internet Gateway'. " +
      "Without a route, traffic simply cannot flow to its destination.",
    buildingMetaphor:
      "This is like the directory sign in the lobby. It tells visitors: " +
      "'For the internet, go through the front door. For the private lab, take the back elevator.' " +
      "Every floor (subnet) follows its own set of directions.",
    keyFacts: [
      "Each subnet must be associated with exactly one route table",
      "The 'local' route allows communication within the VPC automatically",
      "Adding a route to an Internet Gateway makes a subnet public",
    ],
    layer: "network",
    relatedResources: ["subnets", "internet_gateways", "nat_gateways", "vpcs"],
  },

  elastic_ips: {
    id: "elastic_ips",
    label: "Elastic IPs",
    icon: Globe,
    color: "text-green-500",
    bgColor: "bg-green-50",
    explanation:
      "An Elastic IP is a static public IP address you can assign to your instance. " +
      "Unlike regular public IPs which change when you stop/start, an Elastic IP stays the same. " +
      "This is useful when you need a permanent address for DNS or whitelisting. " +
      "You are charged when an Elastic IP is allocated but not attached to a running instance.",
    buildingMetaphor:
      "This is like having a permanent phone number for your office. " +
      "Even if you move desks (restart the server), people can still reach you at the same number.",
    keyFacts: [
      "Persists across instance stops and starts",
      "Can be quickly remapped to a different instance for failover",
      "Unused Elastic IPs incur charges to discourage waste",
    ],
    layer: "connectivity",
    relatedResources: ["instances", "network_interfaces", "nat_gateways"],
  },

  network_interfaces: {
    id: "network_interfaces",
    label: "Network Interfaces",
    icon: Cable,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    explanation:
      "A network interface is a virtual network card attached to an instance. " +
      "It has a private IP address, one or more security groups, and optionally a public IP. " +
      "Instances can have multiple network interfaces for advanced networking. " +
      "Think of it as the Ethernet port that connects your server to the network.",
    buildingMetaphor:
      "This is like the Ethernet jack on the wall of each room. " +
      "Plug in a cable (attach to an instance) and you're connected to the building's network. " +
      "Some rooms have multiple jacks for connecting to different networks.",
    keyFacts: [
      "Every instance has at least one primary network interface",
      "Additional interfaces can be attached for multi-homed setups",
      "Security groups are applied at the interface level",
    ],
    layer: "network",
    relatedResources: ["instances", "subnets", "security_groups", "elastic_ips"],
  },

  nat_gateways: {
    id: "nat_gateways",
    label: "NAT Gateways",
    icon: Globe2,
    color: "text-teal-500",
    bgColor: "bg-teal-50",
    explanation:
      "A NAT Gateway allows instances in a private subnet to connect to the internet " +
      "for things like software updates, while preventing the internet from initiating connections back in. " +
      "It translates private IP addresses to a public IP for outbound traffic only. " +
      "This gives your private servers internet access without exposing them.",
    buildingMetaphor:
      "This is like a mail room in the basement. People inside the building can send letters " +
      "out to the world, but nobody outside can send mail directly to a specific person. " +
      "All outgoing mail goes through the mail room's return address.",
    keyFacts: [
      "Provides outbound-only internet access for private subnets",
      "Requires an Elastic IP for its public-facing address",
      "Charged per hour and per GB of data processed",
    ],
    layer: "connectivity",
    relatedResources: ["subnets", "elastic_ips", "route_tables"],
  },

  internet_gateways: {
    id: "internet_gateways",
    label: "Internet Gateways",
    icon: Globe,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    explanation:
      "An Internet Gateway is the front door of your VPC to the public internet. " +
      "Without it, nothing inside your VPC can communicate with the outside world. " +
      "It handles both inbound and outbound internet traffic for public subnets. " +
      "Each VPC can have at most one Internet Gateway attached.",
    buildingMetaphor:
      "This is the main entrance door of the building. Without it, the building is completely sealed. " +
      "Open it, and visitors (internet traffic) can come in through the lobby, " +
      "and tenants can walk out to the street.",
    keyFacts: [
      "One per VPC; horizontally scaled and highly available",
      "Must be referenced in a route table for traffic to flow",
      "No bandwidth constraints; scales automatically",
    ],
    layer: "connectivity",
    relatedResources: ["vpcs", "route_tables", "subnets"],
  },

  network_acls: {
    id: "network_acls",
    label: "Network ACLs",
    icon: ShieldCheck,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    explanation:
      "A Network ACL is an optional layer of security at the subnet level. " +
      "Unlike security groups (which protect individual instances), ACLs protect entire subnets. " +
      "They have numbered rules evaluated in order, and they are stateless " +
      "(you must explicitly allow both inbound and outbound traffic).",
    buildingMetaphor:
      "This is like the building's outer perimeter fence with a checkpoint. " +
      "Security groups are the guards at each room; Network ACLs are the guards at the building gate. " +
      "Traffic must pass both checkpoints.",
    keyFacts: [
      "Stateless: inbound and outbound rules are evaluated independently",
      "Rules are evaluated in number order; first match wins",
      "Default ACL allows all traffic; custom ACLs deny all by default",
    ],
    layer: "security",
    relatedResources: ["subnets", "security_groups"],
  },

  vpc_peering: {
    id: "vpc_peering",
    label: "VPC Peering",
    icon: GitMerge,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    explanation:
      "VPC Peering connects two VPCs so they can communicate using private IP addresses. " +
      "Traffic between peered VPCs stays on the cloud provider's private network (never traverses the internet). " +
      "This is useful when you have separate VPCs for different environments and need them to talk. " +
      "Peering is non-transitive: if VPC-A peers with VPC-B and VPC-B peers with VPC-C, A cannot reach C through B.",
    buildingMetaphor:
      "This is like a skybridge connecting two buildings. People in Building A can walk directly " +
      "to Building B without going outside. But they cannot use B's skybridge to reach Building C.",
    keyFacts: [
      "No single point of failure or bandwidth bottleneck",
      "Both VPCs must accept the peering request",
      "CIDR ranges of peered VPCs must not overlap",
    ],
    layer: "connectivity",
    relatedResources: ["vpcs", "route_tables"],
  },

  load_balancers: {
    id: "load_balancers",
    label: "Load Balancers",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    explanation:
      "A Load Balancer distributes incoming traffic across multiple instances for reliability and performance. " +
      "If one instance goes down, the load balancer stops sending traffic to it automatically. " +
      "It can operate at Layer 4 (TCP) or Layer 7 (HTTP) depending on the type. " +
      "This is essential for any production workload that needs high availability.",
    buildingMetaphor:
      "This is like a reception desk in the lobby. When visitors arrive, the receptionist " +
      "directs them to whichever available meeting room has the shortest wait. " +
      "If a room is closed, visitors are automatically sent elsewhere.",
    keyFacts: [
      "Performs health checks to detect unhealthy instances",
      "Supports SSL/TLS termination for HTTPS traffic",
      "Can distribute traffic across multiple availability zones",
    ],
    layer: "compute",
    relatedResources: ["instances", "subnets", "security_groups"],
  },

  instances: {
    id: "instances",
    label: "Instances / Servers",
    icon: Server,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    explanation:
      "An instance is a virtual server running in the cloud. " +
      "You choose the operating system, CPU, memory, and storage, then launch it in a subnet. " +
      "Instances run your applications, databases, and services. " +
      "You can start, stop, and resize them on demand.",
    buildingMetaphor:
      "This is a room in the building. You furnish it (choose CPU/RAM), " +
      "set it up for a specific purpose (web server, database), and people (users/traffic) visit it. " +
      "You can lock it (stop) and unlock it (start) whenever you like.",
    keyFacts: [
      "Billed per hour or second while running",
      "Can be resized (vertical scaling) by changing the instance type",
      "Data on the root disk is lost when terminated unless backed up",
    ],
    layer: "compute",
    relatedResources: ["subnets", "security_groups", "network_interfaces", "elastic_ips"],
  },
};

// ---------------------------------------------------------------------------
// Layer Configuration (for Infographic Cards View)
// ---------------------------------------------------------------------------

export const LAYER_ORDER: Array<{
  id: InfraLayer;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
}> = [
  {
    id: "connectivity",
    label: "Connectivity",
    description: "Internet & cross-VPC access",
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    icon: Globe,
  },
  {
    id: "network",
    label: "Network",
    description: "VPCs, subnets, and routing",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: Network,
  },
  {
    id: "security",
    label: "Security",
    description: "Firewalls and access control",
    color: "text-red-600",
    bgColor: "bg-red-50",
    icon: Shield,
  },
  {
    id: "compute",
    label: "Compute",
    description: "Servers and load distribution",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    icon: Server,
  },
];

// Get resources for a specific layer
export function getResourcesByLayer(layer: InfraLayer): ResourceExplanation[] {
  return Object.values(RESOURCE_EXPLANATIONS).filter((r) => r.layer === layer);
}

// ---------------------------------------------------------------------------
// Provider-aware filtering
// ---------------------------------------------------------------------------

/** Feature gating key for each resource type */
const RESOURCE_FEATURE_KEY: Record<ResourceTypeId, string> = {
  vpcs: "vpcs",
  subnets: "subnets",
  security_groups: "security_groups",
  route_tables: "route_tables",
  elastic_ips: "elastic_ips",
  network_interfaces: "network_interfaces",
  nat_gateways: "nat_gateways",
  internet_gateways: "internet_gateways",
  network_acls: "network_acls",
  vpc_peering: "vpc_peering",
  load_balancers: "load_balancers",
  instances: "compute",
};

/** Get resources for a specific layer, filtered by provider support */
export function getResourcesByLayerForProvider(
  layer: InfraLayer,
  provider?: string
): ResourceExplanation[] {
  return Object.values(RESOURCE_EXPLANATIONS).filter(
    (r) => r.layer === layer && isFeatureSupported(provider, RESOURCE_FEATURE_KEY[r.id])
  );
}

/** Get all supported resource type IDs for a provider */
export function getSupportedResourceIds(provider?: string): ResourceTypeId[] {
  return (Object.keys(RESOURCE_EXPLANATIONS) as ResourceTypeId[]).filter((id) =>
    isFeatureSupported(provider, RESOURCE_FEATURE_KEY[id])
  );
}
