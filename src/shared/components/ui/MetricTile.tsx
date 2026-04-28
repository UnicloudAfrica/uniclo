import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  label: string;
  value: ReactNode;
  /** Optional sub-label, e.g. "vs last month". */
  hint?: string;
  /** Optional trend indicator. */
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  icon?: ReactNode;
  /** Background tone. */
  tone?: "neutral" | "primary" | "success" | "warn" | "danger";
  /** Reverse colour scheme for hero placement (transparent over dark gradient). */
  glass?: boolean;
}

const TONE_CLASSES: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-white border-slate-200",
  primary: "bg-gradient-to-br from-indigo-50 via-white to-white border-indigo-200/50",
  success: "bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-200/50",
  warn: "bg-gradient-to-br from-amber-50 via-white to-white border-amber-200/50",
  danger: "bg-gradient-to-br from-red-50 via-white to-white border-red-200/50",
};

const ICON_TONE: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "bg-slate-100 text-slate-600",
  primary: "bg-indigo-100 text-indigo-600",
  success: "bg-emerald-100 text-emerald-600",
  warn: "bg-amber-100 text-amber-600",
  danger: "bg-red-100 text-red-600",
};

export default function MetricTile({
  label,
  value,
  hint,
  trend,
  trendLabel,
  icon,
  tone = "neutral",
  glass = false,
}: Props) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-slate-500";

  if (glass) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-white/80">{label}</span>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
              {icon}
            </div>
          )}
        </div>
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-white/70">{hint}</p>}
      </div>
    );
  }

  return (
    <div
      className={`group rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${TONE_CLASSES[tone]}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {icon && (
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${ICON_TONE[tone]} transition group-hover:scale-105`}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {trendLabel}
          </span>
        )}
        {hint && <span className="text-slate-500">{hint}</span>}
      </div>
    </div>
  );
}
