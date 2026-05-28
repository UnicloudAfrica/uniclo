/**
 * Tenant CuberWatch monitoring page hook.
 *
 * Composes the tenant-scoped subscription/status/tiers/hosts endpoints
 * (already mounted under `/api/v1/tenant/monitoring/*` — see
 * `api/routes/tenant.php` and `MonitoringSubscriptionController`) into the
 * single shape the page renders:
 *
 *   {
 *     subscription: { plan, host_count, host_limit, currency, price_per_host },
 *     hosts: [{ id, name, ip, status, last_seen_at, requires_operator_install,
 *               install_command }],
 *   }
 *
 * Producer notes (parallel BE change being shipped on
 * `IntegrationSubscription.config.assigned_hosts[i]`):
 *
 *   - `host_secret`            — set by `RegisterHostOnCuberWatchJob` once
 *                                CuberWatch returns it.
 *   - `pending_install_command` — set by `InstallCuberWatchAgentJob` when no
 *                                 SSH exec service is wired, so an operator
 *                                 must run the agent install manually.
 *   - `requires_operator_install` — flag on the subscription that flips ON in
 *                                   that same path.
 *
 * The current `MonitoringSubscriptionController@hosts` only projects
 * `id, name, identifier, ip_address, region, status` from the Instance row
 * — it does NOT (yet) merge the `assigned_hosts` JSON entry. Until that BE
 * patch lands, `install_command`/`requires_operator_install` will be
 * undefined here; the page renders the "Show install command" affordance
 * only when they are present, so the surface degrades gracefully.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } & AnyRecord =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T } & AnyRecord;

// ── Public types ─────────────────────────────────────────────────────

export type TenantMonitoringHostStatus =
  | "pending"
  | "connected"
  | "disconnected"
  | "unknown";

export interface TenantMonitoringHost {
  /** Stable id for React keys + assign/unassign mutations. */
  id: number;
  /** Display name (instance name / hostname). */
  name: string;
  /** Public/management IP, if known. */
  ip: string | null;
  /** Normalised host status — pending operator install / connected / disconnected. */
  status: TenantMonitoringHostStatus;
  /** Raw status string from upstream, kept for the badge label. */
  rawStatus: string;
  /** ISO8601 timestamp the agent last reported, or null if never. */
  last_seen_at: string | null;
  /**
   * True while the agent install command is pending operator execution
   * (no SSH exec service wired, see `InstallCuberWatchAgentJob`).
   */
  requires_operator_install: boolean;
  /**
   * Shell command the operator must run on the VM to install the agent.
   * Populated by `InstallCuberWatchAgentJob` when it defers to a manual
   * install — undefined otherwise.
   */
  install_command: string | null;
}

export interface TenantMonitoringSubscription {
  /** Plan tier — e.g. "basic", "standard", "professional", "enterprise". */
  plan: string;
  /** Number of hosts currently attached to the subscription. */
  host_count: number;
  /** Max hosts allowed under this plan. */
  host_limit: number;
  /** ISO 4217 currency code for `price_per_host` + monthly_cost. */
  currency: string;
  /** Per-host monthly price in `currency`. */
  price_per_host: number;
  /** Monthly cost in `currency` (price_per_host * host_count, server-side). */
  monthly_cost: number;
  /**
   * True when an active paid subscription exists. Drives the "no plan yet"
   * vs "plan active" branch in the UI.
   */
  hasActivePlan: boolean;
}

export interface TenantMonitoringData {
  subscription: TenantMonitoringSubscription;
  hosts: TenantMonitoringHost[];
}

// ── Internal: normalise status & timestamp shape ─────────────────────

/**
 * Map upstream status strings into the three-state model the UI shows.
 * Defaults to "pending" for instances that have just been assigned but
 * haven't started reporting yet.
 */
const normaliseHostStatus = (
  rawStatus: string | undefined,
  requiresOperatorInstall: boolean,
): TenantMonitoringHostStatus => {
  if (requiresOperatorInstall) return "pending";
  if (!rawStatus) return "unknown";
  const s = rawStatus.toLowerCase();
  if (["connected", "active", "running", "online", "ready"].includes(s)) {
    return "connected";
  }
  if (
    [
      "disconnected",
      "offline",
      "stopped",
      "failed",
      "error",
      "inactive",
      "terminated",
    ].includes(s)
  ) {
    return "disconnected";
  }
  if (["pending", "provisioning", "creating", "initializing"].includes(s)) {
    return "pending";
  }
  return "unknown";
};

/**
 * Pluck the install command for a host. BE writes it onto the
 * `assigned_hosts[i].pending_install_command` JSON entry; once
 * `MonitoringSubscriptionController@hosts` merges that into the host record
 * it'll appear at the top level. Falls back to null.
 */
const pickInstallCommand = (host: AnyRecord): string | null => {
  const v = host.pending_install_command ?? host.install_command;
  return typeof v === "string" && v.length > 0 ? v : null;
};

const pickRequiresOperatorInstall = (
  host: AnyRecord,
  subscriptionFlag: boolean,
): boolean => {
  const direct = host.requires_operator_install;
  if (typeof direct === "boolean") return direct;
  // No per-host flag yet — fall back to the subscription-level flag, but
  // only treat as pending when there's actually a command to surface.
  return subscriptionFlag && pickInstallCommand(host) !== null;
};

// ── Hook ─────────────────────────────────────────────────────────────

