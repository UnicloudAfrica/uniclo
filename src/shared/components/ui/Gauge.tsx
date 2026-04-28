import React, { memo, useId } from "react";

/**
 * Gauge — radial progress indicator (0–100%). Semantic tone is derived
 * from value by default (≥90% danger, ≥75% warning, else success), or
 * can be overridden.
 *
 * Accessible: exposes `role="meter"` with aria-valuenow/min/max and a
 * descriptive aria-label. Honours `prefers-reduced-motion` (no transition
 * when the user prefers reduced motion).
 *
 * Sizes: sm (64px), md (96px, default), lg (128px).
 */

export type GaugeTone = "auto" | "primary" | "secondary" | "success" | "warning" | "danger";
export type GaugeSize = "sm" | "md" | "lg";

interface GaugeProps {
  /** 0–100. Values outside the range are clamped. */
  value: number;
  /** Accessible label. Falls back to `${label}: ${value}%`. */
  label: string;
  /** Optional suffix appended to the displayed value (default `%`). */
  suffix?: string;
  /** Optional leading icon shown next to the label. */
  icon?: React.ReactNode;
  /** Override automatic tone derivation. */
  tone?: GaugeTone;
  size?: GaugeSize;
  /** Override the formatted value text (e.g. "3/4 nodes"). */
  displayValue?: string;
  className?: string;
}

const SIZE_PX: Record<GaugeSize, number> = {
  sm: 64,
  md: 96,
  lg: 128,
};

const TONE_VAR: Record<Exclude<GaugeTone, "auto">, string> = {
  primary: "rgb(var(--theme-color-500))",
  secondary: "rgb(var(--secondary-color-500))",
  success: "rgb(var(--theme-success-500))",
  warning: "rgb(var(--theme-warning-500))",
  danger: "rgb(var(--theme-danger-500))",
};

const resolveTone = (value: number, tone: GaugeTone): string => {
  if (tone !== "auto") return TONE_VAR[tone];
  if (value >= 90) return TONE_VAR.danger;
  if (value >= 75) return TONE_VAR.warning;
  return TONE_VAR.success;
};

const Gauge: React.FC<GaugeProps> = ({
  value,
  label,
  suffix = "%",
  icon,
  tone = "auto",
  size = "md",
  displayValue,
  className = "",
}) => {
  const titleId = useId();
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const color = resolveTone(clamped, tone);
  const px = SIZE_PX[size];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const fontSize = size === "sm" ? 14 : size === "lg" ? 22 : 18;

  return (
    <div className={`flex flex-col items-center font-outfit ${className}`}>
      <div className="relative" style={{ width: px, height: px }}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90"
          role="meter"
          aria-labelledby={titleId}
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={displayValue ?? `${clamped.toFixed(1)}${suffix}`}
        >
          <title id={titleId}>{label}</title>
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgb(var(--theme-neutral-200))"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color, fontSize, fontWeight: 600, lineHeight: 1 }}>
            {displayValue ?? `${clamped.toFixed(1)}${suffix}`}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
        {icon && <span className="shrink-0">{icon}</span>}
        {label}
      </div>
    </div>
  );
};

export default memo(Gauge);
