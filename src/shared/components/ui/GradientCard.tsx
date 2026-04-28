import type { ReactNode } from "react";

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Tailwind gradient utilities, e.g. "from-blue-500 to-purple-600". */
  accent?: string;
  className?: string;
  actions?: ReactNode;
}

/**
 * Card with a thin gradient border and soft glow on hover.
 */
export default function GradientCard({
  title,
  subtitle,
  children,
  accent = "from-indigo-500 to-violet-500",
  className = "",
  actions,
}: Props) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-white p-px shadow-sm transition hover:shadow-lg ${className}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-10 transition group-hover:opacity-20`}
      />
      <div className="relative rounded-3xl bg-white p-5">
        {(title || actions) && (
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              {title && <h3 className="text-base font-semibold text-slate-800">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            {actions}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
