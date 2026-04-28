import React, { memo, useId } from "react";

/**
 * ProgressBar — linear progress indicator (0–100%). Semantic tone derived
 * from value by default; can be overridden.
 *
 * Accessible: `role="progressbar"` with aria-valuenow/min/max + label.
 * Reduced motion respected via motion-safe Tailwind utilities.
 */

export type ProgressBarTone = "auto" | "primary" | "secondary" | "success" | "warning" | "danger";

interface ProgressBarProps {
  value: number;
  /** Visible or visually-hidden label. Required for a11y. */
  label: string;
  /** When true, the label is rendered above the bar. Otherwise it's hidden but still announced. */
  showLabel?: boolean;
  /** Show numeric value to the right of the label. */
  showValue?: boolean;
  tone?: ProgressBarTone;
  size?: "sm" | "md";
  className?: string;
}

const TONE_VAR: Record<Exclude<ProgressBarTone, "auto">, string> = {
  primary: "rgb(var(--theme-color-500))",
  secondary: "rgb(var(--secondary-color-500))",
  success: "rgb(var(--theme-success-500))",
  warning: "rgb(var(--theme-warning-500))",
  danger: "rgb(var(--theme-danger-500))",
};

const resolveTone = (value: number, tone: ProgressBarTone): string => {
  if (tone !== "auto") return TONE_VAR[tone];
  if (value >= 90) return TONE_VAR.danger;
  if (value >= 75) return TONE_VAR.warning;
  return TONE_VAR.success;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showLabel = true,
  showValue = true,
  tone = "auto",
  size = "sm",
  className = "",
}) => {
  const id = useId();
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const color = resolveTone(clamped, tone);
  const trackHeight = size === "md" ? "h-2" : "h-1.5";

  return (
    <div className={`font-outfit ${className}`}>
      {showLabel && (
        <div
          id={`${id}-label`}
          className="mb-1 flex items-center justify-between text-[11px]"
        >
          <span className="text-gray-500">{label}</span>
          {showValue && (
            <span className="font-semibold text-gray-700">{clamped.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-labelledby={showLabel ? `${id}-label` : undefined}
        aria-label={showLabel ? undefined : label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`overflow-hidden rounded-full bg-gray-100 ${trackHeight}`}
      >
        <div
          className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
    </div>
  );
};

export default memo(ProgressBar);
