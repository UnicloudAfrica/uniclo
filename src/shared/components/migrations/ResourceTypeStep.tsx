/**
 * ResourceTypeStep — Step 1: Select what kind of resource to migrate (VM, Database, Storage).
 */
import React from "react";
import { Server, Database, HardDrive } from "lucide-react";

const RESOURCE_TYPES = [
  {
    id: "vm",
    label: "Virtual Machine",
    description: "Servers, VMs, and compute instances",
    icon: Server,
  },
  {
    id: "database",
    label: "Database",
    description: "PostgreSQL, MySQL, MongoDB, and more",
    icon: Database,
  },
  {
    id: "storage",
    label: "Storage",
    description: "Block storage, S3 buckets, and volumes",
    icon: HardDrive,
  },
] as const;

interface ResourceTypeStepProps {
  value: string;
  onChange: (type: string) => void;
}

const ResourceTypeStep: React.FC<ResourceTypeStepProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          What are you migrating?
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select the type of resource you want to migrate.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {RESOURCE_TYPES.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition ${
              value === id
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                value === id
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-800/40 dark:text-blue-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              <Icon size={24} />
            </div>
            <div>
              <div
                className={`text-sm font-semibold ${
                  value === id
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {label}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResourceTypeStep;
