import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useCreateAccount } from "../../hooks/authHooks";
import { useFetchCountries } from "../../hooks/resource";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import useAuthRedirect from "../../utils/authRedirect";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "../../hooks/useBrandingTheme";
import useImageFallback from "../../hooks/useImageFallback";
import { getSubdomain } from "../../utils/getSubdomain";
import AuthShell from "../../components/auth/AuthShell";

interface Country {
  id: number | string;
  name: string;
  iso2?: string;
  iso3?: string;
}

const TenantRegister = ({ tenant = "Tenant" }: any) => {
  const navigate = useNavigate();
  const { setUserEmail } = useTenantAuthStore.getState();
  const { mutate, isPending } = useCreateAccount();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const { isLoading } = useAuthRedirect();
  const {
    data: countriesRaw,
    isFetching: isCountriesFetching,
    isError: isCountriesError,
  } = useFetchCountries();
  const countries = (countriesRaw as Country[]) || [];
  const fallbackBrand = {
    name: tenant,
    logo,
    color: "var(--theme-color)",
  };
  const hostname =
    typeof globalThis.window !== "undefined" ? globalThis.window.location.hostname : "";
  const subdomain = typeof globalThis.window !== "undefined" ? getSubdomain() : undefined;
  const { data: brandingRaw } = usePublicBrandingTheme({
    domain: hostname,
    ...(subdomain ? { subdomain } : {}),
  });
  const branding: any = brandingRaw; // Avoid complex branding type issues for now
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const accentColor = branding?.accentColor || fallbackBrand.color;
  const brandName = branding?.company?.name || fallbackBrand.name;
  const logoSrc = resolveBrandLogo(branding, fallbackBrand.logo);
  const logoAlt = (branding?.company?.name as string | undefined)
    ? `${branding.company.name} Logo`
    : `${fallbackBrand.name} Logo`;
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(
    logoSrc,
    fallbackBrand.logo
  );

  const [signupRole, setSignupRole] = useState("client");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    phone: "",
    countryId: "",
    countryName: "",
    countryCode: "",
    accountType: "business",
    companyName: "",
  });

  const validateForm = () => {
    const newErrors: Record<string, any> = {};
    if (!formData["email"]) newErrors["email"] = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData["email"])) newErrors["email"] = "Invalid email format";
    if (!formData["password"]) newErrors["password"] = "Password is required";
    else if (formData["password"].length < 6)
      newErrors["password"] = "Password must be at least 6 characters";
    if (!formData["confirmPassword"]) newErrors["confirmPassword"] = "Confirm password is required";
    else if (formData["password"] !== formData["confirmPassword"])
      newErrors["confirmPassword"] = "Passwords do not match";
    if (!formData["contactPersonFirstName"])
      newErrors["contactPersonFirstName"] = "First name is required";
    if (!formData["contactPersonLastName"])
      newErrors["contactPersonLastName"] = "Last name is required";
    if (!formData["phone"]) newErrors["phone"] = "Phone number is required";
    else if (!/^\+?\d{10,15}$/.test(formData["phone"])) newErrors["phone"] = "Invalid phone number";
    if (!formData["countryId"]) newErrors["countryId"] = "Country is required";
    if (signupRole === "client" && !formData["accountType"])
      newErrors["accountType"] = "Account type is required";

    const isBusinessAccount = signupRole === "tenant" || formData["accountType"] === "business";
    if (isBusinessAccount && !formData["companyName"]) {
      newErrors["companyName"] = "Company name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: any, value: any) => {
    setFormData((prev) => {
      if (field === "countryId") {
        const selectedCountry = countries.find((country) => String(country.id) === value);
        return {
          ...prev,
          countryId: value,
          countryName: selectedCountry?.name || "",
          countryCode:
            selectedCountry?.iso2?.toUpperCase() || selectedCountry?.iso3?.toUpperCase() || "",
        };
      }
      if (field === "accountType" && value === "individual") {
        return {
          ...prev,
          accountType: value,
          companyName: "",
        };
      }
      return { ...prev, [field]: value };
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleRoleChange = (role: any) => {
    setSignupRole(role);
    setFormData((prev) => ({
      ...prev,
      accountType: role === "tenant" ? "business" : prev.accountType || "business",
    }));
    setErrors((prev) => ({
      ...prev,
      accountType: null,
      companyName: null,
    }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (validateForm()) {
      const isTenant = signupRole === "tenant";
      const isBusinessAccount = isTenant || formData.accountType === "business";
      const accountType = isTenant ? "business" : formData.accountType;

      const businessPayload = isBusinessAccount
        ? {
            name: formData["companyName"] || null,
          }
        : {};

      const userData = {
        first_name: formData["contactPersonFirstName"],
        last_name: formData["contactPersonLastName"],
        email: formData["email"],
        role: isTenant ? "tenant" : "client",
        account_type: accountType,
        password: formData["password"],
        password_confirmation: formData["confirmPassword"],
        phone: formData["phone"],
        country_id: formData["countryId"],
        country: formData["countryName"],
        country_code: formData["countryCode"],
        company_name: isBusinessAccount ? formData["companyName"] : null,
        business: businessPayload,
      };

      mutate(userData, {
        onSuccess: () => {
          setUserEmail(formData["email"]);
          navigate("/verify-mail");
        },
        onError: (err) => {
          setErrors({ general: err.message || "Failed to create account" });
          console.log(err);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  return (
    <AuthShell>
      <div className="max-w-md mx-auto w-full bg-white p-6 rounded-xl shadow-md">
        <div className="mb-6 text-center">
          <img
            src={resolvedLogoSrc}
            className="w-[100px] mx-auto mb-4 rounded"
            alt={logoAlt}
            onError={handleLogoError}
          />
          <h1 className="text-2xl font-semibold text-[var(--theme-heading-color)] mb-2">
            Create an Account
          </h1>
          <p className="text-[var(--theme-text-color)] text-sm">
            Join {brandName} and launch your cloud in minutes.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-[var(--theme-surface-alt)] rounded-[12px] p-1">
            {["tenant", "client"].map((role: string) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-[10px] transition-all ${
                  signupRole === role
                    ? "bg-white shadow text-[var(--theme-heading-color)]"
                    : "text-[var(--theme-text-color)]"
                }`}
              >
                {role === "tenant" ? "Tenant" : "Client"}
              </button>
            ))}
          </div>

          {signupRole === "client" && (
            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div
                id="accountType"
                className="flex bg-[var(--theme-surface-alt)] rounded-[12px] p-1"
              >
                {["business", "individual"].map((type: string) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData("accountType", type)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-[10px] transition-all ${
                      formData["accountType"] === type
                        ? "bg-white shadow text-[var(--theme-heading-color)]"
                        : "text-[var(--theme-text-color)]"
                    }`}
                  >
                    {type === "business" ? "Business" : "Individual"}
                  </button>
                ))}
              </div>
              {errors["accountType"] && (
                <p className="text-red-500 text-xs mt-1">{errors["accountType"]}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contactPersonFirstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contactPersonFirstName"
                type="text"
                value={formData["contactPersonFirstName"]}
                onChange={(e) => updateFormData("contactPersonFirstName", e.target.value)}
                className={`w-full input-field ${
                  errors["contactPersonFirstName"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter first name"
              />
              {errors["contactPersonFirstName"] && (
                <p className="text-red-500 text-xs mt-1">{errors["contactPersonFirstName"]}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="contactPersonLastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contactPersonLastName"
                type="text"
                value={formData["contactPersonLastName"]}
                onChange={(e) => updateFormData("contactPersonLastName", e.target.value)}
                className={`w-full input-field ${
                  errors["contactPersonLastName"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter last name"
              />
              {errors["contactPersonLastName"] && (
                <p className="text-red-500 text-xs mt-1">{errors["contactPersonLastName"]}</p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData["email"]}
              onChange={(e) => updateFormData("email", e.target.value)}
              className={`w-full input-field ${
                errors["email"] ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter email"
            />
            {errors["email"] && <p className="text-red-500 text-xs mt-1">{errors["email"]}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData["password"]}
                onChange={(e) => updateFormData("password", e.target.value)}
                className={`w-full input-field ${
                  errors["password"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors["password"] && (
              <p className="text-red-500 text-xs mt-1">{errors["password"]}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData["confirmPassword"]}
              onChange={(e) => updateFormData("confirmPassword", e.target.value)}
              className={`w-full input-field ${
                errors["confirmPassword"] ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Confirm password"
            />
            {errors["confirmPassword"] && (
              <p className="text-red-500 text-xs mt-1">{errors["confirmPassword"]}</p>
            )}
          </div>
          {(signupRole === "tenant" || formData["accountType"] === "business") && (
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                value={formData["companyName"]}
                onChange={(e) => updateFormData("companyName", e.target.value)}
                className={`w-full input-field ${
                  errors["companyName"] ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter company name"
              />
              {errors["companyName"] && (
                <p className="text-red-500 text-xs mt-1">{errors["companyName"]}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData["phone"]}
              onChange={(e) => updateFormData("phone", e.target.value)}
              className={`w-full input-field ${
                errors["phone"] ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter phone number"
            />
            {errors["phone"] && <p className="text-red-500 text-xs mt-1">{errors["phone"]}</p>}
          </div>
          <div>
            <label htmlFor="countryId" className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="countryId"
              value={formData["countryId"]}
              onChange={(e) => updateFormData("countryId", e.target.value)}
              className={`w-full input-field ${
                errors["countryId"] ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isCountriesFetching || isCountriesError}
            >
              <option value="">
                {isCountriesFetching ? "Loading countries..." : "Select a country"}
              </option>
              {countries.map((country: Country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            {isCountriesError && (
              <p className="text-red-500 text-xs mt-1">
                Unable to load countries. Please refresh and try again.
              </p>
            )}
            {errors["countryId"] && (
              <p className="text-red-500 text-xs mt-1">{errors["countryId"]}</p>
            )}
          </div>

          {errors["general"] && <p className="text-red-500 text-xs mt-1">{errors["general"]}</p>}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 hover:opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-opacity focus:outline-none focus:ring-1 focus:ring-offset-2 flex items-center justify-center"
              style={{
                backgroundColor: accentColor,
                transition: "opacity 0.3s",
              }}
            >
              Sign Up
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
          <div className="text-center mt-4">
            <span className="text-sm text-[rgb(var(--theme-neutral-900) / 0.6)]">
              Already have an account?{" "}
            </span>
            <Link
              to="/sign-in"
              type="button"
              className="text-sm hover:opacity-80 font-medium"
              style={{ color: accentColor, transition: "opacity 0.3s" }}
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
};

export default TenantRegister;
