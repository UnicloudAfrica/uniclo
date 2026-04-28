import React, { memo, useId } from "react";
import Eyebrow from "./Eyebrow";
import { Skeleton } from "./Skeleton";

/**
 * KpiTile — dark-on-brand tile for hero strips inside .db-signal-panel.
 *
 * Same a11y model as StatTile: label and value linked via aria-labelledby,
 * with optional `accessibleValue` for non-textual values.
 */
export type KpiTileTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

export interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  accessibleValue?: string | number;
  icon?: React.ReactNode;
  tone?: KpiTileTone;
  loading?: boolean;
  className?: string;
}

const VALUE_VAR: Record<KpiTileTone, string> = {
  neutral: "rgb(var(--theme-neutral-100))",
  primary: "rgb(var(--theme-color-300))",
  secondary: "rgb(var(--secondary-color-500))",
  success: "rgb(var(--theme-success-500))",
  warning: "rgb(var(--theme-warning-500))",
  danger: "rgb(var(--theme-danger-500))",
};

const announcedText = (value: React.ReactNode, accessibleValue?: string | number): string => {
  if (accessibleValue !== undefined) return String(accessibleValue);
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
};

const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  accessibleValue,
  icon,
  tone = "neutral",
  loading = false,
  className = "",
}) => {
  const labelId = useId();
  const valueId = useId();
  const announced = announcedText(value, accessibleValue);

  return (
    <div
      className={`rounded-xl border px-4 py-3 backdrop-blur font-outfit ${className}`}
      style={{
        borderColor: "rgb(255 255 255 / 0.12)",
        background: "rgb(255 255 255 / 0.06)",
      }}
      role="group"
      aria-labelledby={`${labelId} ${valueId}`}
    >
      <Eyebrow
        size="xs"
        tone="onDark"
        icon={icon ? <span style={{ color: VALUE_VAR[tone] }}>{icon}</span> : undefined}
        id={labelId}
      >
        {label}
      </Eyebrow>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-2/3 bg-white/10" aria-busy="true" />
      ) : (
        <div
          id={valueId}
          className="mt-1 text-2xl font-semibold"
          style={{ color: VALUE_VAR[tone] }}
          aria-label={announced || undefined}
        >
          {value}
        </div>
      )}
    </div>
  );
};

export default memo(KpiTile);
