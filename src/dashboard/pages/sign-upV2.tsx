import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateAccount } from "@/hooks/authHooks";
import { useVerifyBusiness } from "@/hooks/businessHooks";
import useAuthStore from "@/stores/authStore";
import Header from "./signup/header";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
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
  companyType: string;
  registrationNumber: string;
  verificationToken: string;
  countryId: string;
  countryName: string;
  countryCode: string;
}

interface VerificationNormalized {
  rc_number?: string;
  registration_number?: string;
  company_name?: string;
  company_type?: string;
  address?: string;
  status?: string;
  registration_date?: string;
  [key: string]: unknown;
}

interface VerificationResult {
  verification_token?: string;
  normalized?: VerificationNormalized;
  [key: string]: unknown;
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
  companyType: "",
  registrationNumber: "",
  verificationToken: "",
  countryId: "",
  countryName: "",
  countryCode: "",
};

export default function DashboardSignUpV2() {
  const navigate = useNavigate();
  const setUserEmail = useAuthStore((state) => state.setUserEmail);
  const { mutate, isPending } = useCreateAccount();
  const { mutate: verifyBusiness, isPending: isVerifying } = useVerifyBusiness();
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
  const [isBusinessVerified, setIsBusinessVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const updateField = (field: keyof SignUpFormData, value: string) => {
    const requiresReverification = ["companyName", "companyType", "registrationNumber"].includes(
      field
    );

    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "countryId") {
        const selectedCountry = countriesList.find((country) => String(country.id) === value);
        next.countryName = selectedCountry?.name || "";
        next.countryCode =
          selectedCountry?.iso2?.toUpperCase() || selectedCountry?.iso3?.toUpperCase() || "";
      }

      if (requiresReverification) {
        next.verificationToken = "";
      }

      return next;
    });

    if (requiresReverification) {
      setIsBusinessVerified(false);
      setVerificationResult(null);
      setVerificationError(null);
    }

    setErrors((prev) => ({
      ...prev,
      [field]: null,
      general: null,
      verificationToken: requiresReverification ? null : (prev.verificationToken ?? null),
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
    if (!formData.companyName.trim()) {
      validationErrors.companyName = "Company name is required";
    }
    if (!formData.companyType) {
      validationErrors.companyType = "Business type is required";
    }
    if (!formData.registrationNumber.trim()) {
      validationErrors.registrationNumber = "Incorporation number is required";
    }
    if (!formData.verificationToken) {
      validationErrors.verificationToken = "Verify your business before signing up.";
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

    const accountType = "business";
    const businessPayload = {
      name: formData.companyName.trim(),
      company_type: formData.companyType,
      registration_number: formData.registrationNumber.trim(),
      country_id: normalizedCountryId,
      country: normalizedCountryName,
      country_code: normalizedCountryCode,
    };

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      password_confirmation: formData.confirmPassword,
      role: activeRole === "tenant" ? "tenant" : "client",
      account_type: accountType,
      company_name: formData.companyName.trim(),
      verification_token: formData.verificationToken,
      country_id: normalizedCountryId,
      country: normalizedCountryName,
      country_code: normalizedCountryCode,
      business: businessPayload,
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

  const handleVerifyBusiness = () => {
    setVerificationError(null);

    if (
      !formData.companyName.trim() ||
      !formData.companyType ||
      !formData.registrationNumber.trim()
    ) {
      setErrors((prev) => ({
        ...prev,
        companyName: !formData.companyName.trim()
          ? "Business name is required"
          : (prev.companyName ?? null),
        companyType: !formData.companyType
          ? "Business type is required"
          : (prev.companyType ?? null),
        registrationNumber: !formData.registrationNumber.trim()
          ? "Incorporation number is required"
          : (prev.registrationNumber ?? null),
      }));
      return;
    }

    verifyBusiness(
      {
        target: activeRole === "tenant" ? "tenant" : "client",
        business_name: formData.companyName.trim(),
        company_type: formData.companyType,
        registration_number: formData.registrationNumber.trim(),
      },
      {
        onSuccess: (data: VerificationResult) => {
          const token = data?.verification_token ?? "";

          if (!token) {
            setIsBusinessVerified(false);
            setErrors((prev) => ({
              ...prev,
              verificationToken: "Unable to verify business. Please try again.",
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              verificationToken: token,
            }));
            setIsBusinessVerified(true);
            setErrors((prev) => ({ ...prev, verificationToken: null }));
          }

          setVerificationResult(data);
          setVerificationError(token ? null : "Verification succeeded but no token was returned.");
        },
        onError: (error) => {
          setIsBusinessVerified(false);
          setVerificationResult(null);
          setFormData((prev) => ({ ...prev, verificationToken: "" }));
          setVerificationError(getErrorMessage(error, "Unable to verify business."));
        },
      }
    );
  };

  const businessTypes = useMemo(
    () => [
      { value: "", label: "Select business type" },
      { value: "RC", label: "Limited Liability Company (RC)" },
      { value: "BN", label: "Business Name (BN)" },
      { value: "IT", label: "Incorporated Trustees (IT)" },
      { value: "LL", label: "Limited Liability" },
      { value: "LLP", label: "Limited Liability Partnership (LLP)" },
      { value: "Other", label: "Other" },
    ],
    []
  );

  const normalizedPreview = useMemo(() => {
    if (!verificationResult?.normalized) {
      return null;
    }

    const normalized = verificationResult.normalized;

    return {
      registrationNumber: normalized.rc_number ?? normalized.registration_number,
      companyName: normalized.company_name,
      companyType: normalized.company_type,
      address: normalized.address,
      status: normalized.status,
      registrationDate: normalized.registration_date,
    };
  }, [verificationResult]);

  const handleRoleChange = (role: RoleTabId) => {
    setActiveRole(role);
    setIsBusinessVerified(false);
    setVerificationResult(null);
    setVerificationError(null);
    setFormData((prev) => ({
      ...prev,
      verificationToken: "",
    }));
    setErrors((prev) => ({
      ...prev,
      verificationToken: null,
    }));
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

          <Field
            label="Company Name"
            value={formData.companyName}
            error={errors.companyName}
            onChange={(value) => updateField("companyName", value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              label="Business Type"
              value={formData.companyType}
              error={errors.companyType}
              options={businessTypes}
              onChange={(value) => updateField("companyType", value)}
              disabled={isBusinessVerified || isVerifying}
            />
            <Field
              label="Incorporation Number"
              value={formData.registrationNumber}
              error={errors.registrationNumber}
              onChange={(value) => updateField("registrationNumber", value)}
              disabled={isBusinessVerified || isVerifying}
              placeholder="e.g., RC123456"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Verify your business</p>
                <p className="text-xs text-gray-500">
                  Confirm your CAC record before creating the account.
                </p>
              </div>
              <button
                type="button"
                onClick={handleVerifyBusiness}
                disabled={isVerifying || isBusinessVerified}
                className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: accentColor, transition: "opacity 0.3s" }}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : isBusinessVerified ? (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Verified
                  </>
                ) : (
                  "Verify Business"
                )}
              </button>
            </div>
            {verificationError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{verificationError}</span>
              </div>
            )}
            {isBusinessVerified && (
              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  Business verified successfully.
                </div>
                {normalizedPreview && (
                  <dl className="grid gap-1 text-xs text-emerald-800 sm:grid-cols-2">
                    {normalizedPreview.companyName && (
                      <div>
                        <dt className="font-semibold">Company</dt>
                        <dd>{normalizedPreview.companyName}</dd>
                      </div>
                    )}
                    {normalizedPreview.registrationNumber && (
                      <div>
                        <dt className="font-semibold">RC Number</dt>
                        <dd>{normalizedPreview.registrationNumber}</dd>
                      </div>
                    )}
                    {normalizedPreview.registrationDate && (
                      <div>
                        <dt className="font-semibold">Registered</dt>
                        <dd>{normalizedPreview.registrationDate}</dd>
                      </div>
                    )}
                    {normalizedPreview.address && (
                      <div className="sm:col-span-2">
                        <dt className="font-semibold">Address</dt>
                        <dd>{normalizedPreview.address}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            )}
          </div>

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

          {errors.verificationToken && (
            <p className="text-red-500 text-sm">{errors.verificationToken}</p>
          )}
          {errors.general && <p className="text-red-500 text-sm">{errors.general}</p>}

          <button
            type="submit"
            disabled={isPending || isVerifying || !formData.verificationToken}
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
