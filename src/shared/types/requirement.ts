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
  target_type?: "client" | "tenant" | null;
  target_id?: string | null;
  fields: RequirementField[];
  enforcement: "required" | "optional" | "off";
  grace_period_days?: number | null;
  version?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** An immutable audit record of one subject's submission against a requirement. */
export interface RequirementSubmissionRecord {
  id: number;
  status: string;
  submitted_at: string | null;
  requirement_version: number;
  subject: { type: string; id: string; name: string; email: string | null };
  snapshot: { title?: string; fields?: RequirementField[] };
  values: Record<string, unknown>;
  /** Per-field auto-verification outcome (e.g. NG business CAC via Mono), keyed by field key. */
  verifications?: Record<string, { status?: string; provider?: string | null; reason?: string | null }>;
}
