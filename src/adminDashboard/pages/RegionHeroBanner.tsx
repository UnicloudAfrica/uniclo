import React from "react";
import type { RegionHeroBannerProps } from "./regionEditTypes";

const RegionHeroBanner = ({
  formData,
  regionName,
  regionProvider,
  locationLabel,
}: RegionHeroBannerProps) => {
  return (
    <div className="brand-hero rounded-[32px] text-white shadow-2xl">
      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              Edit Region
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {formData.name || regionName || "Region"}
              </h2>
              <p className="text-sm text-white/80 sm:text-base">
                {locationLabel || "Location not specified"} • {formData.code}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">Zones</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {regionProvider || "—none"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                Active State
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formData.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">Country</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {formData.country_code || "—not set"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionHeroBanner;
