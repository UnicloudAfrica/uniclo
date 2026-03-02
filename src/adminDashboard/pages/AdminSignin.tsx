import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { useNavigate } from "react-router-dom";

import useAdminAuthStore from "../../stores/adminAuthStore";

import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useLoginAdminAccount } from "../../hooks/adminHooks/authHooks";
import {
  resolveBrandLogo,
  usePlatformBrandingTheme,
  useApplyBrandingTheme,
} from "../../hooks/useBrandingTheme";
import useImageFallback from "../../hooks/useImageFallback";
import AuthShell from "../../components/auth/AuthShell";
import logger from "../../utils/logger";

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const { mutate, isPending } = useLoginAdminAccount();
  const navigate = useNavigate();
  const { setUserEmail, setTwoFactorRequired, clearTwoFactorRequirement } = useAdminAuthStore();
  const { isLoading } = useAuthRedirect();
  const { data: branding } = usePlatformBrandingTheme();
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const fallbackBrand = {
    name: "Unicloud Africa",
    logo,
    color: "var(--theme-color)",
  };
  const accentColor = branding?.accentColor || fallbackBrand.color;
  const logoSrc = resolveBrandLogo(branding, fallbackBrand.logo);
  const brandingCompanyName = branding?.company?.["name"];
  const logoAlt = brandingCompanyName
    ? `${brandingCompanyName} Logo`
    : `${fallbackBrand.name} Logo`;
  const companyName = brandingCompanyName || fallbackBrand.name;
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(logoSrc, logo);

  useEffect(() => {
    clearTwoFactorRequirement();
  }, [clearTwoFactorRequirement]);

  // Validation function
  const validateForm = () => {
    const newErrors: LoginErrors = {};

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
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      email,
      password,
    };
    mutate(userData, {
      onSuccess: (res: any) => {
        const requiresTwoFactor =
          res?.data?.two_factor_enabled ??
          res?.data?.two_factor_required ??
          res?.data?.requires_two_factor ??
          res?.data?.settings?.security?.two_factor_enabled ??
          res?.data?.profile?.two_factor_enabled ??
          res?.requires_two_factor ??
          res?.two_factor_required ??
          res?.data?.user?.two_factor_enabled ??
          false;

        setTwoFactorRequired(Boolean(requiresTwoFactor));
        setUserEmail(email);
        navigate("/verify-admin-mail"); // Redirect on success
      },
      onError: (err: any) => {
        setErrors({ general: err.message || "Failed to login" });
        logger.log(err);
      },
    });
  };

  if (isLoading) {
    return (
      <div className=" w-full h-svh flex items-center justify-center">
        <Loader2 className=" w-12 text-[var(--theme-color)] animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell>
      <div className="max-w-md mx-auto w-full bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-md">
        <div className="mb-6 text-center">
          <img
            src={resolvedLogoSrc}
            className="w-[100px] mx-auto mb-4 rounded"
            alt={logoAlt}
            onError={handleLogoError}
          />
          <h1 className="text-2xl font-semibold text-[var(--theme-heading-color)] mb-2">
            Welcome Back
          </h1>
          <p className="text-[var(--theme-text-color)] text-sm">
            Welcome back to {companyName}. Enter your details to access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--theme-heading-color)] mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className={`w-full auth-input ${errors.email ? "auth-input-error" : ""}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--theme-heading-color)] mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full pr-10 auth-input ${errors.password ? "auth-input-error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-[var(--theme-muted-color)]" />
                ) : (
                  <Eye className="h-4 w-4 text-[var(--theme-muted-color)]" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
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
            {isPending ? <Loader2 className="w-4 text-white animate-spin" /> : "Login"}
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
