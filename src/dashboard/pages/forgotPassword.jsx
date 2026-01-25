import React, { useState } from "react";
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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const { userEmail, setUserEmail } = useTenantAuthStore.getState();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const subdomain = typeof window !== "undefined" ? getSubdomain() : null;
  const { data: branding } = usePublicBrandingTheme({
    domain: hostname,
    subdomain,
  });
  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });
  const logoSrc = resolveBrandLogo(branding, logo);
  const logoAlt = branding?.company?.name ? `${branding.company.name} Logo` : "Logo";
  const { src: resolvedLogoSrc, onError: handleLogoError } = useImageFallback(logoSrc, logo);

  const navigate = useNavigate();

  // Validation function
  const validateForm = () => {
    let newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for forgot password
  const handleSubmit = (e) => {
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
        console.log(err);
      },
    });
  };

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      {/* Left Side - Forgot Password Form */}
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
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">Forgot Password</h1>
            <p className="text-[#676767] text-sm">
              Enter your email address to reset your password. We will send you a verification code.
            </p>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
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

            {/* General Error */}
            {/* {errors.general && (
              <p className="text-red-500 text-xs mt-1">{errors.general}</p>
            )} */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
            >
              {isPending ? <Loader2 className="w-4 text-white animate-spin" /> : "Send Reset Code"}
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <span className="text-sm text-[#1E1E1E99]">Remember your password? </span>
              <Link
                to="/sign-in"
                type="button"
                className="text-sm text-[#288DD1] hover:text-[#6db1df] font-medium"
              >
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="flex-1 side-bg hidden lg:flex items-center justify-center relative overflow-hidden"></div>
    </div>
  );
}
