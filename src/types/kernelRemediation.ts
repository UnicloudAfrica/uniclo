export type KernelRemediationType = 'upgrade' | 'downgrade';

export type KernelRemediationStatus =
  | 'planned'
  | 'approved'
  | 'snapshotting'
  | 'executing'
  | 'rebooting'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'rolled_back'
  | 'cancelled';

export interface KernelRemediationRef {
  id: number;
  external_endpoint_id: number;
  acf_remediation_identifier: string;
  acf_remediation_status: KernelRemediationStatus;
  type: KernelRemediationType;
  source_kernel: string;
  target_kernel: string;
  last_result: KernelRemediationDetail | null;
  last_polled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KernelRemediationDetail {
  identifier: string;
  type: KernelRemediationType;
  status: KernelRemediationStatus;
  source_kernel: string;
  target_kernel: string;
  source_arch: string;
  os_family: string | null;
  previous_kernel: string | null;
  plan_details: RemediationPlanDetails | null;
  execution_log: RemediationStepResult[] | null;
  blockers: string[];
  warnings: string[];
  error_message: string | null;
  rollback_reason: string | null;
  approved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  rolled_back_at: string | null;
  created_at: string;
}

export interface RemediationPlanDetails {
  steps: string[];
  package_available: boolean;
  package_name: string | null;
  estimated_duration_seconds: number;
  boot_mode: 'uefi' | 'bios' | null;
  previous_kernel: string;
}

export interface RemediationStepResult {
  step: string;
  status: 'success' | 'failed' | 'skipped';
  output: string | null;
  duration_seconds: number | null;
  error?: string | null;
}

export function isTerminalStatus(status: KernelRemediationStatus): boolean {
  return ['completed', 'failed', 'rolled_back', 'cancelled'].includes(status);
}

export function isActiveStatus(status: KernelRemediationStatus): boolean {
  return ['approved', 'snapshotting', 'executing', 'rebooting', 'verifying'].includes(status);
}
