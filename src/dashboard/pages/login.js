import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import sideBg from "./assets/sideBg.svg";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";

export default function DashboardLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState("partner");

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center  py bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <img src={logo} className=" w-[100px]" alt="" />
            </div>
          </div>

          {/* Welcome Title */}
          <div className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">
              Welcome Back
            </h1>
            <p className="text-[#676767] text-sm">
              Welcome back to Unicloud Africa. Enter your details to access your
              account
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex mb-6 bg-[#FAFAFA] border border-[#ECEDF0] rounded-[50px] p-3">
            <button
              onClick={() => setActiveTab("partner")}
              className={`flex-1 py-2 px-4 rounded-[30px] text-sm font-normal whitespace-nowrap transition-colors ${
                activeTab === "partner"
                  ? "bg-[#288DD1] text-white shadow-sm font-semibold"
                  : "text-[#676767] hover:text-gray-800 font-normal"
              }`}
            >
              Login as Partner
            </button>
            <button
              onClick={() => setActiveTab("client")}
              className={`flex-1 py-2 px-4 rounded-[30px] text-sm font-normal whitespace-nowrap transition-colors ${
                activeTab === "client"
                  ? "bg-[#288DD1] text-white shadow-sm font-semibold"
                  : "text-[#676767] hover:text-gray-800 font-normal"
              }`}
            >
              Login as Client
            </button>
          </div>

          {/* Login Form */}
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full input-field"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pr-10 input-field"
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
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember Me
                </label> */}
              </div>
              <button
                type="button"
                className="text-sm text-[#288DD1] hover:text-[#6db1df] font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={() => console.log("Login clicked")}
              className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2"
            >
              Login
            </button>

            {/* Sign Up Link */}
            <div className="text-center">
              <span className="text-sm text-[#1E1E1E99]">
                Don't have an account?{" "}
              </span>
              <Link
                to="/sign-up"
                type="button"
                className="text-sm text-[#288DD1] hover:text-[#6db1df] font-medium"
              >
                Signup
              </Link>
            </div>
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
