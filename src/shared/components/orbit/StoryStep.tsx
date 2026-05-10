import React, { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrefersReducedMotion, orbitTransition, DURATION } from "./motion";

/**
 * StoryStep — a single step inside a multi-step wizard, but written like
 * a story rather than a form.
 *
 * Most enterprise wizards look like:
 *   Step 3 of 7 — Network Configuration
 *   [ wall of dropdowns ]
 *   [Back] [Next]
 *
 * StoryStep instead frames each step as:
 *   - a big numeric badge (3) with a friendly title ("How should we get there?")
 *   - a plain-English explanation of what this step decides
 *   - the actual fields (the hard work)
 *   - a "what happens if I skip this" note for skippable steps
 *   - back/next/skip with friendly verbs ("Got it" instead of "Next")
 *
 * This is used inside e.g. the BMR wizard, cutover advance flow, recovery
 * plan builder, source registration wizard.
 *
 * Accessibility:
 *   - The wizard parent should expose `role="region" aria-label="step <n> of <total>"`.
 *   - Inside this step, headings use semantic h2/h3.
 *   - "Back" is the first focusable control after the heading; pressing
 *     Tab walks the user through the form sensibly.
 *   - Step counter is announced to screen readers via the aria-label on
 *     the step badge ("Step 3 of 7: How should we get there?").
 *
 * @example
 *   <StoryStep
 *     stepNumber={2}
 *     totalSteps={5}
 *     title="Where should it land?"
 *     blurb="Pick a region for the recovered server. Closer to your users = faster connections."
 *     illustration={<RegionMapIllustration />}
 *     onBack={() => goPrev()}
 *     onNext={() => goNext()}
 *     nextDisabled={!form.regionId}
 *     skippable={false}
 *   >
 *     <RegionPicker value={form.regionId} onChange={(id) => setForm({...form, regionId: id})} />
 *   </StoryStep>
 */

export interface StoryStepProps {
  /** 1-indexed step number for the badge. */
  stepNumber: number;
  /** Total steps in the wizard, for the progress display. */
  totalSteps: number;
  /** Friendly title for this step. Plain English. */
  title: string;
  /** 1-2 sentence plain-English explanation of what this step decides. */
  blurb: string;
  /** Optional illustration shown above the form (left-aligned on desktop). */
  illustration?: ReactNode;
  /** The actual step content — fields, pickers, etc. */
  children: ReactNode;
  /** Called when user clicks Back (or presses ESC where supported). */
  onBack?: () => void;
  /** Called when user clicks Next. */
  onNext: () => void;
  /** When true, the step can be skipped — shows a "Skip this for now" link. */
  skippable?: boolean;
  /** Called when user skips. */
  onSkip?: () => void;
  /** Disable the Next button (typically when form not valid). */
  nextDisabled?: boolean;
  /** Override the Next-button label. Default "Got it". */
  nextLabel?: string;
  /** Override the Back-button label. Default "Back". */
  backLabel?: string;
  /** Mark step as "the last one" — Next becomes "Looks good!" by default. */
  isFinalStep?: boolean;
  /** Optional fine-print under the buttons (e.g. "We won't charge you yet."). */
  reassurance?: string;
}

export function StoryStep({
  stepNumber,
  totalSteps,
  title,
  blurb,
  illustration,
  children,
  onBack,
  onNext,
  skippable = false,
  onSkip,
  nextDisabled = false,
  nextLabel,
  backLabel = "Back",
  isFinalStep = false,
  reassurance,
}: StoryStepProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const titleId = React.useId();
  const blurbId = React.useId();
  const resolvedNextLabel = nextLabel ?? (isFinalStep ? "Looks good!" : "Got it");
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      aria-describedby={blurbId}
      className="mx-auto w-full max-w-3xl"
    >
      {/* ─── Progress hairline ─── */}
      <div
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${stepNumber} of ${totalSteps}`}
        className="mb-8 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
      >
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-[var(--secondary-color)]"
          style={{
            width: `${progress}%`,
            transition: orbitTransition(reduced, "width", "smooth", "decelerate"),
          }}
        />
      </div>

      {/* ─── Header: number badge + title + blurb ─── */}
      <div className="mb-6 flex items-start gap-4 sm:gap-5">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white shadow-lg sm:h-14 sm:w-14 sm:text-xl"
          style={{
            transition: orbitTransition(reduced, "transform", "base", "spring"),
            animation: reduced ? "none" : `orbit-pop ${DURATION.cinematic}ms ease-out`,
          }}
        >
          {stepNumber}
        </div>
        <div className="flex-1 pt-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Step {stepNumber} of {totalSteps}
          </p>
          <h2
            id={titleId}
            className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl"
          >
            {title}
          </h2>
          <p
            id={blurbId}
            className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base"
          >
            {blurb}
          </p>
        </div>
      </div>

      {/* ─── Body: optional illustration + step content ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6 lg:p-8">
        {illustration && (
          <div
            aria-hidden="true"
            className="mx-auto mb-6 flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40"
          >
            {illustration}
          </div>
        )}
        <div>{children}</div>
      </div>

      {/* ─── Footer: back / skip / next ─── */}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus:ring-offset-gray-900"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </button>
          )}
          {skippable && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 underline-offset-4 transition-colors hover:text-gray-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-200 dark:focus:ring-offset-gray-900"
            >
              Skip this for now
            </button>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            aria-disabled={nextDisabled}
            className={[
              "group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
              "bg-gradient-to-br from-primary-500 to-primary-700 text-white hover:shadow-lg hover:scale-[1.02] focus:ring-primary-500",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100",
              "motion-reduce:hover:scale-100",
            ].join(" ")}
            style={{ transition: orbitTransition(reduced, "all", "fast", "spring") }}
          >
            {resolvedNextLabel}
            <ChevronRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </button>
          {reassurance && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{reassurance}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default StoryStep;
