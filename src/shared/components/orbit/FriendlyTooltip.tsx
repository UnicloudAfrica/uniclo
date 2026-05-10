import React, { ReactNode, useId, useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { usePrefersReducedMotion, orbitTransition } from "./motion";

/**
 * FriendlyTooltip — wraps any technical term and surfaces a plain-English
 * explanation on hover or focus. Solves the "what's RPO?" problem without
 * cluttering the page with footnotes.
 *
 * Two modes:
 *   - "inline"   : wraps an existing word/phrase, adds a subtle dotted underline
 *   - "icon"     : standalone (?) icon, used when there's no natural anchor word
 *
 * Accessibility:
 *   - Implements the W3C ARIA tooltip pattern:
 *     - The trigger has aria-describedby pointing at the tooltip
 *     - role="tooltip" on the bubble
 *     - Tooltip appears on hover, focus, AND tap (mobile)
 *     - Esc dismisses
 *   - Fully keyboard accessible: Tab to the trigger, the tooltip auto-shows
 *   - Reduced-motion: instant show/hide
 *
 * @example
 *   // Inline:
 *   Your <FriendlyTooltip term="RPO" definition="How much data you can afford to lose if something goes wrong. Lower = less data lost." /> is 60 seconds.
 *
 *   // Icon:
 *   <label>
 *     Data sovereignty
 *     <FriendlyTooltip mode="icon" definition="Where your data physically lives. Some laws require it to stay in your country." />
 *   </label>
 */

export interface FriendlyTooltipProps {
  /** "inline" wraps the `term`; "icon" renders a (?) icon. */
  mode?: "inline" | "icon";
  /** Required when mode="inline": the word/phrase to wrap. */
  term?: ReactNode;
  /** Plain-English explanation. 1-2 sentences max. No jargon. */
  definition: string;
  /** Optional secondary line ("Why it matters" or "Example: ..."). */
  example?: string;
  /** Where the tooltip prefers to appear relative to the trigger. */
  placement?: "top" | "bottom" | "auto";
  /** Optional class on the trigger wrapper. */
  className?: string;
}

export function FriendlyTooltip({
  mode = "inline",
  term,
  definition,
  example,
  placement = "auto",
  className = "",
}: FriendlyTooltipProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [resolvedPlacement, setResolvedPlacement] = useState<"top" | "bottom">("top");

  // Compute placement — flip to "bottom" if there's no room above
  useEffect(() => {
    if (!open || placement !== "auto") {
      if (placement === "bottom") setResolvedPlacement("bottom");
      else setResolvedPlacement("top");
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setResolvedPlacement(rect.top < 120 ? "bottom" : "top");
  }, [open, placement]);

  // Esc to dismiss
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Mobile: tap toggles; outside-click closes
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        bubbleRef.current &&
        !bubbleRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const triggerProps = {
    ref: triggerRef,
    tabIndex: 0,
    role: "button" as const,
    "aria-describedby": open ? tipId : undefined,
    "aria-expanded": open,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen((v) => !v);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    },
  };

  const bubble = (
    <span
      ref={bubbleRef}
      id={tipId}
      role="tooltip"
      // The bubble is positioned absolutely relative to the trigger wrapper
      className={[
        "absolute left-1/2 z-50 w-64 -translate-x-1/2 rounded-xl bg-primary-700 px-3 py-2.5 text-left text-xs leading-relaxed text-white shadow-xl",
        "dark:bg-gray-100 dark:text-gray-900",
        resolvedPlacement === "top" ? "bottom-full mb-2" : "top-full mt-2",
      ].join(" ")}
      style={{
        opacity: open ? 1 : 0,
        transform: open
          ? "translateX(-50%) translateY(0)"
          : `translateX(-50%) translateY(${resolvedPlacement === "top" ? "4px" : "-4px"})`,
        transition: orbitTransition(reduced, "all", "fast", "decelerate"),
        pointerEvents: open ? "auto" : "none",
      }}
    >
      <p className="font-medium">{definition}</p>
      {example && (
        <p className="mt-1.5 text-[11px] text-white/70 dark:text-gray-600">{example}</p>
      )}
      {/* Bubble arrow */}
      <span
        aria-hidden="true"
        className={[
          "absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-primary-700 dark:bg-gray-100",
          resolvedPlacement === "top" ? "top-full -mt-1" : "bottom-full -mb-1",
        ].join(" ")}
      />
    </span>
  );

  if (mode === "icon") {
    return (
      <span className={`relative inline-flex items-center ${className}`}>
        <span
          {...triggerProps}
          aria-label="Show explanation"
          className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-gray-400 outline-none transition-colors hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:hover:text-gray-200 dark:focus-visible:ring-offset-gray-900"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </span>
        {bubble}
      </span>
    );
  }

  // Inline mode
  return (
    <span className={`relative inline-block ${className}`}>
      <span
        {...triggerProps}
        className="cursor-help border-b border-dotted border-gray-400 outline-none focus-visible:rounded focus-visible:bg-blue-100 focus-visible:px-0.5 dark:border-gray-500 dark:focus-visible:bg-blue-900/40"
      >
        {term}
      </span>
      {bubble}
    </span>
  );
}

export default FriendlyTooltip;
