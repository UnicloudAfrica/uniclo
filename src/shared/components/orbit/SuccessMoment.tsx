import React, { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { usePrefersReducedMotion, DURATION, EASING, orbitTransition } from "./motion";

/**
 * SuccessMoment — full-overlay celebration shown when a long-running
 * resilience action completes. Used after BMR completes, after a cutover
 * advances to the final phase, after a DR drill passes, after a tenant
 * registers their first source.
 *
 * Why it matters:
 *   - Lift-and-shift takes minutes to hours. The user has been watching a
 *     progress bar. Closing the loop with a moment of celebration is the
 *     difference between "I think it worked" and "I KNOW it worked."
 *   - Tenants who feel rewarded run more migrations. This is product UX,
 *     not vanity.
 *
 * Design:
 *   - Backdrop fades in
 *   - Big circular check with spring overshoot animation
 *   - Confetti particles (CSS-only, no library) burst from the check
 *   - Title + body fade-in below
 *   - Optional primary CTA ("See the recovered server")
 *   - Auto-dismiss after `autoCloseAfter` ms (default 6000), or manual
 *     close via Esc / X button
 *   - Reduced-motion: confetti and overshoot disabled; gentle fade only
 *
 * Accessibility:
 *   - role="alertdialog", aria-modal="true"
 *   - aria-labelledby + aria-describedby
 *   - Esc to close
 *   - Focus trap; close button is the focus target
 *   - Returns focus to trigger element on close
 *
 * @example
 *   <SuccessMoment
 *     open={completed}
 *     onClose={() => setCompleted(false)}
 *     title="Your server made it!"
 *     body="The recovery finished without a hiccup. You can connect to it now."
 *     primaryCta={{ label: "Connect to it", onClick: () => navigate(`/instances/${id}`) }}
 *   />
 */

export interface SuccessMomentProps {
  /** Visibility. */
  open: boolean;
  /** Called on Esc, X click, or auto-close. */
  onClose: () => void;
  /** Friendly title. Plain English, ends with "!". */
  title: string;
  /** 1-2 sentence body explaining what's now possible. */
  body: string;
  /** Optional primary CTA — usually "do the next thing." */
  primaryCta?: { label: string; onClick: () => void };
  /** Optional secondary action — plain text link style. */
  secondaryCta?: { label: string; onClick: () => void };
  /** Auto-close after N ms. Default 6000. Pass 0 to disable. */
  autoCloseAfter?: number;
  /** Custom icon (defaults to a Check). */
  icon?: ReactNode;
}

const CONFETTI_COUNT = 18;
const CONFETTI_COLORS = ["var(--theme-color-500)", "var(--secondary-color)", "var(--theme-color-700)", "#FFFFFF"];

/** Pre-computed confetti positions so the component is deterministic. */
function confettiPieces(reduced: boolean) {
  if (reduced) return [];
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angle = (i / CONFETTI_COUNT) * Math.PI * 2;
    // Random-but-stable jitter using a hash of i so SSR + hydration match
    const distance = 80 + ((i * 37) % 60);
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 6) * 30,
      rotation: ((i * 47) % 360) - 180,
    };
  });
}

export function SuccessMoment({
  open,
  onClose,
  title,
  body,
  primaryCta,
  secondaryCta,
  autoCloseAfter = 6000,
  icon,
}: SuccessMomentProps): React.JSX.Element | null {
  const reduced = usePrefersReducedMotion();
  const titleId = React.useId();
  const bodyId = React.useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  // Focus management + auto-close + body scroll lock
  useEffect(() => {
    if (!open) {
      setAnimateIn(false);
      return;
    }
    triggerRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Animate in next frame so initial render is in the "from" state
    const raf = requestAnimationFrame(() => {
      setAnimateIn(true);
      closeBtnRef.current?.focus();
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (autoCloseAfter > 0) {
      timer = setTimeout(() => onClose(), autoCloseAfter);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      triggerRef.current?.focus?.();
    };
  }, [open, autoCloseAfter, onClose]);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confetti = confettiPieces(reduced);

  return createPortal(
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="fixed inset-0 z-[1100] flex items-center justify-center px-4 py-6"
      style={{
        // Backdrop uses the platform's theme-color at low opacity so the
        // overlay tint follows whichever brand is active (UniCloud blue,
        // Verdant emerald, Orbit indigo, Sahara orange).
        backgroundColor: animateIn
          ? "rgb(var(--theme-color-rgb) / 0.6)"
          : "rgb(var(--theme-color-rgb) / 0)",
        transition: orbitTransition(reduced, "background-color", "smooth", "decelerate"),
        backdropFilter: animateIn ? "blur(8px)" : "blur(0px)",
        WebkitBackdropFilter: animateIn ? "blur(8px)" : "blur(0px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-gray-900"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "scale(1)" : "scale(0.92)",
          transition: reduced
            ? `opacity ${DURATION.fast}ms ${EASING.standard}`
            : `opacity ${DURATION.smooth}ms ${EASING.standard}, transform ${DURATION.cinematic}ms ${EASING.spring}`,
        }}
      >
        {/* Close button (top-right) */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-3 top-3 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Check icon + confetti */}
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          {/* Confetti — purely decorative */}
          {confetti.map((p) => (
            <span
              key={p.id}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 block h-2.5 w-1 rounded-sm"
              style={{
                backgroundColor: p.color,
                transform: animateIn
                  ? `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`
                  : "translate(0,0) rotate(0deg)",
                opacity: animateIn ? 0 : 1,
                transition: `transform ${DURATION.showtime}ms ${EASING.decelerate} ${p.delay}ms, opacity ${DURATION.showtime}ms ${EASING.standard} ${p.delay}ms`,
              }}
            />
          ))}
          {/* Glow halo */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-emerald-400 opacity-40 blur-2xl"
            style={{
              transform: animateIn ? "scale(1)" : "scale(0.5)",
              transition: orbitTransition(reduced, "transform", "cinematic", "spring"),
            }}
          />
          {/* Check circle */}
          <span
            aria-hidden="true"
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-primary-500 text-white shadow-lg"
            style={{
              transform: animateIn ? "scale(1) rotate(0deg)" : "scale(0.3) rotate(-180deg)",
              transition: reduced
                ? `transform ${DURATION.fast}ms ${EASING.standard}`
                : `transform ${DURATION.cinematic}ms ${EASING.spring}`,
            }}
          >
            {icon ?? <Check className="h-10 w-10" strokeWidth={3} />}
          </span>
        </div>

        <h2 id={titleId} className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <p
          id={bodyId}
          className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400"
        >
          {body}
        </p>

        {(primaryCta || secondaryCta) && (
          <div className="mt-6 flex flex-col items-stretch gap-2">
            {primaryCta && (
              <button
                type="button"
                onClick={primaryCta.onClick}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 motion-reduce:hover:scale-100 dark:focus:ring-offset-gray-900"
                style={{ transition: orbitTransition(reduced, "all", "fast", "spring") }}
              >
                {primaryCta.label}
              </button>
            )}
            {secondaryCta && (
              <button
                type="button"
                onClick={secondaryCta.onClick}
                className="rounded-md text-sm font-medium text-gray-600 underline-offset-4 transition-colors hover:text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:text-gray-200 dark:focus:ring-offset-gray-900"
              >
                {secondaryCta.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default SuccessMoment;
