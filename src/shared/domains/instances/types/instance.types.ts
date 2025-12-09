/**
 * Instance Types
 * Shared TypeScript interfaces for Instance domain across Admin, Tenant, and Client
 */

export type InstanceStatus =
  | "running"
  | "stopped"
  | "pending"
  | "stopping"
  | "terminated"
  | "terminating"
  | "rebooting"
  | "error"
  | "unknown";

export type InstanceType =
  | "t2.micro"
  | "t2.small"
  | "t2.medium"
  | "t2.large"
  | "t3.micro"
  | "t3.small"
  | "t3.medium"
  | "t3.large"
  | string; // Allow custom types

export interface InstanceVolume {
  id: string;
  device_name?: string;
  volume_type?: string;
  size?: number;
  iops?: number;
  encrypted?: boolean;
}

export interface InstanceNetworkInterface {
  id: string;
  subnet_id?: string;
  private_ip_address?: string;
  public_ip_address?: string;
  security_groups?: string[];
}

export interface InstanceTag {
  key: string;
  value: string;
}

export interface InstanceMetrics {
  cpu_utilization?: number;
  network_in?: number;
  network_out?: number;
  disk_read?: number;
  disk_write?: number;
}

export interface Instance {
  id: number | string;
  identifier: string;
  name: string;
  status: InstanceStatus;
  instance_type?: InstanceType;

  // Project & Region
  project_id?: string | number;
  project_identifier?: string;
  project_name?: string;
  region?: string;
  region_name?: string;
  availability_zone?: string;

  // Compute Resources
  vcpu?: number;
  memory?: number; // in MB or GB
  architecture?: "x86_64" | "arm64" | string;

  // Image & OS
  image_id?: string;
  image_name?: string;
  os?: string;
  os_type?: "linux" | "windows" | string;

  // Networking
  private_ip_address?: string;
  public_ip_address?: string;
  private_dns_name?: string;
  public_dns_name?: string;
  vpc_id?: string;
  subnet_id?: string;
  security_groups?: Array<{
    id: string;
    name: string;
  }>;
  network_interfaces?: InstanceNetworkInterface[];

  // Storage
  root_device_name?: string;
  root_device_type?: "ebs" | "instance-store" | string;
  block_device_mappings?: InstanceVolume[];

  // Key Pair
  key_name?: string;
  key_pair_id?: string;

  // Monitoring & Metrics
  monitoring?: boolean;
  metrics?: InstanceMetrics;

  // State & Timestamps
  state?: string;
  state_transition_reason?: string;
  launch_time?: string;
  created_at?: string;
  updated_at?: string;
  terminated_at?: string;

  // Tags & Metadata
  tags?: InstanceTag[];
  user_data?: string;

  // Billing
  billing_product?: string;
  pricing?: {
    hourly_rate?: number;
    monthly_estimate?: number;
    currency?: string;
  };

  // Additional metadata
  [key: string]: any;
}

export interface InstanceFormData {
  name: string;
  instance_type: InstanceType;
  image_id: string;
  project_id?: string;
  region: string;
  availability_zone?: string;
  key_name?: string;
  security_group_ids?: string[];
  subnet_id?: string;
  user_data?: string;
  monitoring?: boolean;
  count?: number; // For multi-instance creation

  // Volume configuration
  volume_size?: number;
  volume_type?: string;
  encrypted?: boolean;

  // Network configuration
  assign_public_ip?: boolean;
  private_ip_address?: string;

  // Tags
  tags?: InstanceTag[];
}

export interface InstanceAction {
  action: "start" | "stop" | "reboot" | "terminate" | "restart";
  instance_id: string;
  force?: boolean;
}

export interface BulkInstanceAction {
  action: "start" | "stop" | "reboot" | "terminate";
  instance_ids: string[];
  force?: boolean;
}

export interface InstanceFilters {
  status?: InstanceStatus[];
  instance_type?: string[];
  region?: string[];
  project?: string[];
  search?: string;
}

export interface InstanceStats {
  total: number;
  running: number;
  stopped: number;
  pending: number;
  terminated: number;
  error: number;
}

export interface InstanceListResponse {
  data: Instance[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export interface InstanceDetailResponse {
  data: Instance;
}

export interface InstanceConsoleOutput {
  instance_id: string;
  output: string;
  timestamp?: string;
}

export interface InstancePermissions {
  canCreate: boolean;
  canStart: boolean;
  canStop: boolean;
  canReboot: boolean;
  canTerminate: boolean;
  canModify: boolean;
  canViewConsole: boolean;
  canAccessSSH: boolean;
}

// Multi-instance creation types
export interface MultiInstanceConfig {
  count: number;
  base_config: InstanceFormData;
  naming_pattern?: string; // e.g., "server-{index}"
  spread_across_zones?: boolean;
}

export interface InstanceCreationProgress {
  total: number;
  created: number;
  failed: number;
  in_progress: number;
  instances: Array<{
    name: string;
    status: "pending" | "creating" | "success" | "failed";
    instance_id?: string;
    error?: string;
  }>;
}
