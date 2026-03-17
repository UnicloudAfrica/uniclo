/**
 * MigrationStatusBadge — Color-coded status badge for external migrations.
 */
import React from "react";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  estimating: {
    label: "Estimating",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  estimated: {
    label: "Estimated",
    className:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
};

const CONNECTION_MAP: Record<string, { label: string; className: string }> = {
  untested: {
    label: "Untested",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  connected: {
    label: "Connected",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface MigrationStatusBadgeProps {
  status: string;
  variant?: "migration" | "connection";
  size?: "sm" | "md";
}

const MigrationStatusBadge: React.FC<MigrationStatusBadgeProps> = ({
  status,
  variant = "migration",
  size = "sm",
}) => {
  const map = variant === "connection" ? CONNECTION_MAP : STATUS_MAP;
  const entry = map[status] ?? {
    label: status,
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${entry.className} ${sizeClasses}`}
    >
      {entry.label}
    </span>
  );
};

export default MigrationStatusBadge;
