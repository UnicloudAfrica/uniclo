import React from "react";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";

/**
 * The big "Hi {name} 👋" gradient banner that anchors the dashboard home page.
 *
 * Renders four pinned status chips on the right (region, spend, credits,
 * support tier) and two primary CTAs. All visual styling pulls from the
 * theme CSS variables so it auto-themes to whatever brand color is active
 * (UniCloud Africa emerald in the default palette).
 */

export interface CommandCenterChip {
  /** Short uppercase label rendered above the value (e.g. `REGION`). */
  label: string;
  /** The actual value (e.g. `Lagos · NG-1`, `₦284,500`, `Premium`). */
  value: React.ReactNode;
  /** Optional leading icon. */
  icon?: React.ReactNode;
}

export interface CommandCenterAction {
  label: string;
  /** Optional `react-router` href. If both are provided, `onClick` wins. */
  href?: string;
  onClick?: () => void;
  /** `primary` is white-on-translucent; `secondary` is outline. */
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

export interface CommandCenterHeroProps {
  /** Eyebrow pill text above the greeting (default: `COMMAND CENTER`). */
  eyebrow?: string;
  /** First-name greeting subject — `Hi {greetingName} 👋`. */
  greetingName?: string;
  /** Long-form description below the greeting. */
  description?: React.ReactNode;
  /** Primary + secondary CTAs (typically 1–2). */
  actions?: CommandCenterAction[];
  /** 1–4 chips rendered in the right-hand info grid. */
  chips?: CommandCenterChip[];
  /** Optional className escape hatch. */
  className?: string;
}

const CommandCenterHero: React.FC<CommandCenterHeroProps> = ({
  eyebrow = "COMMAND CENTER",
  greetingName,
  description,
  actions = [],
  chips = [],
  className = "",
}) => {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-[32px] px-8 py-10 text-white shadow-[0_30px_80px_-50px_rgb(var(--theme-color-rgb)/0.45)] md:px-12 md:py-12",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        // Solid deep emerald per the reference design. The subtle radial
        // gradient lifts the corner without lightening the brand color.
        background:
          "radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--theme-color) 80%, white) 0%, var(--theme-color) 50%, color-mix(in srgb, var(--theme-color) 90%, black) 100%)",
      }}
    >
      {/* Decorative orb — soft white blur on the top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "rgba(255, 255, 255, 0.7)" }}
      />

      <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-start md:gap-10">
        {/* Left: text + actions */}
        <div className="space-y-5">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95 backdrop-blur-sm">
            <Sparkles size={13} aria-hidden="true" />
            {eyebrow}
          </span>

          {/* Greeting */}
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            {greetingName ? (
              <>
                Hi {greetingName} <span aria-hidden="true">👋🏾</span>
              </>
            ) : (
              <>
                Welcome back <span aria-hidden="true">👋🏾</span>
              </>
            )}
          </h1>

          {/* Description */}
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-white/85 md:text-[15px]">
              {description}
            </p>
          ) : null}

          {/* Actions */}
          {actions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {actions.map((action, idx) => {
                const isPrimary = (action.variant ?? (idx === 0 ? "primary" : "secondary")) === "primary";
                const className = isPrimary
                  ? "inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--theme-color)] shadow-sm transition hover:bg-white/95"
                  : "inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20";

                const content = (
                  <>
                    {action.icon ?? (isPrimary ? <ArrowUpRight size={16} /> : <Plus size={16} />)}
                    {action.label}
                  </>
                );

                if (action.onClick) {
                  return (
                    <button key={action.label} type="button" onClick={action.onClick} className={className}>
                      {content}
                    </button>
                  );
                }
                if (action.href) {
                  return (
                    <a key={action.label} href={action.href} className={className}>
                      {content}
                    </a>
                  );
                }
                return (
                  <span key={action.label} className={className}>
                    {content}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Right: 2x2 chips grid */}
        {chips.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {chips.slice(0, 4).map((chip) => (
              <div
                key={chip.label}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/75">
                  {chip.icon ? <span aria-hidden="true">{chip.icon}</span> : null}
                  {chip.label}
                </div>
                <div className="mt-1 text-base font-semibold text-white md:text-lg">{chip.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default CommandCenterHero;
