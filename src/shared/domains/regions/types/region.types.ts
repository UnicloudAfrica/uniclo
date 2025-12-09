/**
 * Region Types
 * Shared TypeScript interfaces for Regions domain
 */

export type RegionStatus = "active" | "maintenance" | "disabled";
export type RegionType = "aws" | "azure" | "gcp" | "private";

export interface RegionCapability {
  name: string;
  available: boolean;
  description?: string;
}

export interface RegionPricing {
  instance_multiplier: number;
  storage_multiplier: number;
  transfer_multiplier: number;
  currency: string;
}

export interface Region {
  id: number;
  identifier: string;
  name: string;
  display_name: string;
  status: RegionStatus;
  type: RegionType;

  // Location
  country: string;
  city?: string;
  continent?: string;

  // Provider
  provider: string;
  provider_region_code: string;

  // Availability
  availability_zones?: string[];

  // Capabilities
  capabilities?: RegionCapability[];
  supports_vpc?: boolean;
  supports_ipv6?: boolean;

  // Pricing
  pricing?: RegionPricing;

  // Limits
  max_instances?: number;
  max_storage_gb?: number;

  // Metadata
  description?: string;
  is_default?: boolean;
  priority?: number;

  // Stats
  instance_count?: number;
  project_count?: number;

  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface RegionFormData {
  name: string;
  display_name: string;
  provider: string;
  provider_region_code: string;
  country: string;
  city?: string;
  type: RegionType;
  availability_zones?: string[];
  description?: string;
  is_default?: boolean;
}

export interface RegionFilters {
  status?: RegionStatus[];
  type?: RegionType[];
  provider?: string[];
  country?: string[];
  search?: string;
}

export interface RegionStats {
  total: number;
  active: number;
  maintenance: number;
  disabled: number;
  total_instances: number;
  total_projects: number;
}

export interface RegionListResponse {
  data: Region[];
  meta?: {
    total: number;
  };
}

export interface RegionDetailResponse {
  data: Region;
}
