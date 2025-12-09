import React from "react";
import { CreditCard, Gauge } from "lucide-react";
import { ModernCard } from "../ui";
import { ModernButton } from "../ui";
import { ModernSelect } from "../ui";
import CustomerContextSelector from "../common/CustomerContextSelector";
import { Option } from "../../../types/InstanceConfiguration";

interface WorkflowSelectionStepProps {
  mode: string;
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
  mode,
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
  return (
    <div className="space-y-6">
      <ModernCard title="Workflow & Assignment">
        <p className="text-sm text-slate-500 -mt-2 mb-4">Who is this resource for?</p>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Provisioning Mode
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div
                onClick={() => onModeChange("fast-track")}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  mode === "fast-track"
                    ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                    : "border-slate-200 hover:border-slate-300"
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
                      Skip payment and provision immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
        <ModernButton
          onClick={onContinue}
          isDisabled={
            (contextType === "tenant" && !selectedTenantId) ||
            (contextType === "user" && !selectedUserId)
          }
        >
          Continue to Configuration
        </ModernButton>
      </div>
    </div>
  );
};

export default WorkflowSelectionStep;
