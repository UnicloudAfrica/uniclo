/**
 * Orbit status mapper — translates internal status strings into the
 * `(mood, tone, friendlyLabel)` triple every Resilience list row uses.
 *
 * One shared dictionary so the list view, the detail page hero, the
 * dashboard stats, and the audit log all describe the same state in
 * the same plain-English voice. Power users still see the canonical
 * status code through ARIA labels (StatusBadge passes the technical
 * label through `aria-label` even when the visible label is friendly).
 *
 * Add a new domain by extending this file with another exported map —
 * keep all status mappings in one place so a copy edit lands once.
 */

import type { Mood } from "./MoodIndicator";
import type { StatusTone } from "./StatusBadge";

export interface FriendlyStatus {
  /** Mood for at-a-glance scanning of a row. */
  mood: Mood;
  /** StatusBadge tone — color/icon family. */
  tone: StatusTone;
  /** Plain-English label shown to sighted users. */
  friendly: string;
  /** Canonical technical label (read by screen readers). */
  technical: string;
}

const NEUTRAL_FALLBACK: FriendlyStatus = {
  mood: "thinking",
  tone: "neutral",
  friendly: "Unknown",
  technical: "unknown",
};

// ─── Workload migration statuses ─────────────────────────────────────────────

const WORKLOAD_MIGRATION: Record<string, FriendlyStatus> = {
  pending: { mood: "thinking", tone: "neutral", friendly: "Just sitting here", technical: "Pending" },
  estimating: { mood: "working", tone: "running", friendly: "Doing the math", technical: "Estimating" },
  estimated: { mood: "thinking", tone: "pending", friendly: "Ready when you are", technical: "Estimated" },
  confirmed: { mood: "thinking", tone: "pending", friendly: "Confirmed — about to start", technical: "Confirmed" },
  in_progress: { mood: "working", tone: "running", friendly: "On its way!", technical: "In Progress" },
  completed: { mood: "happy", tone: "success", friendly: "Made it! ✨", technical: "Completed" },
  failed: { mood: "alarmed", tone: "danger", friendly: "Hit a snag", technical: "Failed" },
  cancelled: { mood: "idle", tone: "neutral", friendly: "Stopped on purpose", technical: "Cancelled" },
};

// ─── Batch migration statuses ────────────────────────────────────────────────

const BATCH_MIGRATION: Record<string, FriendlyStatus> = {
  pending: { mood: "thinking", tone: "neutral", friendly: "Waiting in line", technical: "Pending" },
  validating: { mood: "working", tone: "running", friendly: "Double-checking everything", technical: "Validating" },
  ready: { mood: "thinking", tone: "pending", friendly: "Packed and ready", technical: "Ready" },
  running: { mood: "working", tone: "running", friendly: "Moving the whole batch", technical: "Running" },
  paused: { mood: "thinking", tone: "warning", friendly: "Took a break", technical: "Paused" },
  completed: { mood: "happy", tone: "success", friendly: "All servers landed", technical: "Completed" },
  partial_failure: { mood: "worried", tone: "warning", friendly: "Some made it, some didn't", technical: "Partial failure" },
  failed: { mood: "alarmed", tone: "danger", friendly: "The batch hit a wall", technical: "Failed" },
  cancelled: { mood: "idle", tone: "neutral", friendly: "Stopped on purpose", technical: "Cancelled" },
};

// ─── Hypervisor connection / VM state statuses ──────────────────────────────

const HYPERVISOR_CONNECTION: Record<string, FriendlyStatus> = {
  detected: { mood: "happy", tone: "success", friendly: "Connected and ready", technical: "Detected" },
  detecting: { mood: "working", tone: "running", friendly: "Saying hello", technical: "Detecting" },
  failed: { mood: "alarmed", tone: "danger", friendly: "Can't reach it", technical: "Detection failed" },
  unsupported: { mood: "worried", tone: "warning", friendly: "We don't speak this kind", technical: "Unsupported" },
  pending: { mood: "thinking", tone: "neutral", friendly: "Not checked yet", technical: "Pending" },
};

