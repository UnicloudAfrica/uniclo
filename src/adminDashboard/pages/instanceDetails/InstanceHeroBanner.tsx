import React from "react";
import { ArrowLeft, Copy, RefreshCw, Sparkles } from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import StatusPill from "@/shared/components/ui/StatusPill";

import { formatStatusText, getStatusTone } from "./instanceDetailsUtils";

interface InstanceHeroBannerProps {
  name: string | undefined;
  identifier: string | undefined;
  region: string | undefined;
  status: string | undefined;
  billingStatus: string | undefined;
  fulfillmentMode: string | undefined;
  isAutoSyncing: boolean;
  pendingAction: string | null;
  onGoBack: () => void;
  onRefreshStatus: () => void;
  onCopyIdentifier: () => void;
}

const InstanceHeroBanner: React.FC<InstanceHeroBannerProps> = ({
  name,
  identifier,
  region: _region,
  status,
  billingStatus,
  fulfillmentMode,
  isAutoSyncing,
  pendingAction,
  onGoBack,
  onRefreshStatus,
  onCopyIdentifier,
}) => {
  return (
    <div className="brand-hero rounded-[32px] text-white shadow-2xl">
      <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between lg:p-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
            <Sparkles size={14} />
            Instance Spotlight
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {name || identifier || "Instance"}
            </h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">
              Stay informed on lifecycle events, resource utilisation, billing, and provider
              telemetry for this workload.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status && <StatusPill label={formatStatusText(status)} tone={getStatusTone(status)} />}
            {billingStatus && (
              <StatusPill label={`Billing: ${formatStatusText(billingStatus)}`} tone="neutral" />
            )}
            {fulfillmentMode && (
              <StatusPill label={`${formatStatusText(fulfillmentMode)} fulfillment`} tone="info" />
            )}
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
            <span className="font-mono">{identifier || "N/A"}</span>
            {identifier && (
              <button
                onClick={onCopyIdentifier}
                className="rounded-full bg-white/10 p-1 text-white transition hover:bg-white/20"
                title="Copy identifier"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Instances
          </ModernButton>
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={onRefreshStatus}
            leftIcon={
              <RefreshCw
                className={`h-4 w-4 ${pendingAction === "refresh" ? "animate-spin" : ""}`}
              />
            }
            isDisabled={pendingAction === "refresh"}
          >
            Sync status
          </ModernButton>
          {isAutoSyncing && (
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              Auto-syncing after retry
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstanceHeroBanner;
