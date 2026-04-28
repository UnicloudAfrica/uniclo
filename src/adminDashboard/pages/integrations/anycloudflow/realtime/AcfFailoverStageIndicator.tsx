/**
 * AcfFailoverStageIndicator — vertical stepper that tracks a replication
 * failover through its canonical stages as realtime events arrive on the
 * `replication.{identifier}` channel (`failover.stage-changed`).
 *
 * Visibility rule enforced by the caller:
 *   - Mount when replication.status === "failed_over", OR
 *   - Keep mounted for 5 minutes after the most recent stage event.
 *
 * The 5-minute grace is handled internally so the caller only needs to
 * consider the `status === "failed_over"` gate — once mounted, the card
 * self-hides after quiescence.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleDot,
  CircleDashed,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { ModernCard } from "@/shared/components/ui";
import { useAcfRealtimeEvent } from "@/hooks/useAcfRealtime";

const STAGES = [
  "detecting",
  "fencing",
  "promoting",
  "dns_switching",
  "complete",
] as const;

type Stage = (typeof STAGES)[number];

interface StageInfo {
  stage: Stage | string;
  status?: "pending" | "active" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  message?: string;
  error?: string | null;
}

interface StagePayload extends StageInfo {
  stage: Stage | string;
}

export interface AcfFailoverStageIndicatorProps {
  replicationIdentifier: string;
  /** If true, the card is always visible regardless of recent activity. */
  forceVisible?: boolean;
  /** ms window during which a recent stage event keeps the card visible. */
  idleHideMs?: number;
}

const STAGE_LABELS: Record<Stage, string> = {
  detecting: "Detecting failure",
  fencing: "Fencing primary",
  promoting: "Promoting target",
  dns_switching: "Switching DNS",
  complete: "Failover complete",
};

function formatTs(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

function iconFor(status?: StageInfo["status"]): React.ReactNode {
  switch (status) {
    case "completed":
      return (
        <CheckCircle2
          size={18}
          className="text-emerald-500"
          aria-label="completed"
        />
      );
    case "active":
      return (
        <RefreshCw
          size={18}
          className="animate-spin text-blue-500"
          aria-label="active"
        />
      );
    case "failed":
      return (
        <XCircle size={18} className="text-rose-500" aria-label="failed" />
      );
    case "pending":
    default:
      // Use filled dot for "the next one up" vs dashed for future.
      return status === "pending" ? (
        <CircleDot
          size={18}
          className="text-gray-400"
          aria-label="pending"
        />
      ) : (
        <CircleDashed
          size={18}
          className="text-gray-300 dark:text-gray-600"
          aria-label="not started"
        />
      );
  }
}

export function AcfFailoverStageIndicator({
  replicationIdentifier,
  forceVisible = false,
  idleHideMs = 5 * 60 * 1000,
}: AcfFailoverStageIndicatorProps) {
  const [stages, setStages] = useState<Record<string, StageInfo>>({});
  const lastEventRef = useRef<number | null>(null);
  const [visible, setVisible] = useState<boolean>(forceVisible);

  useAcfRealtimeEvent(
    replicationIdentifier ? `replication.${replicationIdentifier}` : null,
    "failover.stage-changed",
    (payload: StagePayload) => {
      if (!payload || !payload.stage) return;
      lastEventRef.current = Date.now();
      setVisible(true);
      setStages((prev) => ({
        ...prev,
        [payload.stage]: {
          stage: payload.stage,
          status: payload.status,
          started_at: payload.started_at,
          completed_at: payload.completed_at,
          message: payload.message,
          error: payload.error,
        },
      }));
    }
  );

  // Hide after idle window unless forceVisible.
  useEffect(() => {
    if (forceVisible) {
      setVisible(true);
      return;
    }
    if (!lastEventRef.current) return;
    const tick = setInterval(() => {
      if (!lastEventRef.current) return;
      if (Date.now() - lastEventRef.current > idleHideMs) {
        setVisible(false);
      }
    }, 15_000);
    return () => clearInterval(tick);
  }, [forceVisible, idleHideMs]);

  // Derived stage list: canonical order first, then any unknown stages
  // the backend may emit in the future — future-proofing against schema
  // drift without breaking the UI.
  const ordered = useMemo(() => {
    const seen = new Set<string>();
    const list: StageInfo[] = [];
    for (const s of STAGES) {
      seen.add(s);
      list.push(stages[s] ?? { stage: s, status: "pending" });
    }
    for (const key of Object.keys(stages)) {
      if (!seen.has(key)) list.push(stages[key]!);
    }
    return list;
  }, [stages]);

  if (!visible) return null;

  const anyFailed = ordered.some((s) => s.status === "failed");
  const allDone = ordered.every((s) => s.status === "completed");

  return (
    <ModernCard variant="outlined" padding="default">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Failover progress
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Live stage tracking for replication{" "}
            <code className="font-mono text-[11px]">
              {replicationIdentifier}
            </code>
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
            anyFailed
              ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
              : allDone
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
          ].join(" ")}
        >
          {anyFailed ? "Failed" : allDone ? "Completed" : "Running"}
        </span>
      </div>

      <ol className="relative ml-2 space-y-4 border-l border-gray-200 pl-5 dark:border-gray-700">
        {ordered.map((stage) => {
          const label =
            STAGE_LABELS[stage.stage as Stage] ??
            String(stage.stage).replace(/_/g, " ");
          const ts = stage.completed_at || stage.started_at;
          const isFailed = stage.status === "failed";
          return (
            <li key={String(stage.stage)} className="relative">
              <span className="absolute -left-[30px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-900">
                {iconFor(stage.status)}
              </span>
              <div className="flex items-center justify-between gap-3">
                <p
                  className={[
                    "text-sm",
                    stage.status === "completed"
                      ? "text-gray-700 dark:text-gray-200"
                      : stage.status === "active"
                        ? "font-semibold text-gray-900 dark:text-gray-100"
                        : isFailed
                          ? "font-semibold text-rose-700 dark:text-rose-300"
                          : "text-gray-500 dark:text-gray-400",
                  ].join(" ")}
                >
                  {label}
                </p>
                {ts && (
                  <time
                    className="shrink-0 font-mono text-[11px] text-gray-400"
                    dateTime={ts}
                  >
                    {formatTs(ts)}
                  </time>
                )}
              </div>
              {stage.message && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {stage.message}
                </p>
              )}
              {isFailed && stage.error && (
                <p className="mt-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">
                  {stage.error}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </ModernCard>
  );
}

export default AcfFailoverStageIndicator;
