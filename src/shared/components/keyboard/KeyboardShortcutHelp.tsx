import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Press `?` anywhere to open this overlay. Lists the global keyboard
 * shortcuts available in the dashboard.
 *
 * Suppressed while focus is in an editable element (input, textarea,
 * contenteditable) so typing a literal `?` in a search box doesn't
 * accidentally open it.
 */

export interface ShortcutGroup {
  name: string;
  shortcuts: Array<{
    /** Array of keys forming the chord — rendered as `<kbd>` chips. */
    keys: string[];
    /** What the shortcut does. */
    description: string;
  }>;
}

const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    name: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["G", "H"], description: "Go to home / dashboard" },
      { keys: ["G", "I"], description: "Go to instances" },
      { keys: ["G", "S"], description: "Go to storage" },
      { keys: ["G", "B"], description: "Go to billing" },
    ],
  },
  {
    name: "Actions",
    shortcuts: [
      { keys: ["N"], description: "Launch a new instance" },
      { keys: ["P"], description: "Create a new project" },
      { keys: ["/"], description: "Focus the search bar" },
      { keys: ["R"], description: "Refresh current view" },
    ],
  },
  {
    name: "Utility",
    shortcuts: [
      { keys: ["?"], description: "Open this shortcut help" },
      { keys: ["Esc"], description: "Close any open dialog" },
      { keys: ["⌘", "."], description: "Toggle dark / light mode" },
    ],
  },
];

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
};

export interface KeyboardShortcutHelpProps {
  /** Override the default shortcut groups. */
  groups?: ShortcutGroup[];
}

const KeyboardShortcutHelp: React.FC<KeyboardShortcutHelpProps> = ({
  groups = DEFAULT_SHORTCUTS,
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        return;
      }
      if (event.key === "?" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border bg-[--theme-card-bg] shadow-2xl"
        style={{ borderColor: "var(--theme-border-color)" }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          <h2 className="text-base font-semibold text-[color:var(--theme-heading-color)]">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-[color:var(--theme-muted-color)] transition hover:bg-black/5"
            aria-label="Close shortcuts"
          >
            <X size={16} />
          </button>
        </div>

        {/* Shortcut groups */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="grid gap-6 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group.name}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--theme-muted-color)]">
                  {group.name}
                </div>
                <ul className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <li
                      key={shortcut.description}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-[color:var(--theme-heading-color)]">
                        {shortcut.description}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        {shortcut.keys.map((key, idx) => (
                          <React.Fragment key={`${shortcut.description}-${idx}`}>
                            {idx > 0 ? (
                              <span className="text-xs text-[color:var(--theme-muted-color)]">
                                then
                              </span>
                            ) : null}
                            <kbd
                              className="rounded-md border bg-[--theme-surface-alt] px-2 py-0.5 font-mono text-[11px] text-[color:var(--theme-heading-color)] shadow-sm"
                              style={{ borderColor: "var(--theme-border-color)" }}
                            >
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="border-t px-5 py-3 text-xs text-[color:var(--theme-muted-color)]"
          style={{ borderColor: "var(--theme-border-color)" }}
        >
          Press{" "}
          <kbd className="rounded border bg-[--theme-surface-alt] px-1.5 py-0.5 font-mono text-[10px]">
            ?
          </kbd>{" "}
          anytime to open this. Press{" "}
          <kbd className="rounded border bg-[--theme-surface-alt] px-1.5 py-0.5 font-mono text-[10px]">
            Esc
          </kbd>{" "}
          to close.
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutHelp;
