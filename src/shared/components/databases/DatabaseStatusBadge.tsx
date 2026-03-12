/**
 * DatabaseStatusBadge — Status indicator for managed databases.
 */
import React from "react";
import type { DatabaseStatus } from "@/types/managedDatabase";

interface DatabaseStatusBadgeProps {
  status: DatabaseStatus | string;
  className?: string;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  payment_pending: {
    label: "Payment Pending",
    classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  provisioning: {
    label: "Provisioning",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  active: {
    label: "Active",
    classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  paused: {
    label: "Paused",
    classes: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
  error: {
    label: "Error",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  deleting: {
    label: "Deleting",
    classes: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  terminated: {
    label: "Terminated",
    classes: "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500",
  },
};

const DatabaseStatusBadge: React.FC<DatabaseStatusBadgeProps> = ({ status, className = "" }) => {
  const config = STATUS_STYLES[status] ?? {
    label: status,
    classes: "bg-gray-100 text-gray-800",
  };

  const isPulsing = status === "provisioning" || status === "deleting";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.classes} ${className}`}
    >
      {isPulsing && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {config.label}
    </span>
  );
};

export default DatabaseStatusBadge;
