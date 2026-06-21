import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  AsyncButton,
  StatusBadge,
  SuccessMoment,
  usePrefersReducedMotion,
} from "@/shared/components/orbit";
import { useMailMigration, useCancelMailMigration } from "@/shared/hooks/resources";
import { mailStatusTone, isMailMigrationRunning } from "./mailStatus";

/**
 * MailMigrationProgress — polls a single mail migration every ~3s (the
 * useMailMigration hook handles the interval) and shows a big animated
 * progress ring with live-ticking counts, friendly copy, and a celebration
 * when the move finishes.
 */

export interface MailMigrationProgressProps {
  identifier: string;
  onBack: () => void;
}

function ProgressRing({ percent }: { percent: number }): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-gray-200 dark:stroke-gray-800"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-primary-500"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: reduced ? "none" : "stroke-dashoffset 600ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{clamped}%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">moved</span>
      </div>
    </div>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-900">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export function MailMigrationProgress({
  identifier,
  onBack,
}: MailMigrationProgressProps): React.JSX.Element {
  const { data, isLoading } = useMailMigration(identifier);
  const cancel = useCancelMailMigration();
  const [celebrated, setCelebrated] = useState(false);

  const status = data?.status;
  const total = data?.total_messages ?? 0;
  const moved = data?.migrated_messages ?? 0;
  const skipped = data?.skipped_messages ?? 0;
  const failed = data?.failed_messages ?? 0;
  const running = isMailMigrationRunning(status);
  const complete = status === "completed";
  const percent = total > 0 ? Math.round((moved / total) * 100) : complete ? 100 : 0;
  const badge = mailStatusTone(status);

  // Refetch stops on its own once status is terminal; the hook keeps polling
  // while the component is mounted, which is fine for a running move.

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to all moves
      </button>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your email move</h2>
          <StatusBadge tone={badge.tone} label={badge.label} />
        </div>

        {isLoading && !data ? (
          <div className="mt-8 h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <>
            <div className="mt-6">
              <ProgressRing percent={percent} />
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              {complete
                ? `🎉 All done! We safely moved ${moved} email${moved === 1 ? "" : "s"}.`
                : running
                  ? "Sit back — we're carefully moving everything. You can safely close this; it keeps going."
                  : badge.label}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Counter label="Moved" value={moved} tone="text-emerald-600 dark:text-emerald-400" />
              <Counter
                label="Skipped"
                value={skipped}
                tone="text-amber-600 dark:text-amber-400"
              />
              <Counter label="Failed" value={failed} tone="text-red-600 dark:text-red-400" />
              <Counter
                label="Total"
                value={total}
                tone="text-gray-900 dark:text-gray-100"
              />
            </div>

            {running && (
              <div className="mt-6 flex justify-center">
                <AsyncButton
                  variant="danger"
                  size="md"
                  onClick={async () => {
                    await cancel.mutateAsync({ identifier });
                  }}
                  loadingLabel="Cancelling…"
                >
                  Cancel this move
                </AsyncButton>
              </div>
            )}
          </>
        )}
      </div>

      <SuccessMoment
        open={complete && !celebrated}
        onClose={() => setCelebrated(true)}
        title="All done!"
        body={`We safely moved ${moved} email${moved === 1 ? "" : "s"} into your new mailbox.`}
        primaryCta={{ label: "See all my moves", onClick: onBack }}
      />
    </div>
  );
}

export default MailMigrationProgress;
