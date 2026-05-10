import React, { useState } from "react";
import {
  Play,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Clock,
} from "lucide-react";
import { ModernButton, ModernCard } from "../ui";
import {
  useFetchMigrationCutover,
  useStartMigrationCutover,
  useAdvanceMigrationCutover,
  useRollbackMigrationCutover,
  type CutoverState,
} from "@/shared/hooks/resources/externalMigrationHooks";

export interface CutoverPanelProps {
  migrationIdentifier: string;
  /** Show the panel only after data transfer is fully complete. */
  isReadyForCutover: boolean;
}

/**
 * CutoverPanel — operator UI for the AcF cutover state machine.
 *
 * Cutover happens AFTER data transfer + adapt + verify. It's the
 * moment when traffic stops hitting the source and starts hitting
 * the target. Mistakes here are visible (downtime, data loss); we
 * deliberately surface every state transition so the operator can
 * see exactly where the migration is.
 *
 * State machine (from CutoverOrchestrationService):
 *   none → pending → preflight_checks → draining_source →
 *   shifting_traffic → monitoring → grace_period →
 *   decommissioning → completed
 *
 * Rollback is available from any non-terminal pre-decommission
 * state. Once decommissioning starts, the source VM is gone.
 *
 * Render strategy:
 *   - Hidden until the migration is actually ready for cutover
 *     (post-verify) — surfacing a "Start cutover" button while
 *     the data transfer is at 30% would be a footgun.
 *   - Big primary action when state is `none`: kicks off the
 *     state machine.
 *   - Live state pill that the polling hook updates every 5 s
 *     while in progress, 30 s once terminal.
 *   - Rollback button gated on `can_rollback` from server.
 *   - Free-text reason required on rollback (server enforces).
 */

const STATE_LABEL: Record<string, { label: string; tone: "info" | "warning" | "success" | "danger" | "neutral" }> = {
  none: { label: "Not started", tone: "neutral" },
  pending: { label: "Queued", tone: "info" },
  preflight_checks: { label: "Running pre-flight checks…", tone: "info" },
  draining_source: { label: "Draining source connections…", tone: "warning" },
  shifting_traffic: { label: "Switching traffic to target…", tone: "warning" },
  monitoring: { label: "Watching health metrics…", tone: "info" },
  grace_period: { label: "Grace period (rollback still possible)", tone: "info" },
  decommissioning: { label: "Removing the source VM…", tone: "warning" },
  completed: { label: "Cutover complete!", tone: "success" },
  rolling_back: { label: "Rolling back to source…", tone: "warning" },
  rolled_back: { label: "Rolled back — source is live again", tone: "neutral" },
  failed: { label: "Cutover failed — needs operator review", tone: "danger" },
};

const TONE_CLASS: Record<string, string> = {
  info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700/40",
  warning: "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700/40",
  success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700/40",
  danger: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700/40",
  neutral: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700",
};

