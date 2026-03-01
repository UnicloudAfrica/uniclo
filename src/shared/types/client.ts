export interface Client {
  id: string | number;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  tenant_id?: string | number;
  tenant_name?: string;
  tenant?: {
    id: string | number;
    name: string;
  };
  entity?: string;
  identifier?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
