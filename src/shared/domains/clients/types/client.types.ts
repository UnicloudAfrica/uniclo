/**
 * Client/User Types
 * Shared TypeScript interfaces for Clients domain across Admin and Tenant
 */

export type ClientStatus = "active" | "inactive" | "suspended" | "pending";

export interface ClientAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface ClientContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  is_primary?: boolean;
}

export interface Client {
  id: number;
  identifier?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: ClientStatus;

  // Tenant association
  tenant_id?: number;
  tenant_name?: string;

  // Business details
  company_name?: string;
  tax_id?: string;
  registration_number?: string;

  // Contact information
  primary_contact?: ClientContact;
  contacts?: ClientContact[];
  billing_email?: string;

  // Address
  address?: ClientAddress;
  billing_address?: ClientAddress;

  // Projects & Resources
  project_count?: number;
  instance_count?: number;
  projects?: Array<{
    id: number;
    name: string;
    status: string;
  }>;

  // Billing
  currency?: string;
  payment_method?: string;
  billing_cycle?: "monthly" | "quarterly" | "annually";
  credit_limit?: number;
  current_balance?: number;

  // Timestamps
  created_at: string;
  updated_at?: string;
  last_login_at?: string;

  // Metadata
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;

  [key: string]: any;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  company_name?: string;
  tax_id?: string;

  // Contact
  primary_contact?: Omit<ClientContact, "is_primary">;
  billing_email?: string;

  // Address
  address?: ClientAddress;
  billing_address?: ClientAddress;

  // Business
  currency?: string;
  payment_method?: string;
  billing_cycle?: "monthly" | "quarterly" | "annually";
  credit_limit?: number;

  // Additional
  notes?: string;
  tags?: string[];
}

export interface ClientUpdateData extends Partial<ClientFormData> {
  status?: ClientStatus;
}

export interface ClientFilters {
  status?: ClientStatus[];
  tenant_id?: number[];
  search?: string;
  has_projects?: boolean;
  created_from?: string;
  created_to?: string;
}

export interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
}

export interface ClientListResponse {
  data: Client[];
  meta?: {
    total: number;
    per_page?: number;
    current_page?: number;
    last_page?: number;
  };
}

export interface ClientDetailResponse {
  data: Client;
}

export interface ClientPermissions {
  canCreate: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSuspend: boolean;
  canActivate: boolean;
  canManageProjects: boolean;
  canViewBilling: boolean;
}
