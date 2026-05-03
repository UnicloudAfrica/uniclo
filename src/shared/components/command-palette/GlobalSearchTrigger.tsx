import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import CommandPalette, { type CommandPaletteItem } from "./CommandPalette";

/**
 * The "Search 40 menus… ⌘K" button that lives in the global header.
 * Clicking opens `<CommandPalette />`. Pressing ⌘K (or Ctrl+K) anywhere
 * also opens it.
 */

export interface GlobalSearchTriggerProps {
  items: CommandPaletteItem[];
  className?: string;
  /** Override the placeholder text. */
  placeholder?: string;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const GlobalSearchTrigger: React.FC<GlobalSearchTriggerProps> = ({
  items,
  className = "",
  placeholder,
}) => {
  const [open, setOpen] = useState(false);

  // Global keyboard shortcut: ⌘K / Ctrl+K opens the palette.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const label =
    placeholder ?? `Search ${items.length} menu${items.length === 1 ? "" : "s"}…`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "flex w-full max-w-md items-center justify-between gap-3 rounded-full border bg-[--theme-surface-alt] px-4 py-2 text-sm text-[color:var(--theme-muted-color)] transition hover:border-[--theme-color] hover:text-[color:var(--theme-heading-color)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus-ring)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ borderColor: "var(--theme-border-color)" }}
        aria-label="Open command palette"
      >
        <span className="flex items-center gap-2 truncate">
          <Search size={14} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </span>
        <kbd className="flex shrink-0 items-center gap-0.5 rounded border bg-white/70 px-1.5 py-0.5 font-mono text-[10px] dark:bg-black/30">
          {isMac ? "⌘" : "Ctrl"}K
        </kbd>
      </button>

      <CommandPalette open={open} onClose={() => setOpen(false)} items={items} />
    </>
  );
};

export default GlobalSearchTrigger;
