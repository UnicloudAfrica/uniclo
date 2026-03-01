export interface ProjectResourcesCount {
  instances?: number;
  volumes?: number;
  snapshots?: number;
  elastic_ips?: number;
  [key: string]: number | undefined;
}

export interface Project {
  id: string | number;
  identifier: string;
  name: string;
  description?: string;
  status: string;
  tenant_id: number;
  region?: string;
  provider?: string;
  resources_count?: ProjectResourcesCount;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectStatus {
  project: Project;
  infrastructure_checklist?: Record<string, boolean | string | number | null>;
  provisioning_status?: {
    progress: number;
    current_step?: string;
    steps?: Array<{
      name: string;
      status: string;
      message?: string;
    }>;
  };
}

export interface CloudPolicy {
  id: number;
  name: string;
  is_default: boolean;
  status: string;
  is_compulsory?: boolean;
}

export interface ProjectUserStatus {
  tenant_admin?: boolean;
  provider_account?: boolean;
  aws_policy?: boolean;
  symp_policy?: boolean;
  role?: string;
  cloud_policies?: CloudPolicy[];
}

export interface ProjectUserAction {
  show: boolean;
  label?: string;
  [key: string]: unknown;
}

export interface ProjectUser {
  id: number | string;
  name?: string;
  full_name?: string;
  first_name?: string;
  firstName?: string;
  middle_name?: string;
  middleName?: string;
  last_name?: string;
  lastName?: string;
  email: string;
  roles?: string[];
  role?: string;
  status?: ProjectUserStatus;
  actions?: Record<string, ProjectUserAction>;
}

export interface SummaryAction {
  method?: string;
  endpoint?: string;
  label?: string;
}

export interface SummaryItem {
  title?: string;
  key?: string;
  missing_count?: number;
  completed?: boolean;
  complete?: boolean;
  action?: SummaryAction;
}
