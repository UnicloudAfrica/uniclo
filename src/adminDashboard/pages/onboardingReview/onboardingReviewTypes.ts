import type { QueueEntry, SubmissionData } from "@/shared/types/onboarding";

// --- Interfaces ---

export interface PersonaOption {
  value: string;
  label: string;
  description: string;
  target: "tenant" | "client";
  subjectType: "tenant" | "client";
}

export interface Step {
  id: string;
  label: string;
  description?: string;
}

export interface EnrichedQueueEntry extends QueueEntry {
  id: string;
  _personaLabel: string;
  _secondaryLine: string | null;
  _queuedSince: string;
  _lastActivity: string;
  _awaitingSteps: Array<{
    id: string;
    label: string;
    status: string;
  }>;
  _isActive: boolean;
}

export interface PayloadEntry {
  id: string;
  fieldName: string;
  fieldValue: unknown;
}

export interface StepSummary {
  status: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}

export interface OnboardingReviewPageProps {
  personaOptions?: PersonaOption[];
  useQueueHook?: (params?: Record<string, unknown>, options?: Record<string, unknown>) => any;
  fetchSubmissionFn?: (args: {
    target: string;
    tenantId?: string | number | null;
    userId?: string | number | null;
    step: string;
  }) => Promise<{ submission: SubmissionData | null; meta: Record<string, unknown> }>;
  useSubmissionHook?: (
    args: {
      target: string;
      tenantId?: string | number | null;
      userId?: string | number | null;
      step: string | null;
    },
    options?: Record<string, unknown>
  ) => any;
  useUpdateStatusHook?: () => {
    mutate: (
      args: {
        target: string;
        tenantId?: string | number | null;
        userId?: string | number | null;
        step: string;
        status: string;
        message?: string;
        meta?: Record<string, unknown>;
      },
      options?: Record<string, unknown>
    ) => void;
    isPending: boolean;
  };
  title?: string;
  description?: string;
  queueRefreshMs?: number;
}

export type TenantOptionItem = Record<string, unknown> & {
  id?: string;
  name?: string;
  company_name?: string;
  identifier?: string;
  slug?: string;
  email?: string;
};

export interface ProgressSnapshot {
  completed: number;
  inFlight: number;
  pending: number;
  percent: number;
}

export interface StepItem {
  id: string;
  label: string;
  status: string;
}

export {
  type QueueEntry,
  type SubmissionData,
  type SubmissionThread,
  type SubmissionDocument,
} from "@/shared/types/onboarding";