function StateBadge({ state }: { state: string }) {
  const meta = STATE_LABEL[state] ?? { label: state, tone: "neutral" as const };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE_CLASS[meta.tone]}`}
    >
      {state === "completed" ? (
        <CheckCircle2 size={12} />
      ) : state === "failed" || state === "rolling_back" ? (
        <AlertTriangle size={12} />
      ) : state !== "none" && state !== "rolled_back" ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Clock size={12} />
      )}
      {meta.label}
    </span>
  );
}

function Timeline({ cutover }: { cutover: CutoverState }) {
  // Show every meaningful timestamp the server has recorded so far
  // — operators want to know "when did we start draining" / "when
  // did traffic actually flip" without diving into the AcF logs.
  const items: { label: string; iso: string | null }[] = [
    { label: "Cutover started", iso: cutover.timestamps.started_at },
    { label: "TLS verified on target", iso: cutover.timestamps.tls_verified_at },
    { label: "Drain started on source", iso: cutover.timestamps.drain_started_at },
    { label: "Traffic shifted to target", iso: cutover.timestamps.traffic_shifted_at },
    { label: "Grace period ends", iso: cutover.timestamps.grace_period_ends_at },
    { label: "Cutover completed", iso: cutover.timestamps.completed_at },
  ];

  const visible = items.filter((i) => i.iso);
  if (visible.length === 0) return null;

  return (
    <ol className="mt-4 space-y-1.5 border-l border-gray-200 pl-4 dark:border-gray-700">
      {visible.map((it) => (
        <li key={it.label} className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-800 dark:text-gray-200">{it.label}:</span>{" "}
          <span className="font-mono">{new Date(it.iso!).toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}

const CutoverPanel: React.FC<CutoverPanelProps> = ({
  migrationIdentifier,
  isReadyForCutover,
}) => {
  const { data: cutover, isLoading } = useFetchMigrationCutover(migrationIdentifier);
  const startMutation = useStartMigrationCutover();
  const advanceMutation = useAdvanceMigrationCutover();
  const rollbackMutation = useRollbackMigrationCutover();

  const [showRollbackForm, setShowRollbackForm] = useState(false);
  const [rollbackReason, setRollbackReason] = useState("");

  if (!isReadyForCutover && cutover?.state === undefined) return null;
  if (isLoading) return null;

  const state = cutover?.state ?? "none";
  const isNone = state === "none";

  const handleStart = () => {
    startMutation.mutate({ migrationId: migrationIdentifier });
  };
  const handleAdvance = () => {
    advanceMutation.mutate({ migrationId: migrationIdentifier });
  };
  const handleRollback = () => {
    if (!rollbackReason.trim()) return;
    rollbackMutation.mutate(
      { migrationId: migrationIdentifier, reason: rollbackReason.trim() },
      {
        onSuccess: () => {
          setShowRollbackForm(false);
          setRollbackReason("");
        },
      },
    );
  };

  return (
    <ModernCard>
      <div className="space-y-3 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
              Traffic cutover
              <StateBadge state={state} />
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The data is on the target. This is the step where{" "}
              <strong>traffic actually moves</strong> — drain source, swap DNS, monitor
              the target, optionally decommission the source.
            </p>
          </div>
        </div>

        {cutover?.error_code && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-200">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong>{cutover.error_code}</strong>
              {cutover.error_translation ? `: ${cutover.error_translation}` : null}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {isNone && (
            <ModernButton
              variant="primary"
              size="sm"
              onClick={handleStart}
              loading={startMutation.isPending}
              disabled={!isReadyForCutover}
            >
              <Play size={14} />
              Start cutover
            </ModernButton>
          )}

          {!isNone && cutover?.is_in_progress && (
            <ModernButton
              variant="outline"
              size="sm"
              onClick={handleAdvance}
              loading={advanceMutation.isPending}
              title="Manually advance one step. The watchdog normally drives this every 30s."
            >
              <ChevronRight size={14} />
              Nudge state machine
            </ModernButton>
          )}

          {cutover?.can_rollback && (
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => setShowRollbackForm(true)}
              className="!border-red-200 !text-red-600 hover:!bg-red-50 dark:!border-red-800 dark:!text-red-400"
            >
              <RotateCcw size={14} />
              Roll back to source
            </ModernButton>
          )}
        </div>

        {showRollbackForm && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-700/40 dark:bg-red-900/20">
            <label
              htmlFor="cutover-rollback-reason"
              className="block text-xs font-medium text-red-900 dark:text-red-200"
            >
              Why are you rolling back? (Captured for the audit log.)
            </label>
            <textarea
              id="cutover-rollback-reason"
              rows={2}
              value={rollbackReason}
              onChange={(e) => setRollbackReason(e.target.value)}
              placeholder="e.g. Latency spike on target — need to investigate before continuing"
              className="mt-1 w-full rounded border border-red-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-red-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <div className="mt-2 flex justify-end gap-2">
              <ModernButton variant="ghost" size="sm" onClick={() => setShowRollbackForm(false)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleRollback}
                loading={rollbackMutation.isPending}
                disabled={!rollbackReason.trim()}
              >
                Yes, roll back
              </ModernButton>
            </div>
          </div>
        )}

        {cutover && <Timeline cutover={cutover} />}
      </div>
    </ModernCard>
  );
};

export default CutoverPanel;
