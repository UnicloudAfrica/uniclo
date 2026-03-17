/**
 * IntegrationStatusBadge — Status badge for integration operations and subscriptions.
 *
 * Maps operation/subscription statuses to visual indicators with appropriate
 * colors and optional pulsing animation for in-progress states.
 */
import React from "react";

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  in_progress: {
    label: "In Progress",
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
  active: {
    label: "Active",
    classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  paused: {
    label: "Paused",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  error: {
    label: "Error",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  healthy: {
    label: "Healthy",
    classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  degraded: {
    label: "Degraded",
    classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  critical: {
    label: "Critical",
    classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};

const PULSING_STATUSES = new Set(["in_progress", "pending"]);

interface IntegrationStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const IntegrationStatusBadge: React.FC<IntegrationStatusBadgeProps> = ({
  status,
  size = "sm",
}) => {
  const style = STATUS_STYLES[status] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    classes: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  const isPulsing = PULSING_STATUSES.has(status);
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style.classes} ${sizeClasses}`}
    >
      {isPulsing && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {style.label}
    </span>
  );
};

export default IntegrationStatusBadge;
