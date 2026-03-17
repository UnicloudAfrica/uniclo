/**
 * MigrationConfigStep — Step 4: Configure transfer method and options.
 */
import React from "react";
import { RefreshCw, Zap, Database } from "lucide-react";

interface MigrationConfigStepProps {
  resourceType: string;
  transferMethod: string;
  onTransferMethodChange: (method: string) => void;
}

const VM_METHODS = [
  {
    id: "rsync",
    label: "rsync",
    description: "Safe, resumable file transfer (recommended)",
    icon: RefreshCw,
  },
  {
    id: "netcat",
    label: "netcat",
    description: "Fast raw transfer for large datasets",
    icon: Zap,
  },
];

const DB_METHODS = [
  {
    id: "dump_restore",
    label: "Dump & Restore",
    description: "Standard dump/restore (recommended for most databases)",
    icon: Database,
  },
  {
    id: "pg_dump",
    label: "pg_dump",
    description: "PostgreSQL-specific dump with streaming",
    icon: Database,
  },
  {
    id: "mysqldump",
    label: "mysqldump",
    description: "MySQL-specific dump utility",
    icon: Database,
  },
];

const STORAGE_METHODS = [
  {
    id: "rclone",
    label: "rclone",
    description: "Cloud storage sync tool (recommended)",
    icon: RefreshCw,
  },
  {
    id: "rsync",
    label: "rsync",
    description: "File-level sync for block storage",
    icon: RefreshCw,
  },
];

const MigrationConfigStep: React.FC<MigrationConfigStepProps> = ({
  resourceType,
  transferMethod,
  onTransferMethodChange,
}) => {
  const methods =
    resourceType === "database"
      ? DB_METHODS
      : resourceType === "storage"
        ? STORAGE_METHODS
        : VM_METHODS;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Transfer Method
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose how data will be transferred between endpoints.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTransferMethodChange(id)}
            className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
              transferMethod === id
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
            }`}
          >
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                transferMethod === id
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-800/40 dark:text-blue-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              <Icon size={18} />
            </div>
            <div>
              <div
                className={`text-sm font-semibold ${
                  transferMethod === id
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {label}
              </div>
              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MigrationConfigStep;
