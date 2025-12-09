/**
 * Support/Ticket Types
 * Shared TypeScript interfaces for Support domain across Admin, Tenant, and Client
 */

export type TicketStatus =
  | "open"
  | "pending"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened"
  | "cancelled";

export type TicketPriority = "low" | "normal" | "high" | "urgent" | "critical";

export type TicketCategory =
  | "technical"
  | "billing"
  | "general"
  | "feature_request"
  | "bug_report"
  | "account"
  | "infrastructure";

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  message: string;
  is_internal?: boolean; // Internal notes visible only to admin/support
  attachments?: TicketAttachment[];
  created_at: string;
  updated_at?: string;
}

export interface TicketAttachment {
  id: number;
  filename: string;
  file_size?: number;
  file_type?: string;
  url: string;
  uploaded_by?: number;
  uploaded_at?: string;
}

export interface TicketAssignee {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
}

export interface Ticket {
  id: number;
  identifier: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;

  // User/Customer information
  user_id: number;
  user_name?: string;
  user_email?: string;
  tenant_id?: number;
  tenant_name?: string;
  client_id?: number;
  client_name?: string;

  // Assignment
  assigned_to?: number;
  assigned_to_name?: string;
  assignee?: TicketAssignee;

  // Related resources
  project_id?: string;
  project_name?: string;
  instance_id?: string;
  instance_name?: string;

  // Messages & Attachments
  messages?: TicketMessage[];
  message_count?: number;
  attachments?: TicketAttachment[];
  attachment_count?: number;

  // Tracking
  first_response_at?: string;
  last_response_at?: string;
  resolved_at?: string;
  closed_at?: string;

  // SLA
  sla_due_at?: string;
  sla_breached?: boolean;
  response_time_sla?: number; // in hours
  resolution_time_sla?: number; // in hours

  // Timestamps
  created_at: string;
  updated_at: string;

  // Tags
  tags?: string[];

  // Metadata
  [key: string]: any;
}

export interface TicketFormData {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  project_id?: string;
  instance_id?: string;
  attachments?: File[];
}

export interface TicketUpdateData {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: number;
  tags?: string[];
}

export interface TicketMessageData {
  message: string;
  is_internal?: boolean;
  attachments?: File[];
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assigned_to?: number[];
  user_id?: number[];
  tenant_id?: number[];
  search?: string;
  date_from?: string;
  date_to?: string;
  sla_breached?: boolean;
}

export interface TicketStats {
  total: number;
  open: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
  breached_sla: number;
  avg_response_time?: number; // in hours
  avg_resolution_time?: number; // in hours
}

export interface TicketListResponse {
  data: Ticket[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export interface TicketDetailResponse {
  data: Ticket;
}

export interface TicketPermissions {
  canCreate: boolean;
  canView: boolean;
  canUpdate: boolean;
  canClose: boolean;
  canReopen: boolean;
  canAssign: boolean;
  canViewInternal: boolean; // View internal notes
  canAddInternal: boolean; // Add internal notes
  canDelete: boolean;
}
