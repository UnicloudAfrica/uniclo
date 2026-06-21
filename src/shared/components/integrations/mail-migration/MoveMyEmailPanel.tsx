import React, { useState } from "react";
import { Plus } from "lucide-react";
import MailMigrationWizard from "./MailMigrationWizard";
import MailMigrationProgress from "./MailMigrationProgress";
import MailMigrationsList from "./MailMigrationsList";

/**
 * MoveMyEmailPanel — the single embeddable surface for "Move My Email".
 * Switches between three views: the list of moves, the new-move wizard,
 * and the live progress of one move.
 */

type View =
  | { name: "list" }
  | { name: "wizard" }
  | { name: "progress"; identifier: string };

export function MoveMyEmailPanel(): React.JSX.Element {
  const [view, setView] = useState<View>({ name: "list" });

  if (view.name === "wizard") {
    return (
      <MailMigrationWizard
        onStarted={(identifier) => setView({ name: "progress", identifier })}
        onCancel={() => setView({ name: "list" })}
      />
    );
  }

  if (view.name === "progress") {
    return (
      <MailMigrationProgress
        identifier={view.identifier}
        onBack={() => setView({ name: "list" })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Your email moves
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Move email from one provider to another — we handle the heavy lifting.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView({ name: "wizard" })}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 motion-reduce:hover:scale-100 dark:focus:ring-offset-gray-900"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Move my email
        </button>
      </div>

      <MailMigrationsList onOpen={(identifier) => setView({ name: "progress", identifier })} />
    </div>
  );
}

export default MoveMyEmailPanel;
