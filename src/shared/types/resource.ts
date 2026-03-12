export type ApiMessage = string | { message: string };

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: ApiMessage;
  success?: boolean;
}

export interface Country {
  id: string | number;
  name: string;
  iso2: string;
  iso3?: string;
  phone_code?: string;
  currency?: string;
  emoji?: string;
}

export interface State {
  id: string | number;
  name: string;
  country_id: string | number;
  state_code: string;
}

export interface City {
  id: string | number;
  name: string;
  state_id: string | number;
}

export interface Industry {
  id: string | number;
  name: string;
  slug: string;
}

export interface ProductCharge {
  id: string | number;
  name: string;
  slug: string;
  amount: number;
  currency: string;
}

export interface Region {
  id: string | number;
  name: string;
  display_name?: string;
  baseUrl?: string;
  endpoint?: string;
  code?: string;
  provider?: string;
  country_code?: string;
  city?: string;
}

export interface ComputeInstance {
  id: string | number;
  name: string;
  vcpus?: number;
  ram?: number;
  storage?: number;
  slug: string;
}

export interface OsImage {
  id: string | number;
  name: string;
  os_distro?: string;
  os_version?: string;
  slug: string;
}

export interface VolumeType {
  id: string | number;
  name: string;
  slug: string;
  min_size?: number;
  max_size?: number;
}

export interface Bandwidth {
  id: string | number;
  name: string;
  slug: string;
  amount?: number;
}

export interface CrossConnect {
  id: string | number;
  name: string;
  slug: string;
}

export interface FloatingIP {
  id: string | number;
  name: string;
  slug: string;
}

export interface Profile {
  id: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  tenant_id?: number | string;
  role?: string;
}

export interface Workspace {
  id: number | string;
  name: string;
  description?: string;
}
