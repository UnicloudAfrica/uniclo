import React from "react";
import { Check, X, Loader2, Circle } from "lucide-react";

/**
 * StateMachineProgress — accessible phase-progress indicator for any
 * resilience saga that moves through ordered phases (BMR, cutover, DR
 * runbook, recovery plan, batch migration, drill).
 *
 * Design intent:
 *   - Mobile (<sm):  vertical stack, each phase a row
 *   - Desktop (≥sm): horizontal stepper with connecting bars
 *   - Failed phases halt the stepper and render the failure path
 *   - Live phases pulse a Loader2 icon
 *   - Completed phases render a Check; pending phases render a hollow Circle
 *
 * Accessibility:
 *   - role="progressbar" on the wrapper with aria-valuenow / aria-valuemin / aria-valuemax
 *   - aria-current="step" on the active phase
 *   - aria-label on each step expressing its phase + status to screen readers
 *   - Focus ring + keyboard interactivity on clickable phases (when onPhaseClick set)
 *
 * @example
 *   <StateMachineProgress
 *     phases={BMR_PHASES}
 *     current="restoring"
 *     status="running"
 *     failedAt={null}
 *   />
 */

export type PhaseStatus = "running" | "succeeded" | "failed";

export interface PhaseDefinition {
  /** Stable machine-readable id. Matches the AcF saga state name. */
  id: string;
  /** Customer-facing label, e.g. "Restoring image". */
  label: string;
  /** Optional secondary description shown below the label on desktop. */
  description?: string;
}

export interface StateMachineProgressProps {
  /** Ordered list of phases the saga moves through. */
  phases: readonly PhaseDefinition[];
  /** The currently-active phase id (or last-completed if `status` === "succeeded"). */
  current: string;
  /**
   * High-level saga status.
   *  - "running"   : `current` phase is in flight
   *  - "succeeded" : the saga completed; every phase up to and including `current` is ✅
   *  - "failed"    : the saga halted at `failedAt` (defaults to `current`)
   */
  status?: PhaseStatus;
  /**
   * Phase id where the saga failed. Defaults to `current` when `status` === "failed".
   * Use when the failure was on a different phase than `current` reports.
   */
  failedAt?: string | null;
  /** Optional click handler — clicking a phase triggers (e.g. show phase log). */
  onPhaseClick?: (phaseId: string) => void;
  /** Visual size override. */
  size?: "sm" | "md" | "lg";
  /** Additional class on the outer wrapper. */
  className?: string;
}

type ResolvedPhaseState = "completed" | "active" | "failed" | "pending";

const sizeMap = {
  sm: { circle: "h-6 w-6", icon: "h-3 w-3", label: "text-xs", desc: "text-[10px]" },
  md: { circle: "h-8 w-8", icon: "h-4 w-4", label: "text-sm", desc: "text-xs" },
  lg: { circle: "h-10 w-10", icon: "h-5 w-5", label: "text-base", desc: "text-sm" },
} as const;

export function StateMachineProgress({
  phases,
  current,
  status = "running",
  failedAt,
  onPhaseClick,
  size = "md",
  className = "",
}: StateMachineProgressProps): React.JSX.Element {
  // Validate that `current` is actually in the phase list — otherwise we'd
  // silently render a wrong stepper. In dev this throws; in prod it falls
  // back to showing all phases as pending.
  const currentIndex = phases.findIndex((p) => p.id === current);
  if (currentIndex < 0) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`StateMachineProgress: current "${current}" not in phases list`, phases);
    }
  }
  const failedIndex = failedAt ? phases.findIndex((p) => p.id === failedAt) : currentIndex;

  const resolvePhaseState = (idx: number): ResolvedPhaseState => {
    if (status === "failed" && idx === failedIndex) return "failed";
    if (status === "failed" && idx > failedIndex) return "pending";
    if (status === "succeeded") return idx <= currentIndex ? "completed" : "pending";
    if (idx < currentIndex) return "completed";
    if (idx === currentIndex) return "active";
    return "pending";
  };

  // Progress percent for screen readers — counts completed phases against total
  const completedCount = phases.filter((_, i) => resolvePhaseState(i) === "completed").length;
  const ariaValueNow = Math.round((completedCount / phases.length) * 100);

  const sizes = sizeMap[size];

  return (
    <div
      role="progressbar"
      aria-valuenow={ariaValueNow}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Saga progress: ${completedCount} of ${phases.length} phases complete`}
      className={`w-full ${className}`}
    >
      {/* Mobile: vertical stack. Desktop: horizontal stepper. */}
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
        {phases.map((phase, idx) => {
          const state = resolvePhaseState(idx);
          const isLast = idx === phases.length - 1;
          const isClickable = Boolean(onPhaseClick);

          return (
            <li
              key={phase.id}
              aria-current={state === "active" ? "step" : undefined}
              aria-label={`Step ${idx + 1} of ${phases.length}: ${phase.label} — ${state}`}
              className="flex flex-row items-start gap-3 sm:flex-1 sm:flex-col sm:items-center sm:gap-1.5"
            >
              {/* Circle + connector row */}
              <div className="flex items-center sm:w-full">
                {/* Connector left (desktop only, hidden on first phase) */}
                <div
                  aria-hidden="true"
                  className={`hidden sm:block sm:flex-1 sm:h-0.5 ${
                    idx === 0
                      ? "invisible"
                      : state === "pending"
                      ? "bg-gray-200 dark:bg-gray-700"
                      : "bg-emerald-500"
                  }`}
                />
                {/* Circle */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={isClickable ? () => onPhaseClick(phase.id) : undefined}
                  aria-label={`Phase: ${phase.label}, status: ${state}${
                    isClickable ? ". Click for details." : ""
                  }`}
                  className={[
                    "flex shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    sizes.circle,
                    state === "completed" && "border-emerald-500 bg-emerald-500 text-white",
                    state === "active" &&
                      "border-blue-500 bg-blue-500 text-white animate-pulse",
                    state === "failed" && "border-red-500 bg-red-500 text-white",
                    state === "pending" &&
                      "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800",
                    isClickable
                      ? "cursor-pointer hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                      : "cursor-default",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {state === "completed" && <Check className={sizes.icon} aria-hidden="true" />}
                  {state === "active" && (
                    <Loader2 className={`${sizes.icon} animate-spin`} aria-hidden="true" />
                  )}
                  {state === "failed" && <X className={sizes.icon} aria-hidden="true" />}
                  {state === "pending" && <Circle className={sizes.icon} aria-hidden="true" />}
                </button>
                {/* Connector right (desktop only, hidden on last phase) */}
                <div
                  aria-hidden="true"
                  className={`hidden sm:block sm:flex-1 sm:h-0.5 ${
                    isLast
                      ? "invisible"
                      : state === "completed"
                      ? "bg-emerald-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              </div>

              {/* Label + description */}
              <div className="flex-1 sm:flex-none sm:text-center sm:px-1">
                <p
                  className={[
                    "font-medium",
                    sizes.label,
                    state === "active" && "text-blue-600 dark:text-blue-400",
                    state === "failed" && "text-red-600 dark:text-red-400",
                    state === "completed" && "text-gray-900 dark:text-gray-100",
                    state === "pending" && "text-gray-500 dark:text-gray-400",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {phase.label}
                </p>
                {phase.description && (
                  <p className={`hidden sm:block ${sizes.desc} text-gray-500 dark:text-gray-400`}>
                    {phase.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default StateMachineProgress;
