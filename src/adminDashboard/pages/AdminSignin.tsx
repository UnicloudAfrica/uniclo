// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { useNavigate } from "react-router-dom";

import useAdminAuthStore from "../../stores/adminAuthStore";
// @ts-ignore
import useAuthRedirect from "../../utils/adminAuthRedirect";
import { useLoginAdminAccount } from "../../hooks/adminHooks/authHooks";
import {
  resolveBrandLogo,
  usePlatformBrandingTheme,
  useApplyBrandingTheme,
} from "../../hooks/useBrandingTheme";
import useImageFallback from "../../hooks/useImageFallback";

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
  const logoSrc = resolveBrandLogo(branding, logo);
  const logoAlt = branding?.company?.name ? `${branding.company.name} Logo` : "Logo";
  const companyName = branding?.company?.name || "Unicloud Africa";
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
        console.log(err);
      },
    });
  };

  if (isLoading) {
    return (
      <div className=" w-full h-svh flex items-center justify-center">
        <Loader2 className=" w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">Welcome Back</h1>
            <p className="text-[#676767] text-sm">
              Welcome back to {companyName}. Enter your details to access the admin dashboard
            </p>
          </div>

          {/* Login Form */}
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

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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

            {/* General Error */}
            {errors.general && <p className="text-red-500 text-xs mt-1">{errors.general}</p>}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
            >
              {isPending ? <Loader2 className="w-4 text-white animate-spin" /> : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="flex-1 side-bg hidden lg:flex items-center justify-center relative overflow-hidden"></div>
    </div>
  );
}
