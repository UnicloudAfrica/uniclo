import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import sideBg from "./assets/sideBg.svg";
import logo from "./assets/logo.png";

import { useNavigate } from "react-router-dom";
import VerificationCodeInput from "../../utils/codeInput";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { useVerifyAdminMail } from "../../hooks/adminHooks/authHooks";

export default function VerifyAdminMail() {
  const [code, setCode] = useState(Array(6).fill("")); // Six-digit OTP input
  const { userEmail, clearUserEmail } = useAdminAuthStore.getState();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { mutate: verifyEmail, isPending: isVerifyPending } =
    useVerifyAdminMail();
  const navigate = useNavigate();

  // Handle OTP code changes from VerificationCodeInput
  const handleCodeChange = (updatedCode) => {
    setCode(updatedCode);
  };

  // Validation function for OTP and email
  const validateForm = () => {
    let newErrors = {};

    const otp = code.join(""); // Join array into a string
    if (!otp || otp.length !== 6) {
      newErrors.otp = "Please enter a 6-digit code";
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = "Code must be 6 digits";
    }

    if (!userEmail) {
      newErrors.email = "Email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission for email verification
  const handleSubmit = (otp = code.join("")) => {
    // No e.preventDefault needed since we're not relying on form events directly
    if (!validateForm()) return;

    const email = userEmail;
    const userData = { email, otp };

    verifyEmail(userData, {
      onSuccess: () => {
        clearUserEmail();
        navigate("/admin-dashboard"); // Redirect on success
      },
      onError: (err) => {
        setErrors({ general: err.message || "Failed to verify email" });
        console.log(err);
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
              <img src={logo} className="w-[100px]" alt="Logo" />
            </div>
          </div>

          {/* Welcome Title */}
          <div className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">
              Verify Account
            </h1>
            <p className="text-[#676767] text-sm">
              An authentication code has been sent to{" "}
              <span className="underline underline-offset-1">
                {userEmail || "your email"}
              </span>
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

            {/* Display errors */}
            {errors.otp && (
              <p className="text-red-500 text-xs mt-1">{errors.otp}</p>
            )}
            {/* {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
            {errors.general && (
              <p className="text-red-500 text-xs mt-1">{errors.general}</p>
            )} */}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isVerifyPending}
              className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
            >
              {isVerifyPending ? (
                <Loader2 className="w-4 text-white animate-spin" />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div
        style={{
          backgroundImage: `url(${sideBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="flex-1 side-bg hidden lg:flex items-center justify-center relative overflow-hidden"
      ></div>
    </div>
  );
}
