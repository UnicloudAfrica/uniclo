/**
 * Module/Product Types
 * Shared TypeScript interfaces for Modules and Product Inventory
 */

export type ModuleStatus = "active" | "beta" | "deprecated" | "disabled";
export type ModuleCategory =
  | "compute"
  | "storage"
  | "network"
  | "security"
  | "database"
  | "analytics"
  | "other";

export interface Module {
  id: number;
  identifier: string;
  name: string;
  display_name: string;
  description?: string;
  status: ModuleStatus;
  category: ModuleCategory;

  // Pricing
  base_price?: number;
  billing_model?: "monthly" | "usage_based" | "one_time";
  currency?: string;

  // Availability
  available_regions?: string[];
  requires_modules?: string[]; // Dependencies

  // Features
  features?: string[];
  specifications?: Record<string, any>;

  // Limits
  max_quantity?: number;
  min_quantity?: number;

  // Metadata
  icon?: string;
  documentation_url?: string;

  // Stats
  active_subscriptions?: number;

  created_at: string;
  updated_at?: string;

  [key: string]: any;
}

export interface ProductInventoryItem {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: string;

  // Pricing
  price: number;
  currency: string;

  // Stock
  quantity_available?: number;
  quantity_reserved?: number;
  low_stock_threshold?: number;

  // Specifications
  specifications?: Record<string, any>;

  // Availability
  is_available: boolean;
  available_from?: string;
  available_until?: string;

  created_at: string;
  updated_at?: string;
}

export interface ModuleSubscription {
  id: number;
  module_id: number;
  module_name: string;
  tenant_id?: number;
  client_id?: number;
  project_id?: string;

  // Subscription details
  quantity: number;
  status: "active" | "suspended" | "cancelled";

  // Billing
  monthly_cost: number;
  currency: string;

  // Dates
  subscribed_at: string;
  expires_at?: string;
  cancelled_at?: string;

  [key: string]: any;
}

export interface ModuleFormData {
  name: string;
  display_name: string;
  description?: string;
  category: ModuleCategory;
  status?: ModuleStatus;
  base_price?: number;
  billing_model?: "monthly" | "usage_based" | "one_time";
  available_regions?: string[];
  features?: string[];
}

export interface ModuleStats {
  total: number;
  active: number;
  beta: number;
  total_subscriptions: number;
  monthly_revenue: number;
}
