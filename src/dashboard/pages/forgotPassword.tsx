import { useState } from "react";
import { Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useForgotPassword } from "../../hooks/authHooks";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "../../hooks/useBrandingTheme";
import useImageFallback from "../../hooks/useImageFallback";
import { getSubdomain } from "../../utils/getSubdomain";
import AuthShell from "../../components/auth/AuthShell";
import logger from "../../utils/logger";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, any>>({});
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const { userEmail, setUserEmail } = useTenantAuthStore.getState();
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
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(logoSrc, logo);

  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, any> = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for forgot password
  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      email,
    };

    forgotPassword(userData, {
      onSuccess: () => {
        setUserEmail(email);
        navigate("/reset-password");
      },
      onError: (err) => {
        setErrors({ general: err.message || "Failed to send reset link" });
        logger.log(err);
      },
    });
  };

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
            Forgot Password
          </h1>
          <p className="text-[var(--theme-text-color)] text-sm">
            Enter your email address to reset your password. We will send you a verification code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className={`w-full input-field ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
            {isPending ? <Loader2 className="w-4 text-white animate-spin" /> : "Send Reset Code"}
          </button>

          <div className="text-center">
            <span className="text-sm text-[rgb(var(--theme-neutral-900) / 0.6)]">
              Remember your password?{" "}
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
}
