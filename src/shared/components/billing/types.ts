import {} from "@/types/project";

export interface BillingRegion {
  code: string;
  name: string;
  [key: string]: unknown;
}

export interface PricingProduct {
  id: number;
  name: string;
  productable_id: number;
  productable_type: string;
  [key: string]: unknown;
}

export interface ProductPricing {
  id: number;
  product: PricingProduct;
  pricing: {
    effective: {
      price_local: number;
      currency: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface VolumeTypeRequest {
  volume_type_id: number;
  storage_size_gb: number;
}

export interface PricingRequestDisplay {
  compute?: string;
  os?: string;
  storage?: string;
  [key: string]: string | undefined;
}

export interface PricingRequest {
  region: string;
  availability_zone?: string;
  compute_instance_id: number | null;
  os_image_id: number | null;
  months: number;
  number_of_instances: number;
  volume_types: VolumeTypeRequest[];
  volumes?: {
    volume_type_id: number | null;
    volume_type_name?: string;
    storage_size_gb: number | string;
  }[];
  bandwidth_id?: number | null;
  bandwidth_count?: number | string;
  floating_ip_id?: number | null;
  floating_ip_count?: number | string;
  cross_connect_id?: number | null;
  // Temporary fields for calculator UI
  volume_type_id?: number | null;
  volume_type_name?: string;
  storage_size_gb?: number | string;
  _display?: PricingRequestDisplay;
  // Calculator specific display names
  region_name?: string;
  compute_instance_name?: string;
  os_image_name?: string;
  bandwidth_name?: string;
  floating_ip_name?: string;
  cross_connect_name?: string;
}

export interface ObjectStorageRequest {
  region: string;
  availability_zone?: string;
  productable_id?: number | null;
  tier_id: number | null;
  quantity: number | string;
  months: number | string;
  product_name?: string;
  unit_price?: number | string;
  total_price?: number | string;
  currency?: string;
  _display?: {
    name: string;
    quantity: string;
  };
  // Calculator specific fields
  // tier_id is now a required field in the main interface
  // product_name, total_price, currency are also in the main interface
  unit_summary?: string; // This field was in the original and not explicitly removed or added to the new structure, so keeping it.
}

export interface BillingLeadInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
}

export interface TotalDiscount {
  type: string; // "percent" | "fixed"
  value: number;
  label?: string | null;
}

/**
 * Quote+Invoice convergence — the wizard's final step lets the user
 * decide whether the document should be saved as a Quote (draft document
 * pre-acceptance) or generated as an Invoice. The string is forwarded
 * to the `intent` field on the multi-quotes API.
 */
export type QuoteInvoiceIntent = "quote" | "invoice";

export interface InvoiceFormData {
  // Step 1: Info
  subject: string;
  email: string;
  emails: string;
  notes: string;
  bill_to_name: string;
  invoice_date: string;
  due_date: string;

  // Final step: Save as Quote vs Generate Invoice
  intent: QuoteInvoiceIntent;

  // Total discount
  apply_total_discount: boolean;
  total_discount_type: string;
  total_discount_value: string | number;
  total_discount_label: string;

  // Lead tracking
  create_lead: boolean;
  lead_first_name: string;
  lead_last_name: string;
  lead_email: string;
  lead_phone: string;
  lead_company: string;
  lead_country: string;

  // Item staging fields (Step 2 form)
  region: string;
  availability_zone?: string;
  compute_instance_id: number | null;
  os_image_id: number | null;
  months: number;
  number_of_instances: number;
  volume_type_id: number | null;
  storage_size_gb: string | number;
  bandwidth_id: number | null;
  bandwidth_count: number;
  floating_ip_id: number | null;
  floating_ip_count: number;

  // Silo Storage staging fields
  object_storage_region: string;
  object_storage_availability_zone?: string;
  object_storage_product_id: number | null;
  object_storage_quantity: number;
  object_storage_months: number;
  tenant_id?: string | number | null;
  cross_connect_id: number | null;
}

export type UpdateInvoiceFormData = (
  field: keyof InvoiceFormData,
  value: InvoiceFormData[keyof InvoiceFormData]
) => void;

export interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface AssignmentDetails {
  assignType: string;
  tenant?: unknown;
  user?: unknown;
}

export interface FlowPlanLineItem {
  id: string;
  plan_id: number;
  plan_name: string;
  monthly_naira: number; // resolved per-month price in NGN
  quantity: number;
  months: number;
  total_price?: number;
  currency?: string;
  unit_summary?: string;
}

export interface ShieldServiceLineItem {
  id: string;
  service_id: number;
  service_name: string;
  provider: string;
  unit_label: string | null;
  unit_price: number;
  currency: string;
  quantity: number; // domains, certs, attacks, …
  months: number;
  billing_model: string; // monthly_flat | one_time | per_usage | …
  total_price?: number;
  unit_summary?: string;
}

export interface MeteredLineItem {
  id: string;
  metric_id: number;
  metric_key: string;
  metric_label: string;
  unit: string; // per-vm-month, per-gb, …
  unit_price: number;
  currency: string;
  estimated_quantity: number; // operator-projected usage for the month
  months: number;
  total_price?: number;
  unit_summary?: string;
}

export interface CalculatorData {
  pricing_requests: PricingRequest[];
  object_storage_items: ObjectStorageRequest[];
  // Track-3 add-ons surfaced through dedicated admin pricing pages
  // (SimpleDeploy plans, Shield/StormWall packages, AnyCloudFlow
  // services, usage-based metrics). Each is a separate bucket on the
  // calculator so the totals can be grouped by track in the summary.
  // AnyCloudFlow shares the same line-item shape as Shield because
  // both are IntegrationProduct-backed services.
  flow_plan_items?: FlowPlanLineItem[];
  shield_items?: ShieldServiceLineItem[];
  anycloudflow_items?: ShieldServiceLineItem[];
  metered_items?: MeteredLineItem[];
  apply_total_discount: boolean;
  total_discount_type: string;
  total_discount_value: string | number;
  total_discount_label?: string;
  country_code: string;
  currency_code: string;
  tenant_id?: string | number | null;
  client_id?: string | number | null;
}

export interface LineItem {
  id?: string | number;
  id_or_sku?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_amount: number;
  unit_price?: number;
  total: number;
  currency?: string;
}

export interface InvoicePayload {
  invoice_number: string;
  subject: string;
  bill_to_name: string;
  bill_to?: { name: string };
  issued_at: string;
  due_at: string;
  currency_code?: string;
  currency?: string;
  line_items: LineItem[];
  amounts: {
    currency: string;
    pre_discount_subtotal?: number;
    subtotal: number;
    discount: number;
    discount_label?: string;
    tax: number;
    total: number;
  };
}

export interface InvoiceData {
  payload: InvoicePayload;
  pdf?: string;
  filename?: string;
  // Persisted IDs surfaced by QuoteMultiInvoiceController::store on the
  // wrapper object alongside `payload` (the controller also folds them
  // into payload itself). Quotes carry `quote_number` and `status="quote"`.
  invoice_id?: number;
  invoice_uuid?: string;
  invoice_number?: string | null;
  quote_number?: string | null;
  status?: string;
}

export interface InvoiceResponse {
  invoices: InvoiceData[];
}
