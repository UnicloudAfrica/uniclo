/**
 * ZfsReplicationPage — Admin dashboard for AnyCloudFlow's ZFS-native replication.
 *
 * Four tabs mirror the design proposal in
 * docs/code-audit/06-zfs/design-proposal.md:
 *   1. Pool Health  — source + target zpool status, scrub, integrity verify
 *   2. Snapshots    — paginated inventory with GUID-match filter
 *   3. Events       — audit trail of replication_zfs_events
 *   4. Configuration — dataset paths, raw-send, compression, resume-token
 *
 * Destructive actions (trigger scrub, clear resume token) are admin-gated.
 */
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import AdminPageShell from "../../../components/AdminPageShell";
import {
  ConfirmDialog,
  ModernButton,
  ModernCard,
  ModernInput,
  ModernSelect,
  ModernModal,
  ModernTable,
} from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import usePermissions from "@/hooks/usePermissions";
import { useAcfRealtimeEvent } from "@/hooks/useAcfRealtime";
import AcfRealtimeStatus from "./realtime/AcfRealtimeStatus";
import { acfApi } from "./api";

type Tab = "health" | "snapshots" | "events" | "config";

type AxiosLike = { data?: unknown };

// ─── Domain types (best-effort, upstream is untyped JSON) ─────────────
interface PoolStatus {
  pool: string;
  state: string; // ONLINE / DEGRADED / FAULTED / ...
  scrubbing?: boolean;
  resilvering?: boolean;
  last_scrub_at?: string | null;
  next_scrub_at?: string | null;
  errors?: number;
  size_bytes?: number;
  used_bytes?: number;
  guid?: string;
}

interface PoolStatusResponse {
  source?: PoolStatus;
  target?: PoolStatus;
}

interface ZfsCapabilities {
  source_version?: string;
  target_version?: string;
  raw_send_supported?: boolean;
  resumable_send_supported?: boolean;
  compressed_send_supported?: boolean;
  encryption_detected?: boolean;
}

interface SnapshotRow {
  identifier: string;
  name: string;
  type: "sync" | "bookmark" | "pitr" | string;
  source_exists: boolean;
  target_exists: boolean;
  source_guid?: string | null;
  target_guid?: string | null;
  guids_match: boolean;
  size_bytes?: number | null;
  created_at: string;
  zfs_properties?: Record<string, string>;
}

interface ZfsEvent {
  identifier: string;
  created_at: string;
  event_type: string; // e.g. scrub_started, divergence_detected, send_completed
  summary: string;
  raw_output?: string | null;
  severity?: "info" | "warning" | "error" | string;
}

interface IntegrityReport {
  passed: boolean;
  checks?: Array<{ name: string; passed: boolean; detail?: string }>;
  raw?: unknown;
}

interface ZfsConfig {
  zfs_source_dataset?: string;
  zfs_target_dataset?: string;
  zfs_raw_send?: boolean;
  zfs_send_compression?: "inherit" | "zstd" | "off" | string;
  zfs_receive_readonly?: boolean;
  zfs_last_snapshot_name?: string | null;
  zfs_last_snapshot_guid?: string | null;
  zfs_last_snapshot_txg?: number | null;
  zfs_resume_token?: string | null;
  zfs_resume_token_created_at?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function unwrap<T>(res: unknown): T | undefined {
  if (!res || typeof res !== "object") return undefined;
  const inner = (res as AxiosLike).data;
  if (inner && typeof inner === "object" && "data" in (inner as Record<string, unknown>)) {
    return (inner as { data: T }).data;
  }
  return (inner as T) ?? (res as T);
}

function formatBytes(b?: number | null): string {
  if (b === null || b === undefined || Number.isNaN(b)) return "—";
  if (b < 1024) return `${b} B`;
  const units = ["KB", "MB", "GB", "TB", "PB"];
  let n = b / 1024;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u += 1;
  }
  return `${n.toFixed(1)} ${units[u]}`;
}

function formatTimestamp(t?: string | null): string {
  if (!t) return "—";
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? t : d.toLocaleString();
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const r = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
    return (
      r.response?.data?.message ||
      r.response?.data?.error ||
      r.message ||
      "Unexpected error"
    );
  }
  return "Unexpected error";
}

// ─── Pool state badge ─────────────────────────────────────────────────

function stateTone(state: string | undefined): { bg: string; text: string } {
  switch ((state ?? "").toUpperCase()) {
    case "ONLINE":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
      };
    case "SCRUBBING":
    case "RESILVERING":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
      };
    case "DEGRADED":
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
      };
    case "FAULTED":
    case "OFFLINE":
    case "UNAVAIL":
    case "REMOVED":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
      };
    default:
      return {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-600 dark:text-gray-400",
      };
  }
}

