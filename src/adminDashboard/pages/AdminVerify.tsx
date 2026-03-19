import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import logo from "./assets/logo.png";

import { useNavigate } from "react-router-dom";
import VerificationCodeInput from "@/utils/VerificationCodeInput";
import useAdminAuthStore from "@/stores/adminAuthStore";
import useTenantAuthStore from "@/stores/tenantAuthStore";
import useClientAuthStore from "@/stores/clientAuthStore";

import { clearAuthSessionsExcept } from "@/stores/sessionUtils";
import { useVerifyAdminMail } from "@/hooks/adminHooks/authHooks";
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
  } = useAdminAuthStore();
  const tenantAuth = useTenantAuthStore.getState();
  const clientAuth = useClientAuthStore.getState();
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

  // Validation function for OTP and email
  const validateForm = () => {
    const newErrors: VerifyErrors = {};

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
  const handleSubmit = (otpValue?: any) => {
    if (otpValue?.preventDefault) {
      otpValue.preventDefault();
    }

    const resolvedOtp =
      typeof otpValue === "string" && otpValue.trim().length ? otpValue : code.join("");

    if (!validateForm()) return;
    if (isSubmittingRef.current || isVerifyPending) return;

    const email = userEmail;
    const userData: any = {
      email,
    };
    if (!twoFactorRequired) {
      userData.otp = resolvedOtp;
    }
    if (twoFactorRequired) {
      userData.google2fa_code = resolvedOtp;
      userData.two_factor_code = resolvedOtp;
      userData.code = resolvedOtp;
    }

    isSubmittingRef.current = true;

    verifyEmail(userData, {
      onSuccess: (res: any) => {
        clearUserEmail();
        clearTwoFactorRequirement();

        const userRole = res?.data?.role ?? res?.role;
        const domainInfo =
          res?.data?.domain ??
          res?.data?.tenant?.domain ??
          res?.data?.domain_account?.account_domain ??
          null;

        const availableTenants =
          res?.data?.available_tenants ??
          res?.data?.availableTenants ??
          res?.data?.tenants ??
          undefined;

        const sessionPayload = {
          user: res?.data ?? null,
          role: userRole ?? undefined,
          tenant: res?.data?.tenant ?? null,
          domain: domainInfo,
          availableTenants,
          userEmail: res?.data?.email ?? email,
          cloudRoles: res?.data?.cloud_roles ?? res?.data?.cloudRoles ?? undefined,
          cloudAbilities: res?.data?.cloud_abilities ?? res?.data?.cloudAbilities ?? undefined,
          isAuthenticated: true,
        };

        const normalizedRole = (userRole || "admin").toLowerCase();

        if (normalizedRole === "client") {
          clientAuth.setSession(sessionPayload);
        } else if (normalizedRole === "tenant") {
          tenantAuth.setSession(sessionPayload);
        } else {
          setSession(sessionPayload);
        }

        clearAuthSessionsExcept(normalizedRole);

        switch (normalizedRole) {
          case "tenant":
            navigate("/dashboard");
            break;
          case "client":
            navigate("/client-dashboard");
            break;
          case "admin":
            navigate("/admin-dashboard");
            break;
          default:
            navigate("/dashboard");
            break;
        }
      },
      onError: (err: any) => {
        const message = err?.message || "Failed to verify email";
        setErrors({ general: message });
        if (/2fa|two[-\\s]?factor|authenticator/i.test(message)) {
          setTwoFactorRequired(true);
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
