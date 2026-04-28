import { useState } from "react";
import { Info, X } from "lucide-react";
import type { CloudTerm } from "@/shared/labels/cloudTerms";

interface Props {
  term: CloudTerm;
  /** Optional override of the page title (e.g. "Backup Plans for project X"). */
  title?: string;
  /** Slot for buttons / actions on the right. */
  actions?: React.ReactNode;
}

/**
 * Standard page header for every customer-facing product page.
 * Always shows: friendly title, one-line description, and a tappable
 * "What is this?" info card with the ELI5 explanation.
 */
export default function ResourcePageHeader({ term, title, actions }: Props) {
  const [showEli5, setShowEli5] = useState(false);

  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{title ?? term.plural}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{term.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEli5((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-primary-200 hover:text-primary-600"
          >
            <Info className="h-3.5 w-3.5" />
            What is this?
          </button>
          {actions}
        </div>
      </div>

      {showEli5 && (
        <div className="relative rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
          <button
            type="button"
            onClick={() => setShowEli5(false)}
            className="absolute right-2 top-2 text-amber-700/60 hover:text-amber-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="font-medium">Explained simply</p>
          <p className="mt-1">{term.eli5}</p>
          {term.analogy && <p className="mt-2 text-amber-800/80 italic">{term.analogy}</p>}
        </div>
      )}
    </header>
  );
}
