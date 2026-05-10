import React, { ReactNode } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pause,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { usePrefersReducedMotion } from "./motion";

/**
 * StatusBadge — uniform pill for the state of a resilience resource.
 * Used in tables, cards, page headers, anywhere a state needs to be
 * communicated quickly.
 *
 * Built-in tones:
 *   - "success"  : green   — completed, healthy
 *   - "running"  : blue    — actively in progress (pulsing dot)
 *   - "pending"  : amber   — waiting for approval / paused / queued
 *   - "warning"  : amber   — degraded but operational
 *   - "danger"   : red     — failed, broken, alarmed
 *   - "neutral"  : gray    — idle, archived, unknown
 *
 * Why a separate component:
 *   - Keeps color/icon mapping centralized (one place to update if
 *     accessibility audit demands a contrast tweak)
 *   - Built-in `friendlyLabel` — translates technical state names into
 *     plain English for the same status code
 *   - Optional pulsing dot for "running" state, honors reduced-motion
 *
 * Accessibility:
 *   - Color is never the sole signal — every tone has a unique icon
 *   - Wrapper uses semantic <span role="status"> for SR awareness
 *   - aria-label expresses the state in words; the icon is aria-hidden
 *
 * @example
 *   <StatusBadge tone="running" label="Restoring image" />
 *   <StatusBadge tone="success" label="Migration complete" friendlyLabel="Made it!" />
 *   <StatusBadge tone="danger" label="Failed at partitioning" />
 */

export type StatusTone =
  | "success"
  | "running"
  | "pending"
  | "warning"
  | "danger"
  | "neutral"
  | "highlight";

export interface StatusBadgeProps {
  /** Color/icon family. */
  tone: StatusTone;
  /** Technical label (e.g., "Restoring image", "Failed at partitioning"). */
  label: string;
  /**
   * Optional plain-English label for friendly mode. When provided, it
   * replaces `label` for sighted users; `label` is still used for the
   * aria-label so SR users get the canonical state.
   */
  friendlyLabel?: string;
  /** Override the default icon for this tone. */
  icon?: ReactNode;
  /** Visual size. */
  size?: "sm" | "md" | "lg";
  /** Optional class on the wrapper. */
  className?: string;
}

const TONE_MAP: Record<
  StatusTone,
  { bg: string; text: string; ring: string; defaultIcon: React.ComponentType<{ className?: string }>; pulses: boolean }
> = {
  success: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    ring: "ring-emerald-200 dark:ring-emerald-800/50",
    defaultIcon: CheckCircle2,
    pulses: false,
  },
  running: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    ring: "ring-blue-200 dark:ring-blue-800/50",
    defaultIcon: Loader2,
    pulses: true,
  },
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    ring: "ring-amber-200 dark:ring-amber-800/50",
    defaultIcon: Clock,
    pulses: false,
  },
  warning: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    ring: "ring-orange-200 dark:ring-orange-800/50",
    defaultIcon: AlertTriangle,
    pulses: false,
  },
  danger: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    ring: "ring-red-200 dark:ring-red-800/50",
    defaultIcon: XCircle,
    pulses: false,
  },
  neutral: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    ring: "ring-gray-200 dark:ring-gray-700",
    defaultIcon: Pause,
    pulses: false,
  },
  highlight: {
    bg: "bg-gradient-to-r from-[var(--secondary-color)]/20 to-primary-500/20 dark:from-[var(--secondary-color)]/10 dark:to-primary-500/10",
    text: "text-primary-700 dark:text-white",
    ring: "ring-[var(--secondary-color)]/40",
    defaultIcon: Sparkles,
    pulses: false,
  },
};

const SIZE_MAP = {
  sm: { wrap: "px-2 py-0.5 text-[11px] gap-1", icon: "h-3 w-3" },
  md: { wrap: "px-2.5 py-1 text-xs gap-1.5", icon: "h-3.5 w-3.5" },
  lg: { wrap: "px-3 py-1.5 text-sm gap-2", icon: "h-4 w-4" },
};

export function StatusBadge({
  tone,
  label,
  friendlyLabel,
  icon,
  size = "md",
  className = "",
}: StatusBadgeProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const config = TONE_MAP[tone];
  const sizes = SIZE_MAP[size];
  const Icon = config.defaultIcon;
  const visibleLabel = friendlyLabel ?? label;
  const shouldSpin = tone === "running" && !reduced;

  return (
    <span
      role="status"
      aria-label={label}
      className={[
        "inline-flex items-center rounded-full font-medium ring-1",
        config.bg,
        config.text,
        config.ring,
        sizes.wrap,
        className,
      ].join(" ")}
    >
      {icon ?? (
        <span className="relative flex items-center" aria-hidden="true">
          <Icon className={`${sizes.icon} ${shouldSpin ? "animate-spin" : ""}`} />
          {/* Pulse ring for running state */}
          {config.pulses && !reduced && (
            <span
              aria-hidden="true"
              className={`absolute inset-0 ${sizes.icon} animate-ping rounded-full bg-current opacity-30`}
            />
          )}
        </span>
      )}
      <span className="whitespace-nowrap">{visibleLabel}</span>
    </span>
  );
}

export default StatusBadge;
