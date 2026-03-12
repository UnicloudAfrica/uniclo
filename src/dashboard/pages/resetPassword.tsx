import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import useTenantAuthStore from "@/stores/tenantAuthStore";
import { useResetPassword } from "@/hooks/authHooks";
import { useResendOTP } from "@/hooks/authHooks";
import {
  resolveBrandLogo,
  useApplyBrandingTheme,
  usePublicBrandingTheme,
} from "@/hooks/useBrandingTheme";
import useImageFallback from "@/hooks/useImageFallback";
import { getSubdomain } from "@/utils/getSubdomain";
import AuthShell from "../../components/auth/AuthShell";
import logger from "@/utils/logger";

export default function ResetPassword() {
  const { userEmail, clearUserEmail } = useTenantAuthStore.getState();
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const { mutate: resetPassword, isPending: isResetPending } = useResetPassword();
  const { mutate: resendOtp, isPending: isResendPending } = useResendOTP();
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

  // Timer state for resend OTP
  const [timeLeft, setTimeLeft] = useState(0); // Start with 0, set to 50 on success
  const [isActive, setIsActive] = useState(false); // Start inactive, activate on success

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval as any);
  }, [isActive, timeLeft]);

  // Format time display
  const formatTime = (seconds: any) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, any> = {};
    if (!userEmail) {
      newErrors.email = "Email is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!otp) {
      newErrors.otp = "OTP is required";
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = "OTP must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for password reset
  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      email: userEmail,
      password,
      otp,
    };

    resetPassword(userData, {
      onSuccess: () => {
        clearUserEmail(); // Clear userEmail on success
        navigate("/sign-in"); // Redirect to login page after success
      },
      onError: (err) => {
        setErrors({ general: err.message || "Failed to reset password" });
        logger.log(err);
      },
    });
  };

  // Handle resend OTP
  const handleResend = () => {
    if (timeLeft === 0 && !isResendPending && userEmail) {
      resendOtp(
        { email: userEmail }, // Trigger resend OTP mutation with userEmail
        {
          onSuccess: () => {
            setTimeLeft(50); // Start timer on success
            setIsActive(true); // Activate timer
          },
          onError: (err) => {
            setErrors({ general: err.message || "Failed to resend OTP" });
            logger.log(err);
          },
        }
      );
    }
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
            Reset Password
          </h1>
          <p className="text-[var(--theme-text-color)] text-sm">
            Enter your new password and the verification code sent to your email{" "}
            <span className="underline underline-offset-1">{userEmail || "your email"}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className={`w-full pr-10 input-field ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              className={`w-full input-field ${errors.otp ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
            <div className="text- mt-2">
              <span className="text-[var(--theme-text-color)] text-xs sm:text-sm">
                Didn't receive a code?{" "}
                <button
                  onClick={handleResend}
                  disabled={timeLeft > 0 || isResendPending || !userEmail}
                  className={`font-medium transition-colors duration-200 ${
                    timeLeft > 0 || isResendPending || !userEmail
                      ? "text-[var(--theme-text-color)] cursor-not-allowed"
                      : "text-[var(--theme-color)] hover:text-[rgb(var(--theme-color-400))] cursor-pointer underline"
                  }`}
                >
                  {isResendPending ? (
                    <Loader2 className="w-4 h-4 text-[var(--theme-color)] animate-spin inline-block" />
                  ) : (
                    "Resend Code"
                  )}
                </button>
                {timeLeft > 0 && (
                  <span className="text-[var(--theme-color)]"> in {formatTime(timeLeft)}</span>
                )}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isResetPending}
            className="w-full hover:opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-opacity focus:outline-none focus:ring-1 focus:ring-offset-2 flex items-center justify-center"
            style={{
              backgroundColor: accentColor,
              transition: "opacity 0.3s",
            }}
          >
            {isResetPending ? (
              <Loader2 className="w-4 text-white animate-spin" />
            ) : (
              "Reset Password"
            )}
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
