import React from "react";
import { CheckCircle2, Users } from "lucide-react";
import type { PersonaOption } from "./onboardingReviewTypes";

interface SelectOption {
  value: string;
  label: string;
}

interface OnboardingFiltersProps {
  personaOptions: PersonaOption[];
  persona: string | null;
  onPersonaChange: (value: string) => void;
  subjectType: "tenant" | "client";
  // Tenant selector
  tenantsOptions: SelectOption[];
  selectedTenantId: string;
  onTenantChange: (value: string) => void;
  isTenantsLoading: boolean;
  // Client selector
  filteredClients: SelectOption[];
  selectedClientId: string;
  onClientChange: (value: string) => void;
  isClientsLoading: boolean;
}

const PersonaOptionButton: React.FC<{
  option: PersonaOption;
  isActive: boolean;
  onClick: () => void;
}> = ({ option, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
      isActive
        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
        : "border-gray-200 hover:bg-gray-50"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-semibold ${isActive ? "text-blue-700" : "text-gray-800"}`}>
          {option.label}
        </p>
        <p className="mt-1 text-xs text-gray-500">{option.description}</p>
      </div>
      {isActive && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
    </div>
  </button>
);

const PersonaSelector: React.FC<{
  personaOptions: PersonaOption[];
  persona: string | null;
  onPersonaChange: (value: string) => void;
}> = ({ personaOptions, persona, onPersonaChange }) => (
  <div className="space-y-3">
    {personaOptions.map((option) => (
      <PersonaOptionButton
        key={option.value}
        option={option}
        isActive={persona === option.value}
        onClick={() => onPersonaChange(option.value)}
      />
    ))}
  </div>
);

const SubjectSelector: React.FC<{
  subjectType: "tenant" | "client";
  tenantsOptions: SelectOption[];
  selectedTenantId: string;
  onTenantChange: (value: string) => void;
  isTenantsLoading: boolean;
  filteredClients: SelectOption[];
  selectedClientId: string;
  onClientChange: (value: string) => void;
  isClientsLoading: boolean;
}> = ({
  subjectType,
  tenantsOptions,
  selectedTenantId,
  onTenantChange,
  isTenantsLoading,
  filteredClients,
  selectedClientId,
  onClientChange,
  isClientsLoading,
}) => (
  <div className="space-y-4">
    {subjectType === "tenant" ? (
      <>
        <label className="block text-sm font-medium text-gray-700">Tenant</label>
        <div className="relative">
          <select
            value={selectedTenantId}
            onChange={(event) => onTenantChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">{isTenantsLoading ? "Loading tenants..." : "Select a tenant"}</option>
            {tenantsOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </>
    ) : (
      <>
        <label className="block text-sm font-medium text-gray-700">Client</label>
        <div className="relative">
          <select
            value={selectedClientId}
            onChange={(event) => onClientChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">{isClientsLoading ? "Loading clients..." : "Select a client"}</option>
            {filteredClients.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </>
    )}
    <p className="flex items-center gap-2 text-xs text-gray-500">
      <Users size={14} />
      Choose who you are reviewing to view their onboarding trail.
    </p>
  </div>
);

export { PersonaSelector, SubjectSelector };
export default OnboardingFiltersProps;
