export interface EdgeConfigMetadata {
  edge_network_ip_pools?: Record<string, unknown[]>;
  default_edgenet_ip_pool?: string;
  [key: string]: unknown;
}

export interface EdgeConfig {
  edge_network_id?: string;
  ip_pool_id?: string;
  flowlogs_enabled?: boolean;
  metadata?: EdgeConfigMetadata;
  status?: string;
  [key: string]: unknown;
}

export interface EdgeNetwork {
  id: string;
  uuid?: string;
  identifier?: string;
  name?: string;
  label?: string;
  [key: string]: unknown;
}

export interface EdgeIpPool {
  edge_network_ip_pool_id?: string;
  id: string;
  uuid?: string;
  label?: string;
  name?: string;
  [key: string]: unknown;
}

export interface EdgeFormData {
  edge_network_id: string;
  ip_pool_id: string;
  flowlogs_enabled: boolean;
}

export interface AssignEdgePayload {
  project_id: string | number;
  region: string;
  edge_network_id?: string;
  edge_ip_pool_id?: string;
  flowlogs_enabled?: boolean;
  auto_assign?: boolean;
  [key: string]: unknown;
}
