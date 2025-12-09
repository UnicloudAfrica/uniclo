// @ts-nocheck
import React from "react";
import { getSlaStatusColor, SlaStatus } from "./threadTypes";

interface SlaStatusIndicatorProps {
  sla: SlaStatus;
  compact?: boolean;
}

export const SlaStatusIndicator: React.FC<SlaStatusIndicatorProps> = ({ sla, compact = false }) => {
  if (compact) {
    const isBad = sla.response.status === "breached" || sla.resolution.status === "breached";
    const isRisk = sla.response.status === "at_risk" || sla.resolution.status === "at_risk";

    return (
      <div
        className={`w-2 h-2 rounded-full ${
          isBad ? "bg-red-500" : isRisk ? "bg-yellow-500" : "bg-green-500"
        }`}
        title={`Response: ${sla.response.status}, Resolution: ${sla.resolution.status}`}
      />
    );
  }

  return (
    <div className="flex gap-4 text-sm">
      <div>
        <span className="text-gray-500">Response:</span>{" "}
        <span className={`font-medium ${getSlaStatusColor(sla.response.status)}`}>
          {sla.response.status.toUpperCase()}
        </span>
      </div>
      <div>
        <span className="text-gray-500">Resolution:</span>{" "}
        <span className={`font-medium ${getSlaStatusColor(sla.resolution.status)}`}>
          {sla.resolution.status.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default SlaStatusIndicator;
