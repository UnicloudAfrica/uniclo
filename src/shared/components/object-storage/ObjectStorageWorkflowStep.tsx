import React from "react";
import { CreditCard, Gauge } from "lucide-react";
import { Option } from "../../../hooks/objectStorageUtils";
import CustomerContextSelector from "../common/CustomerContextSelector";
import { ModernCard, ModernSelect } from "../ui";

export interface ObjectStorageWorkflowStepProps {
  // Mode
  mode: string;
  onModeChange: (mode: string) => void;
  enableFastTrack?: boolean;

  // Customer Context - only show for admin
  showCustomerContext?: boolean;
  contextType: string;
  onContextTypeChange: (type: string) => void;
  selectedTenantId: string;
  onTenantChange: (id: string) => void;
  selectedUserId: string;
  onUserChange: (id: string) => void;
  tenantOptions: Option[];
  clientOptions: Option[];
  isTenantsFetching?: boolean;
  isUsersFetching?: boolean;

  // Country
  countryCode: string;
  onCountryChange: (code: string) => void;
  countryOptions: Option[];
  isCountryLocked?: boolean;
  isCountriesLoading?: boolean;

  // Dashboard context
  dashboardContext: "admin" | "tenant" | "client";
}

export const ObjectStorageWorkflowStep: React.FC<ObjectStorageWorkflowStepProps> = ({
  mode,
  onModeChange,
  enableFastTrack = true,
  showCustomerContext = true,
  contextType,
  onContextTypeChange,
  selectedTenantId,
  onTenantChange,
  selectedUserId,
  onUserChange,
  tenantOptions,
  clientOptions,
  isTenantsFetching,
  isUsersFetching,
  countryCode,
  onCountryChange,
  countryOptions,
  isCountryLocked,
  isCountriesLoading,
  dashboardContext,
}) => {
  return (
    <ModernCard title="Workflow & Assignment">
      <p className="text-sm text-gray-500 -mt-2 mb-4">
        Choose your provisioning mode and who this request is for.
      </p>
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Provisioning Mode</label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div
              onClick={() => onModeChange("standard")}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${mode === "standard"
                  ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                  : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${mode === "standard"
                      ? "bg-primary-100 text-primary-600"
                      : "bg-gray-100 text-gray-500"
                    }`}
                >
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Standard Workflow</p>
                  <p className="text-xs text-gray-500">
                    Configure, price, and generate payment link.
                  </p>
                </div>
              </div>
            </div>

            {enableFastTrack && (
              <div
                onClick={() => onModeChange("fast-track")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${mode === "fast-track"
                    ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                    : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${mode === "fast-track"
                        ? "bg-primary-100 text-primary-600"
                        : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    <Gauge className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fast-Track</p>
                    <p className="text-xs text-gray-500">Skip payment and provision immediately.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showCustomerContext && dashboardContext === "admin" && (
          <CustomerContextSelector
            contextType={contextType}
            setContextType={onContextTypeChange}
            selectedTenantId={selectedTenantId}
            setSelectedTenantId={onTenantChange}
            selectedUserId={selectedUserId}
            setSelectedUserId={onUserChange}
            tenants={tenantOptions.map((option) => ({
              id: option.value,
              name: option.label,
            }))}
            isTenantsFetching={isTenantsFetching}
            userPool={clientOptions.map((option) => ({
              id: option.value,
              email: option.label,
            }))}
            isUsersFetching={isUsersFetching}
          />
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Billing Country</label>
          {isCountryLocked ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 shadow-sm">
              {countryOptions.find((c) => c.value === countryCode)?.label ||
                countryCode ||
                "United States (US)"}
              <span className="ml-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                Default from profile
              </span>
            </div>
          ) : (
            <ModernSelect
              value={countryCode}
              onChange={(event) => {
                if (!isCountryLocked) {
                  onCountryChange(event.target.value);
                }
              }}
              options={countryOptions}
              placeholder={isCountriesLoading ? "Loading countries..." : "Select billing country"}
              disabled={isCountryLocked || isCountriesLoading}
            />
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            {isCountryLocked
              ? "Country is mandated by your account settings."
              : "Used for tax calculation and currency selection."}
          </p>
        </div>
      </div>
    </ModernCard>
  );
};
