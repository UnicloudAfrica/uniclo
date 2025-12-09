/**
 * Project Types
 * Shared TypeScript interfaces for Project domain across Admin, Tenant, and Client
 */

export interface ProjectUser {
  id: number;
  name?: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email: string;
  role?: string;
  roles?: string[];
  status?: {
    provider_account?: boolean;
    aws_policy?: boolean;
    symp_policy?: boolean;
    tenant_admin?: boolean;
    role?: string;
  };
}

export interface ProjectClient {
  id: number;
  name: string;
  email: string;
  company?: string;
}

export interface ProjectTenant {
  id: number;
  name: string;
  email?: string;
  company_name?: string;
}

export interface ProjectInstance {
  id: string | number;
  identifier?: string;
  name: string;
  status: string;
  type?: string;
  region?: string;
  created_at?: string;
}

export interface ProjectSummaryItem {
  key?: string;
  title?: string;
  count?: number;
  missing_count?: number;
  completed?: boolean;
  complete?: boolean;
  status?: string;
}

export interface Project {
  id: number;
  identifier: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "pending" | "provisioning" | "processing" | "failed" | "error";
  region: string;
  region_name?: string;
  tenant_id?: number;
  client_id?: number;
  tenant?: ProjectTenant;
  clients?: ProjectClient[];
  assignment_scope?: "internal" | "tenant" | "client";

  // VPC & Infrastructure
  vpc_enabled?: boolean;

  // Users & Members
  users?:
    | {
        local?: ProjectUser[];
      }
    | ProjectUser[];

  // Instances
  instances?: ProjectInstance[];
  pending_instances?: ProjectInstance[];

  // Summary & Progress
  summary?: ProjectSummaryItem[];

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Additional metadata
  [key: string]: any;
}

export interface ProjectFilters {
  status?: string[];
  region?: string[];
  tenant?: number[];
  client?: number[];
  search?: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  failed: number;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  region: string;
  tenant_id?: number;
  client_id?: number;
  assignment_scope?: "internal" | "tenant" | "client";
}

// Update data for existing projects
export type ProjectUpdateData = Partial<ProjectFormData>;

export interface ProjectListResponse {
  data: Project[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export interface ProjectDetailResponse {
  data: Project;
}

export interface ProjectStatusResponse {
  project: Project;
  status?: string;
}

// Project permissions interface
export interface ProjectPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canActivate: boolean;
  canManageUsers: boolean;
  canEnableVpc: boolean;
}

// Infrastructure status interfaces
export interface InfrastructureComponent {
  status: "active" | "completed" | "pending" | "failed";
  count?: number;
  message?: string;
}

export interface ProjectInfrastructureStatus {
  components: {
    vpc?: InfrastructureComponent;
    networks?: InfrastructureComponent;
    subnets?: InfrastructureComponent;
    security_groups?: InfrastructureComponent;
    keypairs?: InfrastructureComponent;
    internet_gateways?: InfrastructureComponent;
    route_tables?: InfrastructureComponent;
    network_interfaces?: InfrastructureComponent;
    elastic_ips?: InfrastructureComponent;
    edge_networks?: InfrastructureComponent;
    [key: string]: InfrastructureComponent | undefined;
  };
}
