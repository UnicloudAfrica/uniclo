export interface Tenant {
  id: string | number;
  parent_id?: string | number | null;
  name?: string;
  company_name?: string;
  identifier?: string;
  slug?: string;
  email?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
