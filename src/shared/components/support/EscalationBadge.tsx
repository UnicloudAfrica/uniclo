// @ts-nocheck
import React from "react";
import { ESCALATION_CONFIG } from "./threadTypes";

interface EscalationBadgeProps {
  level: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export const EscalationBadge: React.FC<EscalationBadgeProps> = ({
  level,
  showLabel = true,
  size = "md",
}) => {
  const config = ESCALATION_CONFIG[level] || ESCALATION_CONFIG[0];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} ${config.color}`}>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

export default EscalationBadge;
