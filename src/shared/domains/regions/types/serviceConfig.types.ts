export interface ProviderOption {
  value: string;
  label: string;
}

export const CLOUD_PROVIDERS: ProviderOption[] = [
  { value: "zadara", label: "Zadara" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "Google Cloud" },
];

export type RegionVisibility = "public" | "private";
export type FastTrackMode = "disabled" | "owner_only" | "grant_only";

export interface RegionFormData {
  name: string;
  code: string;
  country_code: string;
  city: string;
  provider: string;
  is_active: boolean;
  visibility: RegionVisibility;
  fast_track_mode: FastTrackMode;
}

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

export type RegionFormChangeHandler = <K extends keyof RegionFormData>(
  field: K,
  value: RegionFormData[K]
) => void;

export type ServiceFieldType = "text" | "password" | "number" | "email" | "url";

export interface FieldDefinition {
  label: string;
  type?: ServiceFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
}

export interface ServiceDefinition {
  label: string;
  description?: string;
  fields?: Record<string, FieldDefinition>;
}

export interface ProviderServicesSchema {
  services?: Record<string, ServiceDefinition>;
}

export interface ServiceConfigState {
  enabled: boolean;
  mode: "manual" | "automated";
  credentials: Record<string, string>;
}

export type ServiceConnectionStatus = "not_configured" | "connected" | "error";
