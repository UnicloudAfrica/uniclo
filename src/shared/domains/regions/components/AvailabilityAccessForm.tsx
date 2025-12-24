/**
 * Availability & Access Form
 * Reusable component for region visibility and fast track settings
 */
// @ts-nocheck
import React from "react";
import { Globe, AlertCircle, ChevronRight } from "lucide-react";
import type { RegionFormData } from "../types/serviceConfig.types";

export interface AvailabilityAccessFormProps {
  regionData: RegionFormData;
  onChange: (field: keyof RegionFormData, value: any) => void;
  showFastTrack?: boolean;
}

const AvailabilityAccessForm: React.FC<AvailabilityAccessFormProps> = ({
  regionData,
  onChange,
  showFastTrack = true,
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Visibility Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Region Visibility</label>
        <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200">
          <button
            type="button"
            onClick={() => onChange("visibility", "public")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              regionData.visibility === "public"
                ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Globe className="h-4 w-4" />
            Public
          </button>
          <button
            type="button"
            onClick={() => onChange("visibility", "private")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all ${
              regionData.visibility === "private"
                ? "bg-white text-amber-600 shadow-sm ring-1 ring-gray-200"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <AlertCircle className="h-4 w-4" />
            Private
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {regionData.visibility === "public"
            ? "Public regions are visible to all tenants."
            : "Private regions are restricted."}
        </p>
      </div>

      {/* Fast Track Access */}
      {showFastTrack && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fast Track Access</label>
          <div className="relative">
            <select
              value={regionData.fast_track_mode}
              onChange={(e) => onChange("fast_track_mode", e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="disabled">Disabled (Standard)</option>
              <option value="owner_only">Owner Only</option>
              <option value="grant_only">Grant Based</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <ChevronRight className="h-4 w-4 rotate-90" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {regionData.fast_track_mode === "disabled" && "Standard visibility rules apply."}
            {regionData.fast_track_mode === "owner_only" &&
              "Only the owning tenant can access this region."}
            {regionData.fast_track_mode === "grant_only" && (
              <span className="text-blue-600 font-medium">
                You will be redirected to configure specific tenant grants after creation.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityAccessForm;
