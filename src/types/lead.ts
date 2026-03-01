export interface Lead {
  id: string | number;
  identifier?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  score?: number;
  source?: string;
  lead_type?: string;
  created_at?: string;
  updated_at?: string;
  is_favorite?: boolean;
  assigned_to?: number | string | null;
  [key: string]: unknown;
}

export interface LeadStats {
  leads: number;
  leads_by_status: Record<string, number>;
}
