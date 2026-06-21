/**
 * Canonical instance-status classification for the fleet summary tiles.
 *
 * The backing values mirror the backend enum
 * `App\Enums\InstanceStatus` (api/app/Enums/InstanceStatus.php). A freshly
 * ordered VM sits in `pending` (the common case) or `awaiting_manual_provisioning`
 * while it provisions — both MUST count as "provisioning". The previous inline
 * filters only matched `provisioning` (plus a few non-enum legacy strings), so a
 * fleet of 13 `pending` instances rendered as "Provisioning 0".
 *
 * Keep these buckets in lockstep with the backend enum.
 */

/** In-flight states: the customer paid, the VM is being built. */
export const PROVISIONING_STATUSES = [
  "pending",
  "awaiting_manual_provisioning",
  "provisioning",
  // transitional states some providers report during reboots/builds:
  "building",
  "reboot",
  "hard_reboot",
] as const;

/** Up-and-serving states. */
export const RUNNING_STATUSES = ["active", "running"] as const;

/** Idle / halted states. `suspended` is the enum value; the rest are
 * provider-reported equivalents kept for robustness. */
export const STOPPED_STATUSES = ["suspended", "stopped", "shutoff", "paused"] as const;

const PROVISIONING = new Set<string>(PROVISIONING_STATUSES);
const RUNNING = new Set<string>(RUNNING_STATUSES);
const STOPPED = new Set<string>(STOPPED_STATUSES);

const normalize = (status: unknown): string => String(status ?? "").toLowerCase();

export const isProvisioning = (status: unknown): boolean => PROVISIONING.has(normalize(status));
export const isRunning = (status: unknown): boolean => RUNNING.has(normalize(status));
export const isStopped = (status: unknown): boolean => STOPPED.has(normalize(status));

export interface InstanceLike {
  status?: unknown;
  bandwidth_count?: number | string;
  [key: string]: unknown;
}

export interface FleetSummary {
  total: number;
  running: number;
  provisioning: number;
  stopped: number;
  bandwidthReady: number;
}

/**
 * Summarise a complete instance collection. Counts are only correct when the
 * caller passes the *whole* fleet — pass `per_page: 0` to the list hook so the
 * endpoint returns every instance rather than the first page.
 */
export const summarizeInstances = (instances: InstanceLike[]): FleetSummary => ({
  total: instances.length,
  running: instances.filter((i) => isRunning(i.status)).length,
  provisioning: instances.filter((i) => isProvisioning(i.status)).length,
  stopped: instances.filter((i) => isStopped(i.status)).length,
  bandwidthReady: instances.filter((i) => Number(i.bandwidth_count ?? 0) > 0).length,
});