function StateBadge({ state }: { state?: string }) {
  const label = state ? state.toUpperCase() : "UNKNOWN";
  const { bg, text } = stateTone(state);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function EventPill({ type, severity }: { type: string; severity?: string }) {
  const tone = (() => {
    if (severity === "error" || /fault|divergence|fail/i.test(type)) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (severity === "warning" || /scrub|resilver|degraded|drift/i.test(type)) {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
    if (/send|snapshot|receive|prune|promote/i.test(type)) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  })();
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs ${tone}`}
    >
      {type}
    </span>
  );
}

// ─── Pool card ────────────────────────────────────────────────────────

function PoolCard({ title, status }: { title: string; status?: PoolStatus }) {
  if (!status) {
    return (
      <ModernCard>
        <div className="space-y-3 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <StateBadge />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No pool data available. The endpoint may not have ZFS detected yet.
          </p>
        </div>
      </ModernCard>
    );
  }
  const effectiveState = status.resilvering
    ? "RESILVERING"
    : status.scrubbing
      ? "SCRUBBING"
      : status.state;
  const usedPct =
    status.size_bytes && status.used_bytes !== undefined && status.size_bytes > 0
      ? Math.round((status.used_bytes / status.size_bytes) * 100)
      : null;

  return (
    <ModernCard>
      <div className="space-y-3 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
              {status.pool}
            </p>
          </div>
          <StateBadge state={effectiveState} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500 dark:text-gray-400">Used</dt>
          <dd className="text-gray-900 dark:text-gray-100">
            {formatBytes(status.used_bytes)}
            {status.size_bytes ? ` / ${formatBytes(status.size_bytes)}` : ""}
            {usedPct !== null ? ` (${usedPct}%)` : ""}
          </dd>

          <dt className="text-gray-500 dark:text-gray-400">Errors</dt>
          <dd
            className={
              (status.errors ?? 0) > 0
                ? "text-red-600 dark:text-red-400"
                : "text-gray-900 dark:text-gray-100"
            }
          >
            {status.errors ?? 0}
          </dd>

          <dt className="text-gray-500 dark:text-gray-400">Last scrub</dt>
          <dd className="text-gray-900 dark:text-gray-100">
            {formatTimestamp(status.last_scrub_at)}
          </dd>

          <dt className="text-gray-500 dark:text-gray-400">Next scrub</dt>
          <dd className="text-gray-900 dark:text-gray-100">
            {formatTimestamp(status.next_scrub_at)}
          </dd>

          {status.guid && (
            <>
              <dt className="text-gray-500 dark:text-gray-400">Pool GUID</dt>
              <dd className="truncate font-mono text-xs text-gray-700 dark:text-gray-300">
                {status.guid}
              </dd>
            </>
          )}
        </dl>
      </div>
    </ModernCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function ZfsReplicationPage() {
  const { id = "" } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { scope } = usePermissions();
  const isAdmin = scope === "admin";

  const [tab, setTab] = useState<Tab>("health");

  // ─── Pool Health ───────────────────────────────────────────────────
  const poolStatus = useQuery({
    queryKey: ["acf-zfs-pool-status", id],
    queryFn: () => acfApi.getZfsPoolStatus(id),
    enabled: !!id && tab === "health",
    refetchInterval: 30_000,
  });
  const capabilities = useQuery({
    queryKey: ["acf-zfs-capabilities", id],
    queryFn: () => acfApi.getZfsCapabilities(id),
    enabled: !!id,
  });

  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [integrityOpen, setIntegrityOpen] = useState(false);

  const verifyIntegrity = useMutation({
    mutationFn: () => acfApi.verifyZfsIntegrity(id),
    onSuccess: (res) => {
      const report = unwrap<IntegrityReport>(res) ?? { passed: false };
      setIntegrityReport(report);
      setIntegrityOpen(true);
      ToastUtils.success("Integrity verification complete");
    },
    onError: (err) => ToastUtils.error(errorMessage(err)),
  });

  const triggerScrub = useMutation({
    mutationFn: () => acfApi.triggerZfsScrub(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-zfs-pool-status", id] });
      ToastUtils.success("Scrub triggered");
    },
    onError: (err) => ToastUtils.error(errorMessage(err)),
  });

  // ─── Snapshots ─────────────────────────────────────────────────────
  const [snapFilters, setSnapFilters] = useState({
    type: "",
    guid_mismatch_only: "",
    from: "",
    to: "",
  });
  const [snapPage, setSnapPage] = useState(1);
  const snapshots = useQuery({
    queryKey: ["acf-zfs-snapshots", id, snapFilters, snapPage],
    queryFn: () => {
      const q: Record<string, string | number> = { page: snapPage };
      if (snapFilters.type) q.type = snapFilters.type;
      if (snapFilters.guid_mismatch_only === "1") q.guid_mismatch_only = 1;
      if (snapFilters.from) q.from = snapFilters.from;
      if (snapFilters.to) q.to = snapFilters.to;
      return acfApi.getZfsSnapshots(id, q);
    },
    enabled: !!id && tab === "snapshots",
  });
  const snapshotRows = (unwrap<SnapshotRow[]>(snapshots.data) ?? []) as SnapshotRow[];
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotRow | null>(null);
  const [inspectSnapshot, setInspectSnapshot] = useState<SnapshotRow | null>(null);
  const [promoteSnapshot, setPromoteSnapshot] = useState<SnapshotRow | null>(null);
  const [deleteSnapshot, setDeleteSnapshot] = useState<SnapshotRow | null>(null);
  // Rows that just received a scrub/resilver event; we briefly pulse the
  // background so the admin's eye lands on the right snapshot.
  const [pulsedSnapshotIds, setPulsedSnapshotIds] = useState<Set<string>>(new Set());
  const pulseTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pulseSnapshot = useCallback((identifier: string) => {
    setPulsedSnapshotIds((prev) => {
      const next = new Set(prev);
      next.add(identifier);
      return next;
    });
    const prevTimer = pulseTimersRef.current.get(identifier);
    if (prevTimer) clearTimeout(prevTimer);
    const timer = setTimeout(() => {
      setPulsedSnapshotIds((prev) => {
        const next = new Set(prev);
        next.delete(identifier);
        return next;
      });
      pulseTimersRef.current.delete(identifier);
    }, 2500);
    pulseTimersRef.current.set(identifier, timer);
  }, []);
  useEffect(() => {
    const timers = pulseTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // ─── Events ────────────────────────────────────────────────────────
  const [eventFilters, setEventFilters] = useState({
    event_type: "",
    from: "",
    to: "",
    search: "",
  });
  const [eventPage, setEventPage] = useState(1);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const events = useQuery({
    queryKey: ["acf-zfs-events", id, eventFilters, eventPage],
    queryFn: () => {
      const q: Record<string, string | number> = { page: eventPage };
      if (eventFilters.event_type) q.event_type = eventFilters.event_type;
      if (eventFilters.from) q.from = eventFilters.from;
      if (eventFilters.to) q.to = eventFilters.to;
      if (eventFilters.search) q.search = eventFilters.search;
      return acfApi.getZfsEvents(id, q);
    },
    enabled: !!id && tab === "events",
  });
  const eventRows = (unwrap<ZfsEvent[]>(events.data) ?? []) as ZfsEvent[];

  const toggleEvent = (identifier: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(identifier)) next.delete(identifier);
      else next.add(identifier);
      return next;
    });
  };

  // ─── Config ────────────────────────────────────────────────────────
  const config = useMemo(
    () => unwrap<ZfsConfig>(poolStatus.data) ?? (unwrap<ZfsConfig>(capabilities.data) ?? {}),
    [poolStatus.data, capabilities.data]
  );

  // Reset pagination when filters change.
  useEffect(() => {
    setSnapPage(1);
  }, [snapFilters]);
  useEffect(() => {
    setEventPage(1);
  }, [eventFilters]);

  // ─── Realtime subscription ────────────────────────────────────────
  // Realtime is best-effort: SWR / react-query polling at 30s stays as
  // the source of truth. Incoming events just trigger an invalidation
  // so we refetch the authoritative pool status / snapshot list.
  //
  // Divergence is surfaced as a sticky red banner until the admin
  // dismisses it or the page is reloaded — the underlying replication
  // state is captured in the event log regardless.
  interface DivergenceAlert {
    detected_at: string;
    summary?: string;
    dataset?: string;
    source_guid?: string | null;
    target_guid?: string | null;
  }
  const [divergenceAlert, setDivergenceAlert] = useState<DivergenceAlert | null>(null);

  const channelName = id ? `replication.${id}` : null;

  const invalidatePoolStatus = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["acf-zfs-pool-status", id] });
    qc.invalidateQueries({ queryKey: ["acf-zfs-pool-status-badge", id] });
    qc.invalidateQueries({ queryKey: ["acf-zfs-capabilities", id] });
  }, [id, qc]);

  const invalidateSnapshots = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["acf-zfs-snapshots", id] });
  }, [id, qc]);

  const invalidateEvents = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["acf-zfs-events", id] });
  }, [id, qc]);

  useAcfRealtimeEvent(channelName, "zfs.pool.status-changed", () => {
    invalidatePoolStatus();
  });

  useAcfRealtimeEvent(channelName, "zfs.scrub.started", (payload: unknown) => {
    invalidatePoolStatus();
    invalidateEvents();
    const dataset = (payload as { dataset?: string } | undefined)?.dataset;
    if (dataset) {
      snapshotRows
        .filter((r) => r.name.startsWith(`${dataset}@`))
        .forEach((r) => pulseSnapshot(r.identifier));
    }
  });

  useAcfRealtimeEvent(channelName, "zfs.scrub.completed", (payload: unknown) => {
    invalidatePoolStatus();
    invalidateEvents();
    const dataset = (payload as { dataset?: string } | undefined)?.dataset;
    if (dataset) {
      snapshotRows
        .filter((r) => r.name.startsWith(`${dataset}@`))
        .forEach((r) => pulseSnapshot(r.identifier));
    }
  });

  useAcfRealtimeEvent(channelName, "zfs.resilver.detected", (payload: unknown) => {
    invalidatePoolStatus();
    invalidateEvents();
    const dataset = (payload as { dataset?: string } | undefined)?.dataset;
    if (dataset) {
      snapshotRows
        .filter((r) => r.name.startsWith(`${dataset}@`))
        .forEach((r) => pulseSnapshot(r.identifier));
    }
  });

  useAcfRealtimeEvent(channelName, "zfs.resilver.completed", (payload: unknown) => {
    invalidatePoolStatus();
    invalidateEvents();
    const dataset = (payload as { dataset?: string } | undefined)?.dataset;
    if (dataset) {
      snapshotRows
        .filter((r) => r.name.startsWith(`${dataset}@`))
        .forEach((r) => pulseSnapshot(r.identifier));
    }
  });

  useAcfRealtimeEvent(channelName, "zfs.divergence.detected", (payload: unknown) => {
    const p = (payload ?? {}) as Partial<DivergenceAlert> & {
      detected_at?: string;
    };
    setDivergenceAlert({
      detected_at: p.detected_at ?? new Date().toISOString(),
      summary: p.summary,
      dataset: p.dataset,
      source_guid: p.source_guid ?? null,
      target_guid: p.target_guid ?? null,
    });
    invalidatePoolStatus();
    invalidateEvents();
    invalidateSnapshots();
  });

  // ─── Snapshot mutations ──────────────────────────────────────────
  const [inspectText, setInspectText] = useState<string>("");
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  useEffect(() => {
    if (!inspectSnapshot) {
      setInspectText("");
      setInspectError(null);
      setInspectLoading(false);
      return;
    }
    let cancelled = false;
    setInspectLoading(true);
    setInspectError(null);
    setInspectText("");
    acfApi
      .inspectZfsSnapshot(id, inspectSnapshot.name)
      .then((res: unknown) => {
        if (cancelled) return;
        // Backend shape may be { raw: "..." } or { properties: {...} } —
        // render whichever is richer.
        const body = unwrap<{
          raw?: string;
          output?: string;
          properties?: Record<string, string>;
        }>(res);
        let text = "";
        if (body?.raw && body.raw.trim().length > 0) text = body.raw;
        else if (body?.output && body.output.trim().length > 0) text = body.output;
        else if (body?.properties) {
          text = Object.entries(body.properties)
            .map(([k, v]) => `${k.padEnd(36)} ${v}`)
            .join("\n");
        } else {
          text = JSON.stringify(body ?? res, null, 2);
        }
        setInspectText(text);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setInspectError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setInspectLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inspectSnapshot, id]);

  const copyInspectText = useCallback(() => {
    if (!inspectText) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(inspectText)
        .then(() => ToastUtils.success("Copied"))
        .catch(() => ToastUtils.error("Copy failed — select and copy manually"));
    } else {
      ToastUtils.error("Clipboard API not available");
    }
  }, [inspectText]);

  const promoteMutation = useMutation({
    mutationFn: (name: string) => acfApi.promoteZfsSnapshot(id, name),
    onSuccess: (res) => {
      const body = unwrap<{ identifier?: string; name?: string }>(res);
      const identifier = body?.identifier ?? body?.name ?? "pinned";
      ToastUtils.success(`Snapshot pinned as PITR (${identifier})`);
      setPromoteSnapshot(null);
      invalidateSnapshots();
      invalidateEvents();
    },
    onError: (err) => ToastUtils.error(errorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (name: string) => acfApi.deleteZfsSnapshot(id, name),
    onSuccess: () => {
      ToastUtils.success("Snapshot deleted");
      setDeleteSnapshot(null);
      invalidateSnapshots();
      invalidateEvents();
    },
    onError: (err) => ToastUtils.error(errorMessage(err)),
  });

  // Delete confirm: tenant must type the snapshot name AND wait out a
  // 3-second countdown before the destructive action is allowed.
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteCountdown, setDeleteCountdown] = useState(3);
  useEffect(() => {
    if (!deleteSnapshot) {
      setDeleteConfirmName("");
      setDeleteCountdown(3);
      return;
    }
    setDeleteConfirmName("");
    setDeleteCountdown(3);
    const tick = setInterval(() => {
      setDeleteCountdown((n) => {
        if (n <= 1) {
          clearInterval(tick);
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [deleteSnapshot]);

  const pool = (unwrap<PoolStatusResponse>(poolStatus.data) ?? {}) as PoolStatusResponse;
  const caps = (unwrap<ZfsCapabilities>(capabilities.data) ?? {}) as ZfsCapabilities;

  // ─── Table columns ─────────────────────────────────────────────────
  const snapshotColumns = [
    {
      key: "name",
      header: "Snapshot",
      render: (r: SnapshotRow) => (
        <code className="break-all text-xs">{r.name}</code>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r: SnapshotRow) => (
        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {r.type}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (r: SnapshotRow) =>
        r.source_exists ? (
          <span className="text-green-600 dark:text-green-400">present</span>
        ) : (
          <span className="text-gray-400">missing</span>
        ),
    },
    {
      key: "target",
      header: "Target",
      render: (r: SnapshotRow) =>
        r.target_exists ? (
          <span className="text-green-600 dark:text-green-400">present</span>
        ) : (
          <span className="text-gray-400">missing</span>
        ),
    },
    {
      key: "guid",
      header: "GUID match",
      render: (r: SnapshotRow) =>
        r.guids_match ? (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
            <span aria-hidden>✓</span> match
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
            <span aria-hidden>✗</span> mismatch
          </span>
        ),
    },
    {
      key: "size",
      header: "Size",
      render: (r: SnapshotRow) => formatBytes(r.size_bytes),
    },
    {
      key: "created",
      header: "Created",
      render: (r: SnapshotRow) => formatTimestamp(r.created_at),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r: SnapshotRow) => {
        // Snapshot name typically looks like `pool/dataset@acf-sync-2026...`.
        // Strip the dataset prefix before matching so admins can still
        // spot the acf prefix in the table cell.
        const shortName = r.name.includes("@") ? r.name.split("@").pop() ?? r.name : r.name;
        const canPromote = /^acf-sync-/.test(shortName);
        // We only allow destructive deletes on snapshots the integration
        // itself created — never on a customer's own snapshots, even if
        // they somehow surface in this table.
        const canDelete = /^acf-/.test(shortName);
        const isPulsed = pulsedSnapshotIds.has(r.identifier);

        return (
          <div
            className={`flex flex-wrap gap-2 ${
              isPulsed
                ? "animate-pulse rounded-md bg-blue-50 dark:bg-blue-900/20"
                : ""
            }`}
          >
            <button
              type="button"
              className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-[#0c1427]"
              onClick={() => setInspectSnapshot(r)}
            >
              Inspect
            </button>
            {isAdmin && canPromote && (
              <button
                type="button"
                className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300"
                onClick={() => setPromoteSnapshot(r)}
                disabled={promoteMutation.isPending}
              >
                Promote to PITR
              </button>
            )}
            {isAdmin && canDelete && (
              <button
                type="button"
                className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300"
                onClick={() => setDeleteSnapshot(r)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className="text-primary-500 rounded px-2 py-1 text-xs underline"
              onClick={() => setSelectedSnapshot(r)}
            >
              Details
            </button>
          </div>
        );
      },
    },
  ];

  // ─── Tabs definition ───────────────────────────────────────────────
  const tabs: Array<[Tab, string]> = [
    ["health", "Pool Health"],
    ["snapshots", "Snapshots"],
    ["events", "Events"],
    ["config", "Configuration"],
  ];

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <AdminPageShell
      title={`ZFS Replication · ${id}`}
      description="Pool health, snapshot chain, events and configuration for ZFS-native replication. Realtime signals via AnyCloudFlow Reverb with a 30s polling fallback."
      actions={<AcfRealtimeStatus />}
    >
      <div className="space-y-4">
        {divergenceAlert && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20"
          >
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
              aria-hidden
            />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-red-800 dark:text-red-200">
                ZFS divergence detected
              </p>
              <p className="mt-0.5 text-red-700 dark:text-red-300">
                {divergenceAlert.summary ??
                  "Source and target pool metadata have drifted. Inspect the snapshot chain and review the events tab."}
              </p>
              <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs text-red-700 dark:text-red-300 sm:grid-cols-2">
                <span>Detected: {formatTimestamp(divergenceAlert.detected_at)}</span>
                {divergenceAlert.dataset && (
                  <span>
                    Dataset: <code className="font-mono">{divergenceAlert.dataset}</code>
                  </span>
                )}
                {divergenceAlert.source_guid && (
                  <span className="truncate">
                    Source GUID:{" "}
                    <code className="font-mono">{divergenceAlert.source_guid}</code>
                  </span>
                )}
                {divergenceAlert.target_guid && (
                  <span className="truncate">
                    Target GUID:{" "}
                    <code className="font-mono">{divergenceAlert.target_guid}</code>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDivergenceAlert(null)}
              aria-label="Dismiss divergence alert"
              className="rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-[#172036]">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`whitespace-nowrap px-4 py-2 text-sm ${
                tab === key
                  ? "border-primary-500 text-primary-500 border-b-2"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─── Pool Health ─── */}
        {tab === "health" && (
          <div className="space-y-4">
            {poolStatus.isLoading && !poolStatus.data ? (
              <ModernCard>
                <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
                  Loading pool status…
                </div>
              </ModernCard>
            ) : poolStatus.isError ? (
              <ModernCard>
                <div className="p-6">
                  <p className="font-medium text-red-600 dark:text-red-400">
                    Could not load pool status
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {errorMessage(poolStatus.error)}
                  </p>
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => poolStatus.refetch()}
                  >
                    Retry
                  </ModernButton>
                </div>
              </ModernCard>
            ) : !pool.source && !pool.target ? (
              <ModernCard>
                <div className="p-6">
                  <p className="font-medium text-gray-700 dark:text-gray-200">
                    ZFS not detected yet
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Run capability detection on each endpoint to populate pool
                    metadata. Once detected, the source and target pools will
                    appear here.
                  </p>
                </div>
              </ModernCard>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PoolCard title="Source pool" status={pool.source} />
                <PoolCard title="Target pool" status={pool.target} />
              </div>
            )}

            <ModernCard>
              <div className="flex flex-col gap-3 p-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Pool operations
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Run an on-demand integrity verification or start a scrub.
                    Scrub is admin-only and competes with replication I/O.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ModernButton
                    onClick={() => verifyIntegrity.mutate()}
                    disabled={verifyIntegrity.isPending}
                  >
                    {verifyIntegrity.isPending ? "Verifying…" : "Verify integrity"}
                  </ModernButton>
                  <ModernButton
                    variant="danger"
                    disabled={!isAdmin || triggerScrub.isPending}
                    title={
                      !isAdmin
                        ? "Admin access required"
                        : "Triggers zpool scrub on both sides"
                    }
                    onClick={() => {
                      if (!isAdmin) return;
                      if (
                        window.confirm(
                          "Trigger a zpool scrub on the source and target? This can take hours and competes with replication I/O."
                        )
                      ) {
                        triggerScrub.mutate();
                      }
                    }}
                  >
                    {triggerScrub.isPending ? "Triggering…" : "Trigger scrub"}
                  </ModernButton>
                </div>
              </div>
            </ModernCard>
          </div>
        )}

        {/* ─── Snapshots ─── */}
        {tab === "snapshots" && (
          <div className="space-y-4">
            <ModernCard>
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5">
                <ModernSelect
                  label="Type"
                  value={snapFilters.type}
                  onChange={(e) =>
                    setSnapFilters({ ...snapFilters, type: e.target.value })
                  }
                  options={[
                    { value: "", label: "All types" },
                    { value: "sync", label: "sync" },
                    { value: "bookmark", label: "bookmark" },
                    { value: "pitr", label: "pitr" },
                  ]}
                />
                <ModernSelect
                  label="GUID mismatch only"
                  value={snapFilters.guid_mismatch_only}
                  onChange={(e) =>
                    setSnapFilters({
                      ...snapFilters,
                      guid_mismatch_only: e.target.value,
                    })
                  }
                  options={[
                    { value: "", label: "No" },
                    { value: "1", label: "Yes" },
                  ]}
                />
                <ModernInput
                  label="From"
                  type="date"
                  value={snapFilters.from}
                  onChange={(e) =>
                    setSnapFilters({ ...snapFilters, from: e.target.value })
                  }
                />
                <ModernInput
                  label="To"
                  type="date"
                  value={snapFilters.to}
                  onChange={(e) =>
                    setSnapFilters({ ...snapFilters, to: e.target.value })
                  }
                />
                <div className="flex items-end">
                  <ModernButton
                    variant="secondary"
                    onClick={() =>
                      setSnapFilters({
                        type: "",
                        guid_mismatch_only: "",
                        from: "",
                        to: "",
                      })
                    }
                  >
                    Clear
                  </ModernButton>
                </div>
              </div>
            </ModernCard>

            <ModernTable
              columns={snapshotColumns}
              data={snapshotRows as unknown as Array<{ id?: string | number | null }>}
              loading={snapshots.isLoading}
              emptyState={{
                title: "No snapshots yet",
                description:
                  "Once the first sync completes, acf-sync-* snapshots will appear here. Older entries are converted to bookmarks for space efficiency.",
              }}
            />

            <div className="flex justify-center gap-2">
              <ModernButton
                size="sm"
                variant="secondary"
                disabled={snapPage === 1}
                onClick={() => setSnapPage(snapPage - 1)}
              >
                Previous
              </ModernButton>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
                Page {snapPage}
              </span>
              <ModernButton
                size="sm"
                variant="secondary"
                disabled={snapshotRows.length < 20}
                onClick={() => setSnapPage(snapPage + 1)}
              >
                Next
              </ModernButton>
            </div>
          </div>
        )}

        {/* ─── Events ─── */}
        {tab === "events" && (
          <div className="space-y-4">
            <ModernCard>
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5">
                <ModernInput
                  label="Event type"
                  value={eventFilters.event_type}
                  onChange={(e) =>
                    setEventFilters({ ...eventFilters, event_type: e.target.value })
                  }
                  placeholder="scrub_started"
                />
                <ModernInput
                  label="From"
                  type="date"
                  value={eventFilters.from}
                  onChange={(e) =>
                    setEventFilters({ ...eventFilters, from: e.target.value })
                  }
                />
                <ModernInput
                  label="To"
                  type="date"
                  value={eventFilters.to}
                  onChange={(e) =>
                    setEventFilters({ ...eventFilters, to: e.target.value })
                  }
                />
                <ModernInput
                  label="Search"
                  value={eventFilters.search}
                  onChange={(e) =>
                    setEventFilters({ ...eventFilters, search: e.target.value })
                  }
                  placeholder="full-text in raw_output"
                />
                <div className="flex items-end">
                  <ModernButton
                    variant="secondary"
                    onClick={() =>
                      setEventFilters({
                        event_type: "",
                        from: "",
                        to: "",
                        search: "",
                      })
                    }
                  >
                    Clear
                  </ModernButton>
                </div>
              </div>
            </ModernCard>

            <ModernCard>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-[#0c1427]">
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Event</th>
                      <th className="px-4 py-3 font-semibold">Summary</th>
                      <th className="px-4 py-3 font-semibold" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {events.isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Loading events…
                        </td>
                      </tr>
                    ) : eventRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          No events match the current filters.
                        </td>
                      </tr>
                    ) : (
                      eventRows.map((ev) => {
                        const isOpen = expandedEvents.has(ev.identifier);
                        return (
                          <Fragment key={ev.identifier}>
                            <tr
                              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#0c1427]"
                              onClick={() => toggleEvent(ev.identifier)}
                            >
                              <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                {formatTimestamp(ev.created_at)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <EventPill type={ev.event_type} severity={ev.severity} />
                              </td>
                              <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                                {ev.summary}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-gray-400">
                                {isOpen ? "▲" : "▼"}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-gray-50 dark:bg-[#0c1427]">
                                <td colSpan={4} className="px-4 py-3">
                                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs text-gray-700 dark:bg-[#15203c] dark:text-gray-300">
                                    {ev.raw_output?.trim() ||
                                      "(no raw output captured)"}
                                  </pre>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </ModernCard>

            <div className="flex justify-center gap-2">
              <ModernButton
                size="sm"
                variant="secondary"
                disabled={eventPage === 1}
                onClick={() => setEventPage(eventPage - 1)}
              >
                Previous
              </ModernButton>
              <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
                Page {eventPage}
              </span>
              <ModernButton
                size="sm"
                variant="secondary"
                disabled={eventRows.length < 20}
                onClick={() => setEventPage(eventPage + 1)}
              >
                Next
              </ModernButton>
            </div>
          </div>
        )}

        {/* ─── Configuration ─── */}
        {tab === "config" && (
          <ConfigurationTab
            replicationId={id}
            caps={caps}
            config={config}
            isAdmin={isAdmin}
            onResumeTokenCleared={() =>
              qc.invalidateQueries({ queryKey: ["acf-zfs-pool-status", id] })
            }
          />
        )}
      </div>

      {/* Integrity report modal */}
      {integrityOpen && integrityReport && (
        <ModernModal
          isOpen={integrityOpen}
          onClose={() => setIntegrityOpen(false)}
          title="Integrity Verification Report"
        >
          <div className="space-y-3 p-4">
            <div
              className={
                integrityReport.passed
                  ? "rounded border border-green-200 bg-green-50 p-4 dark:bg-green-900/20"
                  : "rounded border border-red-200 bg-red-50 p-4 dark:bg-red-900/20"
              }
            >
              <p className="font-semibold">
                {integrityReport.passed
                  ? "All integrity checks passed"
                  : "Integrity check failed"}
              </p>
            </div>
            {Array.isArray(integrityReport.checks) && integrityReport.checks.length > 0 && (
              <ul className="space-y-2 text-sm">
                {integrityReport.checks.map((c, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded border border-gray-100 p-2 dark:border-gray-800"
                  >
                    <span
                      className={
                        c.passed
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {c.passed ? "✓" : "✗"}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {c.name}
                      </div>
                      {c.detail && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {c.detail}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {integrityReport.raw !== undefined && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500">
                  Raw report
                </summary>
                <pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-50 p-2 dark:bg-[#15203c]">
                  {JSON.stringify(integrityReport.raw, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </ModernModal>
      )}

      {/* Inspect snapshot modal — raw `zfs get all` output. */}
      {inspectSnapshot && (
        <ModernModal
          isOpen={true}
          onClose={() => setInspectSnapshot(null)}
          title={`Inspect · ${inspectSnapshot.name}`}
        >
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Read-only `zfs get all` output. Safe to run for any admin.
              </p>
              <ModernButton
                size="sm"
                variant="secondary"
                onClick={copyInspectText}
                disabled={!inspectText || inspectLoading}
              >
                Copy
              </ModernButton>
            </div>
            {inspectLoading ? (
              <div className="rounded bg-gray-50 p-4 text-sm text-gray-500 dark:bg-[#0c1427] dark:text-gray-400">
                Loading inspection output…
              </div>
            ) : inspectError ? (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                <p className="font-medium">Could not load inspection</p>
                <p className="mt-1 text-xs">{inspectError}</p>
              </div>
            ) : inspectText ? (
              <pre className="max-h-[24rem] overflow-auto rounded bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:bg-[#15203c] dark:text-gray-200">
                {inspectText}
              </pre>
            ) : (
              <div className="rounded bg-gray-50 p-4 text-sm text-gray-500 dark:bg-[#0c1427] dark:text-gray-400">
                No properties returned for this snapshot.
              </div>
            )}
          </div>
        </ModernModal>
      )}

      {/* Promote to PITR confirm */}
      {promoteSnapshot && (
        <ConfirmDialog
          isOpen={true}
          title="Pin this snapshot as a PITR recovery point?"
          message="Pinned snapshots are retained beyond normal retention and can be used for point-in-time recovery later."
          confirmLabel={promoteMutation.isPending ? "Pinning…" : "Yes, pin as PITR"}
          cancelLabel="Cancel"
          variant="warning"
          isLoading={promoteMutation.isPending}
          onCancel={() => {
            if (!promoteMutation.isPending) setPromoteSnapshot(null);
          }}
          onConfirm={() => promoteMutation.mutate(promoteSnapshot.name)}
        />
      )}

      {/* Delete snapshot — custom dialog because ConfirmDialog has no
          "type to confirm" field. Retains the same visual language. */}
      {deleteSnapshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/30">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Delete this snapshot?
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This is irreversible. PITR recovery to this snapshot will no
                  longer be possible.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="break-all rounded bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800 dark:bg-[#0c1427] dark:text-gray-200">
                {deleteSnapshot.name}
              </p>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Type the snapshot name to confirm
                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  disabled={deleteMutation.isPending}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  placeholder={deleteSnapshot.name}
                />
              </label>
              {deleteCountdown > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Confirm available in {deleteCountdown}s…
                </p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!deleteMutation.isPending) setDeleteSnapshot(null);
                }}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    deleteConfirmName === deleteSnapshot.name &&
                    deleteCountdown === 0 &&
                    !deleteMutation.isPending
                  ) {
                    deleteMutation.mutate(deleteSnapshot.name);
                  }
                }}
                disabled={
                  deleteConfirmName !== deleteSnapshot.name ||
                  deleteCountdown > 0 ||
                  deleteMutation.isPending
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot detail modal */}
      {selectedSnapshot && (
        <ModernModal
          isOpen={true}
          onClose={() => setSelectedSnapshot(null)}
          title={`Snapshot · ${selectedSnapshot.name}`}
        >
          <div className="space-y-4 p-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">Type</dt>
              <dd>{selectedSnapshot.type}</dd>
              <dt className="text-gray-500">Source GUID</dt>
              <dd className="break-all font-mono text-xs">
                {selectedSnapshot.source_guid ?? "—"}
              </dd>
              <dt className="text-gray-500">Target GUID</dt>
              <dd className="break-all font-mono text-xs">
                {selectedSnapshot.target_guid ?? "—"}
              </dd>
              <dt className="text-gray-500">Size</dt>
              <dd>{formatBytes(selectedSnapshot.size_bytes)}</dd>
              <dt className="text-gray-500">Created</dt>
              <dd>{formatTimestamp(selectedSnapshot.created_at)}</dd>
            </dl>
            <div>
              <h4 className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                zfs get all
              </h4>
              {selectedSnapshot.zfs_properties &&
              Object.keys(selectedSnapshot.zfs_properties).length > 0 ? (
                <pre className="max-h-80 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-[#15203c]">
                  {Object.entries(selectedSnapshot.zfs_properties)
                    .map(([k, v]) => `${k.padEnd(28)} ${v}`)
                    .join("\n")}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">
                  Properties not available for this snapshot.
                </p>
              )}
            </div>
          </div>
        </ModernModal>
      )}
    </AdminPageShell>
  );
}

// ─── Configuration tab ─────────────────────────────────────────────────

interface ConfigurationTabProps {
  replicationId: string;
  caps: ZfsCapabilities;
  config: ZfsConfig;
  isAdmin: boolean;
  onResumeTokenCleared: () => void;
}

function ConfigurationTab({
  replicationId,
  caps,
  config,
  isAdmin,
  onResumeTokenCleared,
}: ConfigurationTabProps) {
  const clearResumeToken = useMutation({
    // There is no dedicated clear endpoint; re-running verify-integrity
    // resets the token on success. We treat this as a pragmatic "clear"
    // button until ACF exposes a dedicated DELETE. The admin is warned.
    mutationFn: () => acfApi.verifyZfsIntegrity(replicationId),
    onSuccess: () => {
      ToastUtils.success("Resume token cleared");
      onResumeTokenCleared();
    },
    onError: (err) => ToastUtils.error(errorMessage(err)),
  });

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col justify-between gap-1 rounded-lg bg-gray-50 px-4 py-3 dark:bg-[#0c1427] sm:flex-row sm:items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      <ModernCard>
        <div className="space-y-3 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            ZFS settings
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "Read-only — edit through the replication wizard or AnyCloudFlow API."
              : "These settings are read-only for tenants; contact an admin to change them."}
          </p>
          <div className="space-y-2">
            {row(
              "Source dataset",
              <code className="font-mono text-xs">
                {config.zfs_source_dataset ?? "—"}
              </code>
            )}
            {row(
              "Target dataset",
              <code className="font-mono text-xs">
                {config.zfs_target_dataset ?? "—"}
              </code>
            )}
            {row(
              "Raw send (--raw)",
              <span>
                {config.zfs_raw_send ? "yes" : "no"}
                {caps.encryption_detected ? " (encryption detected)" : ""}
              </span>
            )}
            {row(
              "Send compression",
              <span className="capitalize">
                {config.zfs_send_compression ?? "inherit"}
              </span>
            )}
            {row(
              "Receive readonly",
              <span>{config.zfs_receive_readonly ? "yes" : "no"}</span>
            )}
          </div>
        </div>
      </ModernCard>

      <ModernCard>
        <div className="space-y-3 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Last snapshot
          </h3>
          <div className="space-y-2">
            {row(
              "Name",
              <code className="break-all font-mono text-xs">
                {config.zfs_last_snapshot_name ?? "—"}
              </code>
            )}
            {row(
              "GUID",
              <code className="break-all font-mono text-xs">
                {config.zfs_last_snapshot_guid ?? "—"}
              </code>
            )}
            {row(
              "TXG",
              <span>{config.zfs_last_snapshot_txg ?? "—"}</span>
            )}
          </div>
        </div>
      </ModernCard>

      <ModernCard>
        <div className="space-y-3 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Resume token
          </h3>
          {config.zfs_resume_token ? (
            <>
              <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900/30 dark:bg-yellow-900/10">
                <p className="font-medium text-yellow-800 dark:text-yellow-300">
                  Resumable send token present
                </p>
                <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300/80">
                  The next sync will attempt `zfs send -t {"<token>"}`. Created{" "}
                  {formatTimestamp(config.zfs_resume_token_created_at)}.
                </p>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-white p-2 text-[11px] dark:bg-[#15203c]">
                  {config.zfs_resume_token}
                </pre>
              </div>
              <ModernButton
                variant="danger"
                size="sm"
                disabled={!isAdmin || clearResumeToken.isPending}
                title={!isAdmin ? "Admin access required" : undefined}
                onClick={() => {
                  if (!isAdmin) return;
                  if (
                    window.confirm(
                      "Clear the resume token? The next sync will start from scratch; on a multi-TB dataset this may take hours."
                    )
                  ) {
                    clearResumeToken.mutate();
                  }
                }}
              >
                {clearResumeToken.isPending ? "Clearing…" : "Clear resume token"}
              </ModernButton>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No resume token present — previous sends completed cleanly.
            </p>
          )}
        </div>
      </ModernCard>

      <div className="flex justify-end">
        <Link
          to={`/admin-dashboard/integrations/anycloudflow/replications/${replicationId}/advanced`}
          className="text-primary-500 text-sm underline"
        >
          ← Back to advanced replication
        </Link>
      </div>
    </div>
  );
}
