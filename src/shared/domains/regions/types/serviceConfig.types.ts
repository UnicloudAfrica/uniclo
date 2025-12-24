/**
 * Service Configuration Types
 * Types for region service configuration (compute, object_storage, etc.)
 */

/** Provider selection option */
export interface ProviderOption {
  value: string;
  label: string;
}

/** Field definition from provider schema */
export interface FieldDefinition {
  label: string;
  type: "text" | "password" | "number" | "email" | "url";
  placeholder?: string;
  help?: string;
  required?: boolean;
}

/** Service definition from provider */
export interface ServiceDefinition {
  label: string;
  description: string;
  fields: Record<string, FieldDefinition>;
}

/** Services schema from provider API */
export interface ProviderServicesSchema {
  services: Record<string, ServiceDefinition>;
}

/** State for a single service configuration */
export interface ServiceConfigState {
  enabled: boolean;
  mode: "manual" | "automated";
  credentials: Record<string, string>;
}

/** Connection status for a service */
export type ServiceConnectionStatus = "connected" | "not_configured";

/** Region form data for create/edit */
export interface RegionFormData {
  name: string;
  code: string;
  country_code: string;
  city: string;
  provider: string;
  is_active: boolean;
  visibility: "public" | "private";
  fast_track_mode: "disabled" | "owner_only" | "grant_only";
}

/** Initial region form data defaults */
export const DEFAULT_REGION_FORM_DATA: RegionFormData = {
  name: "",
  code: "",
  country_code: "",
  city: "",
  provider: "zadara",
  is_active: true,
  visibility: "public",
  fast_track_mode: "disabled",
};

/** Available cloud providers */
export const CLOUD_PROVIDERS: ProviderOption[] = [
  { value: "zadara", label: "Zadara" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "Google Cloud" },
];
