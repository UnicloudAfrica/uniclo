import React, { memo, useId, useState, useRef, useEffect } from "react";

/**
 * Tabs — accessible tablist following WAI-ARIA APG.
 *
 * Implements:
 *   - role=tablist / tab / tabpanel
 *   - Roving tabindex (only the active tab is in tab order)
 *   - Arrow Left/Right (or Up/Down for vertical) cycles tabs
 *   - Home / End jumps to first / last
 *   - Activation mode: "automatic" (focus = activate) or "manual" (Enter/Space to activate)
 *   - Controlled or uncontrolled via `defaultValue` / `value` + `onChange`
 *   - Whitelabel-aware borders + active tint
 */

export interface TabItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  /** Optional badge/count rendered next to the label */
  badge?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  activation?: "automatic" | "manual";
  /** Render the active tab's panel. Receives the active value. */
  renderPanel: (activeValue: string) => React.ReactNode;
  /** Accessible label for the tablist (when no visible heading provides one). */
  ariaLabel?: string;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  value,
  defaultValue,
  onChange,
  orientation = "horizontal",
  activation = "automatic",
  renderPanel,
  ariaLabel,
  className = "",
}) => {
  const groupId = useId();
  const isControlled = value !== undefined;
  const initial = (defaultValue ?? items.find((i) => !i.disabled)?.value ?? items[0]?.value) || "";
  const [internal, setInternal] = useState<string>(initial);
  const active = isControlled ? (value as string) : internal;

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const setActive = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const focusableItems = items.filter((i) => !i.disabled);
  const activeIndex = Math.max(
    0,
    focusableItems.findIndex((i) => i.value === active)
  );

  const focusByIndex = (idx: number) => {
    const target = focusableItems[(idx + focusableItems.length) % focusableItems.length];
    if (!target) return;
    tabRefs.current[target.value]?.focus();
    if (activation === "automatic") setActive(target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, item: TabItem) => {
    const horizontal = orientation === "horizontal";
    const next = horizontal ? "ArrowRight" : "ArrowDown";
    const prev = horizontal ? "ArrowLeft" : "ArrowUp";

    if (e.key === next) {
      e.preventDefault();
      focusByIndex(activeIndex + 1);
    } else if (e.key === prev) {
      e.preventDefault();
      focusByIndex(activeIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusByIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusByIndex(focusableItems.length - 1);
    } else if (
      activation === "manual" &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      setActive(item.value);
    }
  };

  // Keep refs cleaned up
  useEffect(() => {
    Object.keys(tabRefs.current).forEach((key) => {
      if (!items.some((i) => i.value === key)) {
        delete tabRefs.current[key];
      }
    });
  }, [items]);

  const isVertical = orientation === "vertical";
  const tablistClass = isVertical
    ? "flex flex-col gap-1 border-r"
    : "flex items-center gap-1 border-b overflow-x-auto";

  return (
    <div
      className={`font-outfit ${isVertical ? "grid grid-cols-[200px_1fr] gap-6" : ""} ${className}`}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation={orientation}
        className={tablistClass}
        style={{ borderColor: "var(--theme-border-color)" }}
      >
        {items.map((item) => {
          const selected = item.value === active;
          const id = `${groupId}-tab-${item.value}`;
          const panelId = `${groupId}-panel-${item.value}`;
          return (
            <button
              key={item.value}
              ref={(el) => {
                tabRefs.current[item.value] = el;
              }}
              id={id}
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              aria-disabled={item.disabled || undefined}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => !item.disabled && setActive(item.value)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              className={[
                "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold whitespace-nowrap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2",
                "motion-safe:transition-colors",
                isVertical ? "border-r-2 -mr-px text-left" : "border-b-2 -mb-px",
                selected
                  ? "border-primary-500 text-primary-700"
                  : item.disabled
                    ? "border-transparent text-gray-300 cursor-not-allowed"
                    : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {item.badge != null && (
                <span className="text-[10px] text-gray-400">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${groupId}-panel-${active}`}
        aria-labelledby={`${groupId}-tab-${active}`}
        tabIndex={0}
        className={isVertical ? "" : "pt-4"}
      >
        {renderPanel(active)}
      </div>
    </div>
  );
};

export default memo(Tabs);
