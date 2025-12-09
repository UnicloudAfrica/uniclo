/**
 * Tax Configuration Types
 * Shared TypeScript interfaces for Tax domain
 */

export type TaxType = "vat" | "gst" | "sales_tax" | "custom";
export type TaxStatus = "active" | "inactive";

export interface TaxRule {
  id: number;
  name: string;
  type: TaxType;
  status: TaxStatus;

  // Location
  country: string;
  state?: string;
  city?: string;

  // Rate
  rate: number; // Percentage

  // Applicability
  applies_to_services?: boolean;
  applies_to_products?: boolean;

  // Validity
  effective_from: string;
  effective_until?: string;

  // Additional info
  tax_code?: string;
  description?: string;

  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface TaxCalculation {
  subtotal: number;
  tax_rules: Array<{
    rule_id: number;
    rule_name: string;
    rate: number;
    amount: number;
  }>;
  total_tax: number;
  total: number;
}

export interface TaxFormData {
  name: string;
  type: TaxType;
  country: string;
  state?: string;
  city?: string;
  rate: number;
  applies_to_services?: boolean;
  applies_to_products?: boolean;
  effective_from: string;
  description?: string;
}

export interface TaxStats {
  total_rules: number;
  active_rules: number;
  countries_covered: number;
}
