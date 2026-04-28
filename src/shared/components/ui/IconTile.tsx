import React, { memo } from "react";

/**
 * IconTile — small colored container for a Lucide icon.
 * Used inside list rows, stat tiles, and form fields.
 *
 * Tones use the design system's brand palette and stay whitelabel-aware
 * via CSS variables (theme-color, secondary, success, warning, danger).
 */
export type IconTileTone =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export type IconTileSize = "sm" | "md" | "lg";

interface IconTileProps {
  icon: React.ReactNode;
  tone?: IconTileTone;
  size?: IconTileSize;
  className?: string;
  /** Hidden when the icon is purely decorative (default true). */
  decorative?: boolean;
  /** Required if decorative=false. */
  ariaLabel?: string;
}

const SIZE_CLASS: Record<IconTileSize, string> = {
  sm: "h-7 w-7 rounded-md",
  md: "h-9 w-9 rounded-lg",
  lg: "h-11 w-11 rounded-xl",
};

const TONE_STYLES: Record<IconTileTone, React.CSSProperties> = {
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
  neutral: {
    background: "rgb(var(--theme-neutral-100))",
    color: "rgb(var(--theme-neutral-600))",
  },
};

const IconTile: React.FC<IconTileProps> = ({
  icon,
  tone = "primary",
  size = "md",
  className = "",
  decorative = true,
  ariaLabel,
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${SIZE_CLASS[size]} ${className}`}
      style={TONE_STYLES[tone]}
      aria-hidden={decorative ? true : undefined}
      aria-label={!decorative ? ariaLabel : undefined}
      role={!decorative ? "img" : undefined}
    >
      {icon}
    </span>
  );
};

export default memo(IconTile);
