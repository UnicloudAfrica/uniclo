/**
 * Region Information Form
 * Reusable form component for basic region details (name, code, country, city, provider)
 */
// @ts-nocheck
import React from "react";
import { MapPin, Globe, Building, ChevronRight } from "lucide-react";
import ModernInput from "../../../components/ui/ModernInput";
import type { RegionFormData, ProviderOption, CLOUD_PROVIDERS } from "../types/serviceConfig.types";

export interface Country {
  id?: number;
  code?: string;
  iso2?: string;
  name: string;
}

export interface RegionInfoFormProps {
  regionData: RegionFormData;
  onChange: (field: keyof RegionFormData, value: any) => void;
  countries: Country[];
  providers?: ProviderOption[];
  showProviderSelection?: boolean;
}

const RegionInfoForm: React.FC<RegionInfoFormProps> = ({
  regionData,
  onChange,
  countries,
  providers = [
    { value: "zadara", label: "Zadara" },
    { value: "aws", label: "AWS" },
    { value: "azure", label: "Azure" },
    { value: "gcp", label: "Google Cloud" },
  ],
  showProviderSelection = true,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ModernInput
          label="Region Name"
          name="name"
          value={regionData.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="e.g., Lagos"
          required
          icon={<MapPin className="h-4 w-4" />}
        />
        <ModernInput
          label="Region Code"
          name="code"
          value={regionData.code}
          onChange={(e) => onChange("code", e.target.value)}
          placeholder="e.g., lagos-1"
          required
          helper="Unique identifier for this region"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <div className="relative">
            <select
              name="country_code"
              value={regionData.country_code}
              onChange={(e) => onChange("country_code", e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 pl-10"
            >
              <option value="">Select a country...</option>
              {countries.map((c: Country) => (
                <option key={c.id || c.code} value={c.code || c.iso2}>
                  {c.name}
                </option>
              ))}
            </select>
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <ChevronRight className="absolute right-3 top-2.5 h-4 w-4 rotate-90 text-gray-400" />
          </div>
        </div>
        <ModernInput
          label="City"
          name="city"
          value={regionData.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="e.g., Lagos"
          icon={<Building className="h-4 w-4" />}
        />
      </div>

      {showProviderSelection && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cloud Provider</label>
          <div className="grid grid-cols-2 gap-3">
            {providers.map((provider) => (
              <label
                key={provider.value}
                className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  regionData.provider === provider.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={provider.value}
                  checked={regionData.provider === provider.value}
                  onChange={(e) => onChange("provider", e.target.value)}
                  className="sr-only"
                />
                <span
                  className={`font-medium ${
                    regionData.provider === provider.value ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {provider.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionInfoForm;
