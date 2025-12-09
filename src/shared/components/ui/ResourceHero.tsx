import React from "react";
import { designTokens } from "../../../styles/designTokens";
import BreadcrumbTrail from "../BreadcrumbTrail";

interface Palette {
  container: string;
  badge: string;
  title: string;
  description: string;
  metricCard: string;
  metricLabel: string;
  metricValue: string;
  metricDescription: string;
  metricIcon: string;
  metricIconColor: string;
}

const palette: Record<string, Palette> = {
  neutral: {
    container: "rounded-3xl border border-slate-200 bg-white shadow-sm text-slate-900",
    badge:
      "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500",
    title: "text-3xl font-semibold tracking-tight text-slate-900",
    description: "text-sm leading-6 text-slate-500",
    metricCard:
      "group rounded-2xl border border-slate-200 bg-slate-50/90 px-5 py-4 transition hover:border-primary-200 hover:bg-white",
    metricLabel: "text-xs font-semibold uppercase tracking-wider text-slate-500",
    metricValue: "text-2xl font-semibold text-slate-900",
    metricDescription: "mt-1 text-xs text-slate-500",
    metricIcon:
      "flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition group-hover:bg-primary-50 group-hover:text-primary-500",
    metricIconColor: "h-4 w-4",
  },
  midnight: {
    container: "rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-lg",
    badge:
      "inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300",
    title: "text-3xl font-semibold tracking-tight text-white",
    description: "text-sm leading-6 text-slate-300",
    metricCard:
      "group rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 transition hover:border-primary-400/60 hover:bg-slate-900",
    metricLabel: "text-xs font-semibold uppercase tracking-wider text-slate-300/90",
    metricValue: "text-2xl font-semibold text-white",
    metricDescription: "mt-1 text-xs text-slate-400",
    metricIcon:
      "flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-200 shadow-inner transition group-hover:bg-primary-500/15 group-hover:text-primary-200",
    metricIconColor: "h-4 w-4",
  },
};

interface Metric {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
}

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ResourceHeroProps {
  title?: React.ReactNode;
  subtitle?: string;
  description?: React.ReactNode;
  metrics?: Metric[];
  accent?: "neutral" | "midnight" | string;
  rightSlot?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
}

const ResourceHero: React.FC<ResourceHeroProps> = ({
  title,
  subtitle,
  description,
  metrics = [],
  accent = "neutral",
  rightSlot,
  breadcrumbs,
}) => {
  const theme = palette[accent] || palette.neutral;

  return (
    <section className={theme.container}>
      <div className="flex flex-col gap-6 px-6 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-3">
          {breadcrumbs && (
            <div className="mb-2">
              <BreadcrumbTrail
                breadcrumbs={breadcrumbs}
                color={
                  accent === "midnight"
                    ? designTokens.colors.neutral[300]
                    : designTokens.colors.primary[500]
                }
              />
            </div>
          )}
          <span className={theme.badge}>{subtitle || "Administrative"}</span>
          <h1 className={theme.title}>{title}</h1>
          {description && <p className={theme.description}>{description}</p>}
        </div>
        {rightSlot && <div className="flex shrink-0 items-center justify-end">{rightSlot}</div>}
      </div>

      {metrics.length > 0 && (
        <div className="border-t border-slate-100 px-6 pb-8 pt-6 sm:px-10 dark:border-slate-800">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const iconNode = metric.icon
                ? React.isValidElement(metric.icon)
                  ? React.cloneElement(metric.icon as React.ReactElement<any>, {
                      className: [
                        theme.metricIconColor,
                        (metric.icon as React.ReactElement<any>).props?.className,
                      ]
                        .filter(Boolean)
                        .join(" "),
                    })
                  : metric.icon
                : null;
              return (
                <div key={metric.label} className={theme.metricCard}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={theme.metricLabel}>{metric.label}</p>
                      <div className={`${theme.metricValue} mt-2`}>{metric.value}</div>
                    </div>
                    {iconNode && <span className={theme.metricIcon}>{iconNode}</span>}
                  </div>
                  {metric.description && (
                    <div className={theme.metricDescription}>{metric.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default ResourceHero;
