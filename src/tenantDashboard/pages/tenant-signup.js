import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useNavigate } from "react-router-dom";
import { useCreateAccount } from "../../hooks/authHooks";
import useAuthStore from "../../stores/userAuthStore";
import useAuthRedirect from "../../utils/authRedirect";

const TenantRegister = ({ tenant = "Tenant" }) => {
  const navigate = useNavigate();
  const { userEmail, setUserEmail } = useAuthStore.getState();
  const { mutate, isPending } = useCreateAccount();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { isLoading } = useAuthRedirect();
  const [tenantData, setTenantData] = useState({
    name: tenant,
    logo: logo, // Placeholder logo
    color: "#288DD1", // Placeholder color
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    phone: "",
  });

  // Simulate API request to fetch tenant data
  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const mockResponse = {
          name: tenant === "Tenant" ? "Default Tenant" : `${tenant} Corp`,
          logo: logo, // Placeholder, could be a URL like "https://example.com/${tenant}-logo.png"
          color: tenant === "Tenant" ? "#FF5722" : "#FF5722", // Different example color
        };
        setTenantData(mockResponse);
      } catch (error) {
        console.error("Failed to fetch tenant data:", error);
        setTenantData({
          name: tenant,
          logo: logo,
          color: "#288DD1",
        });
      }
    };

    fetchTenantData();
  }, [tenant]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.contactPersonFirstName)
      newErrors.contactPersonFirstName = "First name is required";
    if (!formData.contactPersonLastName)
      newErrors.contactPersonLastName = "Last name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    else if (!/^\+?\d{10,15}$/.test(formData.phone))
      newErrors.phone = "Invalid phone number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const userData = {
        first_name: formData.contactPersonFirstName,
        last_name: formData.contactPersonLastName,
        email: formData.email,
        role: "Client", // Fixed to Client for tenant signup
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        phone: formData.phone,
      };

      mutate(userData, {
        onSuccess: () => {
          setUserEmail(formData.email);
          navigate("/verify-mail");
        },
        onError: (err) => {
          setErrors({ general: err.message || "Failed to create account" });
          console.log(err);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 font-Outfit"
      style={{ backgroundColor: tenantData.color + "20" }} // Light background tint
    >
      <div className="max-w-md mx-auto w-full bg-white p-6 rounded-xl shadow-md">
        <div className="mb-6 text-center">
          <img
            src={tenantData.logo}
            className="w-[100px] mx-auto mb-4 rounded"
            alt={`${tenantData.name} Logo`}
          />
          <h1 className="text-2xl font-semibold text-[#121212] mb-2">
            Create an Account
          </h1>
          <p className="text-[#676767] text-sm">
            Create an account on {tenantData.name}'s portal.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                className={`w-full input-field ${
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
                className={`w-full input-field ${
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              className={`w-full input-field ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                className={`w-full input-field ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                updateFormData("confirmPassword", e.target.value)
              }
              className={`w-full input-field ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              className={`w-full input-field ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {errors.general && (
            <p className="text-red-500 text-xs mt-1">{errors.general}</p>
          )}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[tenantData.color] hover:opacity-80 text-white font-semibold py-3 px-4 rounded-lg transition-opacity focus:outline-none focus:ring-1 focus:ring-[tenantData.color] focus:ring-offset-2 flex items-center justify-center"
              style={{
                backgroundColor: tenantData.color,
                transition: "opacity 0.3s",
              }}
            >
              Sign Up
              {isPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
          <div className="text-center mt-4">
            <span className="text-sm text-[#1E1E1E99]">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              type="button"
              className="text-sm text-[tenantData.color] hover:opacity-80 font-medium"
              style={{ color: tenantData.color, transition: "opacity 0.3s" }}
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantRegister;
