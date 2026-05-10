/**
 * Orbit / VM Endpoint domain types — FR-043.
 *
 * Mirrors the response shapes from AcF's `/v1/vms/*` endpoints (which
 * UniCloud proxies under `/integrations/orbit/vms/*`). Keep these
 * types stable: every page rendering a source-VM card depends on them.
 */

/** Source-VM type. Determines the migration path AcF will choose. */
export type VmSourceType =
  | "linux"
  | "windows"
  | "vmware"
  | "hyperv"
  | "kvm"
  | "on_prem"
  | "aws_ec2"
  | "azure_vm"
  | "gcp_vm";

export type VmEndpointHealth = "healthy" | "degraded" | "unreachable" | "unknown";

export interface VmEndpoint {
  identifier: string;
  name: string;
  host: string;
  port: number;
  source_type: VmSourceType;
  /** UniCloud credential vault reference — never the raw secret. */
  credential_ref: string;
  health: VmEndpointHealth;
  /** ISO-8601 timestamp of last successful reach. */
  last_seen_at?: string | null;
  /** When a discovery scan is running, the percent done [0, 100]. */
  scan_progress_percent?: number | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Result of a connection test (POST /test-connection). Returned BEFORE
 * persisting the endpoint, so the user sees green/red/why before saving.
 */
export interface VmConnectionTestResult {
  /** True when AcF could open a session and run a baseline probe. */
  reachable: boolean;
  /** Round-trip time of the probe in milliseconds. */
  latency_ms?: number;
  /** OS family detected during the probe. */
  detected_os?: string;
  /** Human-readable reason if `reachable === false`. */
  reason?: string;
  /** Timestamp the test ran. */
  tested_at: string;
}

/** Status of a discovery scan in progress. */
export interface VmScanStatus {
  identifier: string;
  state: "queued" | "running" | "succeeded" | "failed";
  /** [0, 100] */
  progress_percent: number;
  /** Phase the scan is currently in (varies by scan_type). */
  phase?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

/**
 * The fat object returned by GET /vms/{id}/assessment. Contains everything
 * the migration wizard needs to size + price the move and surface
 * remediation work to the customer.
 */
export interface VmAssessment {
  identifier: string;
  generated_at: string;
  /** OS / kernel / patch level */
  os: {
    family: string;
    distribution?: string;
    version: string;
    kernel?: string;
    patch_level?: string;
  };
  /** Discovered hardware sizing */
  hardware: {
    cpu_cores: number;
    cpu_model?: string;
    memory_mb: number;
    disks: Array<{
      device: string;
      size_bytes: number;
      used_bytes?: number;
      filesystem?: string;
      encrypted?: boolean;
    }>;
    nics: Array<{ name: string; ipv4?: string; mac?: string; speed_mbps?: number }>;
  };
  /** Detected application stack (web servers, databases, etc.). */
  application_stack?: Array<{
    name: string;
    version?: string;
    confidence: "high" | "medium" | "low";
    note?: string;
  }>;
  /** Things AcF identified that block or complicate the migration. */
  remediations: Array<{
    severity: "critical" | "high" | "medium" | "low" | "info";
    code: string;
    title: string;
    description: string;
    /** Optional one-line plain-English summary for the friendly UI. */
    friendly_summary?: string;
    /** Optional remediation steps. */
    steps?: string[];
  }>;
  /** Top-line readiness score [0, 100]. */
  readiness_score: number;
  /** Friendly headline distilled from the remediations + score. */
  headline?: string;
}
