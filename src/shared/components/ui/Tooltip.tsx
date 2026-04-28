import React, {
  cloneElement,
  isValidElement,
  memo,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

/**
 * Tooltip — a11y-first, dependency-free tooltip.
 *
 * Wrap any focusable element with `<Tooltip content="…">`. The wrapped
 * element gets `aria-describedby` linking to the tooltip text, so screen
 * readers announce the tooltip when the trigger is focused.
 *
 * Behaviour:
 *   - Shows on hover and on keyboard focus.
 *   - Hides on Escape, blur, or pointer-leave.
 *   - Supports `delay` (default 200ms) before showing to avoid noise on
 *     incidental hovers.
 *   - Honours `prefers-reduced-motion` (no fade animation).
 *
 * Use for icon-only buttons, abbreviation expansions, and short
 * supplementary text. Do not use for critical info that should always
 * be visible.
 */

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** The element to wrap. Must be a single React element that accepts ref + event handlers. */
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: TooltipPlacement;
  /** Show delay in ms (default 200). */
  delay?: number;
  /** Override id used to link aria-describedby. */
  id?: string;
  className?: string;
  /** When true the tooltip never opens. Useful for conditional disable. */
  disabled?: boolean;
}

const PLACEMENT_CLASS: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = "top",
  delay = 200,
  id,
  className = "",
  disabled = false,
}) => {
  const generatedId = useId();
  const tooltipId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clear = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = () => {
    if (disabled) return;
    clear();
    timerRef.current = window.setTimeout(() => setOpen(true), Math.max(0, delay));
  };

  const hide = () => {
    clear();
    setOpen(false);
  };

  useEffect(() => () => clear(), []);

  // Hide on Escape — register at the document level since the tooltip
  // child may be an element that doesn't bubble keydown to its parent.
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!isValidElement(children)) {
    return <>{children}</>;
  }

  const childProps = (children.props ?? {}) as React.HTMLAttributes<HTMLElement> & {
    "aria-describedby"?: string;
  };
  const existingDescribedBy = childProps["aria-describedby"];

  const trigger = cloneElement(children, {
    onMouseEnter: ((e) => {
      childProps.onMouseEnter?.(e);
      show();
    }) as React.MouseEventHandler<HTMLElement>,
    onMouseLeave: ((e) => {
      childProps.onMouseLeave?.(e);
      hide();
    }) as React.MouseEventHandler<HTMLElement>,
    onFocus: ((e) => {
      (childProps.onFocus as React.FocusEventHandler<HTMLElement> | undefined)?.(e);
      show();
    }) as React.FocusEventHandler<HTMLElement>,
    onBlur: ((e) => {
      (childProps.onBlur as React.FocusEventHandler<HTMLElement> | undefined)?.(e);
      hide();
    }) as React.FocusEventHandler<HTMLElement>,
    "aria-describedby": [existingDescribedBy, open ? tooltipId : null]
      .filter(Boolean)
      .join(" ") || undefined,
  } as Partial<React.HTMLAttributes<HTMLElement>>);

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && content && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute z-50 max-w-xs whitespace-normal rounded-md px-2 py-1 text-[11px] font-medium font-outfit shadow-md motion-safe:animate-fadeIn ${PLACEMENT_CLASS[placement]} ${className}`}
          style={{
            background: "rgb(var(--theme-neutral-900))",
            color: "rgb(var(--theme-neutral-50))",
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default memo(Tooltip);
