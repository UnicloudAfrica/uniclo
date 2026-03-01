export type OnboardingStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "completed"
  | (string & {});

export interface OnboardingOption {
  value: string;
  label: string;
}

export type OnboardingFieldType =
  | "text"
  | "textarea"
  | "file"
  | "select"
  | "date"
  | "email"
  | "url"
  | "password"
  | "collection";

export interface OnboardingFieldDefinition {
  id: string;
  label: string;
  type?: OnboardingFieldType;
  required?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  placeholder?: string;
  accept?: string;
  rows?: number;
  options?: OnboardingOption[];
  itemLabel?: string;
  fields?: OnboardingFieldDefinition[];
}

export interface OnboardingStepDefinition {
  id: string;
  label: string;
  description: string;
  custom?: string;
  fields?: OnboardingFieldDefinition[];
}

export interface UploadedFileValue {
  url?: string;
  path?: string;
  preview?: string;
  name?: string;
  original_name?: string;
  document_id?: string | number;
  [key: string]: unknown;
}

export type OnboardingFileValue = string | UploadedFileValue | null | undefined;

export interface LookupItem {
  id?: string | number;
  name: string;
  [key: string]: unknown;
}

interface TenantScopedReference {
  id?: string | number | null;
  tenant_id?: string | number | null;
  [key: string]: unknown;
}

export interface OnboardingStepState {
  id: string;
  status?: OnboardingStatus;
  [key: string]: unknown;
}

export interface OnboardingProgress {
  approved?: number;
  required?: number;
  [key: string]: unknown;
}

export interface OnboardingStateData {
  status?: OnboardingStatus;
  persona?: string;
  target?: string;
  tenant_id?: string | number | null;
  tenant?: TenantScopedReference;
  account?: TenantScopedReference;
  workspace?: TenantScopedReference;
  relationships?: TenantScopedReference;
  context?: TenantScopedReference;
  current_step?: string | null;
  steps?: OnboardingStepState[];
  progress?: OnboardingProgress;
  [key: string]: unknown;
}

export interface OnboardingThreadAuthor {
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export interface OnboardingThread {
  id: string | number;
  message?: string;
  action?: string;
  created_at?: string;
  author?: OnboardingThreadAuthor;
  [key: string]: unknown;
}

export interface OnboardingDocument {
  id: string | number;
  category?: string;
  version?: string | number;
  status?: string;
  url?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface OnboardingSubmissionData {
  status?: OnboardingStatus;
  payload?: Record<string, unknown>;
  documents?: OnboardingDocument[];
  threads?: OnboardingThread[];
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface StatusMeta {
  label: string;
  tone: string;
}
