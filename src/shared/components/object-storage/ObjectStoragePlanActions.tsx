import React from "react";
import { ArrowLeft, MapPin, ShieldCheck, Zap } from "lucide-react";

/**
 * Reusable CTA cluster for Silo Storage plan selection.
 *
 * Persona rules:
 * - admin: Standard + Fast-track visible. If tenant context exists, include it in the fast-track note.
 * - tenant: Standard visible. Fast-track optional (pass canFastTrack=true to show).
 * - client: Standard only (fast-track hidden).
 */
const ObjectStoragePlanActions = ({
  persona = "client", // 'admin' | 'tenant' | 'client'
  hasTenantContext = false,
  canFastTrack = false,
  enableFastTrack = true,
  onStandardPlan,
  onFastTrack,
  onBack,
  standardLabel = "Provision Silo Storage",
  fastTrackLabel = "Fast-track Silo Storage",
  loading = false,
}) => {
  const showFastTrack =
    enableFastTrack && (persona === "admin" || (persona === "tenant" && canFastTrack));

  const regionCopy = (() => {
    if (persona === "admin") {
      if (hasTenantContext) {
        return "Regions: all regions for standard; fast-track scoped to the selected tenant.";
      }
      return "Regions: all regions available for standard and fast-track.";
    }
    if (persona === "tenant") {
      if (canFastTrack) {
        return "Regions: standard uses all regions; fast-track is limited to those granted to this tenant owner.";
      }
      return "Regions: standard uses all regions available to your tenant.";
    }
    // client
    return "Regions: standard plan lists all regions. Fast-track unavailable for clients.";
  })();

  return (
    <div className="flex flex-col gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={onStandardPlan}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg shadow-primary-900/20 transition hover:-trangray-y-0.5 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" />
          {standardLabel}
        </button>
        {showFastTrack && (
          <button
            type="button"
            onClick={onFastTrack}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-200 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-900/20 transition hover:-trangray-y-0.5 hover:from-emerald-300 hover:to-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {fastTrackLabel}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-white/80">
        <MapPin className="h-4 w-4 opacity-80" />
        <span>{regionCopy}</span>
      </div>
    </div>
  );
};

export default ObjectStoragePlanActions;
