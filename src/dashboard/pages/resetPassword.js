import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import sideBg from "./assets/sideBg.svg";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/userAuthStore";
import { useResetPassword } from "../../hooks/authHooks";
import { useResendOTP } from "../../hooks/authHooks";

export default function ResetPassword() {
  const { userEmail, clearUserEmail } = useAuthStore.getState();
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { mutate: resetPassword, isPending: isResetPending } =
    useResetPassword();
  const { mutate: resendOtp, isPending: isResendPending } = useResendOTP();
  const navigate = useNavigate();

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
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Validation function
  const validateForm = () => {
    let newErrors = {};

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
  const handleSubmit = (e) => {
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
        console.log(err);
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
            console.log(err);
          },
        }
      );
    }
  };

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      {/* Left Side - Reset Password Form */}
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
              Reset Password
            </h1>
            <p className="text-[#676767] text-sm">
              Enter your new password and the verification code sent to your
              email{" "}
              <span className="underline underline-offset-1">
                {userEmail || "your email"}
              </span>
              .
            </p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* OTP Field with Resend */}
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className={`w-full input-field ${
                  errors.otp ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.otp && (
                <p className="text-red-500 text-xs mt-1">{errors.otp}</p>
              )}
              <div className="text- mt-2">
                <span className="text-[#676767] text-xs sm:text-sm">
                  Didn't receive a code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={timeLeft > 0 || isResendPending || !userEmail}
                    className={`font-medium transition-colors duration-200 ${
                      timeLeft > 0 || isResendPending || !userEmail
                        ? "text-[#676767] cursor-not-allowed"
                        : "text-[#288DD1] hover:text-[#6db1df] cursor-pointer underline"
                    }`}
                  >
                    {isResendPending ? (
                      <Loader2 className="w-4 h-4 text-[#288DD1] animate-spin inline-block" />
                    ) : (
                      "Resend Code"
                    )}
                  </button>
                  {timeLeft > 0 && (
                    <span className="text-[#288DD1]">
                      {" "}
                      in {formatTime(timeLeft)}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* General Error */}
            {/* {errors.general && (
              <p className="text-red-500 text-xs mt-1">{errors.general}</p>
            )} */}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isResetPending}
              className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
            >
              {isResetPending ? (
                <Loader2 className="w-4 text-white animate-spin" />
              ) : (
                "Reset Password"
              )}
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <span className="text-sm text-[#1E1E1E99]">
                Remember your password?{" "}
              </span>
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
