/**
 * DegradationBanner — Critical alert when bidirectional sync is degraded.
 *
 * Shows when quorum is lost/fenced or bidirectional sync has auto-degraded
 * to active-passive. Includes "Restore Bidirectional" action (manual-only,
 * matching AnyCloudFlow's design).
 */
import React from "react";
import { AlertTriangle, ShieldOff, RefreshCw } from "lucide-react";
import { ModernButton } from "../ui";
import { useRestoreBidirectional } from "../../hooks/resources/integrationHooks";
import { QuorumState, QUORUM_STATE_LABELS } from "@/types/bidirectional";

interface DegradationBannerProps {
  pairId: string;
  quorumState: QuorumState;
  degradedAt?: string | null;
  degradationReason?: string | null;
  className?: string;
}

const DegradationBanner: React.FC<DegradationBannerProps> = ({
  pairId,
  quorumState,
  degradedAt,
  degradationReason,
  className = "",
}) => {
  const restoreBidirectional = useRestoreBidirectional();

  // Only show if actually degraded/lost/fenced
  const isVisible = [QuorumState.Degraded, QuorumState.Lost, QuorumState.Fenced].includes(quorumState);

  if (!isVisible) return null;

  const isFenced = quorumState === QuorumState.Fenced;
  const isLost = quorumState === QuorumState.Lost;

  const bgColor = isFenced
    ? "bg-gray-900 dark:bg-gray-950"
    : isLost
      ? "bg-red-50 dark:bg-red-950/30"
      : "bg-yellow-50 dark:bg-yellow-950/30";

  const borderColor = isFenced
    ? "border-gray-700"
    : isLost
      ? "border-red-200 dark:border-red-900"
      : "border-yellow-200 dark:border-yellow-900";

  const textColor = isFenced
    ? "text-white"
    : isLost
      ? "text-red-800 dark:text-red-300"
      : "text-yellow-800 dark:text-yellow-300";

  const Icon = isFenced ? ShieldOff : AlertTriangle;

  const handleRestore = () => {
    restoreBidirectional.mutate({ pairId });
  };

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={`mt-0.5 shrink-0 ${textColor}`} />
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${textColor}`}>
            {isFenced
              ? "Node Fenced — Bidirectional Sync Disabled"
              : isLost
                ? "Quorum Lost — Bidirectional Sync Suspended"
                : "Bidirectional Sync Degraded"}
          </h4>
          <p className={`mt-1 text-xs ${isFenced ? "text-gray-300" : isLost ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}`}>
            {degradationReason ?? `Quorum state: ${QUORUM_STATE_LABELS[quorumState]}`}
            {degradedAt && (
              <> &middot; Since {new Date(degradedAt).toLocaleString()}</>
            )}
          </p>
          <div className="mt-3">
            <ModernButton
              variant={isFenced ? "outline" : "primary"}
              size="sm"
              onClick={handleRestore}
              disabled={restoreBidirectional.isPending || isFenced}
            >
              <RefreshCw size={14} className={restoreBidirectional.isPending ? "animate-spin" : ""} />
              {restoreBidirectional.isPending ? "Restoring..." : "Restore Bidirectional"}
            </ModernButton>
            {isFenced && (
              <p className="mt-1.5 text-xs text-gray-400">
                Cannot restore while a node is fenced. Resolve the fencing issue first.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DegradationBanner;
