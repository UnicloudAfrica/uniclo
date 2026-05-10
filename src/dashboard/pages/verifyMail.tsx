import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import VerificationCodeInput from "@/utils/VerificationCodeInput";
import useAuthStore from "@/stores/authStore";
import { clearAuthSessionsExcept } from "@/stores/sessionUtils";
import { useVerifyMail } from "@/hooks/authHooks";
import { useNavigate } from "react-router-dom";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "@/hooks/useBrandingTheme";
import useImageFallback from "@/hooks/useImageFallback";
import { getSubdomain } from "@/utils/getSubdomain";
import AuthShell from "../../components/auth/AuthShell";

/** Payload sent to the verify-email / 2FA endpoints */
interface VerifyEmailPayload {
  email: string | null;
  google2fa_code?: string;
  two_factor_code?: string;
  code?: string;
  otp?: string;
  [key: string]: unknown;
}

/** Shape of the successful verification response */
interface AuthVerifyResponse {
  data?: {
    role?: string;
    domain?: string;
    tenant?: { id?: string | number; domain?: string };
    domain_account?: { account_domain?: string };
    available_tenants?: unknown[];
    availableTenants?: unknown[];
    tenants?: unknown[];
    tenant_id?: string | number;
    email?: string;
    cloud_roles?: unknown;
    cloudRoles?: unknown;
    cloud_abilities?: unknown;
    cloudAbilities?: unknown;
    [key: string]: unknown;
  };
  role?: string;
  [key: string]: unknown;
}

