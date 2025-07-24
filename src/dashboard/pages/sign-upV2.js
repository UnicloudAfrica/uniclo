import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import sideBg from "./assets/sideBg.svg";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useCreateAccount } from "../../hooks/authHooks";
import useAuthStore from "../../stores/userAuthStore";
import ToastUtils from "../../utils/toastUtil";

export default function DashboardSignUpV2() {
  const navigate = useNavigate();
  const setUserEmail = useAuthStore((state) => state.setUserEmail);
  const { mutate, isPending } = useCreateAccount();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("partner");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    companyName: "",
    subdomain: "",
    businessPhone: "",
    phone: "",
  });

  // Function to validate the form fields
  const validateForm = () => {
    const newErrors = {};

    // Common validations for both Partner and Client
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.contactPersonFirstName) {
      newErrors.contactPersonFirstName = "First name is required";
    }

    if (!formData.contactPersonLastName) {
      newErrors.contactPersonLastName = "Last name is required";
    }

    // Partner-specific validations
    if (activeTab === "partner") {
      if (!formData.companyName) {
        newErrors.companyName = "Company name is required";
      }
      if (!formData.subdomain) {
        newErrors.subdomain = "Subdomain is required";
      } else if (!/^[a-zA-Z0-9-]+$/.test(formData.subdomain)) {
        newErrors.subdomain =
          "Subdomain can only contain letters, numbers, and hyphens";
      }
      if (!formData.businessPhone) {
        newErrors.businessPhone = "Business phone is required";
      } else if (!/^\+?\d{10,15}$/.test(formData.businessPhone)) {
        newErrors.businessPhone =
          "Invalid phone number format (e.g., +1234567890)";
      }
    } else {
      // Client-specific validations
      if (!formData.phone) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\+?\d{10,15}$/.test(formData.phone)) {
        newErrors.phone = "Invalid phone number format (e.g., +1234567890)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to update form data and clear associated errors
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const userData = {
        first_name: formData.contactPersonFirstName,
        last_name: formData.contactPersonLastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        phone: formData.businessPhone,
      };

      if (activeTab === "partner") {
        userData.role = "tenant";
        userData.domain = formData.subdomain;
        userData.business = {
          name: formData.companyName,
          phone: formData.businessPhone,
        };
      } else {
        userData.role = "client";
        userData.phone = formData.phone;
      }

      // Call the useCreateAccount mutation
      mutate(userData, {
        onSuccess: () => {
          ToastUtils.success(
            "Account created successfully! Please verify your email."
          );
          setUserEmail(formData.email);
          navigate("/verify-mail");
        },
        onError: (err) => {
          // Display a general error message from the API response or a fallback
          // const errorMessage =
          //   err.response?.data?.message ||
          //   err.message ||
          //   "Failed to create account. Please try again.";
          // setErrors({ general: errorMessage });
          // ToastUtils.error(errorMessage);
          // console.error("Account creation error:", err);
        },
      });
    }
  };

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      {/* Left Section: Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <img src={logo} className="w-[100px]" alt="Logo" />
            </div>
          </div>
          <div className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">
              Create an Account
            </h1>
            <p className="text-[#676767] text-sm">
              Create an account on Unicloud Africa.
            </p>
          </div>

          {/* Tab Selector for Partner/Client */}
          <div className="flex w-full mb-6 bg-[#FAFAFA] border border-[#ECEDF0] rounded-[50px] p-3">
            <button
              onClick={() => setActiveTab("partner")}
              className={`flex-1 py-2 px-4 w-[50%] rounded-[30px] text-sm font-normal whitespace-nowrap transition-colors ${
                activeTab === "partner"
                  ? "bg-[#288DD1] text-white shadow-sm font-semibold"
                  : "text-[#676767] hover:text-gray-800 font-normal"
              }`}
            >
              Signup as Partner
            </button>
            <button
              onClick={() => setActiveTab("client")}
              className={`flex-1 py-2 px-4 w-[50%] rounded-[30px] text-sm font-normal whitespace-nowrap transition-colors ${
                activeTab === "client"
                  ? "bg-[#288DD1] text-white shadow-sm font-semibold"
                  : "text-[#676767] hover:text-gray-800 font-normal"
              }`}
            >
              Signup as Client
            </button>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPersonFirstName}
                    onChange={(e) =>
                      updateFormData("contactPersonFirstName", e.target.value)
                    }
                    className={`input-field ${
                      errors.contactPersonFirstName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.contactPersonFirstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contactPersonFirstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPersonLastName}
                    onChange={(e) =>
                      updateFormData("contactPersonLastName", e.target.value)
                    }
                    className={`input-field ${
                      errors.contactPersonLastName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.contactPersonLastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contactPersonLastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className={`input-field ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    className={`input-field ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateFormData("confirmPassword", e.target.value)
                    }
                    className={`input-field ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Partner-specific Fields */}
              {activeTab === "partner" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) =>
                        updateFormData("companyName", e.target.value)
                      }
                      className={`input-field ${
                        errors.companyName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter company name"
                    />
                    {errors.companyName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.companyName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subdomain <span className="text-red-500">*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={formData.subdomain}
                        onChange={(e) =>
                          updateFormData("subdomain", e.target.value)
                        }
                        className={`input-field sub-input flex-grow ${
                          errors.subdomain
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder="mycompany"
                      />
                      <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-100 rounded-r-lg text-gray-700 text-sm">
                        .unicloudafrica.com
                      </span>
                    </div>
                    {errors.subdomain && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.subdomain}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.businessPhone}
                      onChange={(e) =>
                        updateFormData("businessPhone", e.target.value)
                      }
                      className={`input-field ${
                        errors.businessPhone
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter business phone (e.g., +1234567890)"
                    />
                    {errors.businessPhone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.businessPhone}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Client-specific Phone Field */}
              {activeTab === "client" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    className={`input-field ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter phone number (e.g., +1234567890)"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <p className="text-red-500 text-xs mt-1 text-center">
                  {errors.general}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 mt-8">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign Up
                {isPending && (
                  <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center mt-6">
              <span className="text-sm text-[#1E1E1E99]">
                Already have an account?{" "}
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

      {/* Right Section: Background Image */}
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
