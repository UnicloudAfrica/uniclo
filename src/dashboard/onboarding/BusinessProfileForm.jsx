import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import api from "../../index/api";
const COMPANY_TYPE_OPTIONS = [
  { value: "", label: "Select business type" },
  { value: "RC", label: "Limited Liability Company (RC)" },
  { value: "BN", label: "Business Name (BN)" },
  { value: "IT", label: "Incorporated Trustees (IT)" },
  { value: "LL", label: "Limited Liability" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)" },
  { value: "Other", label: "Other" },
];

const BUSINESS_MODEL_OPTIONS = [
  { value: "B2B", label: "Business to Business (B2B)" },
  { value: "B2C", label: "Business to Consumer (B2C)" },
  { value: "B2B2C", label: "Business to Business to Consumer (B2B2C)" },
];

const DEFAULT_PAYLOAD = {
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

const clone = (value) => JSON.parse(JSON.stringify(value));

const extractArray = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.data?.data)) {
    return payload.data.data;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.message)) {
    return payload.message;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

export const ensureBusinessProfileDefaults = (value) => {
  if (!value || typeof value !== "object") {
    return clone(DEFAULT_PAYLOAD);
  }

  const merged = clone(DEFAULT_PAYLOAD);

  Object.keys(DEFAULT_PAYLOAD).forEach((key) => {
    if (value[key] !== undefined && value[key] !== null) {
      merged[key] = value[key];
    }
  });

  // Normalise legacy structures if present
  if (!merged.registration_number && value.registration_number) {
    merged.registration_number = value.registration_number;
  }

  if (!Array.isArray(merged.business_model)) {
    if (typeof merged.business_model === "string" && merged.business_model !== "") {
      merged.business_model = [merged.business_model];
    } else if (merged.business_model === null || merged.business_model === undefined) {
      merged.business_model = [];
    } else {
      merged.business_model = [];
    }
  }

  return merged;
};

const setNestedValue = (target, path, nextValue) => {
  const keys = Array.isArray(path) ? path : path.split(".");
  const finalKey = keys[keys.length - 1];
  let cursor = target;

  keys.slice(0, -1).forEach((key) => {
    if (
      cursor[key] === undefined ||
      cursor[key] === null ||
      typeof cursor[key] !== "object"
    ) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  });

  cursor[finalKey] = nextValue;
};

const BusinessProfileForm = ({ value, onChange }) => {
  const payload = useMemo(
    () => ensureBusinessProfileDefaults(value),
    [value]
  );

  const { data: industries = [], isLoading: industriesLoading } = useQuery({
    queryKey: ["industries"],
    queryFn: async () => {
      const response = await api("GET", "/industries");
      return extractArray(response);
    },
  });

  const { data: countries = [], isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const response = await api("GET", "/countries");
      return extractArray(response);
    },
  });

  const { data: states = [], isLoading: statesLoading } = useQuery({
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

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", payload.state_id],
    queryFn: async () => {
      if (!payload.state_id) {
        return [];
      }

      const response = await api("GET", `/states/${payload.state_id}`);
      const stateData =
        response?.data?.data ??
        response?.data ??
        response?.data?.state ??
        {};

      const cityCollection =
        stateData?.cities ??
        response?.data?.cities ??
        response?.cities ??
        [];

      return Array.isArray(cityCollection) ? cityCollection : [];
    },
    enabled: Boolean(payload.state_id),
  });

  const updateValue = (path, nextValue) => {
    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);
      setNestedValue(updated, path, nextValue);
      return updated;
    });
  };

  const handleCountryChange = (event) => {
    const selectedId = event.target.value || "";
    const selected = countries.find(
      (item) => String(item.id) === String(selectedId)
    );

    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);
      updated.country_id = selected ? String(selected.id) : "";
      updated.country = selected ? selected.name : "";
      updated.state_id = "";
      updated.state = "";
      updated.city_id = "";
      updated.city = "";
      return updated;
    });
  };

  const handleStateChange = (event) => {
    const selectedId = event.target.value || "";
    const selected = states.find(
      (item) => String(item.id) === String(selectedId)
    );

    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);
      updated.state_id = selected ? String(selected.id) : "";
      updated.state = selected ? selected.name : "";
      updated.city_id = "";
      updated.city = "";
      return updated;
    });
  };

  const handleBusinessModelToggle = (value) => {
    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);

      const current = Array.isArray(updated.business_model)
        ? [...updated.business_model]
        : [];

      const exists = current.includes(value);
      const next = exists
        ? current.filter((item) => item !== value)
        : [...current, value];

      updated.business_model = next;
      return updated;
    });
  };

  const handleCityChange = (event) => {
    const nextValue = event.target.value;
    const match = cities.find(
      (city) =>
        city?.name &&
        city.name.toLowerCase() === (nextValue || "").toLowerCase()
    );

    onChange((previous) => {
      const base = ensureBusinessProfileDefaults(previous);
      const updated = clone(base);
      updated.city = nextValue;
      updated.city_id = match ? String(match.id) : "";
      return updated;
    });
  };

  const busy =
    industriesLoading || countriesLoading || statesLoading || citiesLoading;

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
          onChange={(event) =>
            updateValue("registration_number", event.target.value)
          }
          required
          disabled
          helperText="Managed during registration. Contact support to change."
        />
        <InputField
          label="Date of incorporation"
          type="date"
          value={payload.date_of_incorporation}
          onChange={(event) =>
            updateValue("date_of_incorporation", event.target.value)
          }
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
              value: String(item.id),
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
              value: String(item.id),
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
            {cities.map((city) => (
              <option key={city.id} value={city.name} />
            ))}
          </datalist>
        </div>

        <InputField
          label="Support contact name"
          value={payload.support_contact_name}
          onChange={(event) =>
            updateValue("support_contact_name", event.target.value)
          }
          required
        />
        <InputField
          label="Support contact email"
          type="email"
          value={payload.support_contact_email}
          onChange={(event) =>
            updateValue("support_contact_email", event.target.value)
          }
          required
        />
        <InputField
          label="Support contact phone"
          value={payload.support_contact_phone}
          onChange={(event) =>
            updateValue("support_contact_phone", event.target.value)
          }
          required
        />
        <InputField
          label="Generic support email"
          type="email"
          value={payload.support_email}
          onChange={(event) =>
            updateValue("support_email", event.target.value)
          }
          required
        />
      </div>
    </div>
  );
};

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
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-3 ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
    />
    {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  helperText,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <select
      value={value ?? ""}
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
