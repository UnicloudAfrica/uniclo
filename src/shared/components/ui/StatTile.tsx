import React, { memo, useId } from "react";
import Eyebrow from "./Eyebrow";
import { Skeleton } from "./Skeleton";

/**
 * StatTile — compact metric for dense grids.
 *
 * A11y:
 *   The eyebrow label is wired to the value via aria-labelledby, so screen
 *   readers always announce "{label}: {value}". When `value` is non-textual
 *   (JSX, icons, etc.) pass `accessibleValue` so the announced text is
 *   meaningful. The visual value remains untouched.
 */
export type StatTileTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
  /**
   * Plain-text value announced to screen readers when `value` is JSX.
   * If omitted and `value` is a string/number, that's used directly.
   */
  accessibleValue?: string | number;
  icon?: React.ReactNode;
  surface?: "card" | "transparent";
  tone?: StatTileTone;
  loading?: boolean;
  hint?: React.ReactNode;
  className?: string;
}

const VALUE_TONE_STYLE: Record<StatTileTone, React.CSSProperties> = {
  neutral: { color: "rgb(var(--theme-neutral-900))" },
  primary: { color: "rgb(var(--theme-color-700))" },
  secondary: { color: "rgb(var(--secondary-color-700))" },
  success: { color: "rgb(var(--theme-success-700))" },
  warning: { color: "rgb(var(--theme-warning-700))" },
  danger: { color: "rgb(var(--theme-danger-700))" },
};

const announcedText = (value: React.ReactNode, accessibleValue?: string | number): string => {
  if (accessibleValue !== undefined) return String(accessibleValue);
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
};

const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  accessibleValue,
  icon,
  surface = "card",
  tone = "neutral",
  loading = false,
  hint,
  className = "",
}) => {
  const labelId = useId();
  const valueId = useId();
  const isCard = surface === "card";
  const wrapperClass = isCard ? "db-surface-card rounded-xl p-4" : "p-1";
  const announced = announcedText(value, accessibleValue);

  return (
    <div
      className={`${wrapperClass} ${className} font-outfit`}
      role="group"
      aria-labelledby={`${labelId} ${valueId}`}
    >
      <Eyebrow size="xs" icon={icon} tone={isCard ? "muted" : "onDark"} id={labelId}>
        {label}
      </Eyebrow>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-3/5" aria-busy="true" />
      ) : (
        <div
          id={valueId}
          className="mt-1 text-2xl font-semibold leading-tight"
          style={isCard ? VALUE_TONE_STYLE[tone] : undefined}
          aria-label={announced || undefined}
        >
          {value}
        </div>
      )}
      {hint && !loading && (
        <div className="mt-1 text-[11px] text-gray-500">{hint}</div>
      )}
    </div>
  );
};

export default memo(StatTile);
