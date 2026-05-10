import React from "react";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import {
  HeroBanner,
  RESILIENCE,
  usePrefersReducedMotion,
  orbitTransition,
} from "@/shared/components/orbit";
import {
  getResilienceCopy,
  type ResilienceTopic,
} from "./resilienceCopy";

/**
 * ResilienceHero — one-line drop-in for any Orbit menu page.
 *
 * Wraps `HeroBanner` with the resilience-domain defaults: the right
 * eyebrow ("Orbit · X"), a topic-keyed friendly title + subtitle (from
 * `resilienceCopy.ts`), a floating emoji illustration, and an optional
 * reassurance pill for sensitive topics (Ransomware / DR Drills).
 *
 * Calibration:
 *   - Plain English you'd use to explain the feature to a smart non-engineer.
 *     If a sentence requires Googling a term, rewrite it.
 *   - Big emoji that bobs gently (like a balloon on a string). Reduced-motion
 *     keeps it static.
 *   - Optional reassurance pill ("Drills run in an isolated zone") right
 *     under the subtitle so the scary topics feel less scary.
 *   - Theme-aware: every color routes through platform tokens, so when a
 *     tenant flips theme the hero re-tints in lockstep.
 *
 * @example
 *   <ResilienceHero topic="ransomware" role="tenant" />
 *
 *   // With a primary CTA:
 *   <ResilienceHero topic="migrations" role="admin" primaryCta={{ label: "New migration", onClick: () => navigate("/migrations/new") }} />
 *
 *   // Override copy for a one-off:
 *   <ResilienceHero topic="dr-drills" titleOverride="Tonight's drill" />
 */

export interface ResilienceHeroProps {
  /** Topic key from `resilienceCopy.ts`. */
  topic: ResilienceTopic;
  /** Optional role context — pulls a per-role copy variant if defined. */
  role?: "admin" | "tenant" | "client";
  /** Override the default title. */
  titleOverride?: string;
  /** Override the default subtitle. */
  subtitleOverride?: string;
  /** Override the default emoji. */
  emojiOverride?: string;
  /** Optional primary CTA — typically the "do the next thing" button. */
  primaryCta?: { label: string; onClick: () => void; icon?: React.ReactNode };
  /** Optional secondary action — text-link style. */
  secondaryCta?: { label: string; onClick: () => void };
  /** "calm" (default) for returning users, "spotlight" for first-runs. */
  mode?: "calm" | "spotlight";
}

export function ResilienceHero({
  topic,
  role,
  titleOverride,
  subtitleOverride,
  emojiOverride,
  primaryCta,
  secondaryCta,
  mode = "calm",
}: ResilienceHeroProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const copy = getResilienceCopy(topic, role);
  const title = titleOverride ?? copy.title;
  const subtitle = subtitleOverride ?? copy.subtitle;
  const emoji = emojiOverride ?? copy.emoji;
  const eyebrow = copy.eyebrow ?? `${RESILIENCE} · ${topicLabel(topic)}`;

  return (
    <div className="space-y-3">
      <HeroBanner
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        technicalNote={copy.technicalNote}
        mode={mode}
        primaryCta={primaryCta}
        secondaryCta={secondaryCta}
        illustration={<FloatingEmoji emoji={emoji} reduced={reduced} mode={mode} />}
      />
      {copy.reassurance && <ReassurancePill text={copy.reassurance} reduced={reduced} />}
    </div>
  );
}

// ─── Bobbing emoji illustration ──────────────────────────────────────────────
// Floats up and down 4px on a 4-second loop. Honors reduced-motion: stays
// still when the user wants reduced motion. The drop-shadow gives it a soft
// glow that follows the active theme color.

function FloatingEmoji({
  emoji,
  reduced,
  mode,
}: {
  emoji: string;
  reduced: boolean;
  mode: "calm" | "spotlight";
}): React.JSX.Element {
  const size = mode === "spotlight" ? "text-7xl sm:text-8xl" : "text-6xl sm:text-7xl";
  return (
    <span
      role="img"
      aria-hidden="true"
      className={[
        "inline-block select-none leading-none",
        size,
        // Soft theme-tinted glow under the emoji
        "drop-shadow-[0_8px_20px_rgb(var(--theme-color-rgb)/0.35)]",
        reduced ? "" : "animate-orbit-bounce",
      ].join(" ")}
      style={{
        transition: orbitTransition(reduced, "transform", "smooth", "gentle"),
      }}
    >
      {emoji}
    </span>
  );
}

// ─── Reassurance pill — appears under the hero for sensitive topics ──────────
// Subtle gradient pill with a ShieldCheck icon. Communicates safety without
// shouting. Only renders when the topic's copy entry includes a reassurance.

function ReassurancePill({
  text,
  reduced,
}: {
  text: string;
  reduced: boolean;
}): React.JSX.Element {
  return (
    <div
      role="note"
      aria-label={`Reassurance: ${text}`}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-success-200 bg-gradient-to-r from-success-50 to-success-100/50 px-4 py-1.5 text-xs font-medium text-success-800 dark:border-success-800/40 dark:from-success-900/20 dark:to-success-900/10 dark:text-success-200"
      style={{ transition: orbitTransition(reduced, "all", "base", "decelerate") }}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-success-600 dark:text-success-400" aria-hidden="true" />
      <span>{text}</span>
      <Sparkles className="h-3 w-3 shrink-0 text-warning-500" aria-hidden="true" />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function topicLabel(topic: ResilienceTopic): string {
  return topic
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default ResilienceHero;

// ─── Quick CTA helpers — tiny components used in headers as page actions ─────
// Pre-styled gradient buttons using platform theme tokens. Re-export for
// pages that want a primary call-to-action below the hero.

export function ResiliencePrimaryAction({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 motion-reduce:hover:scale-100 dark:focus:ring-offset-gray-900"
      style={{ transition: orbitTransition(reduced, "all", "fast", "spring") }}
    >
      {icon}
      {label}
      <ArrowRight
        className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
        aria-hidden="true"
      />
    </button>
  );
}
