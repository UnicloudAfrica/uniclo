/**
 * Tax configuration types matching the backend TaxConfiguration model.
 */

export interface TaxConfiguration {
  id: string | number;
  name: string;
  rate?: number;
  country?: string;
  region?: string;
  state?: string;
  type?: string;
  is_active?: boolean;
  is_inclusive?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface CreateTaxConfigurationPayload {
  name: string;
  rate: number;
  country?: string;
  region?: string;
  state?: string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

export interface UpdateTaxConfigurationPayload {
  id: string | number;
  configData: Partial<CreateTaxConfigurationPayload>;
}
