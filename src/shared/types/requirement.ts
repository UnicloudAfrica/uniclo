/**
 * Dynamic Input Gate — shared types for Requirement definitions and their
 * field schema (mirrors the backend `requirements` table + RequirementGate).
 */
export type RequirementFieldType = "text" | "checkbox" | "file" | "verification" | "group";

export interface RequirementField {
  key: string;
  type: RequirementFieldType | string;
  label: string;
  required?: boolean;
  /** Consent statement shown next to a `checkbox` field. */
  consent_text?: string;
  /** `group`-only: repeatable sub-form (e.g. Founder 1, Founder 2 …). */
  item_label?: string;
  min?: number;
  max?: number;
  fields?: RequirementField[];
}

export interface RequirementRecord {
  id: number;
  key: string;
  title: string;
  description?: string | null;
  placement: string;
  scope: "platform" | "tenant";
  tenant_id?: string | null;
  persona?: "any" | "tenant" | "client" | null;
  account_type?: "any" | "individual" | "business" | null;
  country_code?: string | null;
  fields: RequirementField[];
  enforcement: "required" | "optional" | "off";
  grace_period_days?: number | null;
  version?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
