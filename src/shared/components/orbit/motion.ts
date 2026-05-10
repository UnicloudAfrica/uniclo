/**
 * Orbit motion tokens + reduced-motion guard.
 *
 * Every animated component imports from this file rather than rolling its
 * own duration/easing constants. Two reasons:
 *   1. Consistent feel across the resilience domain (a BMR phase advance
 *      animates with the same easing as a cutover phase advance)
 *   2. Single source of truth for honoring `prefers-reduced-motion`
 *
 * NEVER set `transition: all 200ms ease` ad-hoc in JSX. Always go through
 * the helpers below — they collapse to `none` when the user has reduced
 * motion enabled.
 */

import { useEffect, useState } from "react";

// ─── Hook: prefers-reduced-motion (live) ─────────────────────────────────────
//
// Returns true when the user has the OS-level "reduce motion" preference set.
// Live — re-fires when the preference flips mid-session.

export function usePrefersReducedMotion(): boolean {
  const query = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const [reduced, setReduced] = useState(query?.matches ?? false);

  useEffect(() => {
    if (!query) return;
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Newer browsers: addEventListener; older Safari: addListener
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handler);
      return () => query.removeEventListener("change", handler);
    }
    // Legacy Safari fallback (addListener is deprecated but present on older
    // MediaQueryList implementations). Cast through `unknown` to satisfy
    // strict TS without a per-line directive.
    const legacy = query as unknown as {
      addListener: (h: (e: MediaQueryListEvent) => void) => void;
      removeListener: (h: (e: MediaQueryListEvent) => void) => void;
    };
    legacy.addListener(handler);
    return () => legacy.removeListener(handler);
  }, [query]);

  return reduced;
}

// ─── Duration tokens (ms) ────────────────────────────────────────────────────

export const DURATION = {
  /** Tooltip fade, micro-feedback. */
  instant: 100,
  /** Hover/focus state changes. */
  fast: 180,
  /** Default for entrance/exit on small surfaces. */
  base: 240,
  /** Page transitions, modal entry. */
  smooth: 360,
  /** Hero entrance, celebration choreography. */
  cinematic: 600,
  /** Confetti / celebration loops. */
  showtime: 1200,
} as const;

// ─── Easing tokens ───────────────────────────────────────────────────────────
// CSS-string form for use in inline styles or className-via-style.

export const EASING = {
  /** Standard. Most common; fine for almost everything. */
  standard: "cubic-bezier(0.4, 0.0, 0.2, 1)",
  /** Decelerate. Element entering, snapping to rest. */
  decelerate: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  /** Accelerate. Element leaving the screen. */
  accelerate: "cubic-bezier(0.4, 0.0, 1, 1)",
  /** Spring-like overshoot. Use sparingly; great for celebration moments. */
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Gentle in-and-out for ambient idle animations (mascot bounce). */
  gentle: "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a `transition` string honoring reduced-motion. Pass the result
 * straight to `style={{ transition: ... }}`.
 *
 * @example
 *   const reduced = usePrefersReducedMotion();
 *   <div style={{ transition: orbitTransition(reduced, "transform", "base", "spring") }} />
 */
export function orbitTransition(
  reduced: boolean,
  property: string,
  duration: keyof typeof DURATION = "base",
  easing: keyof typeof EASING = "standard"
): string {
  if (reduced) return "none";
  return `${property} ${DURATION[duration]}ms ${EASING[easing]}`;
}

/**
 * Helper for Framer-Motion-style consumer libraries. Returns `0` when the
 * user wants reduced motion so animations finish instantly.
 */
export function orbitDuration(reduced: boolean, duration: keyof typeof DURATION = "base"): number {
  return reduced ? 0 : DURATION[duration];
}

// ─── Idle-bounce loop (for mascots, success ticks) ───────────────────────────
// Used as: <span className={orbitIdleBounce(reduced)}>🚀</span>
// When reduced-motion is on, the class collapses to a no-op.

export function orbitIdleBounce(reduced: boolean): string {
  if (reduced) return "";
  return "animate-orbit-bounce motion-safe:animate-orbit-bounce";
}
