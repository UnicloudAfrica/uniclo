import React, { memo } from "react";
import { X } from "lucide-react";
import { useUiMessages } from "./messages";

/**
 * Chip — compact pill for filters, tags, multi-select selections.
 *
 * Different from StatusPill (which is a status indicator). Chips are
 * interactive: they can be clicked, toggled selected/unselected, or
 * dismissed with a close icon.
 *
 * A11y:
 *   - When `onClick` is provided, renders as a `<button>` with proper
 *     `aria-pressed` if `selected` is set.
 *   - The dismiss button has its own aria-label and stops propagation
 *     so it doesn't trigger the chip's onClick.
 */

export type ChipTone = "neutral" | "primary" | "secondary" | "success" | "warning" | "danger";
export type ChipSize = "sm" | "md";

export interface ChipProps {
  children: React.ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  /** Toggleable mode. When true the chip uses `aria-pressed`. */
  selected?: boolean;
  onClick?: () => void;
  /** Show close X. The handler is wired to this; clicking it does NOT call onClick. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. */
  dismissLabel?: string;
  /** Optional leading icon */
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const TONE_BASE: Record<ChipTone, React.CSSProperties> = {
  neutral: {
    background: "rgb(var(--theme-neutral-100))",
    color: "rgb(var(--theme-neutral-700))",
  },
  primary: {
    background: "var(--theme-color-10)",
    color: "var(--theme-color)",
  },
  secondary: {
    background: "rgb(var(--secondary-color-500) / 0.12)",
    color: "rgb(var(--secondary-color-700))",
  },
  success: {
    background: "rgb(var(--theme-success-500) / 0.12)",
    color: "rgb(var(--theme-success-700))",
  },
  warning: {
    background: "rgb(var(--theme-warning-500) / 0.14)",
    color: "rgb(var(--theme-warning-700))",
  },
  danger: {
    background: "rgb(var(--theme-danger-500) / 0.14)",
    color: "rgb(var(--theme-danger-700))",
  },
};

const TONE_SELECTED: Record<ChipTone, React.CSSProperties> = {
  neutral: {
    background: "rgb(var(--theme-neutral-700))",
    color: "rgb(var(--theme-neutral-50))",
  },
  primary: {
    background: "var(--theme-color)",
    color: "var(--theme-on-color)",
  },
  secondary: {
    background: "rgb(var(--secondary-color-500))",
    color: "var(--theme-on-secondary)",
  },
  success: {
    background: "rgb(var(--theme-success-500))",
    color: "white",
  },
  warning: {
    background: "rgb(var(--theme-warning-500))",
    color: "white",
  },
  danger: {
    background: "rgb(var(--theme-danger-500))",
    color: "white",
  },
};

const SIZE_CLASS: Record<ChipSize, string> = {
  sm: "h-6 px-2 text-[11px]",
  md: "h-7 px-2.5 text-xs",
};

const Chip: React.FC<ChipProps> = ({
  children,
  tone = "neutral",
  size = "md",
  selected = false,
  onClick,
  onDismiss,
  dismissLabel,
  icon,
  disabled = false,
  className = "",
}) => {
  const messages = useUiMessages();
  const resolvedDismissLabel = dismissLabel ?? messages.remove;
  const interactive = Boolean(onClick) && !disabled;
  const style = selected ? TONE_SELECTED[tone] : TONE_BASE[tone];
  const composed = `inline-flex items-center gap-1 rounded-full font-medium font-outfit ${SIZE_CLASS[size]} ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  } ${
    interactive
      ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-1 motion-safe:transition-colors"
      : ""
  } ${className}`;

  const inner = (
    <>
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label={resolvedDismissLabel}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onDismiss();
          }}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </>
  );

  // When BOTH onClick and onDismiss are set, native <button> nesting would
  // be invalid HTML (button-in-button). In that case we render the chip body
  // as a role="button" span so the dismiss <button> remains valid; the chip
  // still gets full keyboard activation (Enter/Space) via onKeyDown.
  if (interactive && onDismiss) {
    const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    };
    return (
      <span
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && onClick?.()}
        onKeyDown={onKeyDown}
        className={composed}
        style={style}
      >
        {inner}
      </span>
    );
  }

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        disabled={disabled}
        className={composed}
        style={style}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={composed} style={style}>
      {inner}
    </span>
  );
};

export default memo(Chip);
