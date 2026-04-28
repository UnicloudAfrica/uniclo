import React, {
  cloneElement,
  isValidElement,
  memo,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useUiMessages } from "./messages";

/**
 * DropdownMenu — accessible action menu (e.g. "..." overflow on rows).
 *
 * WAI-ARIA APG-compliant:
 *   - role=menu / menuitem / menuitemradio / menuitemcheckbox
 *   - Arrow Up/Down moves focus
 *   - Home / End jumps to first / last enabled item
 *   - Escape / outside click closes; focus returns to trigger
 *   - Enter/Space activates the focused item
 *
 * The trigger is the wrapped child element (must be a single React
 * element). Use `<DropdownMenu trigger={<IconButton ... />} items={...} />`.
 */

export interface DropdownMenuItem {
  label: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  /** When true, renders a separator before this item */
  separatorBefore?: boolean;
  /** Icon to the left of the label */
  icon?: React.ReactNode;
  /** Mark item as destructive (red text). */
  destructive?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactElement;
  items: DropdownMenuItem[];
  /** Accessible label for the menu (announced by screen readers). */
  ariaLabel?: string;
  /** Right- or left-anchored relative to trigger. */
  align?: "start" | "end";
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  ariaLabel,
  align = "end",
  className = "",
}) => {
  const messages = useUiMessages();
  const resolvedAriaLabel = ariaLabel ?? messages.menuActions;
  const id = useId();
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIndices = items
    .map((it, i) => (it.disabled ? -1 : i))
    .filter((i) => i !== -1);

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Outside click closes
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Focus the first enabled item when the menu opens
  useEffect(() => {
    if (!open) return;
    const idx = enabledIndices[0] ?? 0;
    setFocusIndex(idx);
    requestAnimationFrame(() => itemRefs.current[idx]?.focus());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeAndFocusTrigger();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const order = enabledIndices;
      if (order.length === 0) return;
      const here = order.indexOf(focusIndex);
      let nextIdx: number;
      if (e.key === "Home") nextIdx = order[0]!;
      else if (e.key === "End") nextIdx = order[order.length - 1]!;
      else if (e.key === "ArrowDown") nextIdx = order[(here + 1) % order.length]!;
      else nextIdx = order[(here - 1 + order.length) % order.length]!;
      setFocusIndex(nextIdx);
      itemRefs.current[nextIdx]?.focus();
    }
  };

  // Inject aria attributes + click handler into the trigger
  if (!isValidElement(trigger)) {
    return <>{trigger}</>;
  }
  const tProps = (trigger.props ?? {}) as React.HTMLAttributes<HTMLElement>;
  const triggerEl = cloneElement(trigger, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
    },
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": open ? id : undefined,
    onClick: ((e) => {
      tProps.onClick?.(e);
      setOpen((v) => !v);
    }) as React.MouseEventHandler<HTMLElement>,
    onKeyDown: ((e) => {
      tProps.onKeyDown?.(e);
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
    }) as React.KeyboardEventHandler<HTMLElement>,
  } as Partial<React.HTMLAttributes<HTMLElement>> & { ref?: React.Ref<HTMLElement> });

  const menuPosition = align === "end" ? "right-0" : "left-0";

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      {triggerEl}
      {open && (
        <div
          id={id}
          role="menu"
          aria-label={resolvedAriaLabel}
          tabIndex={-1}
          onKeyDown={handleMenuKey}
          className={`absolute ${menuPosition} z-50 mt-1 min-w-[160px] rounded-lg p-1 shadow-md font-outfit`}
          style={{
            background: "var(--theme-card-bg)",
            border: "1px solid var(--theme-border-color)",
          }}
        >
          {items.map((item, i) => {
            const destructive = item.destructive ? { color: "rgb(var(--theme-danger-700))" } : {};
            return (
              <React.Fragment key={i}>
                {item.separatorBefore && (
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    className="my-1 h-px"
                    style={{ background: "var(--theme-border-color)" }}
                  />
                )}
                <button
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  tabIndex={focusIndex === i ? 0 : -1}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onSelect?.();
                    closeAndFocusTrigger();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  style={destructive}
                >
                  {item.icon && (
                    <span className="shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </span>
  );
};

export default memo(DropdownMenu);
