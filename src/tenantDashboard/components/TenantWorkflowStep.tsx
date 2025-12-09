// @ts-nocheck
import React from "react";
import { CreditCard, Gauge, AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { ModernCard, ModernButton, ModernSelect } from "../../shared/components/ui";
import { Option } from "../../types/InstanceConfiguration";

interface TenantWorkflowStepProps {
  mode: string;
  billingCountry: string;
  isCountryLocked: boolean;
  isCountriesLoading: boolean;
  countryOptions: Option[];
  hasFastTrackAccess: boolean;
  fastTrackRegions: string[];
  allRegionOptions: Option[];
  onModeChange: (mode: string) => void;
  onCountryChange: (country: string) => void;
  onContinue: () => void;
}

const TenantWorkflowStep: React.FC<TenantWorkflowStepProps> = ({
  mode,
  billingCountry,
  isCountryLocked,
  isCountriesLoading,
  countryOptions,
  hasFastTrackAccess,
  fastTrackRegions,
  allRegionOptions,
  onModeChange,
  onCountryChange,
  onContinue,
}) => {
  // Filter to show only fast-track eligible regions
  const eligibleRegionNames = allRegionOptions
    .filter((r: any) => fastTrackRegions.includes(r.value))
    .map((r: any) => r.label);

  return (
    <div className="space-y-6">
      <ModernCard title="Provisioning Mode">
        <p className="text-sm text-slate-500 -mt-2 mb-4">
          Choose how you want to provision your instances
        </p>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Standard Mode */}
            <div
              onClick={() => onModeChange("standard")}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                mode === "standard"
                  ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    mode === "standard"
                      ? "bg-primary-100 text-primary-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Standard Workflow</p>
                  <p className="text-xs text-slate-500">Deploy in any region with payment</p>
                </div>
              </div>
            </div>

            {/* Fast-Track Mode */}
            <div
              onClick={() => hasFastTrackAccess && onModeChange("fast-track")}
              className={`relative rounded-xl border p-4 transition-all ${
                !hasFastTrackAccess
                  ? "cursor-not-allowed opacity-60 border-slate-200 bg-slate-50"
                  : mode === "fast-track"
                    ? "cursor-pointer border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                    : "cursor-pointer border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    mode === "fast-track"
                      ? "bg-primary-100 text-primary-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Fast-Track</p>
                  <p className="text-xs text-slate-500">
                    {hasFastTrackAccess
                      ? "Deploy instantly in granted regions (no payment)"
                      : "No fast-track access granted"}
                  </p>
                </div>
              </div>
              {!hasFastTrackAccess && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                    Not Available
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fast-Track Info Message */}
          {!hasFastTrackAccess && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Fast-track provisioning not available
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Contact your administrator to request fast-track access for specific regions. Once
                  granted, you can deploy instances immediately without payment in those regions.
                </p>
              </div>
            </div>
          )}

          {/* Eligible Regions Display */}
          {hasFastTrackAccess && mode === "fast-track" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">Fast-Track Eligible Regions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {eligibleRegionNames.length > 0 ? (
                  eligibleRegionNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                    >
                      <MapPin className="h-3 w-3" />
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-green-600">All granted regions available</span>
                )}
              </div>
              <p className="text-xs text-green-600 mt-2">
                Instances in these regions will be provisioned immediately without payment.
              </p>
            </div>
          )}

          {/* Mixed Order Info for Standard Mode */}
          {hasFastTrackAccess && mode === "standard" && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Mixed orders supported</p>
                <p className="text-xs text-blue-700 mt-1">
                  You can add instances in both fast-track and regular regions. Fast-track regions (
                  {eligibleRegionNames.join(", ") || "none"}) will be provisioned free, while other
                  regions will require payment.
                </p>
              </div>
            </div>
          )}

          {/* Billing Country */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Billing Country</label>
            <ModernSelect
              value={billingCountry}
              onChange={(e) => {
                if (!isCountryLocked) {
                  onCountryChange(e.target.value);
                }
              }}
              options={countryOptions}
              placeholder="Select billing country"
              disabled={isCountryLocked || isCountriesLoading}
              helper={
                isCountryLocked
                  ? "Country is locked based on your profile."
                  : "Used for tax calculation and currency selection."
              }
            />
          </div>
        </div>
      </ModernCard>

      <div className="flex justify-end">
        <ModernButton onClick={onContinue}>Continue to Configuration</ModernButton>
      </div>
    </div>
  );
};

export default TenantWorkflowStep;
