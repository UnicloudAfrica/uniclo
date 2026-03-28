/**
 * Admin Region API - Shared Types & Interfaces
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  verified?: boolean;
  credentials_updated_at?: string;
}

export interface RegionApproval {
  id: string | number;
  code: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  ownership_type: "tenant_owned" | "platform_owned";
  tenant_id?: string | number;
  tenant_name?: string;
  reason?: string;
  platform_fee_percentage?: number;
  fast_track_granted?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProviderService {
  type: string;
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

export interface CredentialStatus {
  service_type: string;
  status: "valid" | "invalid" | "expired" | "not_provided";
  last_verified_at?: string;
  error?: string;
  credentials?: Record<string, string>;
}

export interface ObjectStorageConfig {
  enabled: boolean;
  base_url: string;
  access_key: string;
  account: string;
  default_quota_gb: number;
  notification_email: string;
}

export interface FastTrackGrant {
  tenant_id: string | number;
  notes?: string;
}

export interface RegionCreatePayload {
  name: string;
  code: string;
  country_code: string | null;
  city: string | null;
  provider?: string | null;
  is_active: boolean;
  ownership_type: string;
  visibility: string;
  fast_track_mode: string;
  az_selection_mode?: "auto" | "user_selectable" | "disabled";
}

export interface RegionUpdatePayload {
  name?: string;
  is_active?: boolean;
  visibility?: "public" | "private";
  fast_track_mode?: string;
  [key: string]: unknown;
}
