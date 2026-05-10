import React, { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { usePrefersReducedMotion, orbitTransition } from "./motion";

/**
 * HeroBanner — the friendly first-impression card that sits at the top of
 * any new-feature page. Replaces the bare "<h1>Title</h1>" + paragraph
 * pattern with a warm, illustrated welcome that explains the feature in
 * plain English.
 *
 * Two visual modes:
 *   - "calm"     : aurora-gradient background, soft glow, subtle parallax
 *   - "spotlight": bigger hero with a primary CTA button, used for
 *                  zero-state or first-run experiences
 *
 * Why an illustration slot rather than a baked-in image:
 *   - Each Orbit feature has its own metaphor (BMR = moving boxes, cutover
 *     = bridge, DR drill = fire-drill, assessment = magnifying glass)
 *   - Illustrations live in `shared/illustrations/orbit/` so designers can
 *     update them without touching component code
 *   - Reduced-motion users get a static SVG; everyone else gets a gentle
 *     idle animation (e.g., satellite slowly orbits)
 *
 * Accessibility:
 *   - `<section>` with aria-labelledby pointing at the title
 *   - Decorative illustration is `aria-hidden`
 *   - CTA button is full-keyboard reachable; focus ring respects theme
 *   - Plain-English subtitle is the primary descriptor; the technical
 *     "what this is" goes in a secondary line
 *
 * @example
 *   <HeroBanner
 *     mode="spotlight"
 *     eyebrow="Orbit · Bare-Metal Recovery"
 *     title="Move a real machine to the cloud"
 *     subtitle="We'll take a snapshot of your physical server and bring it back to life on a new one. You stay in control the whole way."
 *     illustration={<MovingBoxesIllustration />}
 *     primaryCta={{ label: "Start a recovery", onClick: () => navigate("/orbit/bmr/new") }}
 *     secondaryCta={{ label: "What is BMR?", onClick: () => setShowExplainer(true) }}
 *   />
 */

export interface HeroBannerProps {
  /** Tiny label above the title. Use for breadcrumbing ("Orbit · BMR"). */
  eyebrow?: string;
  /** Main title. Plain English, sentence-case, 6 words max. */
  title: string;
  /** Subtitle. Plain English description of what the feature does. 1-2 sentences. */
  subtitle: string;
  /**
   * Tertiary "what this technically is" line. Optional. Used when the
   * customer might be a tenant who knows the jargon and wants the
   * technical anchor.
   */
  technicalNote?: string;
  /**
   * Right-side illustration. Pass an SVG component — it's rendered inside
   * a wrapper that handles sizing and aria-hidden automatically.
   */
  illustration?: ReactNode;
  /** Primary action — large CTA button. */
  primaryCta?: { label: string; onClick: () => void; icon?: ReactNode };
  /** Secondary action — text-link style. */
  secondaryCta?: { label: string; onClick: () => void };
  /** Visual mode. */
  mode?: "calm" | "spotlight";
  /** Additional class on the outer section. */
  className?: string;
}

export function HeroBanner({
  eyebrow,
  title,
  subtitle,
  technicalNote,
  illustration,
  primaryCta,
  secondaryCta,
  mode = "calm",
  className = "",
}: HeroBannerProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const titleId = React.useId();

  const isSpotlight = mode === "spotlight";

  return (
    <section
      aria-labelledby={titleId}
      className={[
        "relative overflow-hidden rounded-2xl border",
        // Aurora gradient — warm, alive, not corporate.
        // Layered: base navy → blue → soft amber accent in top-right.
        "bg-gradient-to-br from-primary-700 via-primary-500 to-primary-700",
        "border-white/10",
        isSpotlight ? "p-8 sm:p-10 lg:p-12" : "p-6 sm:p-8",
        className,
      ].join(" ")}
    >
      {/* Decorative orb — top-right, soft amber, parallax-y on scroll.
          Honors reduced-motion. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--secondary-color)] opacity-20 blur-3xl"
        style={{
          transition: orbitTransition(reduced, "transform", "cinematic", "gentle"),
        }}
      />
      {/* Decorative star sparkles — purely cosmetic */}
      <div aria-hidden="true" className="pointer-events-none absolute right-8 top-8 text-white/40">
        <Sparkles className="h-5 w-5" />
      </div>

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1fr,auto] lg:items-center lg:gap-10">
        {/* ─── Copy column ─── */}
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--secondary-color)]">
              {eyebrow}
            </p>
          )}
          <h1
            id={titleId}
            className={`font-bold tracking-tight text-white ${
              isSpotlight ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {title}
          </h1>
          <p
            className={`mt-3 leading-relaxed text-white/90 ${
              isSpotlight ? "text-base sm:text-lg" : "text-sm sm:text-base"
            }`}
          >
            {subtitle}
          </p>
          {technicalNote && (
            <p className="mt-2 text-xs text-white/60">{technicalNote}</p>
          )}

          {(primaryCta || secondaryCta) && (
            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              {primaryCta && (
                <button
                  type="button"
                  onClick={primaryCta.onClick}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700 motion-reduce:hover:scale-100"
                  style={{ transition: orbitTransition(reduced, "all", "fast", "spring") }}
                >
                  {primaryCta.icon}
                  {primaryCta.label}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </button>
              )}
              {secondaryCta && (
                <button
                  type="button"
                  onClick={secondaryCta.onClick}
                  className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-white/90 underline-offset-4 transition-colors hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700"
                >
                  {secondaryCta.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─── Illustration column ─── */}
        {illustration && (
          <div
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center ${
              isSpotlight ? "h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56" : "h-28 w-28 sm:h-32 sm:w-32"
            }`}
          >
            {illustration}
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroBanner;
