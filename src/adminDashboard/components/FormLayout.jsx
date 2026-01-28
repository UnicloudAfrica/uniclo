import React from "react";
import { X } from "lucide-react";

const hexToRgba = (hex, alpha = 1) => {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * @typedef {Object} FormLayoutProps
 * @property {string} [mode]
 * @property {string} title
 * @property {string} [description]
 * @property {() => void} [onClose]
 * @property {boolean} [isProcessing]
 * @property {string} [accentGradient]
 * @property {string} [accentColor]
 * @property {any[]} [meta]
 * @property {string} [kicker]
 * @property {React.ReactNode} [headerBadge]
 * @property {React.ReactNode} [headerActions]
 * @property {React.ReactNode} [aside]
 * @property {React.ReactNode} children
 * @property {React.ReactNode} [footer]
 * @property {string} [maxWidthClass]
 * @property {string} [contentPaddingClass]
 * @property {string} [className]
 * @property {boolean} [showCloseButton]
 */

/**
 * @param {FormLayoutProps} props
 */
const FormLayout = ({
  mode = "modal",
  title,
  description,
  onClose,
  isProcessing = false,
  accentGradient = "brand-hero",
  accentColor = "var(--theme-color)",
  meta = [],
  kicker,
  headerBadge,
  headerActions,
  aside,
  children,
  footer,
  maxWidthClass = "max-w-5xl",
  contentPaddingClass = "px-8 py-8",
  className = "",
  showCloseButton = true,
}) => {
  const isPageMode = mode === "page";
  const headingId = React.useId();
  const descriptionId = React.useId();

  const wrapperClasses = isPageMode
    ? `font-Outfit w-full ${className}`
    : `fixed inset-0 z-[1000] flex items-start justify-center bg-black/50 px-4 py-10 font-Outfit ${className}`;

  const headerClassName =
    accentGradient === "brand-hero"
      ? "brand-hero text-white"
      : `relative bg-gradient-to-br ${accentGradient} text-white`;

  const cardBaseClasses =
    "relative flex w-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl";
  const cardClasses = isPageMode ? cardBaseClasses : `${cardBaseClasses} max-h-[min(92vh,960px)]`;

  const handleClose = () => {
    if (!isProcessing && typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <div
      className={wrapperClasses}
      role={isPageMode ? undefined : "dialog"}
      aria-modal={isPageMode ? undefined : "true"}
      aria-labelledby={headingId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className={`w-full ${maxWidthClass}`}>
        <div className={cardClasses}>
          <div className={headerClassName}>
            <div className="px-8 pb-10 pt-8 md:px-10">
              {kicker && (
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  {kicker}
                </p>
              )}
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="space-y-3">
                  <h2 id={headingId} className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {title}
                  </h2>
                  {description && (
                    <p
                      id={descriptionId}
                      className="max-w-2xl text-sm font-medium text-white/80 md:text-base"
                    >
                      {description}
                    </p>
                  )}
                  {headerBadge}
                </div>
                {headerActions && (
                  <div className="flex flex-wrap items-center gap-3">{headerActions}</div>
                )}
              </div>
              {meta.length > 0 && (
                <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {meta.map(({ label, value, hint }, index) => (
                    <div
                      key={`${label}-${index}`}
                      className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-white/70">
                        {label}
                      </dt>
                      <dd className="mt-2 text-lg font-semibold leading-tight text-white">
                        {value ?? "—"}
                      </dd>
                      {hint && <p className="mt-1 text-xs font-medium text-white/70">{hint}</p>}
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div
              className={`${contentPaddingClass} ${
                aside ? "grid gap-8 lg:grid-cols-[280px,1fr]" : ""
              }`}
            >
              {aside && <aside className="order-1 space-y-6 lg:order-none">{aside}</aside>}
              <div className="order-last space-y-8 lg:order-none">{children}</div>
            </div>
          </div>

          {footer && (
            <div className="border-t border-slate-200 bg-white px-6 py-4 sm:px-8">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const formAccent = {
  primary: {
    gradient: "brand-hero",
    color: "var(--theme-color)",
  },
  emerald: {
    gradient: "brand-hero",
    color: "var(--theme-color)",
  },
  slate: {
    gradient: "brand-hero",
    color: "var(--theme-color)",
  },
};

export const getAccentRgba = (color, opacity) => {
  if (!color) return hexToRgba(color, opacity);
  if (typeof color === "string" && color.includes("var(")) {
    if (color.includes("--secondary-color")) {
      return `rgba(var(--secondary-color-rgb), ${opacity})`;
    }
    return `rgba(var(--theme-color-rgb), ${opacity})`;
  }
  return hexToRgba(color, opacity);
};

export default FormLayout;
