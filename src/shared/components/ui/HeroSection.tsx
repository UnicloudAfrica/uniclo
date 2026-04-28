import { useState } from "react";
import { Info, Sparkles } from "lucide-react";
import type { CloudTerm } from "@/shared/labels/cloudTerms";

interface Props {
  term: CloudTerm;
  /** Optional override of the page title. */
  title?: string;
  /** Optional override of the description (else uses term.description). */
  subtitle?: string;
  /** Right-aligned action buttons. */
  actions?: React.ReactNode;
  /** Hero accent gradient (Tailwind classes). Defaults to primary blue. */
  accent?: string;
  /** Decorative icon. */
  icon?: React.ReactNode;
  /** Optional KPI tiles rendered inside the hero. */
  metrics?: React.ReactNode;
}

/**
 * The "wow" page header. Used everywhere a customer-facing product lives.
 * Gradient hero, decorative pattern, ELI5 toggle, glass action bar.
 */
export default function HeroSection({
  term,
  title,
  subtitle,
  actions,
  accent = "from-indigo-600 via-violet-600 to-purple-600",
  icon,
  metrics,
}: Props) {
  const [showEli5, setShowEli5] = useState(false);

  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${accent} p-8 shadow-xl shadow-indigo-500/10`}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, transparent 35%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.10) 0%, transparent 35%)",
        }}
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                {icon}
              </div>
            )}
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3" />
                  {term.singular}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {title ?? term.plural}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm text-white/85">
                {subtitle ?? term.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEli5((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <Info className="h-3.5 w-3.5" />
              What is this?
            </button>
            {actions}
          </div>
        </div>

        {showEli5 && (
          <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/95 backdrop-blur-md">
            <p className="font-semibold text-white">Explained simply</p>
            <p className="mt-1 leading-relaxed">{term.eli5}</p>
            {term.analogy && (
              <p className="mt-2 italic text-white/80">{term.analogy}</p>
            )}
          </div>
        )}

        {metrics && <div className="mt-6">{metrics}</div>}
      </div>
    </section>
  );
}
