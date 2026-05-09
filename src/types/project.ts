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
  /**
   * Vendor-neutral availability zone identifier (e.g. `uni-ng-az-1`). Replaces
   * the legacy `provider` field on the wire — see backend `ProjectResource`
   * and `ProviderIdMapper`. Use this for display and filtering.
   */
  availability_zone?: string;
  /**
   * Opaque, deterministic UUID derived from the internal provider key.
   * Use only for grouping / equality — never displayed to users.
   */
  provider_id?: string;
  /**
   * @deprecated The backend no longer ships this field. Reads will return
   * undefined. Use `availability_zone` (display) or `provider_features`
   * (capabilities) instead. Kept on the type only to ease incremental
   * migration of existing call sites — schedule for removal once all
   * frontend reads are gone.
   */
  provider?: string;
  /**
   * Capability flags computed by the backend from the internal provider key.
   * Vendor-neutral keys (`vpc`, `edge_network`, etc.) → booleans. Use this
   * to gate UI features instead of looking up by provider name.
   */
  provider_features?: Record<string, boolean>;
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
  count?: number;
  missing_count?: number;
  completed?: boolean;
  complete?: boolean;
  action?: SummaryAction;
}
