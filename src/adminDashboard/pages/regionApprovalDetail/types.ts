export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";
export type FastTrackMode = "owner_only" | "grant_only" | "disabled";

export interface TenantOption {
  id?: string | number | null;
  name?: string;
  email?: string;
  slug?: string;
  identifier?: string;
}

export interface CredentialForm {
  username: string;
  password: string;
  domain: string;
  domain_id: string;
  [key: string]: string;
}

export interface CredentialSummary {
  domain?: string;
  default_project?: string;
  username_preview?: string;
}

export interface RevenueShare {
  id?: string | number | null;
  created_at?: string;
  gross_amount?: number | string;
  platform_fee_amount?: number | string;
  tenant_share_amount?: number | string;
  status?: string;
}

export interface FastTrackGrant {
  id?: string | number | null;
  tenant_id?: string | number | null;
  tenant_name?: string;
  granted_at?: string;
  notes?: string;
}

export interface RegionOwnerTenant {
  id?: string | number | null;
  name?: string;
  email?: string;
}

export interface RegionApproval {
  id?: string | number | null;
  name?: string;
  code?: string;
  country_code?: string;
  city?: string;
  platform_fee_percentage?: number | string | null;
  base_url?: string;
  ownership_type?: string;
  fulfillment_mode?: string;
  approval_status?: string;
  has_msp_credentials?: boolean;
  msp_credentials_verified_at?: string | null;
  msp_credential_summary?: CredentialSummary;
  owner_tenant?: RegionOwnerTenant | null;
  recent_revenue_shares?: RevenueShare[];
  fast_track_mode?: FastTrackMode;
  fast_track_notes?: string;
  fast_track_grants?: FastTrackGrant[];
  admin_notes?: string;
  rejection_reason?: string;
}
