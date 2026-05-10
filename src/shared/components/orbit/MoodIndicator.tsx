import React from "react";
import { usePrefersReducedMotion } from "./motion";

/**
 * MoodIndicator — reflects the current mood of a resource via emoji or
 * mascot. Used in headers, list rows, dashboard cards. The mood translates
 * a technical state into something a non-expert can read at a glance.
 *
 * State mapping:
 *   - idle       : "😴" — nothing's happening, nothing to worry about
 *   - working    : "🚀" — actively running (gentle bounce animation)
 *   - happy      : "✨" — last operation succeeded
 *   - thinking   : "🤔" — pending approval, paused, awaiting input
 *   - worried    : "😬" — degraded; needs attention but not on fire
 *   - alarmed    : "🚨" — failure or critical alert
 *
 * Why emoji: every OS renders them, screen readers read them, they
 * translate across cultures, and they're already in the customer's
 * mental model.
 *
 * Accessibility:
 *   - aria-label on the wrapper conveys the mood in words; emoji is
 *     marked aria-hidden because the label is the canonical version
 *   - Idle bounce animation honors prefers-reduced-motion
 *
 * @example
 *   <MoodIndicator mood="working" />
 *   <MoodIndicator mood="alarmed" label="Replication broke" />
 */

export type Mood = "idle" | "working" | "happy" | "thinking" | "worried" | "alarmed";

const MOOD_MAP: Record<Mood, { emoji: string; defaultLabel: string; bouncing: boolean }> = {
  idle: { emoji: "😴", defaultLabel: "Idle", bouncing: false },
  working: { emoji: "🚀", defaultLabel: "Working on it", bouncing: true },
  happy: { emoji: "✨", defaultLabel: "All good", bouncing: false },
  thinking: { emoji: "🤔", defaultLabel: "Awaiting input", bouncing: false },
  worried: { emoji: "😬", defaultLabel: "Needs attention", bouncing: false },
  alarmed: { emoji: "🚨", defaultLabel: "Something's wrong", bouncing: true },
};

const SIZE_MAP = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl",
};

export interface MoodIndicatorProps {
  mood: Mood;
  /** Override the screen-reader label. Falls back to a sensible default per mood. */
  label?: string;
  /** Visual size. */
  size?: keyof typeof SIZE_MAP;
  /** Show the label as visible text alongside the emoji. */
  showLabel?: boolean;
  /** Additional class on the wrapper. */
  className?: string;
}

export function MoodIndicator({
  mood,
  label,
  size = "md",
  showLabel = false,
  className = "",
}: MoodIndicatorProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const config = MOOD_MAP[mood];
  const text = label ?? config.defaultLabel;
  const shouldAnimate = config.bouncing && !reduced;

  return (
    <span
      role="img"
      aria-label={text}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`${SIZE_MAP[size]} ${shouldAnimate ? "orbit-mood-bounce" : ""}`}
      >
        {config.emoji}
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{text}</span>
      )}
    </span>
  );
}

export default MoodIndicator;
