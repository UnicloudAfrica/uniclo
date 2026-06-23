import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateAccount } from "@/hooks/authHooks";
import useAuthStore from "@/stores/authStore";
import Header from "./signup/header";
import { useSharedFetchCountries } from "@/hooks/sharedResourceHooks";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "@/hooks/useBrandingTheme";
import { getSubdomain } from "@/utils/getSubdomain";
import AuthShell from "../../components/auth/AuthShell";

type RoleTabId = "tenant" | "client";

interface Country {
  id: string | number;
  name: string;
  iso2?: string;
  iso3?: string;
  [key: string]: unknown;
}

interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  countryId: string;
  countryName: string;
  countryCode: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const payload = error as {
      message?: string;
      response?: {
        data?: {
          message?: string;
        };
      };
    };
    return payload.response?.data?.message || payload.message || fallback;
  }
  return fallback;
};

const ROLE_TABS: Array<{ id: RoleTabId; label: string }> = [
  { id: "tenant", label: "Tenant" },
  { id: "client", label: "Client" },
];

const INITIAL_FORM: SignUpFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  countryId: "",
  countryName: "",
  countryCode: "",
};

export default function DashboardSignUpV2() {
  const navigate = useNavigate();
  const setUserEmail = useAuthStore((state) => state.setUserEmail);
  const { mutate, isPending } = useCreateAccount();
  const { data: countries = [], isFetching: isCountriesFetching } = useSharedFetchCountries();
  const countriesList = useMemo<Country[]>(
    () => (Array.isArray(countries) ? (countries as unknown as Country[]) : []),
    [countries]
  );
  const hostname = globalThis.window !== undefined ? globalThis.window.location.hostname : "";
  const subdomain = globalThis.window !== undefined ? getSubdomain() : null;
  const { data: branding } = usePublicBrandingTheme({
    domain: hostname,
    subdomain: subdomain ?? undefined,
  });
  useApplyBrandingTheme(branding, { updateFavicon: true });
  const fallbackBrand = {
    name: "Unicloud",
    color: "var(--theme-color)",
  };
  const accentColor = branding?.accentColor || fallbackBrand.color;
  const headerLogo = resolveBrandLogo(branding, null);
  const logoAlt = branding?.company?.name ? `${branding.company.name} Logo` : "Logo";
  const companyName = branding?.company?.name || fallbackBrand.name;

  const [activeRole, setActiveRole] = useState<RoleTabId>("tenant");
  const [formData, setFormData] = useState<SignUpFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  // Tenants are always a business; clients choose. Company Name only applies to a business.
  const [accountType, setAccountType] = useState<"business" | "individual">("business");
  const isBusiness = activeRole === "tenant" || accountType === "business";

  const updateField = (field: keyof SignUpFormData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "countryId") {
        const selectedCountry = countriesList.find((country) => String(country.id) === value);
        next.countryName = selectedCountry?.name || "";
        next.countryCode =
          selectedCountry?.iso2?.toUpperCase() || selectedCountry?.iso3?.toUpperCase() || "";
      }

      return next;
    });

    setErrors((prev) => ({
      ...prev,
      [field]: null,
      general: null,
    }));
  };

  const validate = () => {
    const validationErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      validationErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      validationErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      validationErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      validationErrors.email = "Enter a valid email address";
    }
    if (!formData.password) {
      validationErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      validationErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = "Confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }
    if (isBusiness && !formData.companyName.trim()) {
      validationErrors.companyName = "Company name is required";
    }
    if (!formData.countryId) {
      validationErrors.countryId = "Select a country";
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const selectedCountry =
      countriesList.find((country) => String(country.id) === formData.countryId) || null;
    const normalizedCountryId = selectedCountry ? String(selectedCountry.id) : "";
    const normalizedCountryName = formData.countryName || selectedCountry?.name || "";
    const normalizedCountryCode =
      formData.countryCode ||
      selectedCountry?.iso2?.toUpperCase() ||
      selectedCountry?.iso3?.toUpperCase() ||
      "";

    const resolvedAccountType = activeRole === "tenant" ? "business" : accountType;

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      password_confirmation: formData.confirmPassword,
      role: activeRole === "tenant" ? "tenant" : "client",
      account_type: resolvedAccountType,
      company_name: isBusiness ? formData.companyName.trim() : "",
      country_id: normalizedCountryId,
      country: normalizedCountryName,
      country_code: normalizedCountryCode,
      // Individuals have no company — omit the business block entirely.
      ...(isBusiness
        ? {
            business: {
              name: formData.companyName.trim(),
              country_id: normalizedCountryId,
              country: normalizedCountryName,
              country_code: normalizedCountryCode,
            },
          }
        : {}),
    };

    mutate(payload, {
      onSuccess: () => {
        setUserEmail(payload.email);
        navigate("/verify-mail");
      },
      onError: (err) => {
        const message = getErrorMessage(err, "Sign up failed. Please try again.");
        setErrors((prev) => ({ ...prev, general: message }));
      },
    });
  };

  const handleRoleChange = (role: RoleTabId) => {
    setActiveRole(role);
  };

  const countryOptions = useMemo(() => {
    if (isCountriesFetching) {
      return [{ value: "", label: "Loading countries..." }];
    }

    return [
      { value: "", label: "Select country" },
      ...countriesList.map((country) => ({
        value: String(country.id),
        label: country.name,
      })),
    ];
  }, [countriesList, isCountriesFetching]);

  return (
    <AuthShell>
      <div className="max-w-md mx-auto w-full bg-white p-6 rounded-xl shadow-md">
        <Header logoSrc={headerLogo} logoAlt={logoAlt} companyName={companyName} />

        <div className="flex bg-[var(--theme-surface-alt)] rounded-[12px] p-1 mb-8">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleRoleChange(tab.id)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-[10px] transition-all ${
                activeRole === tab.id
                  ? "bg-white shadow text-[var(--theme-heading-color)]"
                  : "text-[var(--theme-text-color)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {activeRole === "client" && (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--theme-heading-color)]">
                I&apos;m signing up as
              </p>
              <div className="flex bg-[var(--theme-surface-alt)] rounded-[12px] p-1">
                {(["individual", "business"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAccountType(t)}
                    className={`flex-1 rounded-[10px] px-4 py-2.5 text-sm font-medium capitalize transition-all ${
                      accountType === t
                        ? "bg-white shadow text-[var(--theme-heading-color)]"
                        : "text-[var(--theme-text-color)]"
                    }`}
                  >
                    {t === "individual" ? "Individual" : "Business"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="First Name"
              value={formData.firstName}
              error={errors.firstName}
              onChange={(value) => updateField("firstName", value)}
            />
            <Field
              label="Last Name"
              value={formData.lastName}
              error={errors.lastName}
              onChange={(value) => updateField("lastName", value)}
            />
          </div>

          {isBusiness && (
            <Field
              label="Company Name"
              value={formData.companyName}
              error={errors.companyName}
              onChange={(value) => updateField("companyName", value)}
            />
          )}

          <Field
            label="Email"
            type="email"
            value={formData.email}
            error={errors.email}
            onChange={(value) => updateField("email", value)}
          />
          <SelectField
            label="Country"
            value={formData.countryId}
            error={errors.countryId}
            options={countryOptions}
            onChange={(value) => updateField("countryId", value)}
            disabled={isCountriesFetching}
          />

          <PasswordField
            label="Password"
            value={formData.password}
            error={errors.password}
            onChange={(value) => updateField("password", value)}
          />

          <PasswordField
            label="Confirm Password"
            value={formData.confirmPassword}
            error={errors.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
          />

          {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full hover:opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-opacity focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor, transition: "opacity 0.3s" }}
          >
            {isPending ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-[var(--theme-text-color)]">
            Already have an account?{" "}
            <a
              href="/sign-in"
              className="hover:opacity-80 font-medium"
              style={{ color: accentColor, transition: "opacity 0.3s" }}
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  options: SelectOption[];
  disabled?: boolean;
}

function SelectField({
  label,
  value,
  onChange,
  error,
  options,
  disabled = false,
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`input-field ${error ? "border-red-500" : "border-gray-300"} bg-white`}
      >
        {options.map((option: SelectOption) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  disabled = false,
  placeholder,
}: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`input-field ${error ? "border-red-500" : "border-gray-300"}`}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

function PasswordField({ label, value, onChange, error }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`input-field ${error ? "border-red-500" : "border-gray-300"}`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
