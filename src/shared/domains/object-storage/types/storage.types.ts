/**
 * Object Storage Types
 * Shared TypeScript interfaces for Object Storage domain
 */

export type BucketStatus = "active" | "suspended" | "deleting" | "deleted";
export type BucketVisibility = "private" | "public";
export type StorageTier = "standard" | "infrequent" | "archive" | "glacier";

export interface Bucket {
  id: number | string;
  identifier: string;
  name: string;
  status: BucketStatus;
  visibility: BucketVisibility;

  // Project & Region
  project_id?: string;
  project_name?: string;
  region: string;
  region_name?: string;

  // Storage details
  storage_tier: StorageTier;
  size_bytes?: number;
  object_count?: number;

  // Access & Security
  access_key_id?: string;
  is_encrypted?: boolean;
  encryption_type?: string;

  // Versioning
  versioning_enabled?: boolean;

  // Lifecycle
  lifecycle_rules?: LifecycleRule[];

  // CORS
  cors_enabled?: boolean;
  cors_rules?: CORSRule[];

  // Metadata
  tags?: Record<string, string>;

  // Pricing
  pricing?: {
    storage_cost?: number;
    transfer_cost?: number;
    request_cost?: number;
    total_cost?: number;
    currency?: string;
  };

  // Timestamps
  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface LifecycleRule {
  id: string;
  enabled: boolean;
  prefix?: string;
  expiration_days?: number;
  transition_days?: number;
  transition_tier?: StorageTier;
}

export interface CORSRule {
  id: string;
  allowed_origins: string[];
  allowed_methods: string[];
  allowed_headers?: string[];
  max_age_seconds?: number;
}

export interface StorageObject {
  key: string;
  size: number;
  last_modified: string;
  etag?: string;
  storage_class?: StorageTier;
  content_type?: string;
  is_folder?: boolean;
}

export interface BucketFormData {
  name: string;
  project_id: string;
  region: string;
  visibility: BucketVisibility;
  storage_tier: StorageTier;
  versioning_enabled?: boolean;
  is_encrypted?: boolean;
  tags?: Record<string, string>;
}

export interface BucketUpdateData {
  visibility?: BucketVisibility;
  versioning_enabled?: boolean;
  tags?: Record<string, string>;
}

export interface BucketFilters {
  status?: BucketStatus[];
  visibility?: BucketVisibility[];
  storage_tier?: StorageTier[];
  project_id?: string[];
  region?: string[];
  search?: string;
}

export interface BucketStats {
  total: number;
  active: number;
  suspended: number;
  total_size_bytes: number;
  total_objects: number;
}

export interface BucketListResponse {
  data: Bucket[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
  };
}

export interface BucketDetailResponse {
  data: Bucket;
}

export interface ObjectListResponse {
  data: StorageObject[];
  prefix?: string;
  continuation_token?: string;
  is_truncated?: boolean;
}

export interface BucketPermissions {
  canCreate: boolean;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canManageAccess: boolean;
}

export interface UploadOptions {
  content_type?: string;
  cache_control?: string;
  content_disposition?: string;
  storage_class?: StorageTier;
  metadata?: Record<string, string>;
}

export interface PresignedUrlOptions {
  expires_in?: number; // seconds
  content_type?: string;
  content_disposition?: string;
}
