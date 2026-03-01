export interface QueueEntry {
  key: string;
  persona: string;
  target: "tenant" | "client";
  tenant_id?: string;
  user_id?: string;
  stepId?: string;
  label: string;
  subtitle?: string;
  email?: string;
  tenant_name?: string;
  queued_since?: string;
  last_activity_at?: string;
  total_pending?: number;
  awaiting_steps?: Array<{
    id: string;
    label: string;
    status: string;
  }>;
}

export interface SubmissionDocument {
  id: string;
  url?: string;
  path?: string;
  category?: string;
  created_at?: string;
  version?: string;
}

export interface SubmissionThread {
  id: string;
  created_at: string;
  message: string;
  action?: string;
  author?: {
    name?: string;
    type?: string;
  };
  attachments?: Array<{
    name?: string;
    url: string;
  }>;
}

export interface Founder {
  id?: string;
  name?: string;
  role?: string;
  ownership?: string;
  nationality?: string;
  identifier?: string;
  is_board_director?: boolean | string;
  national_id_type?: string;
  national_id_number?: string;
  address?: string;
  utility_bill?: SubmissionDocument;
  supporting_id?: SubmissionDocument;
}

export interface SubmissionData {
  status: string;
  submitted_at?: string;
  reviewed_at?: string;
  payload?: Record<string, unknown> & {
    founders?: Founder[];
  };
  documents?: SubmissionDocument[];
  threads?: SubmissionThread[];
}
