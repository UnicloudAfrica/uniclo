import React, { useMemo, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import api from "../../index/api";
import type { LookupItem, OnboardingOption } from "@/types/onboarding";

const COMPANY_TYPE_OPTIONS: OnboardingOption[] = [
  { value: "", label: "Select business type" },
  { value: "RC", label: "Limited Liability Company (RC)" },
  { value: "BN", label: "Business Name (BN)" },
  { value: "IT", label: "Incorporated Trustees (IT)" },
  { value: "LL", label: "Limited Liability" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)" },
  { value: "Other", label: "Other" },
];

const BUSINESS_MODEL_OPTIONS: OnboardingOption[] = [
  { value: "B2B", label: "Business to Business (B2B)" },
  { value: "B2C", label: "Business to Consumer (B2C)" },
  { value: "B2B2C", label: "Business to Business to Consumer (B2B2C)" },
];

export interface BusinessProfilePayload extends Record<string, unknown> {
  company_name: string;
  registration_number: string;
  company_type: string;
  business_model: string[];
  date_of_incorporation: string;
  industry: string;
  website: string;
  address: string;
  country: string;
  country_id: string;
  state: string;
  state_id: string;
  city: string;
  city_id: string;
  support_contact_name: string;
  support_contact_email: string;
  support_contact_phone: string;
  support_email: string;
}

const DEFAULT_PAYLOAD: BusinessProfilePayload = {
  company_name: "",
  registration_number: "",
  company_type: "",
  business_model: [],
  date_of_incorporation: "",
  industry: "",
  website: "",
  address: "",
  country: "",
  country_id: "",
  state: "",
  state_id: "",
  city: "",
  city_id: "",
  support_contact_name: "",
  support_contact_email: "",
  support_contact_phone: "",
  support_email: "",
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

const isLookupItem = (value: unknown): value is LookupItem =>
  isRecord(value) && typeof value.name === "string";

const toLookupArray = (value: unknown): LookupItem[] =>
  Array.isArray(value) ? value.filter(isLookupItem) : [];

const extractArray = (payload: unknown): LookupItem[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const topData = payload.data;
  if (isRecord(topData)) {
    const nestedData = topData.data;
    const nestedResult = toLookupArray(nestedData);
    if (nestedResult.length) {
      return nestedResult;
    }

    const topResult = toLookupArray(topData);
    if (topResult.length) {
      return topResult;
    }
  }

  const messageResult = toLookupArray(payload.message);
  if (messageResult.length) {
    return messageResult;
  }

  return toLookupArray(payload);
};

export const ensureBusinessProfileDefaults = (value: unknown): BusinessProfilePayload => {
  if (!isRecord(value)) {
    return clone(DEFAULT_PAYLOAD);
  }

  const merged = clone(DEFAULT_PAYLOAD);

  (Object.keys(DEFAULT_PAYLOAD) as Array<keyof BusinessProfilePayload>).forEach((key) => {
    const nextValue = value[key];
    if (nextValue !== undefined && nextValue !== null) {
      if (key === "business_model") {
        if (Array.isArray(nextValue)) {
          merged.business_model = nextValue
            .filter((entry): entry is string => typeof entry === "string")
            .map((entry) => entry.trim())
            .filter((entry) => entry !== "");
          return;
        }

        if (typeof nextValue === "string" && nextValue.trim() !== "") {
          merged.business_model = [nextValue.trim()];
          return;
        }

        merged.business_model = [];
        return;
      }

      merged[key] = String(nextValue) as BusinessProfilePayload[typeof key];
    }
  });

  if (!merged.registration_number) {
    const fallback = value.registration_number;
    if (typeof fallback === "string") {
      merged.registration_number = fallback;
    }
  }

  if (!Array.isArray(merged.business_model)) {
    merged.business_model = [];
  }

  return merged;
};

const setNestedValue = (
  target: Record<string, unknown>,
  path: string | string[],
  nextValue: unknown
) => {
  const keys = Array.isArray(path) ? path : path.split(".");
  const finalKey = keys[keys.length - 1];
  let cursor: Record<string, unknown> = target;

  keys.slice(0, -1).forEach((key) => {
    const currentValue = cursor[key];

    if (!isRecord(currentValue)) {
      cursor[key] = {};
    }

    cursor = cursor[key] as Record<string, unknown>;
  });

  cursor[finalKey] = nextValue;
};

interface BusinessProfileFormProps {
  value: Record<string, unknown> | null | undefined;
  onChange: Dispatch<SetStateAction<Record<string, unknown>>>;
}

const BusinessProfileForm = ({ value, onChange }: BusinessProfileFormProps) => {
  const payload = useMemo(() => ensureBusinessProfileDefaults(value), [value]);

  const { data: industries = [], isLoading: industriesLoading } = useQuery<LookupItem[]>({
    queryKey: ["industries"],
    queryFn: async () => {
      const response = await api("GET", "/industries");
      return extractArray(response);
    },
  });

  const { data: countries = [], isLoading: countriesLoading } = useQuery<LookupItem[]>({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await api("GET", "/countries");
      return extractArray(response);
    },
  });

  const { data: states = [], isLoading: statesLoading } = useQuery<LookupItem[]>({
    queryKey: ["states", payload.country_id],
    queryFn: async () => {
      if (!payload.country_id) {
        return [];
      }

      const response = await api("GET", `/countries/${payload.country_id}`);
      return extractArray(response);
    },
    enabled: Boolean(payload.country_id),
  });

  const { data: cities = [], isLoading: citiesLoading } = useQuery<LookupItem[]>({
    queryKey: ["cities", payload.state_id],
    queryFn: async () => {
      if (!payload.state_id) {
        return [];
      }

      const response = await api<{ data?: unknown }>("GET", `/states/${payload.state_id}`);

      const responseData = isRecord(response?.data) ? response.data : null;
      const nestedData = responseData && isRecord((responseData as Record<string, unknown>).data) ? (responseData as Record<string, unknown>).data : null;
      const stateData =
        nestedData ??
        responseData ??
        (isRecord((response as Record<string, unknown>)?.data?.state)
          ? (response as Record<string, unknown>).data.state
          : null);
      const cityCollection =
        (stateData && isRecord(stateData) ? (stateData as Record<string, unknown>).cities : undefined) ??
        (responseData && isRecord(responseData) ? (responseData as Record<string, unknown>).cities : undefined) ??
        (isRecord(response) ? (response as Record<string, unknown>).cities : undefined);

      return toLookupArray(cityCollection);
    },
    enabled: Boolean(payload.state_id),
  });

  const updateValue = (path: string | string[], nextValue: unknown) => {
    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base) as Record<string, unknown>;
      setNestedValue(updated, path, nextValue);
      return updated;
    });
  };

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value || "";
    const selected = countries.find((item) => String(item.id) === String(selectedId));

    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);
      updated.country_id = selected ? String(selected.id ?? "") : "";
      updated.country = selected?.name ?? "";
      updated.state_id = "";
      updated.state = "";
      updated.city_id = "";
      updated.city = "";
      return updated;
    });
  };

  const handleStateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value || "";
    const selected = states.find((item) => String(item.id) === String(selectedId));

    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);
      updated.state_id = selected ? String(selected.id ?? "") : "";
      updated.state = selected?.name ?? "";
      updated.city_id = "";
      updated.city = "";
      return updated;
    });
  };

  const handleBusinessModelToggle = (nextValue: string) => {
    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);

      const current = Array.isArray(updated.business_model) ? [...updated.business_model] : [];

      const exists = current.includes(nextValue);
      updated.business_model = exists
        ? current.filter((item) => item !== nextValue)
        : [...current, nextValue];

      return updated;
    });
  };

  const handleCityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    const match = cities.find(
      (city) =>
        typeof city.name === "string" && city.name.toLowerCase() === (nextValue || "").toLowerCase()
    );

    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);
      updated.city = nextValue;
      updated.city_id = match?.id !== undefined && match?.id !== null ? String(match.id) : "";
      return updated;
    });
  };

  const busy = industriesLoading || countriesLoading || statesLoading || citiesLoading;

  return (
    <div className="space-y-6">
      {busy && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading lookup data…
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField
          label="Company name"
          value={payload.company_name}
          onChange={(event) => updateValue("company_name", event.target.value)}
          required
          disabled
          helperText="Managed during registration. Contact support to change."
        />
        <SelectField
          label="Business type"
          value={payload.company_type}
          onChange={(event) => updateValue("company_type", event.target.value)}
          options={COMPANY_TYPE_OPTIONS}
          required
          disabled
          helperText="Managed during registration. Contact support to change."
        />
        <InputField
          label="Incorporation number"
          value={payload.registration_number}
          onChange={(event) => updateValue("registration_number", event.target.value)}
          required
          disabled
          helperText="Managed during registration. Contact support to change."
        />
        <InputField
          label="Date of incorporation"
          type="date"
          value={payload.date_of_incorporation}
          onChange={(event) => updateValue("date_of_incorporation", event.target.value)}
          required
        />
        <SelectField
          label="Industry"
          value={payload.industry}
          onChange={(event) => updateValue("industry", event.target.value)}
          options={[
            { value: "", label: "Select industry" },
            ...industries.map((item) => ({
              value: item.name,
              label: item.name,
            })),
          ]}
          required
        />
        <InputField
          label="Company website"
          value={payload.website}
          onChange={(event) => updateValue("website", event.target.value)}
          placeholder="https://example.com"
          required
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business model<span className="text-red-500"> *</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_MODEL_OPTIONS.map((option) => {
              const selected = payload.business_model.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleBusinessModelToggle(option.value)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    selected
                      ? "border-[--theme-color] bg-[--theme-color-10] text-[--theme-color]"
                      : "border-gray-300 hover:border-[--theme-color] hover:text-[--theme-color]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Select all models that describe how you sell your services.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business address<span className="text-red-500"> *</span>
          </label>
          <textarea
            value={payload.address}
            onChange={(event) => updateValue("address", event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
          />
        </div>

        <SelectField
          label="Country"
          value={payload.country_id}
          onChange={handleCountryChange}
          options={[
            { value: "", label: "Select country" },
            ...countries.map((item) => ({
              value: String(item.id ?? ""),
              label: item.name,
            })),
          ]}
          required
        />
        <SelectField
          label="State / Region"
          value={payload.state_id}
          onChange={handleStateChange}
          options={[
            { value: "", label: payload.country_id ? "Select state" : "Select a country first" },
            ...states.map((item) => ({
              value: String(item.id ?? ""),
              label: item.name,
            })),
          ]}
          disabled={!payload.country_id}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City<span className="text-red-500"> *</span>
          </label>
          <input
            type="text"
            value={payload.city}
            onChange={handleCityChange}
            list="city-suggestions"
            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3"
            placeholder="City"
          />
          <datalist id="city-suggestions">
            {cities.map((city, index) => (
              <option key={String(city.id ?? index)} value={city.name} />
            ))}
          </datalist>
        </div>

        <InputField
          label="Support contact name"
          value={payload.support_contact_name}
          onChange={(event) => updateValue("support_contact_name", event.target.value)}
          required
        />
        <InputField
          label="Support contact email"
          type="email"
          value={payload.support_contact_email}
          onChange={(event) => updateValue("support_contact_email", event.target.value)}
          required
        />
        <InputField
          label="Support contact phone"
          value={payload.support_contact_phone}
          onChange={(event) => updateValue("support_contact_phone", event.target.value)}
          required
        />
        <InputField
          label="Generic support email"
          type="email"
          value={payload.support_email}
          onChange={(event) => updateValue("support_email", event.target.value)}
          required
        />
      </div>
    </div>
  );
};

interface InputFieldProps {
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value: unknown;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  helperText?: string;
  disabled?: boolean;
}

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "",
  helperText,
  disabled = false,
}: InputFieldProps) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      value={typeof value === "string" || typeof value === "number" ? value : ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3 ${
        disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
      }`}
    />
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

interface SelectFieldProps {
  label: string;
  value: unknown;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: OnboardingOption[];
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  helperText,
}: SelectFieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <select
      value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
      onChange={onChange}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3 disabled:bg-gray-100 disabled:text-gray-500"
    >
      {options.map((option) => (
        <option key={option.value || option.label} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

export default BusinessProfileForm;
