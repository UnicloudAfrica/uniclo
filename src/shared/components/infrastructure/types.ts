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
  entries?: Array<any>;
  provider_resource_id?: string;
  local_id?: string | number;
}

export interface SecurityGroup {
  id: string;
  name?: string;
  description?: string;
  vpc_id?: string;
  inbound_rules_count?: number;
  outbound_rules_count?: number;
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
