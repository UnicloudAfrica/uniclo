import React, { useEffect, useMemo, useState } from "react";
import { Search, X, ArrowRight, CornerDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Cmd+K command palette: a global search dialog that lets users jump to
 * any page in the dashboard by typing. Items are pulled from a flat list
 * and matched fuzzily by title + category.
 *
 * Open via:
 * - The `<GlobalSearchTrigger />` button in the headbar
 * - Pressing `⌘K` / `Ctrl+K` (registered globally by the trigger)
 *
 * Keyboard:
 * - Type to filter
 * - ↑/↓ to move selection
 * - Enter to navigate
 * - Esc to close
 */

export interface CommandPaletteItem {
  id: string;
  title: string;
  category: string;
  /** Optional second-line description for context. */
  description?: string;
  /** React-router path to navigate to. */
  path: string;
  /** Optional leading icon. */
  icon?: React.ReactNode;
  /** Optional keywords (extra text included in search match). */
  keywords?: string[];
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandPaletteItem[];
}

const score = (query: string, item: CommandPaletteItem): number => {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const haystack = [item.title, item.category, item.description, ...(item.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes(q)) {
    // Title prefix matches rank highest.
    if (item.title.toLowerCase().startsWith(q)) return 100;
    if (item.title.toLowerCase().includes(q)) return 80;
    if (item.category.toLowerCase().includes(q)) return 50;
    return 30;
  }

  // Cheap fuzzy: every char in q appears in order in haystack.
  let i = 0;
  for (const c of haystack) {
    if (c === q[i]) {
      i += 1;
      if (i === q.length) return 10;
    }
  }
  return -1;
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose, items }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      // No query — show all items grouped by category, capped at 50.
      return items.slice(0, 50);
    }
    return items
      .map((item) => ({ item, s: score(query, item) }))
      .filter((entry) => entry.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map((entry) => entry.item);
  }, [items, query]);

  // Reset selection when the filter changes.
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Reset query when closed.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Group filtered items by category (only when no active query).
  const grouped = useMemo(() => {
    const groups = new Map<string, CommandPaletteItem[]>();
    for (const item of filtered) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const handleSelect = (item: CommandPaletteItem) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((idx) => Math.min(idx + 1, filtered.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((idx) => Math.max(idx - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const target = filtered[selectedIndex];
      if (target) handleSelect(target);
    }
  };

  if (!open) return null;

  // Flat index for keyboard nav, mapped back into grouped rendering.
  let runningIndex = -1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/45 px-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-[--theme-card-bg] shadow-2xl"
        style={{ borderColor: "var(--theme-border-color)" }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          <Search size={18} className="shrink-0 text-[color:var(--theme-muted-color)]" aria-hidden="true" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${items.length} menus, settings, and pages…`}
            className="flex-1 bg-transparent text-sm text-[color:var(--theme-heading-color)] outline-none placeholder:text-[color:var(--theme-muted-color)]"
            aria-label="Search the dashboard"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[color:var(--theme-muted-color)] transition hover:bg-black/5"
            aria-label="Close command palette"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[color:var(--theme-muted-color)]">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map(([category, group]) => (
              <div key={category} className="px-2 pb-2">
                <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--theme-muted-color)]">
                  {category}
                </div>
                {group.map((item) => {
                  runningIndex += 1;
                  const isSelected = runningIndex === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => {
                        const flatIdx = filtered.indexOf(item);
                        if (flatIdx >= 0) setSelectedIndex(flatIdx);
                      }}
                      className={[
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                        isSelected
                          ? "bg-[--theme-color-10] text-[color:var(--theme-color)]"
                          : "text-[color:var(--theme-heading-color)] hover:bg-black/5",
                      ].join(" ")}
                    >
                      {item.icon ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[--theme-surface-alt]">
                          {item.icon}
                        </span>
                      ) : null}
                      <div className="flex-1 truncate">
                        <div className="truncate font-medium">{item.title}</div>
                        {item.description ? (
                          <div className="truncate text-xs text-[color:var(--theme-muted-color)]">
                            {item.description}
                          </div>
                        ) : null}
                      </div>
                      {isSelected ? (
                        <CornerDownLeft size={14} className="shrink-0 opacity-60" aria-hidden="true" />
                      ) : (
                        <ArrowRight size={14} className="shrink-0 opacity-30" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center justify-between gap-3 border-t px-4 py-2 text-[11px] text-[color:var(--theme-muted-color)]"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-[--theme-border-color] bg-[--theme-surface-alt] px-1.5 py-0.5 font-mono text-[10px]">
              ↑↓
            </kbd>
            navigate
            <kbd className="ml-2 rounded border border-[--theme-border-color] bg-[--theme-surface-alt] px-1.5 py-0.5 font-mono text-[10px]">
              ↵
            </kbd>
            open
            <kbd className="ml-2 rounded border border-[--theme-border-color] bg-[--theme-surface-alt] px-1.5 py-0.5 font-mono text-[10px]">
              esc
            </kbd>
            close
          </span>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
