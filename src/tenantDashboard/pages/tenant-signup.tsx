// @ts-nocheck
import React, { useState } from "react";
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
import { getSubdomain } from "../../utils/getSubdomain";

const TenantRegister = ({ tenant = "Tenant" }: any) => {
  const navigate = useNavigate();
  const { userEmail, setUserEmail } = useTenantAuthStore.getState();
  const { mutate, isPending } = useCreateAccount();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { isLoading } = useAuthRedirect();
  const {
    data: countries = [],
    isFetching: isCountriesFetching,
    isError: isCountriesError,
  } = useFetchCountries();
  const fallbackBrand = {
    name: tenant,
    logo,
    color: "#288DD1",
  };
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const subdomain = typeof window !== "undefined" ? getSubdomain() : null;
  const { data: branding } = usePublicBrandingTheme({
    domain: hostname,
    subdomain,
  });
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const accentColor = branding?.accentColor || fallbackBrand.color;
  const accentTint = /^#([0-9A-F]{6}|[0-9A-F]{3})$/i.test(accentColor)
    ? `${accentColor}20`
    : "#288DD120";
  const brandName = branding?.company?.name || fallbackBrand.name;
  const logoSrc = resolveBrandLogo(branding, fallbackBrand.logo);
  const logoAlt = branding?.company?.name
    ? `${branding.company.name} Logo`
    : `${fallbackBrand.name} Logo`;

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
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.contactPersonFirstName)
      newErrors.contactPersonFirstName = "First name is required";
    if (!formData.contactPersonLastName) newErrors.contactPersonLastName = "Last name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    else if (!/^\+?\d{10,15}$/.test(formData.phone)) newErrors.phone = "Invalid phone number";
    if (!formData.countryId) newErrors.countryId = "Country is required";
    if (!formData.accountType && signupRole === "client")
      newErrors.accountType = "Account type is required";

    const isBusinessAccount = signupRole === "tenant" || formData.accountType === "business";
    if (isBusinessAccount && !formData.companyName) {
      newErrors.companyName = "Company name is required";
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
            name: formData.companyName || null,
          }
        : {};

      const userData = {
        first_name: formData.contactPersonFirstName,
        last_name: formData.contactPersonLastName,
        email: formData.email,
        role: isTenant ? "tenant" : "client",
        account_type: accountType,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        phone: formData.phone,
        country_id: formData.countryId,
        country: formData.countryName,
        country_code: formData.countryCode,
        company_name: isBusinessAccount ? formData.companyName : null,
        business: businessPayload,
      };

      mutate(userData, {
        onSuccess: () => {
          setUserEmail(formData.email);
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
    <div
      className="min-h-screen flex items-center justify-center p-8 font-Outfit"
      style={{ backgroundColor: accentTint }} // Light background tint
    >
      <div className="max-w-md mx-auto w-full bg-white p-6 rounded-xl shadow-md">
        <div className="mb-6 text-center">
          <img src={logoSrc} className="w-[100px] mx-auto mb-4 rounded" alt={logoAlt} />
          <h1 className="text-2xl font-semibold text-[#121212] mb-2">Create an Account</h1>
          <p className="text-[#676767] text-sm">
            Join {brandName} and launch your cloud in minutes.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-[#F5F6F8] rounded-[12px] p-1">
            {["tenant", "client"].map((role: any) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-[10px] transition-all ${
                  signupRole === role ? "bg-white shadow text-[#121212]" : "text-[#6B7280]"
                }`}
              >
                {role === "tenant" ? "Tenant" : "Client"}
              </button>
            ))}
          </div>

          {signupRole === "client" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <div className="flex bg-[#F5F6F8] rounded-[12px] p-1">
                {["business", "individual"].map((type: any) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData("accountType", type)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-[10px] transition-all ${
                      formData.accountType === type
                        ? "bg-white shadow text-[#121212]"
                        : "text-[#6B7280]"
                    }`}
                  >
                    {type === "business" ? "Business" : "Individual"}
                  </button>
                ))}
              </div>
              {errors.accountType && (
                <p className="text-red-500 text-xs mt-1">{errors.accountType}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactPersonFirstName}
                onChange={(e) => updateFormData("contactPersonFirstName", e.target.value)}
                className={`w-full input-field ${
                  errors.contactPersonFirstName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter first name"
              />
              {errors.contactPersonFirstName && (
                <p className="text-red-500 text-xs mt-1">{errors.contactPersonFirstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactPersonLastName}
                onChange={(e) => updateFormData("contactPersonLastName", e.target.value)}
                className={`w-full input-field ${
                  errors.contactPersonLastName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter last name"
              />
              {errors.contactPersonLastName && (
                <p className="text-red-500 text-xs mt-1">{errors.contactPersonLastName}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              className={`w-full input-field ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter email"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                className={`w-full input-field ${
                  errors.password ? "border-red-500" : "border-gray-300"
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
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => updateFormData("confirmPassword", e.target.value)}
              className={`w-full input-field ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>
          {(signupRole === "tenant" || formData.accountType === "business") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateFormData("companyName", e.target.value)}
                className={`w-full input-field ${
                  errors.companyName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              className={`w-full input-field ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter phone number"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.countryId}
              onChange={(e) => updateFormData("countryId", e.target.value)}
              className={`w-full input-field ${
                errors.countryId ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isCountriesFetching || isCountriesError}
            >
              <option value="">
                {isCountriesFetching ? "Loading countries..." : "Select a country"}
              </option>
              {countries.map((country: any) => (
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
            {errors.countryId && <p className="text-red-500 text-xs mt-1">{errors.countryId}</p>}
          </div>

          {errors.general && <p className="text-red-500 text-xs mt-1">{errors.general}</p>}
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
            <span className="text-sm text-[#1E1E1E99]">Already have an account? </span>
            <Link
              to="/login"
              type="button"
              className="text-sm hover:opacity-80 font-medium"
              style={{ color: accentColor, transition: "opacity 0.3s" }}
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantRegister;
