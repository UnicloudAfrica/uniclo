import React from "react";
import { Server, Globe2, Info, ChevronRight } from "lucide-react";

/**
 * Two-button radio for the DR tab's Phase-2 mode selector.
 *
 * "Standard" maps to Phase-1 same-provider StaqDB-native replication.
 * "Orbit" maps to Phase-2 cross-provider via AnyCloudFlow overlay.
 *
 * Why a dedicated component rather than inline buttons in `DrTab`:
 *   - The selector renders identically in the database details DR tab
 *     and in the (future) database creation wizard's replica section.
 *     Centralising the visual contract here avoids the two surfaces
 *     drifting.
 *   - Disabled states are non-trivial (Orbit may be flag-off for the
 *     tenant, or the engine catalog may not support it). Encapsulating
 *     them keeps the parent component's render path readable.
 *   - The "coming soon" tooltip copy is policy — it'll change when the
 *     beta opens, the GA lands, and pricing surfaces. One place to edit.
 *
 * Accessibility:
 *   - Uses `role="radiogroup"` with each card as a `role="radio"` so
 *     keyboard navigation + screen readers treat the two cards as a
 *     proper choice group.
 *   - Disabled cards are non-focusable AND keep their explanatory
 *     tooltip — never silently swallowed.
 */
export type OrbitReplicationMode = "standard" | "orbit_overlay";

export interface OrbitReplicationModeSelectorProps {
  /** Currently-selected mode. */
  value: OrbitReplicationMode;
  /** Called when the user picks a different mode. */
  onChange: (mode: OrbitReplicationMode) => void;
  /**
   * Whether the Orbit option is available *at all* for this primary.
   * Distinct from `orbitDisabledReason` — `orbitAvailable: false` hides
   * the option entirely (e.g. engine is on the permanent-exclusion list),
   * while `orbitDisabledReason` keeps it visible but ungrabbable.
   */
  orbitAvailable?: boolean;
  /**
   * When set, the Orbit card renders as disabled with this string as
   * a tooltip. Examples:
   *   - "Orbit replication has been disabled on your account."
   *   - "Your data-residency policy restricts Orbit on this DB."
   *   - "No cross-provider target available in your region."
   */
  orbitDisabledReason?: string | null;
  /**
   * Optional per-mode caveats from the engine catalog. Rendered as a
   * subtle list under the active mode's card so users see operational
   * trade-offs before they commit.
   */
  caveats?: string[];
}

const OrbitReplicationModeSelector: React.FC<OrbitReplicationModeSelectorProps> = ({
  value,
  onChange,
  orbitAvailable = true,
  orbitDisabledReason = null,
  caveats = [],
}) => {
  const orbitInteractive = orbitAvailable && !orbitDisabledReason;

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Replication mode
      </div>
      <div role="radiogroup" aria-label="Replication mode" className="grid gap-3 md:grid-cols-2">
        <ModeCard
          icon={<Server size={18} />}
          title="Standard"
          subtitle="Same provider, faster, lower cost"
          active={value === "standard"}
          onSelect={() => onChange("standard")}
          disabled={false}
        />
        {orbitAvailable && (
          <ModeCard
            icon={<Globe2 size={18} />}
            title="Orbit"
            subtitle="Cross-cloud via AnyCloudFlow overlay"
            active={value === "orbit_overlay"}
            onSelect={() => orbitInteractive && onChange("orbit_overlay")}
            disabled={!orbitInteractive}
            disabledReason={orbitDisabledReason}
          />
        )}
      </div>

      {caveats.length > 0 && (
        <ul
          className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
          data-testid="orbit-mode-caveats"
        >
          {caveats.map((caveat, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>{caveat}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  active: boolean;
  disabled: boolean;
  disabledReason?: string | null;
  onSelect: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({
  icon,
  title,
  subtitle,
  active,
  disabled,
  disabledReason,
  onSelect,
}) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      title={disabled && disabledReason ? disabledReason : undefined}
      className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
        active && !disabled
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : disabled
            ? "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900"
            : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
      }`}
    >
      <span
        className={`mt-0.5 shrink-0 ${
          active && !disabled ? "text-blue-600" : "text-gray-500"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
        {disabled && disabledReason && (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-400" data-testid="mode-disabled-reason">
            {disabledReason}
          </div>
        )}
      </div>
      {active && !disabled && (
        <ChevronRight size={16} className="mt-1 shrink-0 text-blue-600" />
      )}
    </button>
  );
};

export default OrbitReplicationModeSelector;
