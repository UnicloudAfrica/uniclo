/**
 * Leads (CRM) Types
 * Shared TypeScript interfaces for Leads domain
 */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "on_hold";

export type LeadSource =
  | "website"
  | "referral"
  | "partner"
  | "marketing"
  | "cold_call"
  | "event"
  | "social_media"
  | "other";

export type LeadPriority = "low" | "medium" | "high" | "critical";

export interface LeadStage {
  id: number;
  name: string;
  status: LeadStatus;
  order: number;
  probability?: number; // Win probability %
  created_at?: string;
}

export interface LeadDocument {
  id: number;
  lead_id: number;
  filename: string;
  file_size?: number;
  file_type?: string;
  url: string;
  uploaded_by?: number;
  uploaded_at: string;
  notes?: string;
}

export interface LeadNote {
  id: number;
  lead_id: number;
  user_id: number;
  user_name?: string;
  note: string;
  created_at: string;
  updated_at?: string;
}

export interface LeadActivity {
  id: number;
  lead_id: number;
  user_id?: number;
  user_name?: string;
  activity_type: string;
  description: string;
  created_at: string;
}

export interface Lead {
  id: number;
  identifier?: string;

  // Contact Information
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;

  // Location
  country?: string;
  city?: string;
  address?: string;

  // Lead Details
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  stage_id?: number;
  stage?: LeadStage;

  // Financial
  estimated_value?: number;
  currency?: string;

  // Assignment
  assigned_to?: number;
  assigned_to_name?: string;

  // Tenant/Admin context
  tenant_id?: number;
  tenant_name?: string;

  // Tracking
  stages?: LeadStage[];
  documents?: LeadDocument[];
  notes?: LeadNote[];
  activities?: LeadActivity[];

  // Metrics
  score?: number; // Lead score 0-100
  last_contacted_at?: string;
  next_follow_up_at?: string;
  converted_at?: string;

  // Timestamps
  created_at: string;
  updated_at?: string;

  // Metadata
  tags?: string[];
  custom_fields?: Record<string, any>;

  [key: string]: any;
}

export interface LeadFormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  country?: string;
  city?: string;
  source: LeadSource;
  priority?: LeadPriority;
  estimated_value?: number;
  currency?: string;
  assigned_to?: number;
  tags?: string[];
  notes?: string;
}

export interface LeadUpdateData extends Partial<LeadFormData> {
  status?: LeadStatus;
  stage_id?: number;
  score?: number;
  next_follow_up_at?: string;
}

export interface LeadFilters {
  status?: LeadStatus[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  assigned_to?: number[];
  tenant_id?: number[];
  search?: string;
  value_min?: number;
  value_max?: number;
  created_from?: string;
  created_to?: string;
}

export interface LeadStats {
  total: number;
  new: number;
  qualified: number;
  proposal: number;
  won: number;
  lost: number;
  conversion_rate: number; // Required - calculated field
  total_value?: number;
  avg_score?: number;
}

export interface LeadListResponse {
  data: Lead[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export interface LeadDetailResponse {
  data: Lead;
}

export interface LeadPermissions {
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canChangeStage: boolean;
  canAddDocuments: boolean;
  canConvert: boolean; // Convert to customer/project
}
