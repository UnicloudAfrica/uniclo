// @ts-nocheck
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import logo from "./assets/logo.png";

import { useNavigate } from "react-router-dom";
import VerificationCodeInput from "../../utils/VerificationCodeInput";
import useAdminAuthStore from "../../stores/adminAuthStore";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import useClientAuthStore from "../../stores/clientAuthStore";
// @ts-ignore
import { clearAuthSessionsExcept } from "../../stores/sessionUtils";
import { useVerifyAdminMail } from "../../hooks/adminHooks/authHooks";
import {
  resolveBrandLogo,
  usePlatformBrandingTheme,
  useApplyBrandingTheme,
} from "../../hooks/useBrandingTheme";
import useImageFallback from "../../hooks/useImageFallback";

interface VerifyErrors {
  otp?: string;
  email?: string;
  twoFactor?: string;
  general?: string;
}

export default function VerifyAdminMail() {
  const [code, setCode] = useState<string[]>(Array(6).fill("")); // Six-digit OTP input
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
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const { mutate: verifyEmail, isPending: isVerifyPending } = useVerifyAdminMail();
  const navigate = useNavigate();
  const { data: branding } = usePlatformBrandingTheme();
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const logoSrc = resolveBrandLogo(branding, logo);
  const logoAlt = branding?.company?.name ? `${branding.company.name} Logo` : "Logo";
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(logoSrc, logo);

  // Handle OTP code changes from VerificationCodeInput
  const handleCodeChange = (updatedCode: string[]) => {
    setCode(updatedCode);
  };

  // Validation function for OTP and email
  const validateForm = () => {
    const newErrors: VerifyErrors = {};

    const otp = code.join(""); // Join array into a string
    if (!otp || otp.length !== 6) {
      newErrors.otp = "Please enter a 6-digit code";
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = "Code must be 6 digits";
    }

    if (!userEmail) {
      newErrors.email = "Email is required";
    }

    if (twoFactorRequired) {
      const authCode = twoFactorCode.trim();
      if (!authCode || authCode.length !== 6) {
        newErrors.twoFactor = "Authenticator code is required";
      }
    } else if (twoFactorCode && twoFactorCode.trim().length !== 6) {
      newErrors.twoFactor = "Authenticator codes are 6 digits";
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

    const email = userEmail;
    const trimmedTwoFactor = twoFactorCode.trim();
    const userData: any = {
      email,
      otp: resolvedOtp,
    };
    if (trimmedTwoFactor) {
      userData.google2fa_code = trimmedTwoFactor;
      userData.two_factor_code = trimmedTwoFactor;
      userData.code = trimmedTwoFactor;
    }

    verifyEmail(userData, {
      onSuccess: (res: any) => {
        clearUserEmail();
        clearTwoFactorRequirement();
        setTwoFactorCode("");

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
    });
  };

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <img
                src={resolvedLogoSrc}
                className="w-[100px]"
                alt={logoAlt}
                onError={handleLogoError}
              />
            </div>
          </div>

          {/* Welcome Title */}
          <div className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">Verify Account</h1>
            <p className="text-[#676767] text-sm">
              An authentication code has been sent to{" "}
              <span className="underline underline-offset-1">{userEmail || "your email"}</span>
            </p>
          </div>

          {/* Verification Form */}
          <div className="space-y-5">
            <VerificationCodeInput
              userEmail={userEmail}
              length={6}
              code={code}
              onCodeChange={handleCodeChange}
              onComplete={handleSubmit} // Pass handleSubmit directly
            />

            {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}

            {twoFactorRequired ? (
              <div className="space-y-2">
                <label
                  htmlFor="two-factor-code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Authenticator code
                </label>
                <input
                  id="two-factor-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="w-full input-field"
                />
                {errors.twoFactor && <p className="text-red-500 text-xs">{errors.twoFactor}</p>}
              </div>
            ) : null}

            {errors.general && <p className="text-red-500 text-xs mt-1">{errors.general}</p>}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isVerifyPending}
              className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
            >
              {isVerifyPending ? <Loader2 className="w-4 text-white animate-spin" /> : "Submit"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="flex-1 side-bg hidden lg:flex items-center justify-center relative overflow-hidden"></div>
    </div>
  );
}
