/**
 * AcfSyncProgressCard — live sync progress for a single AnyCloudFlow
 * replication, powered by the `replication.{identifier}` private channel
 * and the `sync.progress` event.
 *
 * If no progress has arrived yet, the component either renders the
 * `initialData` snapshot (typically pulled from REST) or nothing. This
 * lets the card mount inside a grid that is driven by a REST list —
 * the first realtime tick simply replaces the snapshot in place.
 *
 * NOTE: placed under `adminDashboard/pages/integrations/anycloudflow/realtime`
 * to colocate with the other ACF integration surface. Import-path agnostic —
 * any UniCloud page (admin / tenant / client) can consume it.
 */
import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { ModernCard } from "@/shared/components/ui";
import { useAcfSyncProgress } from "@/hooks/useAcfRealtime";

export interface SyncProgressData {
  /** Current phase, e.g. "scanning", "transferring", "verifying". */
  phase?: string;
  /** Status, e.g. "running", "completed", "failed", "paused". */
  status?: string;
  /** 0–100 percent complete. */
  percent?: number;
  /** Bytes already transferred so far. */
  bytes_transferred?: number;
  /** Estimated total bytes for this sync cycle. */
  bytes_total?: number;
  /** Estimated seconds remaining. */
  eta_seconds?: number;
  /** Transfer speed in bytes per second. */
  bytes_per_second?: number;
  /** Optional last-error string if status === "failed". */
  error_message?: string | null;
  /** Files processed / files discovered (optional). */
  files_transferred?: number;
  files_total?: number;
  /** ISO timestamp when the payload was produced on the backend. */
  timestamp?: string;
}

export interface AcfSyncProgressCardProps {
  /** Replication identifier — channel will be `replication.{identifier}`. */
  replicationIdentifier: string;
  /** Seed data to render before the first realtime event arrives. */
  initialData?: SyncProgressData;
  /** Human-readable label rendered above the progress bar. */
  title?: string;
  /** Rendered below the title — useful for "source → target" context. */
  subtitle?: string;
  /** Compact layout for grids; default is the roomier "card" layout. */
  compact?: boolean;
  /** Optional override handler so parent components can observe progress. */
  onProgress?: (data: SyncProgressData) => void;
}

function formatBytes(n?: number): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(2)} ${units[i] ?? "B"}`;
}

function formatDuration(seconds?: number): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatRate(bps?: number): string {
  if (bps == null || !Number.isFinite(bps) || bps <= 0) return "—";
  return `${formatBytes(bps)}/s`;
}

/** Tone derivation is cheap so we inline it rather than carry a util. */
function toneFor(status?: string): {
  bar: string;
  text: string;
  icon: React.ReactNode;
} {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "success":
      return {
        bar: "bg-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
        icon: <CheckCircle2 size={16} />,
      };
    case "failed":
    case "error":
      return {
        bar: "bg-rose-500",
        text: "text-rose-600 dark:text-rose-400",
        icon: <AlertTriangle size={16} />,
      };
    case "paused":
    case "idle":
      return {
        bar: "bg-gray-400",
        text: "text-gray-500 dark:text-gray-400",
        icon: <Clock size={16} />,
      };
    default:
      return {
        bar: "bg-blue-500",
        text: "text-blue-600 dark:text-blue-400",
        icon: <RefreshCw size={16} className="animate-spin" />,
      };
  }
}

export function AcfSyncProgressCard({
  replicationIdentifier,
  initialData,
  title,
  subtitle,
  compact = false,
  onProgress,
}: AcfSyncProgressCardProps) {
  const [progress, setProgress] = useState<SyncProgressData | undefined>(
    initialData
  );

  useAcfSyncProgress<SyncProgressData>(replicationIdentifier, (p) => {
    setProgress(p);
    onProgress?.(p);
  });

  if (!progress) return null;

  const percent = Math.max(
    0,
    Math.min(100, Math.round(progress.percent ?? 0))
  );
  const tone = toneFor(progress.status);

  return (
    <ModernCard variant="outlined" padding={compact ? "sm" : "default"}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={tone.text}>{tone.icon}</span>
              <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {title ?? "Live sync"}
              </h4>
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div
              className={`text-sm font-semibold ${tone.text}`}
              aria-live="polite"
            >
              {percent}%
            </div>
            {progress.phase && (
              <div className="text-[11px] uppercase tracking-wide text-gray-400">
                {progress.phase}
              </div>
            )}
          </div>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full ${tone.bar} transition-[width] duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-gray-400">Transferred</dt>
            <dd className="font-medium text-gray-700 dark:text-gray-200">
              {formatBytes(progress.bytes_transferred)}
              {progress.bytes_total != null && (
                <span className="text-gray-400">
                  {" / "}
                  {formatBytes(progress.bytes_total)}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Rate</dt>
            <dd className="font-medium text-gray-700 dark:text-gray-200">
              {formatRate(progress.bytes_per_second)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">ETA</dt>
            <dd className="font-medium text-gray-700 dark:text-gray-200">
              {formatDuration(progress.eta_seconds)}
            </dd>
          </div>
        </dl>

        {progress.files_total != null && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            {progress.files_transferred ?? 0} / {progress.files_total} files
          </div>
        )}

        {progress.status === "failed" && progress.error_message && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
            {progress.error_message}
          </div>
        )}
      </div>
    </ModernCard>
  );
}

export default AcfSyncProgressCard;
