// @ts-nocheck
import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useLoginAccount } from "../../hooks/authHooks";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import useAuthRedirect from "../../utils/authRedirect";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "../../hooks/useBrandingTheme";
import useImageFallback from "../../hooks/useImageFallback";
import { getSubdomain } from "../../utils/getSubdomain";

const TenantLogin = ({ tenant = "Tenant" }: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { mutate, isPending } = useLoginAccount();
  const navigate = useNavigate();
  const { userEmail, setUserEmail } = useTenantAuthStore.getState();
  const { isLoading } = useAuthRedirect();
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
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(
    logoSrc,
    fallbackBrand.logo
  );

  // Validation function
  const validateForm = () => {
    let newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for login
  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      email,
      password,
    };

    mutate(userData, {
      onSuccess: () => {
        setUserEmail(email);
        navigate("/verify-mail"); // Redirect on success
      },
      onError: (err) => {
        setErrors({ general: err.message || "Failed to login" });
        console.log(err);
      },
    });
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
          <img
            src={resolvedLogoSrc}
            className="w-[100px] mx-auto mb-4 rounded"
            alt={logoAlt}
            onError={handleLogoError}
          />
          <h1 className="text-2xl font-semibold text-[#121212] mb-2">Welcome Back</h1>
          <p className="text-[#676767] text-sm">Welcome back to {brandName}.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full input-field ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full input-field pr-10 ${
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
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm hover:opacity-80 font-medium"
              style={{ color: accentColor, transition: "opacity 0.3s" }}
            >
              Forgot Password?
            </Link>
          </div>
          {errors.general && <p className="text-red-500 text-xs mt-1">{errors.general}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full hover:opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-opacity focus:outline-none focus:ring-1 focus:ring-offset-2 flex items-center justify-center"
            style={{
              backgroundColor: accentColor,
              transition: "opacity 0.3s",
            }}
          >
            {isPending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : "Login"}
          </button>
          <div className="text-center mt-4">
            <span className="text-sm text-[#1E1E1E99]">Don't have an account? </span>
            <Link
              to="/sign-up"
              type="button"
              className="text-sm hover:opacity-80 font-medium"
              style={{ color: accentColor, transition: "opacity 0.3s" }}
            >
              Sign Up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantLogin;
