import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import logo from "./assets/logo.png";

import { useNavigate } from "react-router-dom";
import VerificationCodeInput from "@/utils/VerificationCodeInput";
import useAuthStore from "@/stores/authStore";

import { clearAuthSessionsExcept } from "@/stores/sessionUtils";
import { useVerifyAdminMail } from "@/hooks/adminHooks/authHooks";
import { popIntendedPath } from "@/utils/intendedPath";
import { consumeTwoFactorReturnTo } from "@/lib/api";
import {
  resolveBrandLogo,
  usePlatformBrandingTheme,
  useApplyBrandingTheme,
} from "@/hooks/useBrandingTheme";
import useImageFallback from "@/hooks/useImageFallback";
import AuthShell from "../../components/auth/AuthShell";

interface VerifyErrors {
  otp?: string;
  email?: string;
  twoFactor?: string;
  general?: string;
}

export default function VerifyAdminMail() {
  const [code, setCode] = useState<string[]>(new Array(6).fill("")); // Six-digit OTP input
  const isSubmittingRef = useRef(false);
  const {
    userEmail,
    clearUserEmail,
    twoFactorRequired,
    clearTwoFactorRequirement,
    setTwoFactorRequired,
    setSession,
  } = useAuthStore();
  const tenantAuth = useAuthStore.getState();
  const clientAuth = useAuthStore.getState();
  const [errors, setErrors] = useState<VerifyErrors>({});
  const { mutate: verifyEmail, isPending: isVerifyPending } = useVerifyAdminMail();
  const navigate = useNavigate();
  const { data: branding } = usePlatformBrandingTheme();
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const fallbackBrand = {
    name: "Unicloud",
    logo,
    color: "var(--theme-color)",
  };
  const accentColor = branding?.accentColor || fallbackBrand.color;
  const logoSrc = resolveBrandLogo(branding, fallbackBrand.logo);
  const brandingCompanyName = branding?.company?.["name"];
  const logoAlt = brandingCompanyName
    ? `${brandingCompanyName} Logo`
    : `${fallbackBrand.name} Logo`;
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(logoSrc, logo);

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

  useEffect(() => {
    setCode(new Array(6).fill(""));
  }, [twoFactorRequired]);

  // Validation function for OTP and email.
  //
  // Takes the resolved OTP explicitly rather than reading `code` from
  // closure — the closure value can lag the actual typed input by one
  // render when `handleSubmit` is triggered via `onComplete` from the
  // VerificationCodeInput's last-digit effect. Passing the resolved
  // value in makes the source of truth unambiguous.
  const validateForm = (resolvedOtp: string): boolean => {
    const newErrors: VerifyErrors = {};

    if (!resolvedOtp || resolvedOtp.length !== 6) {
      if (twoFactorRequired) {
        newErrors.twoFactor = "Authenticator code is required";
      } else {
        newErrors.otp = "Please enter a 6-digit code";
      }
    } else if (!/^\d{6}$/.test(resolvedOtp)) {
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
  const handleSubmit = (otpValue?: string | React.FormEvent) => {
    if (typeof otpValue === "object" && otpValue && "preventDefault" in otpValue) {
      otpValue.preventDefault();
    }

    const resolvedOtp =
      typeof otpValue === "string" && otpValue.trim().length ? otpValue : code.join("");

    if (!validateForm(resolvedOtp)) return;
    if (isSubmittingRef.current || isVerifyPending) return;

    const email = userEmail;
    // Defence in depth: send the typed code under EVERY field name
    // the BE recognises. The BE picks the right one based on whether
    // the user actually has 2FA enabled (`$twoFactorEnabled` on the
    // user row) — not based on our FE flag. Submitting under all
    // names means the very first submit always works, even when the
    // FE's `twoFactorRequired` flag is out of sync with the user's
    // actual 2FA enrolment state. Eliminates the "type code → 2FA
    // required → flag flips → code clears → retype same code →
    // works" round-trip the customer hit.
    const userData: Record<string, unknown> = {
      email,
      otp: resolvedOtp,
      code: resolvedOtp,
      google2fa_code: resolvedOtp,
      two_factor_code: resolvedOtp,
    };

    isSubmittingRef.current = true;

    verifyEmail(userData, {
      onSuccess: (res: Record<string, unknown>) => {
        clearUserEmail();
        clearTwoFactorRequirement();

        const data = res?.data as Record<string, unknown> | undefined;
        const tenant = data?.tenant as Record<string, unknown> | undefined;
        const domainAccount = data?.domain_account as Record<string, unknown> | undefined;

        const userRole = (data?.role ?? res?.role) as string | undefined;
        const domainInfo =
          (data?.domain ??
            tenant?.domain ??
            domainAccount?.account_domain ??
            null) as string | null;

        const availableTenants =
          data?.available_tenants ??
          data?.availableTenants ??
          data?.tenants ??
          undefined;

        const sessionPayload = {
          user: data ?? null,
          role: userRole ?? undefined,
          tenant: tenant ?? null,
          domain: domainInfo,
          // Cookie-based stateful Sanctum is the original intent, but most
          // fetch sites in the codebase don't opt into credentials:"include",
          // so we ALSO capture the Bearer token from the verify-email
          // payload. Without this, every API call after sign-in 401s.
          token:
            (res?.access_token as string | undefined) ??
            (data?.access_token as string | undefined) ??
            (res?.token as string | undefined) ??
            null,
          availableTenants,
          userEmail: (data?.email as string | undefined) ?? email,
          cloudRoles: data?.cloud_roles ?? data?.cloudRoles ?? undefined,
          cloudAbilities: data?.cloud_abilities ?? data?.cloudAbilities ?? undefined,
          isAuthenticated: true,
        };

        const normalizedRole = (userRole || "admin").toLowerCase();

        if (normalizedRole === "client") {
          clientAuth.setSession(sessionPayload as never);
        } else if (normalizedRole === "tenant") {
          tenantAuth.setSession(sessionPayload as never);
        } else {
          setSession(sessionPayload as never);
        }

        clearAuthSessionsExcept(normalizedRole);

        // Honour the deep-linked URL the user was trying to reach when
        // they were bounced to /admin-signin (or /sign-in). The route
        // guard stashes the intended path in sessionStorage; restore it
        // here so the user lands back where they started instead of
        // always at the role's default dashboard.
        const fallback =
          normalizedRole === "tenant"
            ? "/dashboard"
            : normalizedRole === "client"
              ? "/client-dashboard"
              : normalizedRole === "admin"
                ? "/admin-dashboard"
                : "/dashboard";
        const scope =
          normalizedRole === "admin"
            ? "admin"
            : normalizedRole === "client"
              ? "client"
              : "tenant";
        const intended = popIntendedPath(scope as "admin" | "tenant" | "client");
        // A mid-session 2FA-required bounce stashes the exact in-app location
        // under `twofactor:return_to` — honour it first, then the deep-link
        // intended path, then the role default.
        navigate(consumeTwoFactorReturnTo() ?? intended ?? fallback);
      },
      onError: (err: { message?: string } | undefined) => {
        const message = err?.message || "Failed to verify email";
        setErrors({ general: message });
        if (/2fa|two[-\\s]?factor|authenticator/i.test(message)) {
          setTwoFactorRequired(true);
        }
        // Always clear the code on error so the user gets a fresh
        // input. The legacy approach relied on the
        // `[twoFactorRequired]` useEffect to clear — but that effect
        // only fires when the flag CHANGES. A wrong-code submission
        // when 2FA was already required wouldn't trigger it, leaving
        // the wrong digits in the inputs. The focus reset effect in
        // VerificationCodeInput watches for the all-empty transition
        // and puts the cursor back on the first input.
        setCode(new Array(6).fill(""));
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
            <div className="space-y-1">
              <p className="text-[var(--theme-text-color)] text-sm">
                Open your authenticator app and enter the 6-digit code to continue.
              </p>
              <p className="text-xs text-[var(--theme-text-color)] opacity-70">
                Lost your device? Enter one of your recovery codes (format <code>xxxx-xxxx</code>)
                instead — each is single-use.
              </p>
            </div>
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
            onClick={handleSubmit}
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
