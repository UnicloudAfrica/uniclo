export interface Client {
  id: string | number;
  identifier?: string;
  uuid?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  verified?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  [key: string]: unknown;
}
