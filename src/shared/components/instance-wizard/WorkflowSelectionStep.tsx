import React from "react";
import { CreditCard, Gauge, AlertCircle, CheckCircle2, MapPin } from "lucide-react";
import { ModernCard } from "../ui";
import { ModernButton } from "../ui";
import { ModernSelect } from "../ui";
import CustomerContextSelector from "../common/CustomerContextSelector";
import { Option } from "../../../types/InstanceConfiguration";

interface WorkflowSelectionStepProps {
  title?: string;
  subtitle?: string;
  showContextSelector?: boolean;
  modeOptions?: Array<"standard" | "fast-track">;
  mode: string;
  showFastTrackInfo?: boolean;
  hasFastTrackAccess?: boolean;
  fastTrackRegions?: string[];
  allRegionOptions?: Option[];
  contextType: string;
  selectedTenantId: string;
  selectedUserId: string;
  billingCountry: string;
  isCountryLocked: boolean;
  isCountriesLoading: boolean;
  tenants: any[];
  isTenantsFetching: boolean;
  userPool: any[];
  isUsersFetching: boolean;
  countryOptions: Option[];
  onModeChange: (mode: string) => void;
  onContextTypeChange: (type: string) => void;
  onTenantChange: (id: string) => void;
  onUserChange: (id: string) => void;
  onCountryChange: (country: string) => void;
  onContinue: () => void;
}

const WorkflowSelectionStep: React.FC<WorkflowSelectionStepProps> = ({
  title = "Workflow & Assignment",
  subtitle = "Who is this resource for?",
  showContextSelector = true,
  modeOptions = ["standard", "fast-track"],
  mode,
  showFastTrackInfo = false,
  hasFastTrackAccess = true,
  fastTrackRegions = [],
  allRegionOptions = [],
  contextType,
  selectedTenantId,
  selectedUserId,
  billingCountry,
  isCountryLocked,
  isCountriesLoading,
  tenants,
  isTenantsFetching,
  userPool,
  isUsersFetching,
  countryOptions,
  onModeChange,
  onContextTypeChange,
  onTenantChange,
  onUserChange,
  onCountryChange,
  onContinue,
}) => {
  const availableModes = modeOptions.length ? modeOptions : ["standard", "fast-track"];
  const showStandard = availableModes.includes("standard");
  const showFastTrack = availableModes.includes("fast-track");
  const fastTrackBlocked = showFastTrackInfo && !hasFastTrackAccess;
  const isContinueDisabled =
    showContextSelector &&
    ((contextType === "tenant" && !selectedTenantId) ||
      (contextType === "user" && !selectedUserId));

  const eligibleRegionNames = showFastTrackInfo
    ? allRegionOptions
        .filter((r: any) => fastTrackRegions.includes(r.value))
        .map((r: any) => r.label)
    : [];

  return (
    <div className="space-y-6">
      <ModernCard title={title}>
        <p className="text-sm text-slate-500 -mt-2 mb-4">{subtitle}</p>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Provisioning Mode
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {showStandard && (
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
                      <p className="text-xs text-slate-500">
                        Configure, price, and generate payment link.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showFastTrack && (
                <div
                  onClick={() => {
                    if (!fastTrackBlocked) {
                      onModeChange("fast-track");
                    }
                  }}
                  className={`relative rounded-xl border p-4 transition-all ${
                    fastTrackBlocked
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
                        {fastTrackBlocked
                          ? "No fast-track access granted"
                          : "Skip payment and provision immediately."}
                      </p>
                    </div>
                  </div>
                  {fastTrackBlocked && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Not Available
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {showFastTrackInfo && fastTrackBlocked && (
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

          {showFastTrackInfo && hasFastTrackAccess && mode === "fast-track" && (
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

          {showFastTrackInfo && mode === "standard" && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Standard billing</p>
                <p className="text-xs text-blue-700 mt-1">
                  Standard mode requires payment before provisioning in any region.
                </p>
              </div>
            </div>
          )}

          {showContextSelector && (
            <CustomerContextSelector
              contextType={contextType}
              setContextType={onContextTypeChange}
              selectedTenantId={selectedTenantId}
              setSelectedTenantId={onTenantChange}
              selectedUserId={selectedUserId}
              setSelectedUserId={onUserChange}
              tenants={tenants}
              isTenantsFetching={isTenantsFetching}
              userPool={userPool}
              isUsersFetching={isUsersFetching}
            />
          )}

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
                  ? "Country is locked based on the selected customer."
                  : "Used for tax calculation and currency selection."
              }
            />
          </div>
        </div>
      </ModernCard>

      <div className="flex justify-end">
        <ModernButton onClick={onContinue} isDisabled={isContinueDisabled}>
          Continue to Configuration
        </ModernButton>
      </div>
    </div>
  );
};

export default WorkflowSelectionStep;
