import React from "react";
import { FlaskConical } from "lucide-react";

interface PocTrialBadgeProps {
  status: "active" | "converted" | "expired" | "cancelled";
  daysRemaining?: number;
  className?: string;
}

const PocTrialBadge: React.FC<PocTrialBadgeProps> = ({ status, daysRemaining, className = "" }) => {
  if (status === "active" && daysRemaining !== undefined) {
    const isExpiringSoon = daysRemaining <= 7;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isExpiringSoon
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
        } ${className}`}
      >
        <FlaskConical size={12} />
        {isExpiringSoon ? `POC Expiring — ${daysRemaining}d left` : `POC Trial — ${daysRemaining}d left`}
      </span>
    );
  }

  if (status === "converted") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ${className}`}
      >
        <FlaskConical size={12} />
        POC Converted
      </span>
    );
  }

  return null;
};

export default PocTrialBadge;