interface UseTenantMonitoringResult {
  data: TenantMonitoringData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch + reshape monitoring data for the tenant's CuberWatch organisation.
 *
 * Internally composes `/monitoring/status`, `/monitoring/tiers`, and
 * `/monitoring/hosts` (all tenant-scoped) into a single page-friendly shape.
 * Returns `data: null` while any of the three queries is still loading or
 * when the tenant has no subscription at all — the page renders a neutral
 * empty/loading state in that case.
 */
export const useTenantMonitoring = (): UseTenantMonitoringResult => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  const statusQuery = useQuery({
    queryKey: ["tenant-monitoring", "status", context],
    queryFn: async () => {
      const res = asEnvelope(
        await entry.silentApi.get<AnyRecord>(
          `${entry.urlPrefix}/monitoring/status`,
        ),
      );
      return res as AnyRecord;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const tiersQuery = useQuery({
    queryKey: ["tenant-monitoring", "tiers", context],
    queryFn: async () => {
      const res = asEnvelope<{ tiers: AnyRecord[] }>(
        await entry.silentApi.get<AnyRecord>(
          `${entry.urlPrefix}/monitoring/tiers`,
        ),
      );
      return (res.tiers ?? (res as AnyRecord).data ?? []) as AnyRecord[];
    },
    staleTime: 60_000 * 5,
    refetchOnWindowFocus: false,
  });

  const hostsQuery = useQuery({
    queryKey: ["tenant-monitoring", "hosts", context],
    queryFn: async () => {
      const res = asEnvelope<{ hosts: AnyRecord[]; total: number }>(
        await entry.silentApi.get<AnyRecord>(
          `${entry.urlPrefix}/monitoring/hosts`,
        ),
      );
      return res as AnyRecord;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const data = useMemo<TenantMonitoringData | null>(() => {
    if (statusQuery.isLoading || hostsQuery.isLoading) return null;

    const status = (statusQuery.data ?? {}) as AnyRecord;
    const tiers = (tiersQuery.data ?? []) as AnyRecord[];
    const hostsEnvelope = (hostsQuery.data ?? {}) as AnyRecord;

    const plan = (status.tier as string | undefined) ?? "basic";
    const hostLimit = (status.max_hosts as number | undefined) ?? 0;
    const hostCount = (status.used_hosts as number | undefined) ?? 0;
    const subscriptionMeta = (status.subscription ?? null) as AnyRecord | null;
    const subscriptionRequiresOperatorInstall =
      Boolean(
        (subscriptionMeta as AnyRecord | null)?.requires_operator_install ??
          status.requires_operator_install,
      );
    const monthlyCost =
      ((subscriptionMeta as AnyRecord | null)?.monthly_cost as
        | number
        | undefined) ??
      ((status.monthly_cost as number | undefined) ?? 0);

    // Find the matching tier so we can publish `price_per_host` + `currency`.
    const currentTierEntry = tiers.find((t) => {
      const svc = (t.service_type as string | undefined) ?? "";
      return svc === `monitoring_${plan}` || svc === plan;
    });
    const pricePerHost =
      (currentTierEntry?.price_per_host as number | undefined) ?? 0;
    const currency =
      ((subscriptionMeta as AnyRecord | null)?.currency as string | undefined) ??
      ((status.currency as string | undefined) ?? "USD");

    const rawHosts = Array.isArray(hostsEnvelope.hosts)
      ? (hostsEnvelope.hosts as AnyRecord[])
      : [];

    const hosts: TenantMonitoringHost[] = rawHosts.map((host) => {
      const requiresOperatorInstall = pickRequiresOperatorInstall(
        host,
        subscriptionRequiresOperatorInstall,
      );
      const rawStatus =
        (host.status as string | undefined) ??
        (host.health as string | undefined) ??
        "";
      return {
        id: Number(host.id ?? 0),
        name:
          (host.name as string | undefined) ??
          (host.identifier as string | undefined) ??
          `host-${host.id ?? "?"}`,
        ip:
          (host.ip as string | undefined) ??
          (host.ip_address as string | undefined) ??
          (host.public_ip as string | undefined) ??
          null,
        rawStatus,
        status: normaliseHostStatus(rawStatus, requiresOperatorInstall),
        last_seen_at:
          (host.last_seen_at as string | undefined) ??
          (host.last_reported_at as string | undefined) ??
          (host.updated_at as string | undefined) ??
          null,
        requires_operator_install: requiresOperatorInstall,
        install_command: pickInstallCommand(host),
      };
    });

    const subscription: TenantMonitoringSubscription = {
      plan,
      host_count: hostCount,
      host_limit: hostLimit,
      currency,
      price_per_host: pricePerHost,
      monthly_cost: monthlyCost,
      hasActivePlan:
        subscriptionMeta !== null && plan !== "basic" && hostLimit > 0,
    };

    return { subscription, hosts };
  }, [
    statusQuery.isLoading,
    statusQuery.data,
    tiersQuery.data,
    hostsQuery.isLoading,
    hostsQuery.data,
  ]);

  const error =
    (statusQuery.error as Error | null) ??
    (hostsQuery.error as Error | null) ??
    (tiersQuery.error as Error | null) ??
    null;

  return {
    data,
    isLoading: statusQuery.isLoading || hostsQuery.isLoading,
    isError: statusQuery.isError || hostsQuery.isError,
    error,
    refetch: () => {
      void statusQuery.refetch();
      void hostsQuery.refetch();
      void tiersQuery.refetch();
    },
  };
};

// Test-only export for unit-testing pure helpers without spinning up the hook.
export const __testables = {
  normaliseHostStatus,
  pickInstallCommand,
  pickRequiresOperatorInstall,
};
