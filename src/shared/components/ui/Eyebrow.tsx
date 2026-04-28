import React, { memo } from "react";

/**
 * Eyebrow — uppercase tracking-wide label.
 *
 * Maps onto the design system's `--ls-eyebrow` (0.18em) and `--fs-eyebrow`
 * (11px / 600 weight) tokens.
 *
 * Polymorphic via `as` so it can serve as a `<span>`, `<label>` (form
 * fields), `<dt>` (description lists), `<legend>` (fieldsets), or `<div>`.
 */

export type EyebrowSize = "xs" | "sm" | "md";
export type EyebrowTone = "muted" | "strong" | "onDark";
export type EyebrowAs = "span" | "div" | "label" | "dt" | "legend" | "p";

interface EyebrowProps extends React.HTMLAttributes<HTMLElement> {
  size?: EyebrowSize;
  tone?: EyebrowTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  as?: EyebrowAs;
  /** When `as="label"` — required to wire the label to its input via htmlFor. */
  htmlFor?: string;
}

const SIZE_CLASS: Record<EyebrowSize, string> = {
  xs: "text-[10px]",
  sm: "text-[11px]",
  md: "text-xs",
};

const TONE_CLASS: Record<EyebrowTone, string> = {
  muted: "text-gray-500",
  strong: "text-gray-700",
  onDark: "text-white/70",
};

const Eyebrow: React.FC<EyebrowProps> = ({
  size = "sm",
  tone = "muted",
  icon,
  children,
  as = "span",
  htmlFor,
  className = "",
  ...rest
}) => {
  const composed = `inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.18em] font-outfit ${SIZE_CLASS[size]} ${TONE_CLASS[tone]} ${className}`;

  const content = (
    <>
      {icon && (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </>
  );

  if (as === "label") {
    return (
      <label
        className={composed}
        htmlFor={htmlFor}
        {...(rest as React.LabelHTMLAttributes<HTMLLabelElement>)}
      >
        {content}
      </label>
    );
  }

  return React.createElement(as, { className: composed, ...rest }, content);
};

export default memo(Eyebrow);
