import React from "react";
import { designTokens } from "../../../styles/designTokens";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

interface ToneStyle {
  background: string;
  color: string;
  dot: string;
}

const toneMap: Record<StatusTone, ToneStyle> = {
  neutral: {
    background: designTokens.colors.neutral[100],
    color: designTokens.colors.neutral[600],
    dot: designTokens.colors.neutral[400],
  },
  info: {
    background: designTokens.colors.info[50],
    color: designTokens.colors.info[700],
    dot: designTokens.colors.info[500],
  },
  success: {
    background: designTokens.colors.success[50],
    color: designTokens.colors.success[700],
    dot: designTokens.colors.success[500],
  },
  warning: {
    background: designTokens.colors.warning[50],
    color: designTokens.colors.warning[700],
    dot: designTokens.colors.warning[500],
  },
  danger: {
    background: designTokens.colors.error[50],
    color: designTokens.colors.error[700],
    dot: designTokens.colors.error[500],
  },
};

const getToneFromStatus = (status?: string): StatusTone => {
  if (!status) return "neutral";
  const normalized = status.toLowerCase();

  if (
    ["running", "active", "ready", "completed", "success", "enabled", "online"].includes(normalized)
  ) {
    return "success";
  }
  if (
    [
      "pending",
      "provisioning",
      "creating",
      "initializing",
      "processing",
      "warning",
      "syncing",
    ].includes(normalized)
  ) {
    return "warning";
  }
  if (
    [
      "stopped",
      "inactive",
      "terminated",
      "error",
      "failed",
      "danger",
      "disabled",
      "offline",
    ].includes(normalized)
  ) {
    return "danger";
  }
  if (["info"].includes(normalized)) {
    return "info";
  }
  return "neutral";
};

export interface StatusPillProps {
  label?: string | undefined;
  status?: string | undefined;
  tone?: StatusTone | undefined;
  className?: string | undefined;
  showIcon?: boolean | undefined;
}

/**
 * StatusPill component
 */
const StatusPill: React.FC<StatusPillProps> = ({
  label,
  status,
  tone,
  className = "",
  showIcon = true,
}) => {
  const derivedTone = tone || getToneFromStatus(status);
  const styles = toneMap[derivedTone] || toneMap.neutral;
  const displayLabel = label || status || "Unknown";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${className}`}
      style={{
        backgroundColor: styles.background,
        color: styles.color,
      }}
    >
      {showIcon && (
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: styles.dot }} />
      )}
      <span className="capitalize">{displayLabel}</span>
    </span>
  );
};

export default StatusPill;
