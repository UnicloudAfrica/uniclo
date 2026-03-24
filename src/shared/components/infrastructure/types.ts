export interface ElasticIp {
  id: string;
  allocation_id?: string;
  public_ip?: string;
  instance_id?: string;
  network_interface_id?: string;
  association_id?: string;
  domain?: string;
  name?: string;
  state?: string;
  created_at?: string;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface NatGateway {
  id: string;
  name?: string;
  subnet_id?: string;
  elastic_ip?: string;
  public_ip?: string;
  state?: string;
  created_at?: string;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface NetworkAcl {
  id: string;
  name?: string;
  vpc_id?: string;
  is_default?: boolean;
  entries?: Record<string, unknown>[];
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface SecurityGroupRuleGroup {
  group_id: string;
  group_name?: string;
  vpc_id?: string;
  user_id?: string;
  description?: string;
}

export interface SecurityGroupRule {
  ip_protocol: string | number;
  from_port?: number;
  to_port?: number;
  ip_ranges?: Array<{ cidr_ip: string; description?: string }>;
  ipv6_ranges?: Array<{ cidr_ipv6: string; description?: string }>;
  groups?: SecurityGroupRuleGroup[];
  ethertype?: "IPv4" | "IPv6";
  description?: string;
  remote_group_id?: string;
  direction?: "ingress" | "egress";
}

export interface SecurityGroup {
  id: string;
  name?: string;
  description?: string;
  vpc_id?: string;
  inbound_rules_count?: number;
  outbound_rules_count?: number;
  rules?: {
    ingress?: SecurityGroupRule[];
    egress?: SecurityGroupRule[];
  };
  ip_permissions_ingress?: SecurityGroupRule[];
  ip_permissions_egress?: SecurityGroupRule[];
  project_id?: string;
  tenant_id?: string;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface Subnet {
  id: string;
  name?: string;
  cidr?: string;
  cidr_block?: string;
  vpc_id?: string;
  state?: string;
  available_ips?: number;
  is_default?: boolean;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface VpcPeeringStatus {
  code?: string;
  message?: string;
}

export interface VpcPeeringConnection {
  id: string;
  name?: string;
  status?: string | VpcPeeringStatus;
  requester_vpc_id?: string;
  accepter_vpc_id?: string;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface LoadBalancer {
  id: string;
  name?: string;
  dns_name?: string;
  lb_type?: string;
  status?: string;
  state?: string;
  is_external?: boolean;
  vpc_id?: string;
  provider_resource_id?: string;
  local_id?: string | number;
}
export interface Vpc {
  id: string;
  name?: string;
  cidr_block?: string;
  cidr?: string;
  state?: string;
  status?: string;
  is_default?: boolean;
  region?: string;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface InternetGatewayAttachment {
  vpc_id: string;
  state: string;
}

export interface InternetGateway {
  id: string;
  name?: string;
  vpc_id?: string;
  state?: string;
  attachments?: InternetGatewayAttachment[];
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface Route {
  destination_cidr_block: string;
  gateway_id?: string;
  nat_gateway_id?: string;
  state?: string;
}

export interface RouteTableAssociation {
  route_table_association_id: string;
  subnet_id?: string;
  gateway_id?: string;
  is_main?: boolean;
  main?: boolean;
}

export interface RouteTable {
  id: string;
  name?: string;
  vpc_id?: string;
  is_main?: boolean;
  routes?: Route[];
  associations?: RouteTableAssociation[];
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface KeyPair {
  id: string;
  name: string;
  fingerprint?: string;
  key_material?: string;
  created_at?: string;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface NetworkInterface {
  id: string;
  name?: string;
  subnet_id?: string;
  vpc_id?: string;
  status?: string;
  state?: string;
  mac_address?: string;
  private_ip_address?: string;
  instance_id?: string;
  security_groups?: unknown;
  provider_resource_id?: string;
  local_id?: string | number;
}
