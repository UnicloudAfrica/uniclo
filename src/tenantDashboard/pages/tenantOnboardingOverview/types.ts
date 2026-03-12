import { STATUS_LABELS, STATUS_OPTIONS } from "@/shared/constants/onboarding";
import type { TenantOnboardingTarget } from "@/hooks/tenantHooks/useTenantSubjectOnboarding";

export type OnboardingStatus = keyof typeof STATUS_LABELS | (string & {});
export type DecisionStatus = (typeof STATUS_OPTIONS)[number]["value"];

export interface ProgressSummary {
  percentage: number;
  approved: number;
  required: number;
}

export interface OnboardingStep {
  id: string | number;
  label?: string;
  status?: OnboardingStatus;
  requires_review?: boolean;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  [key: string]: unknown;
}

export interface OnboardingSubjectState {
  id?: string | number;
  name?: string;
  email?: string;
  tenant_name?: string;
  status?: OnboardingStatus;
  steps?: OnboardingStep[];
  current_step?: string | number | null;
  progress?: Partial<ProgressSummary>;
  [key: string]: unknown;
}

export interface OnboardingSubject {
  id: string | number;
  name?: string;
  email?: string;
  tenant_name?: string;
  target: TenantOnboardingTarget;
  subjectKey: string;
  source: "state" | "queue";
  status: OnboardingStatus;
  steps: OnboardingStep[];
  current_step?: string | number | null;
  progress: ProgressSummary;
}

export interface ReviewQueueEntry {
  key: string;
  target: TenantOnboardingTarget;
  tenant_id?: string | number | null;
  user_id?: string | number | null;
  label?: string;
  subtitle?: string;
  email?: string;
  tenant_name?: string;
  persona?: string;
  status?: OnboardingStatus;
  awaiting_steps?: OnboardingStep[];
  total_pending?: number;
  queued_since?: string | number;
  last_activity_at?: string | number;
  progress?: Partial<ProgressSummary>;
}

export interface SubmissionDocument {
  id: string | number;
  category?: string;
  created_at?: string;
  version?: string | number;
  url?: string;
}

export interface SubmissionAttachment {
  url?: string;
  name?: string;
}

export interface SubmissionThread {
  id: string | number;
  author?: { name?: string; type?: string };
  created_at?: string;
  message?: string;
  attachments?: SubmissionAttachment[];
  action?: string;
}
