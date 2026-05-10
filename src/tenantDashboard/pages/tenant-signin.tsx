import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useLoginAccount } from "@/hooks/authHooks";
import useAuthStore from "@/stores/authStore";
import useAuthRedirect from "@/utils/authRedirect";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "@/hooks/useBrandingTheme";
import useImageFallback from "@/hooks/useImageFallback";
import { getSubdomain } from "@/utils/getSubdomain";
import AuthShell from "../../components/auth/AuthShell";
import logger from "@/utils/logger";

interface TenantLoginProps {
  tenant?: string;
}

type LoginErrors = Partial<Record<"email" | "password" | "general", string>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim() !== "") return error;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
};

const TenantLogin: React.FC<TenantLoginProps> = ({ tenant = "Tenant" }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const { mutate, isPending } = useLoginAccount();
  const navigate = useNavigate();
  const { setUserEmail, setTwoFactorRequired, clearTwoFactorRequirement } =
    useAuthStore.getState();
  const { isLoading } = useAuthRedirect();
  const fallbackBrand = {
    name: tenant,
    logo,
    color: "var(--theme-color)",
  };
  const hostname = globalThis.window !== undefined ? globalThis.window.location.hostname : "";
  const subdomain = globalThis.window !== undefined ? getSubdomain() : null;
  const { data: branding } = usePublicBrandingTheme({
    domain: hostname,
    subdomain,
  });
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const accentColor = branding?.accentColor || fallbackBrand.color;
  const brandName = branding?.company?.name || fallbackBrand.name;
  const logoSrc = resolveBrandLogo(branding, fallbackBrand.logo);
  const logoAlt = branding?.company?.name
    ? `${branding.company.name} Logo`
    : `${fallbackBrand.name} Logo`;
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(
    logoSrc,
    fallbackBrand.logo
  );

  useEffect(() => {
    clearTwoFactorRequirement?.();
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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      email,
      password,
    };

    mutate(userData, {
      onSuccess: (res) => {
        const responseRecord = isRecord(res) ? res : {};
        const dataRecord = isRecord(responseRecord.data) ? responseRecord.data : {};
        const settingsRecord = isRecord(dataRecord.settings) ? dataRecord.settings : {};
        const securityRecord = isRecord(settingsRecord.security) ? settingsRecord.security : {};
        const profileRecord = isRecord(dataRecord.profile) ? dataRecord.profile : {};
        const userRecord = isRecord(dataRecord.user) ? dataRecord.user : {};
        const requiresTwoFactor = Boolean(
          dataRecord.two_factor_enabled ??
          dataRecord.two_factor_required ??
          dataRecord.requires_two_factor ??
          securityRecord.two_factor_enabled ??
          profileRecord.two_factor_enabled ??
          responseRecord.requires_two_factor ??
          responseRecord.two_factor_required ??
          userRecord.two_factor_enabled ??
          false
        );

        setTwoFactorRequired?.(requiresTwoFactor);
        setUserEmail(email);
        navigate("/verify-mail"); // Redirect on success
      },
      onError: (err) => {
        setErrors({ general: getErrorMessage(err, "Failed to login") });
        logger.log(err);
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
          <p className="text-[var(--theme-text-color)] text-sm">Welcome back to {brandName}.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--theme-heading-color)] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full auth-input ${errors.email ? "auth-input-error" : ""}`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--theme-heading-color)] mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full auth-input pr-10 ${errors.password ? "auth-input-error" : ""}`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-[var(--theme-muted-color)]"
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
            <span className="text-sm text-[rgb(var(--theme-neutral-900) / 0.6)]">
              Don't have an account?{" "}
            </span>
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
    </AuthShell>
  );
};

export default TenantLogin;
