/**
 * Availability Zone Configuration Step
 * Allows adding/removing AZs during region creation.
 * Each AZ has a provider, code, and name.
 */
import React from "react";
import { Plus, Trash2, Server, ChevronRight } from "lucide-react";
import ModernInput from "@/shared/components/ui/ModernInput";
import { ModernButton } from "@/shared/components/ui";
import type { AZFormData, ProviderOption } from "../types/serviceConfig.types";
import { CLOUD_PROVIDERS, DEFAULT_AZ_FORM_DATA } from "../types/serviceConfig.types";

export interface AZConfigStepProps {
  azList: AZFormData[];
  onChange: (azList: AZFormData[]) => void;
  providers?: ProviderOption[];
}

const AZConfigStep: React.FC<AZConfigStepProps> = ({
  azList,
  onChange,
  providers = CLOUD_PROVIDERS,
}) => {
  const handleAdd = () => {
    onChange([...azList, { ...DEFAULT_AZ_FORM_DATA }]);
  };

  const handleRemove = (index: number) => {
    onChange(azList.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: keyof AZFormData, value: string | boolean) => {
    const updated = azList.map((az, i) => (i === index ? { ...az, [field]: value } : az));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Availability Zones</h3>
          <p className="text-xs text-gray-500 mt-1">
            Add one or more availability zones. Each AZ can use a different cloud provider.
          </p>
        </div>
        <ModernButton type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add AZ
        </ModernButton>
      </div>

      {azList.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
          <Server className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-3">No availability zones added yet</p>
          <ModernButton type="button" variant="primary" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add First Availability Zone
          </ModernButton>
        </div>
      )}

      <div className="space-y-4">
        {azList.map((az, index) => (
          <div
            key={index}
            className="rounded-2xl border-2 border-gray-200 bg-white p-5 space-y-4 hover:border-gray-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Server className="h-4 w-4" />
                </div>
                <span className="font-semibold text-gray-900">
                  AZ {index + 1}
                  {az.name ? ` — ${az.name}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Remove AZ"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cloud Provider
                </label>
                <div className="relative">
                  <select
                    value={az.provider}
                    onChange={(e) => handleFieldChange(index, "provider", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select provider...</option>
                    {providers.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-2.5 h-4 w-4 rotate-90 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Code */}
              <ModernInput
                label="AZ Code"
                name={`az-code-${index}`}
                value={az.code}
                onChange={(e) => handleFieldChange(index, "code", e.target.value)}
                placeholder="e.g., lagos-az1"
                required
              />

              {/* Name */}
              <ModernInput
                label="AZ Name"
                name={`az-name-${index}`}
                value={az.name}
                onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                placeholder="e.g., Lagos AZ1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AZConfigStep;