const HYPERVISOR_VM: Record<string, FriendlyStatus> = {
  running: { mood: "happy", tone: "success", friendly: "Up and running", technical: "Running" },
  stopped: { mood: "idle", tone: "neutral", friendly: "Powered off", technical: "Stopped" },
  paused: { mood: "thinking", tone: "warning", friendly: "Paused", technical: "Paused" },
  suspended: { mood: "thinking", tone: "warning", friendly: "Asleep", technical: "Suspended" },
  migrating: { mood: "working", tone: "running", friendly: "Moving to a new home", technical: "Migrating" },
  unknown: { mood: "thinking", tone: "neutral", friendly: "We're not sure", technical: "Unknown" },
};

// ─── Ransomware scan statuses ───────────────────────────────────────────────

const RANSOMWARE_SCAN: Record<string, FriendlyStatus> = {
  scanning: { mood: "working", tone: "running", friendly: "Looking around", technical: "Scanning" },
  clean: { mood: "happy", tone: "success", friendly: "All clear", technical: "Clean" },
  suspicious: { mood: "worried", tone: "warning", friendly: "Something looks off", technical: "Suspicious" },
  detected: { mood: "alarmed", tone: "danger", friendly: "Threat detected — act fast", technical: "Detected" },
  recovering: { mood: "working", tone: "running", friendly: "Restoring from a clean point", technical: "Recovering" },
  recovered: { mood: "happy", tone: "success", friendly: "Back to safe", technical: "Recovered" },
  acknowledged: { mood: "thinking", tone: "neutral", friendly: "Reviewed by your team", technical: "Acknowledged" },
};

// ─── DR Drill statuses ──────────────────────────────────────────────────────

const DR_DRILL: Record<string, FriendlyStatus> = {
  scheduled: { mood: "thinking", tone: "pending", friendly: "Drill on the calendar", technical: "Scheduled" },
  running: { mood: "working", tone: "running", friendly: "Drilling now", technical: "Running" },
  passed: { mood: "happy", tone: "success", friendly: "Passed — recovery would work", technical: "Passed" },
  failed: { mood: "alarmed", tone: "danger", friendly: "Drill failed — needs attention", technical: "Failed" },
  cancelled: { mood: "idle", tone: "neutral", friendly: "Stopped on purpose", technical: "Cancelled" },
};

// ─── Bucket migration / replication statuses ───────────────────────────────

const BUCKET_OPERATION: Record<string, FriendlyStatus> = {
  pending: { mood: "thinking", tone: "neutral", friendly: "Queued up", technical: "Pending" },
  running: { mood: "working", tone: "running", friendly: "Copying files", technical: "Running" },
  paused: { mood: "thinking", tone: "warning", friendly: "Paused", technical: "Paused" },
  draining: { mood: "working", tone: "running", friendly: "Finishing the last bits", technical: "Draining" },
  completed: { mood: "happy", tone: "success", friendly: "All files moved", technical: "Completed" },
  failed: { mood: "alarmed", tone: "danger", friendly: "Some files didn't make it", technical: "Failed" },
  cancelled: { mood: "idle", tone: "neutral", friendly: "Stopped on purpose", technical: "Cancelled" },
};

// ─── Public lookup ──────────────────────────────────────────────────────────

export type StatusDomain =
  | "workload-migration"
  | "batch-migration"
  | "hypervisor-connection"
  | "hypervisor-vm"
  | "ransomware-scan"
  | "dr-drill"
  | "bucket-operation";

const DOMAIN_MAPS: Record<StatusDomain, Record<string, FriendlyStatus>> = {
  "workload-migration": WORKLOAD_MIGRATION,
  "batch-migration": BATCH_MIGRATION,
  "hypervisor-connection": HYPERVISOR_CONNECTION,
  "hypervisor-vm": HYPERVISOR_VM,
  "ransomware-scan": RANSOMWARE_SCAN,
  "dr-drill": DR_DRILL,
  "bucket-operation": BUCKET_OPERATION,
};

/**
 * Look up the friendly status triple for a given (domain, status) pair.
 * Falls back to a neutral "Unknown" entry rather than throwing — so a
 * new status code from upstream renders safely until we add a mapping.
 */
export function friendlyStatus(domain: StatusDomain, status: string | null | undefined): FriendlyStatus {
  if (!status) return NEUTRAL_FALLBACK;
  const map = DOMAIN_MAPS[domain];
  return map[status] ?? { ...NEUTRAL_FALLBACK, technical: status };
}
