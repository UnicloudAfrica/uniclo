import React, { memo, useCallback, useId, useRef } from "react";

/**
 * SelectableCardGroup — an accessible, single-select grid of "cards".
 *
 * This is the reusable primitive behind picker UIs like the email-migration
 * "Which email service is this?" step, where a user chooses one option from a
 * small set of visually rich tiles (icon/emoji + label + optional blurb).
 *
 * Why this exists: those pickers were hand-inlined as ad-hoc `aria-pressed`
 * button grids. This component standardises the look AND upgrades the
 * semantics to the WAI-ARIA Radio Group pattern:
 *
 *   - container  → role="radiogroup" (needs an accessible name)
 *   - each card  → role="radio" + aria-checked
 *   - roving tabindex: exactly one card is in the tab order; Arrow / Home /
 *     End keys move the selection (and focus) within the group, matching
 *     native radio behaviour. Space / Enter also select the focused card.
 *
 * States covered: selected, disabled (per option), loading (skeleton tiles),
 * and empty. Fully responsive (configurable columns) and dark-mode aware.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 */

export interface SelectableCardOption<T extends string = string> {
  value: T;
  /** Primary label shown on the card. */
  label: React.ReactNode;
  /** Optional secondary line (kept short). */
  description?: React.ReactNode;
  /**
   * Leading visual — an emoji string, an icon node, or anything renderable.
   * Decorative only; it is marked aria-hidden so the label carries meaning.
   */
  icon?: React.ReactNode;
  /** When true, the card is shown dimmed and cannot be selected or focused. */
  disabled?: boolean;
}

export interface SelectableCardGroupProps<T extends string = string> {
  options: SelectableCardOption<T>[];
  /** Currently selected value, or null when nothing is chosen yet. */
  value: T | null;
  onChange: (value: T) => void;
  /**
   * Accessible name for the group. Provide this OR `ariaLabelledBy`
   * (e.g. when a visible heading/legend already labels the group).
   */
  ariaLabel?: string;
  /** id of an element that labels the group (takes precedence over ariaLabel). */
  ariaLabelledBy?: string;
  /** Columns at the sm breakpoint and up. Mobile is always 2. Default 3. */
  columns?: 2 | 3 | 4;
  /** Card density. `md` adds padding and a larger icon (good for blurbs). Default "md". */
  size?: "sm" | "md";
  /** Render skeleton tiles instead of options (e.g. while fetching the list). */
  loading?: boolean;
  /** Skeleton tile count while loading. Defaults to options.length || 3. */
  skeletonCount?: number;
  className?: string;
}

const COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

const CARD_BASE =
  "relative flex w-full rounded-xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1";

const CARD_SELECTED =
  "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20";

const CARD_IDLE =
  "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500";

const CARD_DISABLED = "cursor-not-allowed opacity-50";

/** Index of the next non-disabled option, searching with wrap-around. */
function nextEnabledIndex<T extends string>(
  options: SelectableCardOption<T>[],
  start: number,
  step: 1 | -1,
): number {
  const n = options.length;
  for (let i = 1; i <= n; i += 1) {
    const idx = (start + step * i + n * i) % n;
    if (!options[idx]?.disabled) return idx;
  }
  return start;
}

function firstEnabledIndex<T extends string>(options: SelectableCardOption<T>[]): number {
  const i = options.findIndex((o) => !o.disabled);
  return i === -1 ? 0 : i;
}

function SelectableCardGroupInner<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  columns = 3,
  size = "md",
  loading = false,
  skeletonCount,
  className = "",
}: SelectableCardGroupProps<T>): React.JSX.Element {
  const groupId = useId();
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const pad = size === "md" ? "p-4" : "px-3 py-2";
  const iconSize = size === "md" ? "text-3xl" : "text-lg";

  // Roving tabindex: the selected card is tabbable; if none is selected, the
  // first enabled card is the single tab stop.
  const selectedIndex = value == null ? -1 : options.findIndex((o) => o.value === value);
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(options);

  const focusAndSelect = useCallback(
    (idx: number) => {
      const opt = options[idx];
      if (!opt || opt.disabled) return;
      cardRefs.current[idx]?.focus();
      onChange(opt.value);
    },
    [options, onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          focusAndSelect(nextEnabledIndex(options, idx, 1));
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          focusAndSelect(nextEnabledIndex(options, idx, -1));
          break;
        case "Home":
          event.preventDefault();
          focusAndSelect(firstEnabledIndex(options));
          break;
        case "End":
          event.preventDefault();
          focusAndSelect(nextEnabledIndex(options, firstEnabledIndex(options), -1));
          break;
        case " ":
        case "Enter": {
          event.preventDefault();
          const opt = options[idx];
          if (opt && !opt.disabled) onChange(opt.value);
          break;
        }
        default:
          break;
      }
    },
    [options, onChange, focusAndSelect],
  );

  if (loading) {
    const count = skeletonCount ?? (options.length || 3);
    return (
      <div className={`grid gap-3 ${COLS[columns]} ${className}`} aria-busy="true" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${pad} rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800`}
          >
            <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3 h-3.5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            {size === "md" && (
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700/60" />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (options.length === 0) return <></>;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={`grid gap-3 ${COLS[columns]} ${className}`}
    >
      {options.map((opt, idx) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            type="button"
            role="radio"
            id={`${groupId}-${idx}`}
            aria-checked={isSelected}
            aria-disabled={opt.disabled || undefined}
            disabled={opt.disabled}
            tabIndex={idx === tabbableIndex ? 0 : -1}
            onClick={() => {
              if (!opt.disabled) onChange(opt.value);
            }}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`${CARD_BASE} ${pad} ${isSelected ? CARD_SELECTED : CARD_IDLE} ${
              opt.disabled ? CARD_DISABLED : ""
            }`}
          >
            <span className={size === "md" ? "block" : "flex items-center gap-2"}>
              {opt.icon != null && (
                <span aria-hidden="true" className={iconSize}>
                  {opt.icon}
                </span>
              )}
              <span className={size === "md" && opt.icon != null ? "mt-2 block" : "block"}>
                <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {opt.label}
                </span>
                {opt.description != null && (
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </span>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Memoised export. The generic is preserved through a typed cast so callers
 * still get `SelectableCardGroup<MyId>` inference.
 */
const SelectableCardGroup = memo(SelectableCardGroupInner) as typeof SelectableCardGroupInner;

export default SelectableCardGroup;
