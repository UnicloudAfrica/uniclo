/**
 * Types for project infrastructure provisioning and normalisation.
 *
 * Used by projectInfrastructureHooks to normalise backend responses
 * into a consistent shape for admin/tenant/client infrastructure views.
 */

export interface InfrastructureComponent {
  status?: string;
  details?: Record<string, unknown> | Record<string, unknown>[];
  count?: number;
  ready_for_setup?: boolean;
  [key: string]: unknown;
}

export interface NormalizedDetail {
  [key: string]: unknown;
}

export interface NormalizedComponent {
  status: string;
  details: NormalizedDetail[] | null;
  count: number | null;
  error: null;
}

export interface InfrastructureBackendResponse {
  project?: { identifier: string; status: string; [key: string]: unknown };
  infrastructure?: Record<string, InfrastructureComponent>;
  completion_percentage?: number;
  estimated_completion_time?: number;
  [key: string]: unknown;
}