export default function VerifyMail() {
  const [code, setCode] = useState(Array(6).fill("")); // Six-digit OTP input
  const isSubmittingRef = useRef(false);
  const tenantAuth = useAuthStore.getState();
  const clientAuth = useAuthStore.getState();
  const adminAuth = useAuthStore.getState();
  const userEmail = useAuthStore((state) => state.userEmail);
  const clearUserEmail = useAuthStore((state) => state.clearUserEmail);
  const twoFactorRequired = useAuthStore((state) => state.twoFactorRequired);
  const setTwoFactorRequired = useAuthStore((state) => state.setTwoFactorRequired);
  const clearTwoFactorRequirement = useAuthStore((state) => state.clearTwoFactorRequirement);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { mutate: verifyEmail, isPending: isVerifyPending } = useVerifyMail();
  const navigate = useNavigate();
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

  useEffect(() => {
    setCode(Array(6).fill(""));
  }, [twoFactorRequired]);

  // Handle OTP code changes from VerificationCodeInput
  const handleCodeChange = (updatedCode: string[]) => {
    setCode((prev) => {
      if (!Array.isArray(updatedCode)) return prev;
      if (
        prev.length === updatedCode.length &&
        prev.every((value, index) => value === updatedCode[index])
      ) {
        return prev;
      }
      return updatedCode;
    });
  };

  // Validation function for OTP and email
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const joinedCode = code.join("");
    if (!joinedCode || joinedCode.length !== 6) {
      if (twoFactorRequired) {
        newErrors.twoFactor = "Authenticator code is required";
      } else {
        newErrors.otp = "Please enter a 6-digit code";
      }
    } else if (!/^\d{6}$/.test(joinedCode)) {
      if (twoFactorRequired) {
        newErrors.twoFactor = "Authenticator code must be 6 digits";
      } else {
        newErrors.otp = "Code must be 6 digits";
      }
    }

    if (!userEmail) {
      newErrors.email = "Email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for email verification
  const handleSubmit = (enteredCode = code.join("")) => {
    // No e.preventDefault needed since we're not relying on form events directly
    if (!validateForm()) return;
    if (isSubmittingRef.current || isVerifyPending) return;

    const email = userEmail;
    const resolvedCode = typeof enteredCode === "string" ? enteredCode : code.join("");
    const userData: VerifyEmailPayload = { email };
    if (twoFactorRequired) {
      userData.google2fa_code = resolvedCode;
      userData.two_factor_code = resolvedCode;
      userData.code = resolvedCode;
    } else {
      userData.otp = resolvedCode;
    }

    isSubmittingRef.current = true;

    verifyEmail(userData, {
      onSuccess: (res) => {
        clearUserEmail();
        clearTwoFactorRequirement?.();

        const response = res as AuthVerifyResponse;
        const userRole = response?.data?.role ?? response?.role;
        const domainInfo =
          response?.data?.domain ??
          response?.data?.tenant?.domain ??
          response?.data?.domain_account?.account_domain ??
          null;

        const availableTenants =
          response?.data?.available_tenants ??
          response?.data?.availableTenants ??
          response?.data?.tenants ??
          undefined;

        const userData = response?.data ?? null;
        const hasTenantContext = Boolean(userData?.tenant_id || userData?.tenant?.id);
        const normalizedRole = (userRole || "").toLowerCase();
        const resolvedRole = ["admin", "tenant", "client"].includes(normalizedRole)
          ? normalizedRole
          : hasTenantContext
            ? "tenant"
            : "client";

        const sessionPayload = {
          user: userData,
          role: resolvedRole,
          tenant: userData?.tenant ?? response?.tenant ?? null,
          domain: domainInfo,
          // Cookie-based stateful Sanctum is the original intent, but most
          // fetch sites in the codebase don't opt into credentials:"include",
          // so we ALSO capture the Bearer token from the verify-email
          // payload. Without this, every API call after sign-in 401s.
          token:
            (res?.access_token as string | undefined) ??
            (res?.data?.access_token as string | undefined) ??
            (res?.token as string | undefined) ??
            null,
          availableTenants,
          userEmail: userData?.email ?? email,
          cloudRoles: userData?.cloud_roles ?? userData?.cloudRoles ?? undefined,
          cloudAbilities: userData?.cloud_abilities ?? userData?.cloudAbilities ?? undefined,
          isAuthenticated: true,
        };

        if (resolvedRole === "client") {
          clientAuth.setSession(sessionPayload as Record<string, unknown>);
        } else if (resolvedRole === "admin") {
          adminAuth.setSession(sessionPayload as Record<string, unknown>);
        } else {
          tenantAuth.setSession(sessionPayload as Record<string, unknown>);
        }

        clearAuthSessionsExcept(resolvedRole);

        switch (resolvedRole) {
          case "tenant":
            navigate("/dashboard/onboarding");
            break;
          case "client":
            navigate("/client-dashboard");
            break;
          case "admin":
            navigate("/admin-dashboard");
            break;
          default:
            navigate("/dashboard/onboarding");
            break;
        }
      },
      onError: (err) => {
        const message = err?.message || "Failed to verify email";
        setErrors({ general: message });
        if (/2fa|two[-\s]?factor|authenticator/i.test(message)) {
          setTwoFactorRequired?.(true);
        }
      },
      onSettled: () => {
        isSubmittingRef.current = false;
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
            {twoFactorRequired ? "Enter Authenticator Code" : "Verify Account"}
          </h1>
          {twoFactorRequired ? (
            <p className="text-[var(--theme-text-color)] text-sm">
              Open your authenticator app and enter the 6-digit code to continue.
            </p>
          ) : (
            <p className="text-[var(--theme-text-color)] text-sm">
              An authentication code has been sent to{" "}
              <span className="underline underline-offset-1">{userEmail || "your email"}</span>
            </p>
          )}
        </div>

        <div className="space-y-5">
          <VerificationCodeInput
            userEmail={userEmail}
            length={6}
            code={code}
            onCodeChange={handleCodeChange}
            onComplete={handleSubmit}
            showResend={!twoFactorRequired}
          />

          {!twoFactorRequired && errors.otp ? (
            <p className="text-red-500 text-xs mt-1">{errors.otp}</p>
          ) : null}
          {twoFactorRequired && errors.twoFactor ? (
            <p className="text-red-500 text-xs mt-1">{errors.twoFactor}</p>
          ) : null}
          {errors.general && <p className="text-red-500 text-xs mt-1">{errors.general}</p>}

          <button
            onClick={() => handleSubmit()}
            disabled={isVerifyPending}
            className="w-full hover:opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-opacity focus:outline-none focus:ring-1 focus:ring-offset-2 flex items-center justify-center"
            style={{
              backgroundColor: accentColor,
              transition: "opacity 0.3s",
            }}
          >
            {isVerifyPending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : "Submit"}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
