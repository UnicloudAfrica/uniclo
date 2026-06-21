import React, { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, Pencil } from "lucide-react";

export interface SectionWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /**
   * Whether the section can be collapsed by clicking the header. Default
   * `true` — every section in the cube wizard is independently
   * collapsible so operators can hide ones they've already filled and
   * skip the seven-section scroll fest the wizard used to require.
   *
   * Setting this to `false` keeps the old non-collapsible behaviour for
   * any caller that wants it (currently nobody — left as an escape hatch).
   */
  collapsible?: boolean;
  /**
   * Initial open state. Defaults to `!isComplete` so completed sections
   * land collapsed, incomplete sections land expanded — the user opens
   * the wizard to a list of "what still needs filling" rather than a
   * wall of forms.
   *
   * Once the user manually toggles the section, that decision sticks
   * regardless of the `isComplete` flag changing. We never auto-collapse
   * a section the user has explicitly opened mid-edit; that would yank
   * the form out from under them.
   */
  defaultOpen?: boolean;
  /**
   * Marks the section as having all required inputs satisfied. Drives
   * the green check icon + the default-collapsed behaviour above. The
   * caller decides what "complete" means — this component just renders
   * the cue.
   */
  isComplete?: boolean;
  /**
   * Compact summary rendered in the collapsed header so operators can
   * tell at a glance what they picked without expanding. E.g. for the
   * Region & project section: "Nigeria (uni-ng) · Lagos AZ1 · Project: Mask".
   * If not provided, the collapsed state only shows the title — still
   * scannable, just less informative.
   */
  summary?: React.ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  title,
  description,
  children,
  collapsible = true,
  defaultOpen,
  isComplete = false,
  summary,
}) => {
  // Resolve the initial open state once, then track user clicks
  // separately so a later isComplete change can't yank the section
  // shut while the user is filling it.
  const initialOpen = defaultOpen ?? !isComplete;
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);
  const [hasUserToggled, setHasUserToggled] = useState(false);

  // If completeness flips AFTER mount and the user hasn't manually
  // touched the toggle, fold the section to keep the scroll short.
  // Mid-edit toggles by the user always win.
  useEffect(() => {
    if (hasUserToggled) return;
    if (isComplete && isOpen) {
      setIsOpen(false);
    }
  }, [isComplete, hasUserToggled, isOpen]);

  const handleToggle = () => {
    setHasUserToggled(true);
    setIsOpen((open) => !open);
  };

  if (!collapsible) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className={`flex w-full items-start gap-3 rounded-t-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
          isOpen ? "" : "rounded-b-xl"
        }`}
      >
        {/* Completion glyph — green check when this section is filled,
            empty circle outline otherwise. Gives operators an at-a-
            glance read of "what's left" without scrolling into each
            section's body. */}
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
          ) : (
            <span className="h-4 w-4 rounded-full border-2 border-gray-300" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {/* Description is only useful while the section is open;
              when collapsed we replace it with the compact summary
              (if the caller provided one) so the header stays scannable. */}
          {isOpen && description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
          {!isOpen && summary && (
            <p className="truncate text-xs text-gray-600">{summary}</p>
          )}
        </div>

        <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-gray-400">
          {!isOpen && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
              <Pencil className="h-3 w-3" aria-hidden="true" />
              Edit
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-gray-100 px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
};

export default SectionWrapper;
