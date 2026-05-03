import React, { useEffect, useId, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

/**
 * Stat card with a label, big value, optional delta chip, and a tiny
 * unlabelled sparkline at the bottom. Used on dashboard home pages to
 * surface KPI trends at a glance.
 *
 * The chart is intentionally minimal — no axes, no tooltip, no grid —
 * because the goal is a "shape of the trend" feel, not exact reading.
 *
 * Note on colors: Recharts forwards `stroke`/`fill` straight to the SVG,
 * which does not understand `var(--…)`. We resolve the relevant theme
 * variables to plain `rgb(…)` strings via `useResolvedThemeColor` before
 * handing them to the chart.
 */

export type StatTrend = "up" | "down" | "flat";

export interface MiniSparklineStatCardProps {
  /** Short uppercase title (e.g. `ACTIVE INSTANCES`). */
  title: string;
  /** Pre-formatted value string (e.g. `38`, `12.4 TB`, `₦284,500`). */
  value: React.ReactNode;
  /** Optional delta chip text (e.g. `+5`, `+1.2 TB`, `-4%`). */
  delta?: string;
  /**
   * Direction of the delta. Drives the chip color.
   * - `up`: green (use when "up" is good — e.g. instances, revenue)
   * - `down`: red (use when "up" is bad — e.g. error rate)
   * - `flat`: neutral
   */
  trend?: StatTrend;
  /**
   * Whether `up` should be considered positive (default true). Set to
   * `false` when "up" is bad — the chip's color is computed from the
   * combination of `trend` and `goodWhenUp`.
   */
  goodWhenUp?: boolean;
  /** 6–24 numeric points for the sparkline. */
  series: number[];
  /** Optional leading icon shown in the top-right corner of the card. */
  icon?: React.ReactNode;
  /** Optional secondary description shown under the value. */
  description?: React.ReactNode;
  /** Optional click handler — turns the card into a button. */
  onClick?: () => void;
  /** Optional className escape hatch. */
  className?: string;
}

const trendChipStyles = (trend: StatTrend, goodWhenUp: boolean): { bg: string; fg: string } => {
  if (trend === "flat") {
    return { bg: "rgb(var(--theme-neutral-100))", fg: "rgb(var(--theme-neutral-600))" };
  }
  const isGood = trend === "up" ? goodWhenUp : !goodWhenUp;
  return isGood
    ? { bg: "rgb(var(--theme-success-100))", fg: "rgb(var(--theme-success-700))" }
    : { bg: "rgb(var(--theme-danger-100))", fg: "rgb(var(--theme-danger-700))" };
};

const TrendIcon: React.FC<{ trend: StatTrend; size?: number }> = ({ trend, size = 12 }) => {
  if (trend === "up") return <ArrowUpRight size={size} aria-hidden="true" />;
  if (trend === "down") return <ArrowDownRight size={size} aria-hidden="true" />;
  return <Minus size={size} aria-hidden="true" />;
};

/**
 * Reads a CSS custom property off `<html>` and returns it as a real color
 * string usable in SVG attributes. Re-reads on `data-theme`/style changes
 * so the sparkline retints when the user toggles dark mode.
 */
const useResolvedThemeColor = (cssVar: string, fallback: string): string => {
  const [color, setColor] = useState<string>(fallback);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim();
      if (!raw) {
        setColor(fallback);
        return;
      }
      // Theme palette stores RGB triplets like `10 94 62` for use with
      // `rgb(...)`. Wrap the triplet so SVG can consume it directly.
      if (/^\d+\s+\d+\s+\d+$/.test(raw)) {
        setColor(`rgb(${raw})`);
      } else {
        setColor(raw);
      }
    };
    compute();

    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
    return () => observer.disconnect();
  }, [cssVar, fallback]);

  return color;
};

const MiniSparklineStatCard: React.FC<MiniSparklineStatCardProps> = ({
  title,
  value,
  delta,
  trend = "flat",
  goodWhenUp = true,
  series,
  icon,
  description,
  onClick,
  className = "",
}) => {
  // Stable, unique ID for the gradient `<defs>` — avoids collisions when
  // multiple cards share the same title.
  const gradientId = `spark-${useId().replace(/:/g, "")}`;

  // Resolve every theme color we hand to SVG. SVG cannot interpret
  // `var(--…)` so we read the computed value off the document.
  const brandColor = useResolvedThemeColor("--theme-color", "#288dd1");
  const successColor = useResolvedThemeColor("--theme-success-500", "#22c55e");
  const dangerColor = useResolvedThemeColor("--theme-danger-500", "#ef4444");

  // Pick the sparkline stroke from the trend semantics.
  let strokeColor = brandColor;
  if (trend === "up") strokeColor = goodWhenUp ? successColor : dangerColor;
  if (trend === "down") strokeColor = goodWhenUp ? dangerColor : successColor;

  const chipColor = trendChipStyles(trend, goodWhenUp);
  const isInteractive = typeof onClick === "function";

  // Recharts wants {value: n} objects keyed by index.
  const chartData = series.map((point, index) => ({ index, value: point }));

  const cardClasses = [
    "group flex h-full flex-col justify-between rounded-2xl border bg-[--theme-card-bg] p-5 transition-all",
    isInteractive ? "cursor-pointer hover:border-[--theme-color] hover:shadow-md" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Wrapper: React.ElementType = isInteractive ? "button" : "div";
  const wrapperProps = isInteractive
    ? { type: "button" as const, onClick, "aria-label": title }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cardClasses}
      style={{ borderColor: "var(--theme-border-color)" }}
    >
      {/* Title + icon */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--theme-muted-color)]">
          {title}
        </span>
        {icon ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgb(var(--theme-color-50))",
              color: "var(--theme-color)",
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>

      {/* Value + delta */}
      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-semibold leading-tight text-[color:var(--theme-heading-color)] md:text-[28px]">
          {value}
        </span>
        {delta ? (
          <span
            className="mb-1.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{ backgroundColor: chipColor.bg, color: chipColor.fg }}
          >
            <TrendIcon trend={trend} />
            {delta}
          </span>
        ) : null}
      </div>

      {/* Description */}
      {description ? (
        <p className="mt-1 text-xs text-[color:var(--theme-muted-color)]">{description}</p>
      ) : null}

      {/* Sparkline */}
      {series.length > 1 ? (
        <div className="mt-4 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Wrapper>
  );
};

export default MiniSparklineStatCard;
