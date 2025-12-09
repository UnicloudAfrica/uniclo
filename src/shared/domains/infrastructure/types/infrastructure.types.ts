/**
 * Infrastructure/VPC Types
 * Shared TypeScript interfaces for VPC and networking infrastructure
 */

export type VPCStatus = "available" | "pending" | "deleting" | "deleted";
export type SubnetType = "public" | "private";

export interface VPC {
  id: string;
  identifier: string;
  name: string;
  status: VPCStatus;

  // Network
  cidr_block: string;
  ipv6_cidr_block?: string;

  // Project & Region
  project_id: string;
  project_name?: string;
  region: string;
  region_name?: string;

  // Features
  enable_dns_support?: boolean;
  enable_dns_hostnames?: boolean;

  // Resources
  subnet_count?: number;
  security_group_count?: number;

  // Timestamps
  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface Subnet {
  id: string;
  identifier: string;
  name: string;
  vpc_id: string;
  vpc_name?: string;

  // Network
  cidr_block: string;
  availability_zone: string;
  type: SubnetType;

  // Features
  map_public_ip_on_launch?: boolean;
  available_ip_count?: number;

  // Project & Region
  project_id: string;
  region: string;

  created_at: string;
  [key: string]: any;
}

export interface SecurityGroup {
  id: string;
  identifier: string;
  name: string;
  description?: string;
  vpc_id: string;

  // Rules
  ingress_rules?: SecurityRule[];
  egress_rules?: SecurityRule[];

  // Project
  project_id: string;
  region: string;

  created_at: string;
  [key: string]: any;
}

export interface SecurityRule {
  id?: string;
  protocol: string; // tcp, udp, icmp, all
  from_port?: number;
  to_port?: number;
  cidr_blocks?: string[];
  source_security_group_id?: string;
  description?: string;
}

export interface InternetGateway {
  id: string;
  identifier: string;
  name: string;
  vpc_id?: string;
  vpc_name?: string;
  project_id: string;
  region: string;
  status: "available" | "attaching" | "attached" | "detaching";
  created_at: string;
}

export interface RouteTable {
  id: string;
  identifier: string;
  name: string;
  vpc_id: string;
  vpc_name?: string;
  project_id: string;
  region: string;
  routes?: Route[];
  is_main?: boolean;
  associated_subnets?: string[];
  created_at: string;
}

export interface Route {
  destination_cidr_block: string;
  gateway_id?: string;
  instance_id?: string;
  nat_gateway_id?: string;
  network_interface_id?: string;
  vpc_peering_connection_id?: string;
  status: "active" | "blackhole";
}

export interface NetworkInterface {
  id: string;
  identifier: string;
  subnet_id: string;
  vpc_id: string;
  private_ip_address: string;
  public_ip_address?: string;
  security_groups?: string[];
  instance_id?: string;
  description?: string;
  project_id: string;
  region: string;
  created_at: string;
}

export interface ElasticIP {
  id: string;
  identifier: string;
  public_ip: string;
  private_ip_address?: string;
  instance_id?: string;
  network_interface_id?: string;
  project_id: string;
  region: string;
  created_at: string;
}

export interface InfrastructureStats {
  vpcs: number;
  subnets: number;
  security_groups: number;
  internet_gateways: number;
  route_tables: number;
  elastic_ips: number;
  network_interfaces: number;
}

export interface VPCFormData {
  name: string;
  cidr_block: string;
  project_id: string;
  region: string;
  enable_dns_support?: boolean;
  enable_dns_hostnames?: boolean;
}

export interface SubnetFormData {
  name: string;
  vpc_id: string;
  cidr_block: string;
  availability_zone: string;
  type: SubnetType;
  map_public_ip_on_launch?: boolean;
}

export interface SecurityGroupFormData {
  name: string;
  description?: string;
  vpc_id: string;
  ingress_rules?: Omit<SecurityRule, "id">[];
  egress_rules?: Omit<SecurityRule, "id">[];
}
