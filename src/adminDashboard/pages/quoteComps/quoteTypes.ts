export type MultiQuoteFormData = {
  subject: string;
  email: string;
  emails: string;
  notes: string;
  bill_to_name: string;
  apply_total_discount: boolean;
  total_discount_type: string;
  total_discount_value: string;
  total_discount_label: string;
  create_lead: boolean;
  lead_first_name: string;
  lead_last_name: string;
  lead_email: string;
  lead_phone: string;
  lead_company: string;
  lead_country: string;
  region: string;
  compute_instance_id: number | null;
  os_image_id: number | null;
  months: number;
  number_of_instances: number;
  volume_type_id: number | null;
  storage_size_gb: string;
  bandwidth_id: number | null;
  bandwidth_count: number;
  floating_ip_id: number | null;
  floating_ip_count: number;
  cross_connect_id: number | null;
  object_storage_region: string;
  object_storage_product_id: number | null;
  object_storage_quantity: number;
  object_storage_months: number;
};

export type MultiQuoteFormErrors = Partial<Record<keyof MultiQuoteFormData | "general", string>>;

export type UpdateFormData = (
  field: keyof MultiQuoteFormData,
  value: MultiQuoteFormData[keyof MultiQuoteFormData]
) => void;
