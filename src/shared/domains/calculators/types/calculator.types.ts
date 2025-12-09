/**
 * Calculator Types
 * Shared TypeScript interfaces for Pricing Calculator domain
 */

export type CalculatorType = "instance" | "storage" | "network" | "advanced" | "total_cost";

export interface InstanceCalculation {
  instance_type: string;
  quantity: number;
  hours_per_month: number;
  unit_price: number;
  monthly_cost: number;
}

export interface StorageCalculation {
  storage_type: string; // SSD, HDD, Object Storage
  size_gb: number;
  unit_price_per_gb: number;
  monthly_cost: number;
}

export interface NetworkCalculation {
  bandwidth_gb: number;
  unit_price_per_gb: number;
  monthly_cost: number;
}

export interface CalculationResult {
  id?: string;
  calculator_type: CalculatorType;

  // Inputs
  region?: string;
  region_name?: string;
  currency: string;

  // Components
  instances?: InstanceCalculation[];
  storage?: StorageCalculation[];
  network?: NetworkCalculation[];

  // Totals
  instance_cost: number;
  storage_cost: number;
  network_cost: number;
  subtotal: number;

  // Discounts & Tax
  discount_percent?: number;
  discount_amount?: number;
  tax_percent?: number;
  tax_amount?: number;

  // Final
  total_cost: number;

  // Metadata
  notes?: string;
  created_by?: number;
  created_at?: string;

  [key: string]: any;
}

export interface PricingRate {
  id: number;
  resource_type: string; // instance, storage, network
  resource_name: string; // t2.micro, ssd, bandwidth
  region: string;
  unit_price: number;
  unit: string; // hour, gb, gb_transfer
  currency: string;
  effective_date: string;
  expires_date?: string;
}

export interface CalculatorFormData {
  calculator_type: CalculatorType;
  region: string;
  currency?: string;
  instances?: Omit<InstanceCalculation, "monthly_cost">[];
  storage?: Omit<StorageCalculation, "monthly_cost">[];
  network?: Omit<NetworkCalculation, "monthly_cost">[];
  discount_percent?: number;
  tax_percent?: number;
  notes?: string;
}

export interface CalculatorStats {
  total_calculations: number;
  avg_monthly_cost: number;
  total_estimated_revenue: number;
}
