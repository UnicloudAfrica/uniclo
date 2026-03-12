import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useLoginAccount } from "@/hooks/authHooks";
import useTenantAuthStore from "@/stores/tenantAuthStore";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "@/hooks/useBrandingTheme";
import useImageFallback from "@/hooks/useImageFallback";
import { getSubdomain } from "@/utils/getSubdomain";
import AuthShell from "../../components/auth/AuthShell";
// import useAuthRedirect from "@/utils/authRedirect";

interface LoginResponse {
  data?: {
    two_factor_enabled?: boolean;
    two_factor_required?: boolean;
    requires_two_factor?: boolean;
    settings?: { security?: { two_factor_enabled?: boolean } };
    profile?: { two_factor_enabled?: boolean };
    user?: { two_factor_enabled?: boolean };
  };
  requires_two_factor?: boolean;
  two_factor_required?: boolean;
}

export default function DashboardLoginV2() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, any>>({});
  const { mutate, isPending } = useLoginAccount();
  const navigate = useNavigate();
  const { setUserEmail, setTwoFactorRequired, clearTwoFactorRequirement } =
    useTenantAuthStore.getState();
  const hostname = globalThis.window !== undefined ? globalThis.window.location.hostname : "";
  const subdomain = globalThis.window !== undefined ? getSubdomain() : null;
  const { data: branding } = usePublicBrandingTheme({
    domain: hostname,
    subdomain: subdomain ?? undefined,
  });
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const fallbackBrand = {
    name: "Unicloud",
    logo,
    color: "var(--theme-color)",
  };
  const accentColor = branding?.accentColor || fallbackBrand.color;
  const logoSrc = resolveBrandLogo(branding, fallbackBrand.logo);
  const logoAlt = branding?.company?.name
    ? `${branding.company.name} Logo`
    : `${fallbackBrand.name} Logo`;
  const brandName = branding?.company?.name || fallbackBrand.name;
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(logoSrc, logo);
  //   const { isLoading } = useAuthRedirect();

  useEffect(() => {
    clearTwoFactorRequirement?.();
  }, [clearTwoFactorRequirement]);

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, any> = {};
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
      onSuccess: (res) => {
        const typedRes = res as LoginResponse;
        const requiresTwoFactor =
          typedRes?.data?.two_factor_enabled ??
          typedRes?.data?.two_factor_required ??
          typedRes?.data?.requires_two_factor ??
          typedRes?.data?.settings?.security?.two_factor_enabled ??
          typedRes?.data?.profile?.two_factor_enabled ??
          typedRes?.requires_two_factor ??
          typedRes?.two_factor_required ??
          typedRes?.data?.user?.two_factor_enabled ??
          false;

        setTwoFactorRequired?.(Boolean(requiresTwoFactor));
        setUserEmail(email);
        navigate("/verify-mail"); // Redirect on success
      },
      onError: (err) => {
        setErrors({ general: err.message || "Failed to login" });
      },
    });
  };

  //   if (isLoading) {
  //     return (
  //       <div className="w-full h-svh flex items-center justify-center">
  //         <Loader2 className="w-12 text-[var(--theme-color)] animate-spin" />
  //       </div>
  //     );
  //   }

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
            Welcome back to {brandName}. Enter your details to access your account
          </p>
        </div>

        <p className="mb-6 text-center text-sm text-[var(--theme-text-color)]">
          Log in to your workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--theme-heading-color)] mb-2"
            >
              Email <span className="text-red-500">*</span>
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
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full auth-input pr-10 ${errors.password ? "auth-input-error" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--theme-muted-color)]"
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

          {errors.general && (
            <p className="text-red-500 text-xs text-center mt-2">{errors.general}</p>
          )}

          <div className="text-center">
            <span className="text-sm text-[rgb(var(--theme-neutral-900) / 0.6)]">
              Don't have an account?{" "}
            </span>
            <Link
              to="/sign-up"
              type="button"
              className="text-sm hover:opacity-80 font-medium"
              style={{ color: accentColor, transition: "opacity 0.3s" }}
            >
              Signup
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
